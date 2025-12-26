import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { handleApiError, createErrorResponse, createSuccessResponse } from '@/lib/api-error-handler';
import { getUserFromRequest } from '@/lib/get-user-from-request';
import { logAuditEvent } from '@/lib/audit';

// DELETE /api/reports/[id] - Delete a report
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return createErrorResponse('Non authentifié', 401);
    }

    // Find report
    const report = await db.report.findUnique({
      where: { id: params.id },
    });

    if (!report) {
      return createErrorResponse('Rapport non trouvé', 404, { reportId: params.id });
    }

    // Check permissions: Only admin or the user who generated the report can delete it
    if (user.role !== 'ADMIN' && report.generatedBy !== user.id) {
      return createErrorResponse(
        'Vous n\'avez pas la permission de supprimer ce rapport',
        403
      );
    }

    // Log audit event before deletion
    await logAuditEvent(
      user.id,
      'REPORT_DELETE',
      'REPORT',
      params.id,
      {
        reportName: report.name,
        projectId: report.projectId,
      },
      request
    );

    // Delete report
    await db.report.delete({
      where: { id: params.id },
    });

    return createSuccessResponse(
      { id: params.id },
      'Rapport supprimé avec succès'
    );
  } catch (error) {
    return handleApiError(error, `DELETE /api/reports/${params.id}`);
  }
}

