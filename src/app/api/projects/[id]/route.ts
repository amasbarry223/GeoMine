import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ProjectStatus } from '@prisma/client';
import { handleApiError, createErrorResponse, createSuccessResponse } from '@/lib/api-error-handler';
import { getUserFromRequest } from '@/lib/get-user-from-request';
import { canEditProject, canDeleteProject } from '@/lib/permissions';
import { logAuditEvent } from '@/lib/audit';

// GET /api/projects/[id] - Get a single project by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const project = await db.project.findUnique({
      where: { id: params.id },
      include: {
        campaigns: {
          include: {
            surveyLines: {
              include: {
                datasets: {
                  include: {
                    inversionModels: true,
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

    const body = await request.json();
    const { name, description, siteLocation, gpsCoordinates, tags, status } = body;

    // Verify project exists
    const existingProject = await db.project.findUnique({
      where: { id: params.id },
    });

    if (!existingProject) {
      return createErrorResponse('Projet non trouvé', 404, { projectId: params.id });
    }

    // Validate name if provided
    if (name !== undefined && (!name || name.trim().length === 0)) {
      return createErrorResponse('Le nom du projet ne peut pas être vide', 400, { field: 'name' });
    }

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
