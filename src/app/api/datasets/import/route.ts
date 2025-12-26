import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DataType } from '@/types/geophysic';
import { parseGeophysicalDataFile, validateDataPoints, generateDataQualityReport, parseCSVFile, parseRES2DINVFile, parseAGISuperStingFile, detectFileFormat } from '@/lib/geophysic/dataParser';
import { v4 as uuidv4 } from 'uuid';
import { handleApiError, createErrorResponse, createSuccessResponse } from '@/lib/api-error-handler';
import { getUserFromRequest } from '@/lib/get-user-from-request';
import { canImportDataset } from '@/lib/permissions';
import { logAuditEvent } from '@/lib/audit';

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

    // Detect format if not provided
    const detectedFormat = format || detectFileFormat(file.name);
    const csvOptions = {
      hasHeader,
      delimiter: delimiter || ',',
    };

    // Parse the file based on format
    let parseResult;
    let dataPoints: DataPoint[] = [];
    let parseErrors: any[] = [];
    let parseWarnings: any[] = [];

    try {
      if (detectedFormat === 'RES2DINV' || detectedFormat === 'RES3DINV') {
        const result = await parseRES2DINVFile(file);
        dataPoints = result.data;
        parseErrors = result.errors;
        parseWarnings = result.warnings;
      } else if (detectedFormat === 'AGI_SUPERSTING') {
        const result = await parseAGISuperStingFile(file);
        dataPoints = result.data;
        parseErrors = result.errors;
        parseWarnings = result.warnings;
      } else {
        const result = await parseCSVFile(file, csvOptions);
        dataPoints = result.data;
        parseErrors = result.errors;
        parseWarnings = result.warnings;
      }

      if (dataPoints.length === 0) {
        return createErrorResponse(
          'Aucune donnée valide trouvée dans le fichier',
          400,
          { errors: parseErrors, warnings: parseWarnings }
        );
      }
    } catch (parseError) {
      return createErrorResponse(
        'Erreur lors du parsing du fichier',
        400,
        parseError instanceof Error ? { message: parseError.message } : undefined
      );
    }

    // Validate data
    const validation = validateDataPoints(dataPoints);

    // Generate quality report
    const qualityReport = generateDataQualityReport(validation.valid);

    // Create dataset
    const dataset = await db.dataset.create({
      data: {
        id: uuidv4(),
        name,
        surveyLineId,
        dataType,
        sourceFormat: file.name.split('.').pop()?.toUpperCase(),
        fileName: file.name,
        fileSize: file.size,
        rawData: validation.valid as any,
        metadata: qualityReport ? { qualityReport } : undefined,
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
          recordsProcessed: dataPoints.length,
          recordsImported: validation.valid.length,
          recordsRejected: validation.invalid.length,
          errors: [...parseErrors, ...validation.invalid.map((idx) => ({
            line: idx + 1,
            message: 'Donnée invalide',
            severity: 'error' as const,
          }))],
          warnings: parseWarnings,
        },
        qualityReport,
      },
      `${validation.valid.length} points de données importés avec succès`
    );
  } catch (error) {
    return handleApiError(error, 'POST /api/datasets/import');
  }
}
