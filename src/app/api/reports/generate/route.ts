import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ReportStatus } from '@prisma/client';
import { handleApiError, createErrorResponse, createSuccessResponse } from '@/lib/api-error-handler';
import { getUserFromRequest } from '@/lib/get-user-from-request';
import { canGenerateReport } from '@/lib/permissions';
import { logAuditEvent } from '@/lib/audit';

// POST /api/reports/generate - Generate a new report
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getUserFromRequest(request);
    if (!user) {
      return createErrorResponse('Non authentifié', 401);
    }

    // Check permissions
    const permission = canGenerateReport(user);
    if (!permission.allowed) {
      return createErrorResponse(permission.reason || 'Permission refusée', 403);
    }

    const body = await request.json();
    const {
      name,
      description,
      templateType,
      includedModels,
      projectId,
    } = body;

    // Validation
    if (!name || name.trim().length === 0) {
      return createErrorResponse('Le nom du rapport est requis', 400, { field: 'name' });
    }

    if (!projectId) {
      return createErrorResponse('L\'ID du projet est requis', 400, { field: 'projectId' });
    }

    // Verify project exists
    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return createErrorResponse('Projet non trouvé', 404, { projectId });
    }

    // Create report with DRAFT status
    const report = await db.report.create({
      data: {
        projectId,
        name: name.trim(),
        description: description?.trim() || null,
        templateType: templateType || null,
        content: JSON.stringify({ sections: [] }), // Empty content initially
        includedModels: JSON.stringify(includedModels || []),
        status: ReportStatus.DRAFT,
        generatedBy: user.id,
      },
    });

    // Log audit event
    await logAuditEvent(
      user.id,
      'REPORT_GENERATE',
      'REPORT',
      report.id,
      {
        name: report.name,
        templateType: report.templateType,
        projectId,
      },
      request
    );

    return createSuccessResponse(
      {
        report,
        message: 'Rapport créé avec succès',
      },
      201
    );
  } catch (error) {
    return handleApiError(error, 'Erreur lors de la génération du rapport');
  }
}

