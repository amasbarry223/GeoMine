import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/db';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-error-handler';
import { getOrSet } from '@/lib/cache';
import {
  calculateDrillHoleStatistics,
  calculateAllElementStatistics,
  calculateHolePath,
  calculateDeviationStatistics,
  calculateGeologyStatistics,
  calculateStructuralStatistics,
} from '@/lib/drilling/analysis';
import type { DrillHoleAnalysis } from '@/types/drilling';

// GET /api/drilling/holes/[id]/analysis - Analyse complète d'un trou de forage
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return createErrorResponse('Non authentifié', 401);
    }

    // Récupérer le trou avec uniquement les champs nécessaires (optimisation Prisma)
    const hole = await db.drillHole.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        holeID: true,
        drillType: true,
        collarX: true,
        collarY: true,
        collarZ: true,
        azimuth: true,
        dip: true,
        totalDepth: true,
        updatedAt: true,
        surveys: {
          select: {
            id: true,
            depth: true,
            azimuth: true,
            dip: true,
            toolFace: true,
          },
          orderBy: { depth: 'asc' },
        },
        geology: {
          select: {
            id: true,
            fromDepth: true,
            toDepth: true,
            lithology: true,
            alteration: true,
            mineralization: true,
            weathering: true,
            color: true,
            texture: true,
            structure: true,
            notes: true,
            geologist: true,
            logDate: true,
          },
          orderBy: { fromDepth: 'asc' },
        },
        assays: {
          select: {
            id: true,
            sampleID: true,
            fromDepth: true,
            toDepth: true,
            element: true,
            value: true,
            unit: true,
            detectionLimit: true,
            method: true,
            lab: true,
          },
          orderBy: [{ fromDepth: 'asc' }, { element: 'asc' }],
        },
        structures: {
          select: {
            id: true,
            depth: true,
            direction: true,
            dip: true,
            structureType: true,
            description: true,
            geologist: true,
            measurementDate: true,
          },
          orderBy: { depth: 'asc' },
        },
      },
    });

    if (!hole) {
      return createErrorResponse('Trou non trouvé', 404);
    }

    // Utiliser le cache pour les calculs d'analyse
    // La clé inclut l'ID et updatedAt pour invalider le cache si les données changent
    const cacheKey = `drill-hole-analysis:${params.id}:${hole.updatedAt.getTime()}`;
    
    const analysis = await getOrSet<DrillHoleAnalysis>(
      cacheKey,
      async () => {
        // Calculer toutes les analyses
        const statistics = calculateDrillHoleStatistics(
          hole,
          hole.surveys,
          hole.geology,
          hole.assays,
          hole.structures
        );

        const elementStatistics = calculateAllElementStatistics(hole.assays);
        const path = calculateHolePath(hole, hole.surveys);
        const deviationStatistics = calculateDeviationStatistics(hole, hole.surveys);
        const geologyStatistics = calculateGeologyStatistics(hole.geology);
        const structuralStatistics = calculateStructuralStatistics(hole.structures);

        return {
          statistics,
          elementStatistics,
          deviationStatistics,
          geologyStatistics,
          structuralStatistics,
          path,
        };
      },
      { ttl: 3600 } // Cache pour 1 heure
    );

    return createSuccessResponse(analysis);
  } catch (error) {
    console.error('[API] Error calculating drill hole analysis:', error);
    return createErrorResponse(
      'Erreur lors du calcul de l\'analyse du trou de forage',
      500,
      error
    );
  }
}

