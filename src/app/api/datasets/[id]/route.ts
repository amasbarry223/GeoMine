import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { handleApiError, createErrorResponse, createSuccessResponse } from '@/lib/api-error-handler';
import { getUserFromRequest } from '@/lib/get-user-from-request';
import { canDeleteDataset } from '@/lib/permissions';
import { logAuditEvent } from '@/lib/audit';
import { DataType } from '@/types/geophysic';

// GET /api/datasets/[id] - Get a single dataset
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return createErrorResponse('Non authentifié', 401);
    }

    const dataset = await db.dataset.findUnique({
      where: { id: params.id },
      include: {
        surveyLine: {
          include: {
            campaign: {
              include: {
                project: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!dataset) {
      return createErrorResponse('Dataset non trouvé', 404, { datasetId: params.id });
    }

    // Transform to match frontend Dataset type
    const transformedDataset = {
      id: dataset.id,
      name: dataset.name,
      surveyLineId: dataset.surveyLineId,
      dataType: dataset.dataType as DataType,
      sourceFormat: dataset.sourceFormat,
      fileName: dataset.fileName,
      fileSize: dataset.fileSize,
      rawData: [],
      metadata: dataset.metadata || {},
      isProcessed: dataset.isProcessed,
      createdAt: dataset.createdAt,
      updatedAt: dataset.updatedAt,
      surveyLine: dataset.surveyLine
        ? {
            id: dataset.surveyLine.id,
            name: dataset.surveyLine.name,
            campaign: dataset.surveyLine.campaign
              ? {
                  id: dataset.surveyLine.campaign.id,
                  name: dataset.surveyLine.campaign.name,
                  project: dataset.surveyLine.campaign.project
                    ? {
                        id: dataset.surveyLine.campaign.project.id,
                        name: dataset.surveyLine.campaign.project.name,
                      }
                    : null,
                }
              : null,
          }
        : null,
    };

    return createSuccessResponse(transformedDataset);
  } catch (error) {
    return handleApiError(error, `GET /api/datasets/${params.id}`);
  }
}

// DELETE /api/datasets/[id] - Delete a dataset
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return createErrorResponse('Non authentifié', 401);
    }

    // Find dataset
    const dataset = await db.dataset.findUnique({
      where: { id: params.id },
      include: {
        surveyLine: {
          include: {
            campaign: {
              include: {
                project: true,
              },
            },
          },
        },
      },
    });

    if (!dataset) {
      return createErrorResponse('Dataset non trouvé', 404, { datasetId: params.id });
    }

    // Check permissions
    const permission = await canDeleteDataset(user, params.id);

    if (!permission.allowed) {
      return createErrorResponse(
        permission.reason || 'Permission refusée',
        403
      );
    }

    // Delete dataset (cascade will handle related data)
    await db.dataset.delete({
      where: { id: params.id },
    });

    // Log audit event
    await logAuditEvent(
      user.id,
      'DATASET_DELETE',
      'DATASET',
      params.id,
      {
        datasetName: dataset.name,
        surveyLineId: dataset.surveyLineId,
      },
      request
    );

    return createSuccessResponse(
      { id: params.id },
      'Dataset supprimé avec succès'
    );
  } catch (error) {
    return handleApiError(error, `DELETE /api/datasets/${params.id}`);
  }
}

