import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ProjectStatus } from '@prisma/client';
import { handleApiError, createErrorResponse, createSuccessResponse } from '@/lib/api-error-handler';
import { getUserFromRequest } from '@/lib/get-user-from-request';
import { canEditProject, canDeleteProject } from '@/lib/permissions';
import { logAuditEvent } from '@/lib/audit';
import { updateProjectSchema, validateRequestBody } from '@/lib/validators';
import { logApiRequest } from '@/lib/logger';
import { validateCSRF } from '@/lib/csrf';

// GET /api/projects/[id] - Get a single project by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Use select instead of include for better performance
    const project = await db.project.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        description: true,
        siteLocation: true,
        gpsCoordinates: true,
        status: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
        campaigns: {
          select: {
            id: true,
            name: true,
            description: true,
            startDate: true,
            endDate: true,
            fieldTeam: true,
            weatherConditions: true,
            equipmentUsed: true,
            createdAt: true,
            updatedAt: true,
            surveyLines: {
              select: {
                id: true,
                name: true,
                lineType: true,
                azimuth: true,
                dipAngle: true,
                electrodeSpacing: true,
                numberOfElectrodes: true,
                totalLength: true,
                topography: true,
                createdAt: true,
                datasets: {
                  select: {
                    id: true,
                    name: true,
                    dataType: true,
                    sourceFormat: true,
                    fileName: true,
                    fileSize: true,
                    isProcessed: true,
                    createdAt: true,
                    inversionModels: {
                      select: {
                        id: true,
                        modelName: true,
                        inversionType: true,
                        algorithm: true,
                        iterations: true,
                        rmsError: true,
                        convergence: true,
                        createdAt: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!project) {
      return createErrorResponse('Projet non trouvé', 404, { projectId: params.id });
    }

    return createSuccessResponse(project);
  } catch (error) {
    return handleApiError(error, `GET /api/projects/${params.id}`);
  }
}

// PUT /api/projects/[id] - Update a project
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate CSRF token
    const csrfValidation = validateCSRF(request);
    if (!csrfValidation.valid) {
      return createErrorResponse(csrfValidation.error || 'Token CSRF invalide', 403);
    }

    // Get authenticated user
    const user = await getUserFromRequest(request);
    if (!user) {
      return createErrorResponse('Non authentifié', 401);
    }

    // Check permissions
    const permission = await canEditProject(user, params.id);
    if (!permission.allowed) {
      return createErrorResponse(permission.reason || 'Permission refusée', 403);
    }

    // Verify project exists
    const existingProject = await db.project.findUnique({
      where: { id: params.id },
    });

    if (!existingProject) {
      return createErrorResponse('Projet non trouvé', 404, { projectId: params.id });
    }

    // Validate request body
    const bodyValidation = await validateRequestBody(request, updateProjectSchema);
    if (!bodyValidation.success) {
      return createErrorResponse('Données invalides', 400, bodyValidation.details);
    }

    const { name, description, siteLocation, gpsCoordinates, tags, status } = bodyValidation.data;

    const project = await db.project.update({
      where: { id: params.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(siteLocation !== undefined && { siteLocation: siteLocation?.trim() || null }),
        ...(gpsCoordinates !== undefined && { gpsCoordinates: gpsCoordinates ? JSON.stringify(gpsCoordinates) : null }),
        ...(tags !== undefined && { tags: tags ? JSON.stringify(tags) : null }),
        ...(status && { status: status as ProjectStatus }),
      },
    });

    // Log audit event
    await logAuditEvent(
      user.id,
      'PROJECT_UPDATE',
      'PROJECT',
      project.id,
      { changes: { name, description, siteLocation, status } },
      request
    );

    return createSuccessResponse(project, 'Projet mis à jour avec succès');
  } catch (error) {
    return handleApiError(error, `PUT /api/projects/${params.id}`);
  }
}

// DELETE /api/projects/[id] - Delete a project
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate CSRF token
    const csrfValidation = validateCSRF(request);
    if (!csrfValidation.valid) {
      return createErrorResponse(csrfValidation.error || 'Token CSRF invalide', 403);
    }

    // Get authenticated user
    const user = await getUserFromRequest(request);
    if (!user) {
      return createErrorResponse('Non authentifié', 401);
    }

    // Check permissions
    const permission = await canDeleteProject(user, params.id);
    if (!permission.allowed) {
      return createErrorResponse(permission.reason || 'Permission refusée', 403);
    }

    // Verify project exists
    const existingProject = await db.project.findUnique({
      where: { id: params.id },
    });

    if (!existingProject) {
      return createErrorResponse('Projet non trouvé', 404, { projectId: params.id });
    }

    // Log audit event before deletion
    await logAuditEvent(
      user.id,
      'PROJECT_DELETE',
      'PROJECT',
      params.id,
      { name: existingProject.name },
      request
    );

    // Delete project (cascade will handle related records)
    await db.project.delete({
      where: { id: params.id },
    });

    return createSuccessResponse(null, 'Projet supprimé avec succès');
  } catch (error) {
    return handleApiError(error, `DELETE /api/projects/${params.id}`);
  }
}
