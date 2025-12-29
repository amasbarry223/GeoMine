import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/db';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-error-handler';
import { CreateGeologyLogInput } from '@/types/drilling';

// GET /api/drilling/holes/[id]/geology - Liste des logs géologiques
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return createErrorResponse('Non authentifié', 401);
    }

    const geology = await db.geologyLog.findMany({
      where: { drillHoleId: params.id },
      orderBy: { fromDepth: 'asc' },
    });

    return createSuccessResponse(geology);
  } catch (error) {
    console.error('[API] Error fetching geology logs:', error);
    return createErrorResponse('Erreur lors de la récupération des logs géologiques', 500, error);
  }
}

// POST /api/drilling/holes/[id]/geology - Ajout d'un log géologique
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return createErrorResponse('Non authentifié', 401);
    }

    const body: CreateGeologyLogInput = await request.json();

    if (body.fromDepth === undefined || body.toDepth === undefined) {
      return createErrorResponse('fromDepth et toDepth sont requis', 400);
    }

    // Vérifier que le trou existe
    const hole = await db.drillHole.findUnique({
      where: { id: params.id },
    });

    if (!hole) {
      return createErrorResponse('Trou non trouvé', 404);
    }

    const geology = await db.geologyLog.create({
      data: {
        drillHoleId: params.id,
        fromDepth: body.fromDepth,
        toDepth: body.toDepth,
        lithology: body.lithology,
        alteration: body.alteration,
        mineralization: body.mineralization,
        weathering: body.weathering,
        color: body.color,
        texture: body.texture,
        structure: body.structure,
        notes: body.notes,
        geologist: body.geologist,
        logDate: body.logDate ? new Date(body.logDate) : null,
      },
    });

    return createSuccessResponse(geology, undefined, 201);
  } catch (error) {
    console.error('[API] Error creating geology log:', error);
    return createErrorResponse('Erreur lors de la création du log géologique', 500, error);
  }
}


