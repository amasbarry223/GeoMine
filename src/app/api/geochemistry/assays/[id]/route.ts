import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/db';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-error-handler';
import { UpdateGeochemicalAssayInput } from '@/types/geochemistry';

// GET /api/geochemistry/assays/[id] - Détails d'une analyse
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return createErrorResponse('Non authentifié', 401);
    }

    const assay = await db.geochemicalAssay.findUnique({
      where: { id: params.id },
      include: {
        sample: {
          include: {
            campaign: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!assay) {
      return createErrorResponse('Analyse non trouvée', 404);
    }

    return createSuccessResponse(assay);
  } catch (error) {
    console.error('[API] Error fetching geochemical assay:', error);
    return createErrorResponse(
      'Erreur lors de la récupération de l\'analyse géochimique',
      500,
      error
    );
  }
}

// PUT /api/geochemistry/assays/[id] - Mise à jour d'une analyse
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return createErrorResponse('Non authentifié', 401);
    }

    const body: UpdateGeochemicalAssayInput = await request.json();

    const existingAssay = await db.geochemicalAssay.findUnique({
      where: { id: params.id },
    });

    if (!existingAssay) {
      return createErrorResponse('Analyse non trouvée', 404);
    }

    const assay = await db.geochemicalAssay.update({
      where: { id: params.id },
      data: {
        ...(body.element !== undefined && { element: body.element }),
        ...(body.value !== undefined && { value: body.value }),
        ...(body.unit !== undefined && { unit: body.unit }),
        ...(body.detectionLimit !== undefined && { detectionLimit: body.detectionLimit }),
        ...(body.method !== undefined && { method: body.method }),
        ...(body.lab !== undefined && { lab: body.lab }),
        ...(body.labRef !== undefined && { labRef: body.labRef }),
      },
      include: {
        sample: true,
      },
    });

    return createSuccessResponse(assay);
  } catch (error) {
    console.error('[API] Error updating geochemical assay:', error);
    return createErrorResponse(
      'Erreur lors de la mise à jour de l\'analyse géochimique',
      500,
      error
    );
  }
}

// DELETE /api/geochemistry/assays/[id] - Suppression d'une analyse
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return createErrorResponse('Non authentifié', 401);
    }

    const assay = await db.geochemicalAssay.findUnique({
      where: { id: params.id },
    });

    if (!assay) {
      return createErrorResponse('Analyse non trouvée', 404);
    }

    await db.geochemicalAssay.delete({
      where: { id: params.id },
    });

    return createSuccessResponse({ message: 'Analyse supprimée avec succès' });
  } catch (error) {
    console.error('[API] Error deleting geochemical assay:', error);
    return createErrorResponse(
      'Erreur lors de la suppression de l\'analyse géochimique',
      500,
      error
    );
  }
}


