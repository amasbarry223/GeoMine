import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/db';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-error-handler';
import { CreateGeochemicalAssayInput } from '@/types/geochemistry';

// GET /api/geochemistry/assays - Liste des analyses avec filtres
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return createErrorResponse('Non authentifié', 401);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const skip = (page - 1) * pageSize;

    // Filtres
    const sampleId = searchParams.get('sampleId');
    const element = searchParams.get('element');
    const campaignId = searchParams.get('campaignId');
    const minValue = searchParams.get('minValue');
    const maxValue = searchParams.get('maxValue');

    const where: any = {};

    if (sampleId) where.sampleId = sampleId;
    if (element) where.element = element;
    if (minValue) where.value = { ...where.value, gte: parseFloat(minValue) };
    if (maxValue) where.value = { ...where.value, lte: parseFloat(maxValue) };

    if (campaignId) {
      where.sample = {
        campaignId: campaignId,
      };
    }

    const [assays, total] = await Promise.all([
      db.geochemicalAssay.findMany({
        where,
        include: {
          sample: {
            select: {
              id: true,
              sampleID: true,
              x: true,
              y: true,
              z: true,
            },
          },
        },
        skip,
        take: pageSize,
        orderBy: [{ element: 'asc' }, { value: 'desc' }],
      }),
      db.geochemicalAssay.count({ where }),
    ]);

    return createSuccessResponse({
      assays,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('[API] Error fetching geochemical assays:', error);
    return createErrorResponse(
      'Erreur lors de la récupération des analyses géochimiques',
      500,
      error
    );
  }
}

// POST /api/geochemistry/assays - Création d'une analyse
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return createErrorResponse('Non authentifié', 401);
    }

    const body: CreateGeochemicalAssayInput = await request.json();

    // Validation
    if (!body.sampleId || !body.element || body.value === undefined) {
      return createErrorResponse('sampleId, element et value sont requis', 400);
    }

    // Vérifier que l'échantillon existe
    const sample = await db.geochemicalSample.findUnique({
      where: { id: body.sampleId },
    });

    if (!sample) {
      return createErrorResponse('Échantillon non trouvé', 404);
    }

    const assay = await db.geochemicalAssay.create({
      data: {
        sampleId: body.sampleId,
        element: body.element,
        value: body.value,
        unit: body.unit || 'ppm',
        detectionLimit: body.detectionLimit,
        method: body.method,
        lab: body.lab,
        labRef: body.labRef,
      },
      include: {
        sample: true,
      },
    });

    return createSuccessResponse(assay, undefined, 201);
  } catch (error) {
    console.error('[API] Error creating geochemical assay:', error);
    return createErrorResponse(
      'Erreur lors de la création de l\'analyse géochimique',
      500,
      error
    );
  }
}

