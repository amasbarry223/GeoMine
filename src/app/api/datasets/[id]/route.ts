import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { handleApiError, createErrorResponse, createSuccessResponse } from '@/lib/api-error-handler';
import { getUserFromRequest } from '@/lib/get-user-from-request';
import { canDeleteDataset } from '@/lib/permissions';
import { logAuditEvent } from '@/lib/audit';

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

