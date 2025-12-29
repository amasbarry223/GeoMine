import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DataType, DataPoint } from '@/types/geophysic';
import { parseGeophysicalDataFile, validateDataPoints, generateDataQualityReport, parseCSVFile, parseRES2DINVFile, parseAGISuperStingFile, detectFileFormat } from '@/lib/geophysic/dataParser';
import { v4 as uuidv4 } from 'uuid';
import { handleApiError, createErrorResponse, createSuccessResponse } from '@/lib/api-error-handler';
import { getUserFromRequest } from '@/lib/get-user-from-request';
import { canImportDataset } from '@/lib/permissions';
import { logAuditEvent } from '@/lib/audit';
import { extractZipFile, isZipFile } from '@/lib/utils/zip-extractor';
import { logInfo, logWarn } from '@/lib/logger';

// POST /api/datasets/import - Import data from uploaded file
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getUserFromRequest(request);
    if (!user) {
      return createErrorResponse('Non authentifié', 401);
    }

    // Check permissions
    const permission = canImportDataset(user);
    if (!permission.allowed) {
      return createErrorResponse(permission.reason || 'Permission refusée', 403);
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const surveyLineId = formData.get('surveyLineId') as string;
    const name = formData.get('name') as string;
    const dataType = formData.get('dataType') as DataType;
    const format = formData.get('format') as string;
    const hasHeader = formData.get('hasHeader') === 'true';
    const delimiter = formData.get('delimiter') as string;

    if (!file) {
      return createErrorResponse('Aucun fichier fourni', 400, { field: 'file' });
    }

    if (!surveyLineId) {
      return createErrorResponse('ID de ligne de sondage requis', 400, { field: 'surveyLineId' });
    }

    if (!name || name.trim().length === 0) {
      return createErrorResponse('Nom du jeu de données requis', 400, { field: 'name' });
    }

    if (!dataType) {
      return createErrorResponse('Type de données requis', 400, { field: 'dataType' });
    }

    // Verify survey line exists
    const surveyLine = await db.surveyLine.findUnique({
      where: { id: surveyLineId },
    });

    if (!surveyLine) {
      return createErrorResponse('Ligne de sondage non trouvée', 404, { surveyLineId });
    }

    // Constants for validation
    const MAX_ZIP_SIZE = 100 * 1024 * 1024; // 100MB
    const MAX_FILES_IN_ZIP = 50;
    const MAX_SINGLE_FILE_SIZE = 500 * 1024 * 1024; // 500MB for single files

    // Validate file size
    if (file.size > MAX_SINGLE_FILE_SIZE) {
      return createErrorResponse(
        `Fichier trop volumineux. Taille maximale autorisée: ${(MAX_SINGLE_FILE_SIZE / (1024 * 1024)).toFixed(0)}MB`,
        400,
        { field: 'file', fileSize: file.size, maxSize: MAX_SINGLE_FILE_SIZE }
      );
    }

    // Handle ZIP files
    let filesToProcess: Array<{ name: string; content: string; file?: File; size?: number }> = [];
    
    if (isZipFile(file.name)) {
      // Validate ZIP file size
      if (file.size > MAX_ZIP_SIZE) {
        return createErrorResponse(
          `Archive ZIP trop volumineuse. Taille maximale autorisée: ${(MAX_ZIP_SIZE / (1024 * 1024)).toFixed(0)}MB`,
          400,
          { field: 'file', fileSize: file.size, maxSize: MAX_ZIP_SIZE }
        );
      }

      logInfo('ZIP file detected, extracting...', { fileName: file.name, size: file.size });
      try {
        const extractedFiles = await extractZipFile(file);
        
        if (extractedFiles.length === 0) {
          return createErrorResponse(
            'Aucun fichier valide trouvé dans l\'archive ZIP. Formats supportés: CSV, TXT, RES2DINV (.dat), AGI SuperSting (.stg)',
            400,
            { fileName: file.name }
          );
        }

        // Validate number of files
        if (extractedFiles.length > MAX_FILES_IN_ZIP) {
          return createErrorResponse(
            `Trop de fichiers dans l'archive ZIP. Maximum autorisé: ${MAX_FILES_IN_ZIP} fichiers. Archive contient: ${extractedFiles.length} fichiers`,
            400,
            { fileName: file.name, fileCount: extractedFiles.length, maxFiles: MAX_FILES_IN_ZIP }
          );
        }

        filesToProcess = extractedFiles.map(f => ({ 
          name: f.name, 
          content: f.content,
          size: f.size 
        }));
        
        logInfo(`Extracted ${extractedFiles.length} file(s) from ZIP`, { 
          files: extractedFiles.map(f => ({ name: f.name, size: f.size }))
        });
      } catch (zipError) {
        logWarn('ZIP extraction error', { error: zipError, fileName: file.name });
        
        // Provide more specific error messages
        let errorMessage = 'Erreur lors de l\'extraction du fichier ZIP';
        if (zipError instanceof Error) {
          if (zipError.message.includes('corrupt') || zipError.message.includes('invalid')) {
            errorMessage = 'L\'archive ZIP semble corrompue ou invalide. Veuillez vérifier le fichier.';
          } else if (zipError.message.includes('password')) {
            errorMessage = 'L\'archive ZIP est protégée par un mot de passe. Les archives protégées ne sont pas supportées.';
          } else {
            errorMessage = `Erreur lors de l'extraction: ${zipError.message}`;
          }
        }
        
        return createErrorResponse(
          errorMessage,
          400,
          { error: zipError instanceof Error ? zipError.message : 'Erreur inconnue', fileName: file.name }
        );
      }
    } else {
      // Single file - read content
      const content = await file.text();
      filesToProcess = [{ name: file.name, content, file, size: file.size }];
    }

    // Process all files
    let allDataPoints: DataPoint[] = [];
    let allParseErrors: any[] = [];
    let allParseWarnings: any[] = [];
    const csvOptions = {
      hasHeader,
      delimiter: delimiter || ',',
    };

    for (const fileToProcess of filesToProcess) {
      const fileName = fileToProcess.name;
      const detectedFormat = format || detectFileFormat(fileName);
      
      logInfo(`Processing file: ${fileName}`, { format: detectedFormat });

      try {
        let result: { data: DataPoint[]; errors: any[]; warnings: any[] };
        
        // Create a File-like object from content if needed
        let fileObj: File;
        if (fileToProcess.file) {
          fileObj = fileToProcess.file;
        } else {
          // Create a Blob and then File from content
          const blob = new Blob([fileToProcess.content], { type: 'text/plain' });
          fileObj = new File([blob], fileName, { type: blob.type });
        }

        if (detectedFormat === 'RES2DINV' || detectedFormat === 'RES3DINV') {
          result = await parseRES2DINVFile(fileObj);
        } else if (detectedFormat === 'AGI_SUPERSTING') {
          result = await parseAGISuperStingFile(fileObj);
        } else {
          result = await parseCSVFile(fileObj, csvOptions);
        }

        allDataPoints.push(...result.data);
        allParseErrors.push(...result.errors.map(err => ({ ...err, file: fileName })));
        allParseWarnings.push(...result.warnings.map(warn => ({ ...warn, file: fileName })));
      } catch (parseError) {
        logWarn(`Error parsing file ${fileName}`, { error: parseError });
        allParseErrors.push({
          file: fileName,
          line: 0,
          message: parseError instanceof Error ? parseError.message : 'Erreur lors du parsing',
          severity: 'error' as const,
        });
      }
    }

    if (allDataPoints.length === 0) {
      return createErrorResponse(
        'Aucune donnée valide trouvée dans les fichiers',
        400,
        { errors: allParseErrors, warnings: allParseWarnings }
      );
    }

    // Validate data
    const validation = validateDataPoints(allDataPoints);

    // Generate quality report
    const qualityReport = generateDataQualityReport(validation.valid);

    // Determine source format
    const sourceFormat = isZipFile(file.name) 
      ? 'ZIP' 
      : file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN';

    // Build enhanced metadata
    const metadata: any = {
      qualityReport,
      filesProcessed: filesToProcess.length,
      fileNames: filesToProcess.map(f => f.name),
      isArchive: isZipFile(file.name),
      importDate: new Date().toISOString(),
      totalRecordsProcessed: allDataPoints.length,
      totalRecordsImported: validation.valid.length,
      totalRecordsRejected: validation.invalid.length,
    };

    // Add ZIP-specific metadata
    if (isZipFile(file.name)) {
      metadata.archiveInfo = {
        originalFileName: file.name,
        originalSize: file.size,
        extractedFiles: filesToProcess.map(f => ({
          name: f.name,
          size: f.size || 0,
          format: f.name.split('.').pop()?.toUpperCase() || 'UNKNOWN',
        })),
        extractionErrors: allParseErrors.filter(e => e.file).map(e => ({
          file: e.file,
          line: e.line,
          message: e.message,
        })),
        extractionWarnings: allParseWarnings.filter(w => w.file).map(w => ({
          file: w.file,
          line: w.line,
          message: w.message,
        })),
      };
    }

    // Create dataset
    const dataset = await db.dataset.create({
      data: {
        id: uuidv4(),
        name,
        surveyLineId,
        dataType,
        sourceFormat,
        fileName: file.name,
        fileSize: file.size,
        rawData: validation.valid as any,
        metadata: JSON.stringify(metadata),
        isProcessed: false,
      },
    });

    // Log audit event
    await logAuditEvent(
      user.id,
      'DATASET_IMPORT',
      'DATASET',
      dataset.id,
      {
        name: dataset.name,
        dataType: dataset.dataType,
        fileName: dataset.fileName,
        recordsImported: validation.valid.length,
        recordsRejected: validation.invalid.length,
      },
      request
    );

    return createSuccessResponse(
      {
        dataset,
        importResult: {
          success: true,
          recordsProcessed: allDataPoints.length,
          recordsImported: validation.valid.length,
          recordsRejected: validation.invalid.length,
          filesProcessed: filesToProcess.length,
          errors: [...allParseErrors, ...validation.invalid.map((idx) => ({
            line: idx + 1,
            message: 'Donnée invalide',
            severity: 'error' as const,
          }))],
          warnings: allParseWarnings,
        },
        qualityReport,
      },
      `${validation.valid.length} points de données importés avec succès${filesToProcess.length > 1 ? ` depuis ${filesToProcess.length} fichier(s)` : ''}`
    );
  } catch (error) {
    return handleApiError(error, 'POST /api/datasets/import');
  }
}
