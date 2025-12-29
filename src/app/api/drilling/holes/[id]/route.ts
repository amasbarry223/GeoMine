import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/db';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-error-handler';
import { UpdateDrillHoleInput } from '@/types/drilling';

// GET /api/drilling/holes/[id] - Détails d'un trou
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return createErrorResponse('Non authentifié', 401);
    }

    const hole = await db.drillHole.findUnique({
      where: { id: params.id },
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        surveys: {
          orderBy: { depth: 'asc' },
        },
        geology: {
          orderBy: { fromDepth: 'asc' },
        },
        assays: {
          orderBy: [{ fromDepth: 'asc' }, { element: 'asc' }],
        },
        structures: {
          orderBy: { depth: 'asc' },
        },
      },
    });

    if (!hole) {
      return createErrorResponse('Trou non trouvé', 404);
    }

    return createSuccessResponse(hole);
  } catch (error) {
    console.error('[API] Error fetching drill hole:', error);
    return createErrorResponse('Erreur lors de la récupération du trou de forage', 500, error);
  }
}

// PUT /api/drilling/holes/[id] - Mise à jour d'un trou
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return createErrorResponse('Non authentifié', 401);
    }

    const body: UpdateDrillHoleInput = await request.json();

    const existingHole = await db.drillHole.findUnique({
      where: { id: params.id },
    });

    if (!existingHole) {
      return createErrorResponse('Trou non trouvé', 404);
    }

    // Si le holeID est modifié, vérifier qu'il n'existe pas déjà
    if (body.holeID && body.holeID !== existingHole.holeID) {
      const duplicateHole = await db.drillHole.findUnique({
        where: { holeID: body.holeID },
      });

      if (duplicateHole) {
        return createErrorResponse('Un trou avec ce holeID existe déjà', 409);
      }
    }

    const hole = await db.drillHole.update({
      where: { id: params.id },
      data: {
        ...(body.campaignId !== undefined && { campaignId: body.campaignId }),
        ...(body.holeID !== undefined && { holeID: body.holeID }),
        ...(body.drillType !== undefined && { drillType: body.drillType }),
        ...(body.collarX !== undefined && { collarX: body.collarX }),
        ...(body.collarY !== undefined && { collarY: body.collarY }),
        ...(body.collarZ !== undefined && { collarZ: body.collarZ }),
        ...(body.azimuth !== undefined && { azimuth: body.azimuth }),
        ...(body.dip !== undefined && { dip: body.dip }),
        ...(body.totalDepth !== undefined && { totalDepth: body.totalDepth }),
        ...(body.utmZone !== undefined && { utmZone: body.utmZone }),
        ...(body.startDate !== undefined && {
          startDate: body.startDate ? new Date(body.startDate) : null,
        }),
        ...(body.endDate !== undefined && {
          endDate: body.endDate ? new Date(body.endDate) : null,
        }),
        ...(body.contractor !== undefined && { contractor: body.contractor }),
        ...(body.rigType !== undefined && { rigType: body.rigType }),
      },
    });

    return createSuccessResponse(hole);
  } catch (error) {
    console.error('[API] Error updating drill hole:', error);
    return createErrorResponse('Erreur lors de la mise à jour du trou de forage', 500, error);
  }
}

// DELETE /api/drilling/holes/[id] - Suppression d'un trou
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return createErrorResponse('Non authentifié', 401);
    }

    const hole = await db.drillHole.findUnique({
      where: { id: params.id },
    });

    if (!hole) {
      return createErrorResponse('Trou non trouvé', 404);
    }

    await db.drillHole.delete({
      where: { id: params.id },
    });

    return createSuccessResponse({ message: 'Trou supprimé avec succès' });
  } catch (error) {
    console.error('[API] Error deleting drill hole:', error);
    return createErrorResponse('Erreur lors de la suppression du trou de forage', 500, error);
  }
}


