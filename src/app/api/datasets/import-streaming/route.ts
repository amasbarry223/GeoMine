import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DataType } from '@/types/geophysic';
import { parseCSVStreaming, processFileStreaming } from '@/lib/streaming-parser';
import { v4 as uuidv4 } from 'uuid';
import { handleApiError, createErrorResponse, createSuccessResponse } from '@/lib/api-error-handler';
import { getUserFromRequest } from '@/lib/get-user-from-request';
import { canImportDataset } from '@/lib/permissions';
import { logAuditEvent } from '@/lib/audit';
import { logInfo, logPerformance } from '@/lib/logger';

/**
 * POST /api/datasets/import-streaming - Import large files using streaming
 * This endpoint is optimized for files > 10MB
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
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
    const hasHeader = formData.get('hasHeader') === 'true';
    const delimiter = formData.get('delimiter') as string || ',';

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

    // Check file size - use streaming for files > 10MB
    const FILE_SIZE_THRESHOLD = 10 * 1024 * 1024; // 10MB
    const useStreaming = file.size > FILE_SIZE_THRESHOLD;

    logInfo('Starting dataset import', {
      fileName: file.name,
      fileSize: file.size,
      useStreaming,
      surveyLineId,
    });

    // Verify survey line exists
    const surveyLine = await db.surveyLine.findUnique({
      where: { id: surveyLineId },
    });

    if (!surveyLine) {
      return createErrorResponse('Ligne de sondage non trouvée', 404, { surveyLineId });
    }

    let allDataPoints: any[] = [];
    let parseErrors: any[] = [];
    let parseWarnings: any[] = [];

    if (useStreaming) {
      // Use streaming parser for large files
      const result = await parseCSVStreaming(file, {
        hasHeader,
        delimiter,
        chunkSize: 5000, // Process 5000 lines at a time
        onProgress: (processed, total) => {
          logInfo('Import progress', { processed, total, percentage: (processed / total) * 100 });
        },
      });

      allDataPoints = result.data;
      parseErrors = result.errors;
      parseWarnings = result.warnings;
    } else {
      // For smaller files, use regular parser (already implemented)
      // This would call the existing parseCSVFile function
      // For now, we'll use streaming parser for consistency
      const result = await parseCSVStreaming(file, {
        hasHeader,
        delimiter,
        chunkSize: 1000,
      });

      allDataPoints = result.data;
      parseErrors = result.errors;
      parseWarnings = result.warnings;
    }

    if (allDataPoints.length === 0) {
      return createErrorResponse(
        'Aucune donnée valide trouvée dans le fichier',
        400,
        { errors: parseErrors, warnings: parseWarnings }
      );
    }

    // Store data in chunks to avoid large JSON strings
    // For very large datasets, consider storing in separate table
    const rawDataChunk = JSON.stringify(allDataPoints);

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
        rawData: rawDataChunk,
        metadata: JSON.stringify({
          importMethod: useStreaming ? 'streaming' : 'standard',
          totalRecords: allDataPoints.length,
          errors: parseErrors.length,
          warnings: parseWarnings.length,
        }),
        isProcessed: false,
      },
    });

    const duration = Date.now() - startTime;
    logPerformance('Dataset import (streaming)', duration, {
      fileName: file.name,
      fileSize: file.size,
      recordsImported: allDataPoints.length,
      useStreaming,
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
        recordsImported: allDataPoints.length,
        importMethod: useStreaming ? 'streaming' : 'standard',
      },
      request
    );

    return createSuccessResponse(
      {
        dataset,
        importResult: {
          success: true,
          recordsProcessed: allDataPoints.length,
          recordsImported: allDataPoints.length,
          recordsRejected: parseErrors.length,
          errors: parseErrors,
          warnings: parseWarnings,
          importMethod: useStreaming ? 'streaming' : 'standard',
        },
      },
      `${allDataPoints.length} points de données importés avec succès`
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    logPerformance('Dataset import (streaming)', duration, { error: String(error) });
    return handleApiError(error, 'POST /api/datasets/import-streaming');
  }
}


