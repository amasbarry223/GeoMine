import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ProjectStatus } from '@prisma/client';
import { handleApiError, createErrorResponse, createSuccessResponse } from '@/lib/api-error-handler';
import { getUserFromRequest } from '@/lib/get-user-from-request';
import { canCreateProject } from '@/lib/permissions';
import { logAuditEvent } from '@/lib/audit';

// GET /api/projects - List all projects with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const userId = searchParams.get('userId');

    const where: any = {};

    if (status) {
      where.status = status as ProjectStatus;
    }

    if (userId) {
      where.createdBy = userId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { siteLocation: { contains: search, mode: 'insensitive' } },
      ];
    }

    const projects = await db.project.findMany({
      where,
      include: {
        campaigns: {
          include: {
            surveyLines: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return createSuccessResponse(
      { projects, total: projects.length },
      `${projects.length} projet${projects.length !== 1 ? 's' : ''} trouvé${projects.length !== 1 ? 's' : ''}`
    );
  } catch (error) {
    return handleApiError(error, 'GET /api/projects');
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getUserFromRequest(request);
    if (!user) {
      return createErrorResponse('Non authentifié', 401);
    }

    const body = await request.json();
    const { 
      name, 
      description, 
      siteLocation, 
      gpsCoordinates, 
      tags,
      duplicateFrom,
      includeCampaigns,
      includeData,
    } = body;

    // Check permissions
    const permission = canCreateProject(user);
    if (!permission.allowed) {
      return createErrorResponse(permission.reason || 'Permission refusée', 403);
    }

    // Validation
    if (!name || name.trim().length === 0) {
      return createErrorResponse('Le nom du projet est requis', 400, { field: 'name' });
    }

    // Handle duplication
    if (duplicateFrom) {
      const sourceProject = await db.project.findUnique({
        where: { id: duplicateFrom },
        include: {
          campaigns: includeCampaigns ? {
            include: {
              surveyLines: includeData ? {
                include: {
                  datasets: includeData,
                },
              } : true,
            },
          } : false,
        },
      });

      if (!sourceProject) {
        return createErrorResponse('Projet source non trouvé', 404, { projectId: duplicateFrom });
      }

      // Create duplicated project
      const newProject = await db.project.create({
        data: {
          name: name.trim(),
          description: description?.trim() || sourceProject.description,
          siteLocation: siteLocation?.trim() || sourceProject.siteLocation,
          gpsCoordinates: gpsCoordinates ? JSON.stringify(gpsCoordinates) : sourceProject.gpsCoordinates,
          tags: tags ? JSON.stringify(tags) : sourceProject.tags,
          createdBy: user.id,
          status: ProjectStatus.ACTIVE,
        },
      });

      // Duplicate campaigns if requested
      if (includeCampaigns && sourceProject.campaigns) {
        for (const campaign of sourceProject.campaigns) {
          const newCampaign = await db.campaign.create({
            data: {
              name: campaign.name,
              description: campaign.description,
              projectId: newProject.id,
              startDate: campaign.startDate,
              endDate: campaign.endDate,
              fieldTeam: campaign.fieldTeam,
              weatherConditions: campaign.weatherConditions,
              equipmentUsed: campaign.equipmentUsed,
            },
          });

          // Duplicate survey lines if requested
          if (includeData && campaign.surveyLines) {
            for (const surveyLine of campaign.surveyLines) {
              const newSurveyLine = await db.surveyLine.create({
                data: {
                  name: surveyLine.name,
                  campaignId: newCampaign.id,
                  lineType: surveyLine.lineType,
                  azimuth: surveyLine.azimuth,
                  dipAngle: surveyLine.dipAngle,
                  electrodeSpacing: surveyLine.electrodeSpacing,
                  numberOfElectrodes: surveyLine.numberOfElectrodes,
                  totalLength: surveyLine.totalLength,
                  topography: surveyLine.topography,
                },
              });

              // Duplicate datasets if requested
              if (surveyLine.datasets) {
                for (const dataset of surveyLine.datasets) {
                  await db.dataset.create({
                    data: {
                      name: dataset.name,
                      surveyLineId: newSurveyLine.id,
                      dataType: dataset.dataType,
                      sourceFormat: dataset.sourceFormat,
                      fileName: dataset.fileName,
                      fileSize: dataset.fileSize,
                      rawData: dataset.rawData,
                      metadata: dataset.metadata,
                      isProcessed: dataset.isProcessed,
                      processingHistory: dataset.processingHistory,
                    },
                  });
                }
              }
            }
          }
        }
      }

      // Log audit event
      await logAuditEvent(
        user.id,
        'PROJECT_CREATE',
        'PROJECT',
        newProject.id,
        { 
          name: newProject.name, 
          status: newProject.status,
          duplicatedFrom: duplicateFrom,
        },
        request
      );

      return createSuccessResponse(newProject, 'Projet dupliqué avec succès', 201);
    }

    // Regular project creation
    const project = await db.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        siteLocation: siteLocation?.trim() || null,
        gpsCoordinates: gpsCoordinates ? JSON.stringify(gpsCoordinates) : null,
        tags: tags ? JSON.stringify(tags) : null,
        createdBy: user.id,
        status: ProjectStatus.ACTIVE,
      },
    });

    // Log audit event
    await logAuditEvent(
      user.id,
      'PROJECT_CREATE',
      'PROJECT',
      project.id,
      { name: project.name, status: project.status },
      request
    );

    return createSuccessResponse(project, 'Projet créé avec succès', 201);
  } catch (error) {
    return handleApiError(error, 'POST /api/projects');
  }
}
