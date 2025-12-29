import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/db';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-error-handler';
import { CreateStructuralMeasurementInput } from '@/types/drilling';

// GET /api/drilling/holes/[id]/structures - Liste des mesures structurales
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return createErrorResponse('Non authentifié', 401);
    }

    const structures = await db.structuralMeasurement.findMany({
      where: { drillHoleId: params.id },
      orderBy: { depth: 'asc' },
    });

    return createSuccessResponse(structures);
  } catch (error) {
    console.error('[API] Error fetching structural measurements:', error);
    return createErrorResponse(
      'Erreur lors de la récupération des mesures structurales',
      500,
      error
    );
  }
}

// POST /api/drilling/holes/[id]/structures - Ajout d'une mesure structurale
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return createErrorResponse('Non authentifié', 401);
    }

    const body: CreateStructuralMeasurementInput = await request.json();

    if (body.depth === undefined || body.direction === undefined || body.dip === undefined) {
      return createErrorResponse('depth, direction et dip sont requis', 400);
    }

    // Vérifier que le trou existe
    const hole = await db.drillHole.findUnique({
      where: { id: params.id },
    });

    if (!hole) {
      return createErrorResponse('Trou non trouvé', 404);
    }

    const structure = await db.structuralMeasurement.create({
      data: {
        drillHoleId: params.id,
        depth: body.depth,
        direction: body.direction,
        dip: body.dip,
        structureType: body.structureType,
        description: body.description,
        geologist: body.geologist,
        measurementDate: body.measurementDate ? new Date(body.measurementDate) : null,
      },
    });

    return createSuccessResponse(structure, undefined, 201);
  } catch (error) {
    console.error('[API] Error creating structural measurement:', error);
    return createErrorResponse(
      'Erreur lors de la création de la mesure structurale',
      500,
      error
    );
  }
}


