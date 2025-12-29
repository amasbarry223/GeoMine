import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/db';
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/lib/api-error-handler';
import { CreateGeochemicalSampleInput, GeochemistryFilter } from '@/types/geochemistry';
import { createGeochemicalSampleSchema, geochemistryQuerySchema, validateQueryParams, validateRequestBody } from '@/lib/validators';
import { logApiRequest } from '@/lib/logger';

// GET /api/geochemistry/samples - Liste des échantillons avec filtres et pagination
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return createErrorResponse('Non authentifié', 401);
    }

    const { searchParams } = new URL(request.url);
    
    // Validate query parameters
    const queryValidation = validateQueryParams(searchParams, geochemistryQuerySchema);
    if (!queryValidation.success) {
      return createErrorResponse('Paramètres de requête invalides', 400, queryValidation.details);
    }
    
    const { page, pageSize, campaignId, sampleID, holeID, sampleStatus, search } = queryValidation.data;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (campaignId) where.campaignId = campaignId;
    if (sampleID) where.sampleID = { contains: sampleID };
    if (holeID) where.holeID = { contains: holeID };
    if (sampleStatus) where.sampleStatus = sampleStatus;

    if (search) {
      where.OR = [
        { sampleID: { contains: search } },
        { holeID: { contains: search } },
        { areaDescription: { contains: search } },
      ];
    }

    const [samples, total] = await Promise.all([
      db.geochemicalSample.findMany({
        where,
        select: {
          id: true,
          campaignId: true,
          holeID: true,
          sampleID: true,
          surfSampleType: true,
          qcRef: true,
          dupID: true,
          sampleStatus: true,
          depth_cm: true,
          x: true,
          y: true,
          z: true,
          utmZone: true,
          surveyMethod: true,
          weathering: true,
          color: true,
          grainSize: true,
          regolith: true,
          litho1: true,
          litho2: true,
          veinType: true,
          veinAbd: true,
          sulphideType: true,
          sulphideAbd: true,
          areaDescription: true,
          operator: true,
          geologist: true,
          date: true,
          comments: true,
          createdAt: true,
          updatedAt: true,
          assays: {
            select: {
              id: true,
              element: true,
              value: true,
              unit: true,
            },
          },
        },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      db.geochemicalSample.count({ where }),
    ]);

    const duration = Date.now() - startTime;
    logApiRequest('GET', '/api/geochemistry/samples', 200, duration);
    
    return createSuccessResponse({
      samples,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logApiRequest('GET', '/api/geochemistry/samples', 500, duration);
    return handleApiError(error, 'GET /api/geochemistry/samples');
  }
}

// POST /api/geochemistry/samples - Création d'un échantillon
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return createErrorResponse('Non authentifié', 401);
    }

    // Validate request body
    const bodyValidation = await validateRequestBody(request, createGeochemicalSampleSchema);
    if (!bodyValidation.success) {
      return createErrorResponse('Données invalides', 400, bodyValidation.details);
    }

    const body = bodyValidation.data;

    // Vérifier que la campagne existe
    const campaign = await db.campaign.findUnique({
      where: { id: body.campaignId },
    });

    if (!campaign) {
      return createErrorResponse('Campagne non trouvée', 404);
    }

    // Vérifier que le sampleID n'existe pas déjà
    const existingSample = await db.geochemicalSample.findUnique({
      where: { sampleID: body.sampleID },
    });

    if (existingSample) {
      return createErrorResponse('Un échantillon avec ce sampleID existe déjà', 409);
    }

    const sample = await db.geochemicalSample.create({
      data: {
        campaignId: body.campaignId,
        holeID: body.holeID,
        sampleID: body.sampleID,
        surfSampleType: body.surfSampleType,
        qcRef: body.qcRef,
        dupID: body.dupID,
        sampleStatus: body.sampleStatus,
        depth_cm: body.depth_cm,
        x: body.x,
        y: body.y,
        z: body.z,
        utmZone: body.utmZone,
        surveyMethod: body.surveyMethod,
        weathering: body.weathering,
        color: body.color,
        grainSize: body.grainSize,
        regolith: body.regolith,
        litho1: body.litho1,
        litho2: body.litho2,
        veinType: body.veinType,
        veinAbd: body.veinAbd,
        sulphideType: body.sulphideType,
        sulphideAbd: body.sulphideAbd,
        areaDescription: body.areaDescription,
        operator: body.operator,
        geologist: body.geologist,
        date: body.date ? new Date(body.date) : null,
        comments: body.comments,
      },
      include: {
        assays: true,
      },
    });

    const duration = Date.now() - startTime;
    logApiRequest('POST', '/api/geochemistry/samples', 201, duration, session.user?.id);
    
    return createSuccessResponse(sample, undefined, 201);
  } catch (error) {
    const duration = Date.now() - startTime;
    logApiRequest('POST', '/api/geochemistry/samples', 500, duration);
    return handleApiError(error, 'POST /api/geochemistry/samples');
  }
}

