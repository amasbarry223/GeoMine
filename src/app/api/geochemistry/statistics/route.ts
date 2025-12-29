import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/db';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-error-handler';

// GET /api/geochemistry/statistics - Statistiques par élément
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return createErrorResponse('Non authentifié', 401);
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    const element = searchParams.get('element');

    const where: any = {};
    if (campaignId) {
      where.sample = { campaignId };
    }
    if (element) {
      where.element = element;
    }

    const assays = await db.geochemicalAssay.findMany({
      where,
      select: {
        element: true,
        value: true,
        detectionLimit: true,
      },
    });

    // Grouper par élément et calculer les statistiques
    const elementStats: Record<string, any> = {};

    assays.forEach((assay) => {
      if (!elementStats[assay.element]) {
        elementStats[assay.element] = {
          element: assay.element,
          values: [],
          detectionLimits: [],
        };
      }
      elementStats[assay.element].values.push(assay.value);
      if (assay.detectionLimit) {
        elementStats[assay.element].detectionLimits.push(assay.detectionLimit);
      }
    });

    const statistics = Object.values(elementStats).map((stat: any) => {
      const values = stat.values.sort((a: number, b: number) => a - b);
      const count = values.length;
      const mean = values.reduce((a: number, b: number) => a + b, 0) / count;
      const median = values[Math.floor(count / 2)];
      const q25 = values[Math.floor(count * 0.25)];
      const q75 = values[Math.floor(count * 0.75)];
      const variance =
        values.reduce((sum: number, val: number) => sum + Math.pow(val - mean, 2), 0) / count;
      const stdDev = Math.sqrt(variance);
      const min = values[0];
      const max = values[count - 1];

      const belowDetectionLimit = stat.detectionLimits.length
        ? values.filter(
            (v: number, i: number) =>
              stat.detectionLimits[i] && v < stat.detectionLimits[i]
          ).length
        : 0;

      return {
        element: stat.element,
        count,
        mean,
        median,
        stdDev,
        min,
        max,
        q25,
        q75,
        belowDetectionLimit,
        detectionLimit:
          stat.detectionLimits.length > 0
            ? Math.min(...stat.detectionLimits)
            : undefined,
      };
    });

    return createSuccessResponse(statistics);
  } catch (error) {
    console.error('[API] Error calculating geochemistry statistics:', error);
    return createErrorResponse(
      'Erreur lors du calcul des statistiques géochimiques',
      500,
      error
    );
  }
}


