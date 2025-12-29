import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/db';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-error-handler';
import { CreateDrillAssayInput } from '@/types/drilling';

// GET /api/drilling/holes/[id]/assays - Liste des analyses
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return createErrorResponse('Non authentifié', 401);
    }

    const { searchParams } = new URL(request.url);
    const element = searchParams.get('element');

    const where: any = { drillHoleId: params.id };
    if (element) {
      where.element = element;
    }

    const assays = await db.drillAssay.findMany({
      where,
      orderBy: [{ fromDepth: 'asc' }, { element: 'asc' }],
    });

    return createSuccessResponse(assays);
  } catch (error) {
    console.error('[API] Error fetching drill assays:', error);
    return createErrorResponse('Erreur lors de la récupération des analyses', 500, error);
  }
}

// POST /api/drilling/holes/[id]/assays - Ajout d'une analyse
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return createErrorResponse('Non authentifié', 401);
    }

    const body: CreateDrillAssayInput = await request.json();

    if (
      body.fromDepth === undefined ||
      body.toDepth === undefined ||
      !body.element ||
      body.value === undefined
    ) {
      return createErrorResponse('fromDepth, toDepth, element et value sont requis', 400);
    }

    // Vérifier que le trou existe
    const hole = await db.drillHole.findUnique({
      where: { id: params.id },
    });

    if (!hole) {
      return createErrorResponse('Trou non trouvé', 404);
    }

    const assay = await db.drillAssay.create({
      data: {
        drillHoleId: params.id,
        sampleID: body.sampleID,
        fromDepth: body.fromDepth,
        toDepth: body.toDepth,
        element: body.element,
        value: body.value,
        unit: body.unit || 'ppm',
        detectionLimit: body.detectionLimit,
        method: body.method,
        lab: body.lab,
      },
    });

    return createSuccessResponse(assay, undefined, 201);
  } catch (error) {
    console.error('[API] Error creating drill assay:', error);
    return createErrorResponse('Erreur lors de la création de l\'analyse', 500, error);
  }
}


