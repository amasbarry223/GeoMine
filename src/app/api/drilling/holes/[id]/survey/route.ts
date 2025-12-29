import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/db';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-error-handler';
import { CreateDrillSurveyInput } from '@/types/drilling';

// GET /api/drilling/holes/[id]/survey - Liste des surveys d'un trou
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return createErrorResponse('Non authentifié', 401);
    }

    const surveys = await db.drillSurvey.findMany({
      where: { drillHoleId: params.id },
      orderBy: { depth: 'asc' },
    });

    return createSuccessResponse(surveys);
  } catch (error) {
    console.error('[API] Error fetching drill surveys:', error);
    return createErrorResponse('Erreur lors de la récupération des surveys', 500, error);
  }
}

// POST /api/drilling/holes/[id]/survey - Ajout d'un survey
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return createErrorResponse('Non authentifié', 401);
    }

    const body: CreateDrillSurveyInput = await request.json();

    if (!body.depth) {
      return createErrorResponse('depth est requis', 400);
    }

    // Vérifier que le trou existe
    const hole = await db.drillHole.findUnique({
      where: { id: params.id },
    });

    if (!hole) {
      return createErrorResponse('Trou non trouvé', 404);
    }

    const survey = await db.drillSurvey.create({
      data: {
        drillHoleId: params.id,
        depth: body.depth,
        azimuth: body.azimuth,
        dip: body.dip,
        toolFace: body.toolFace,
      },
    });

    return createSuccessResponse(survey, undefined, 201);
  } catch (error) {
    console.error('[API] Error creating drill survey:', error);
    return createErrorResponse('Erreur lors de la création du survey', 500, error);
  }
}


