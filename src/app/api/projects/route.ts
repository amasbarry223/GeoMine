import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ProjectStatus } from '@prisma/client';
import { handleApiError, createErrorResponse, createSuccessResponse } from '@/lib/api-error-handler';
import { getUserFromRequest } from '@/lib/get-user-from-request';
import { canCreateProject } from '@/lib/permissions';
import { logAuditEvent } from '@/lib/audit';
import { projectQuerySchema, createProjectSchema, validateQueryParams, validateRequestBody } from '@/lib/validators';
import { logApiRequest } from '@/lib/logger';
import { validateCSRF } from '@/lib/csrf';

// GET /api/projects - List all projects with optional filtering and pagination
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  try {
    const { searchParams } = new URL(request.url);
    
    // Validate query parameters
    const queryValidation = validateQueryParams(searchParams, projectQuerySchema);
    if (!queryValidation.success) {
      return createErrorResponse('Paramètres de requête invalides', 400, queryValidation.details);
    }
    
    const { page, pageSize, status, search, userId } = queryValidation.data;
    const skip = (page - 1) * pageSize;

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

    // Get total count for pagination
    const total = await db.project.count({ where });

    // Optimized query with select instead of include for better performance
    const projects = await db.project.findMany({
      where,
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
            _count: {
              select: {
            surveyLines: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      skip,
      take: pageSize,
    });

    return createSuccessResponse(
      {
        projects,
        pagination: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      },
      `${total} projet${total !== 1 ? 's' : ''} trouvé${total !== 1 ? 's' : ''}`
    );
  } catch (error) {
    return handleApiError(error, 'GET /api/projects');
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  const startTime = Date.now();
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
    const permission = canCreateProject(user);
    if (!permission.allowed) {
      return createErrorResponse(permission.reason || 'Permission refusée', 403);
    }

    // Validate request body (read once)
    const bodyValidation = await validateRequestBody(request, createProjectSchema);
    if (!bodyValidation.success) {
      return createErrorResponse('Données invalides', 400, bodyValidation.details);
    }

    const { 
      name, 
      description, 
      siteLocation, 
      gpsCoordinates, 
      tags,
      duplicateFrom,
      includeCampaigns = false,
      includeData = false,
    } = bodyValidation.data;

    // Handle duplication
    if (duplicateFrom) {
      const sourceProject = await db.project.findUnique({
        where: { id: duplicateFrom },
        include: {
          campaigns: includeCampaigns ? {
            include: {
              surveyLines: includeData ? {
                include: {
                  datasets: includeData ? {
                    include: {
                      inversionModels: includeData,
                    },
                  } : true,
                },
              } : true,
            },
          } : false,
        },
      });

      if (!sourceProject) {
        return createErrorResponse('Projet source non trouvé', 404, { projectId: duplicateFrom });
      }

      // Normalize GPS coordinates
      let normalizedGpsCoordinates: string | null = null;
      if (gpsCoordinates) {
        if (typeof gpsCoordinates === 'string') {
          normalizedGpsCoordinates = gpsCoordinates;
        } else if (typeof gpsCoordinates === 'object') {
          // Handle both {lat, lng} and {latitude, longitude} formats
          const lat = 'lat' in gpsCoordinates ? gpsCoordinates.lat : ('latitude' in gpsCoordinates ? gpsCoordinates.latitude : null);
          const lng = 'lng' in gpsCoordinates ? gpsCoordinates.lng : ('longitude' in gpsCoordinates ? gpsCoordinates.longitude : null);
          if (lat !== null && lng !== null) {
            normalizedGpsCoordinates = `${lat},${lng}`;
          }
        }
      } else if (sourceProject.gpsCoordinates) {
        normalizedGpsCoordinates = sourceProject.gpsCoordinates;
      }

      // Normalize tags
      let normalizedTags: string | null = null;
      if (tags && Array.isArray(tags)) {
        normalizedTags = JSON.stringify(tags);
      } else if (sourceProject.tags) {
        normalizedTags = sourceProject.tags;
      }

      // Create duplicated project
      const newProject = await db.project.create({
        data: {
          name: name.trim(),
          description: description?.trim() || sourceProject.description,
          siteLocation: siteLocation?.trim() || sourceProject.siteLocation,
          gpsCoordinates: normalizedGpsCoordinates,
          tags: normalizedTags,
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
                  const newDataset = await db.dataset.create({
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

                  // Duplicate inversion models if requested
                  if (includeData && dataset.inversionModels) {
                    for (const inversionModel of dataset.inversionModels) {
                      await db.inversionModel.create({
                        data: {
                          datasetId: newDataset.id,
                          modelName: inversionModel.modelName,
                          inversionType: inversionModel.inversionType,
                          algorithm: inversionModel.algorithm,
                          iterations: inversionModel.iterations,
                          rmsError: inversionModel.rmsError,
                          convergence: inversionModel.convergence,
                          regularizationFactor: inversionModel.regularizationFactor,
                          smoothingFactor: inversionModel.smoothingFactor,
                          modelParameters: inversionModel.modelParameters,
                          modelData: inversionModel.modelData,
                          qualityIndicators: inversionModel.qualityIndicators,
                          gridGeometry: inversionModel.gridGeometry,
                        },
                      });
                    }
                  }
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

    // Normalize GPS coordinates for regular creation
    let normalizedGpsCoordinates: string | null = null;
    if (gpsCoordinates) {
      if (typeof gpsCoordinates === 'string') {
        normalizedGpsCoordinates = gpsCoordinates;
      } else if (typeof gpsCoordinates === 'object') {
        const lat = 'lat' in gpsCoordinates ? gpsCoordinates.lat : ('latitude' in gpsCoordinates ? gpsCoordinates.latitude : null);
        const lng = 'lng' in gpsCoordinates ? gpsCoordinates.lng : ('longitude' in gpsCoordinates ? gpsCoordinates.longitude : null);
        if (lat !== null && lng !== null) {
          normalizedGpsCoordinates = `${lat},${lng}`;
        }
      }
    }

    // Normalize tags
    const normalizedTags = tags && Array.isArray(tags) ? JSON.stringify(tags) : null;

    // Regular project creation
    const project = await db.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        siteLocation: siteLocation?.trim() || null,
        gpsCoordinates: normalizedGpsCoordinates,
        tags: normalizedTags,
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
