import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/db';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-error-handler';
import { UpdateGeochemicalSampleInput } from '@/types/geochemistry';

// GET /api/geochemistry/samples/[id] - Détails d'un échantillon
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return createErrorResponse('Non authentifié', 401);
    }

    const sample = await db.geochemicalSample.findUnique({
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
        assays: {
          orderBy: { element: 'asc' },
        },
      },
    });

    if (!sample) {
      return createErrorResponse('Échantillon non trouvé', 404);
    }

    return createSuccessResponse(sample);
  } catch (error) {
    console.error('[API] Error fetching geochemical sample:', error);
    return createErrorResponse(
      'Erreur lors de la récupération de l\'échantillon géochimique',
      500,
      error
    );
  }
}

// PUT /api/geochemistry/samples/[id] - Mise à jour d'un échantillon
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return createErrorResponse('Non authentifié', 401);
    }

    const body: UpdateGeochemicalSampleInput = await request.json();

    // Vérifier que l'échantillon existe
    const existingSample = await db.geochemicalSample.findUnique({
      where: { id: params.id },
    });

    if (!existingSample) {
      return createErrorResponse('Échantillon non trouvé', 404);
    }

    // Si le sampleID est modifié, vérifier qu'il n'existe pas déjà
    if (body.sampleID && body.sampleID !== existingSample.sampleID) {
      const duplicateSample = await db.geochemicalSample.findUnique({
        where: { sampleID: body.sampleID },
      });

      if (duplicateSample) {
        return createErrorResponse('Un échantillon avec ce sampleID existe déjà', 409);
      }
    }

    const sample = await db.geochemicalSample.update({
      where: { id: params.id },
      data: {
        ...(body.campaignId && { campaignId: body.campaignId }),
        ...(body.holeID !== undefined && { holeID: body.holeID }),
        ...(body.sampleID && { sampleID: body.sampleID }),
        ...(body.surfSampleType !== undefined && { surfSampleType: body.surfSampleType }),
        ...(body.qcRef !== undefined && { qcRef: body.qcRef }),
        ...(body.dupID !== undefined && { dupID: body.dupID }),
        ...(body.sampleStatus !== undefined && { sampleStatus: body.sampleStatus }),
        ...(body.depth_cm !== undefined && { depth_cm: body.depth_cm }),
        ...(body.x !== undefined && { x: body.x }),
        ...(body.y !== undefined && { y: body.y }),
        ...(body.z !== undefined && { z: body.z }),
        ...(body.utmZone !== undefined && { utmZone: body.utmZone }),
        ...(body.surveyMethod !== undefined && { surveyMethod: body.surveyMethod }),
        ...(body.weathering !== undefined && { weathering: body.weathering }),
        ...(body.color !== undefined && { color: body.color }),
        ...(body.grainSize !== undefined && { grainSize: body.grainSize }),
        ...(body.regolith !== undefined && { regolith: body.regolith }),
        ...(body.litho1 !== undefined && { litho1: body.litho1 }),
        ...(body.litho2 !== undefined && { litho2: body.litho2 }),
        ...(body.veinType !== undefined && { veinType: body.veinType }),
        ...(body.veinAbd !== undefined && { veinAbd: body.veinAbd }),
        ...(body.sulphideType !== undefined && { sulphideType: body.sulphideType }),
        ...(body.sulphideAbd !== undefined && { sulphideAbd: body.sulphideAbd }),
        ...(body.areaDescription !== undefined && { areaDescription: body.areaDescription }),
        ...(body.operator !== undefined && { operator: body.operator }),
        ...(body.geologist !== undefined && { geologist: body.geologist }),
        ...(body.date !== undefined && { date: body.date ? new Date(body.date) : null }),
        ...(body.comments !== undefined && { comments: body.comments }),
      },
      include: {
        assays: true,
      },
    });

    return createSuccessResponse(sample);
  } catch (error) {
    console.error('[API] Error updating geochemical sample:', error);
    return createErrorResponse(
      'Erreur lors de la mise à jour de l\'échantillon géochimique',
      500,
      error
    );
  }
}

// DELETE /api/geochemistry/samples/[id] - Suppression d'un échantillon
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return createErrorResponse('Non authentifié', 401);
    }

    const sample = await db.geochemicalSample.findUnique({
      where: { id: params.id },
    });

    if (!sample) {
      return createErrorResponse('Échantillon non trouvé', 404);
    }

    await db.geochemicalSample.delete({
      where: { id: params.id },
    });

    return createSuccessResponse({ message: 'Échantillon supprimé avec succès' });
  } catch (error) {
    console.error('[API] Error deleting geochemical sample:', error);
    return createErrorResponse(
      'Erreur lors de la suppression de l\'échantillon géochimique',
      500,
      error
    );
  }
}


