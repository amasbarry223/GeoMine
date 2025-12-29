import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/db';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-error-handler';
import { CreateDrillHoleInput, DrillType } from '@/types/drilling';

// GET /api/drilling/holes - Liste des trous avec filtres et pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return createErrorResponse('Non authentifié', 401);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const skip = (page - 1) * pageSize;

    // Filtres
    const campaignId = searchParams.get('campaignId');
    const holeID = searchParams.get('holeID');
    const drillType = searchParams.get('drillType') as DrillType | null;
    const search = searchParams.get('search');

    const where: any = {};

    if (campaignId) where.campaignId = campaignId;
    if (holeID) where.holeID = { contains: holeID };
    if (drillType) where.drillType = drillType;

    if (search) {
      where.OR = [
        { holeID: { contains: search } },
        { contractor: { contains: search } },
      ];
    }

    const [holes, total] = await Promise.all([
      db.drillHole.findMany({
        where,
        select: {
          id: true,
          campaignId: true,
          holeID: true,
          drillType: true,
          collarX: true,
          collarY: true,
          collarZ: true,
          azimuth: true,
          dip: true,
          totalDepth: true,
          utmZone: true,
          startDate: true,
          endDate: true,
          contractor: true,
          rigType: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              surveys: true,
              geology: true,
              assays: true,
              structures: true,
            },
          },
        },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      db.drillHole.count({ where }),
    ]);

    return createSuccessResponse({
      holes,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('[API] Error fetching drill holes:', error);
    return createErrorResponse('Erreur lors de la récupération des trous de forage', 500, error);
  }
}

// POST /api/drilling/holes - Création d'un trou
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return createErrorResponse('Non authentifié', 401);
    }

    const body: CreateDrillHoleInput = await request.json();

    // Validation
    if (!body.campaignId || !body.holeID || !body.drillType) {
      return createErrorResponse('campaignId, holeID et drillType sont requis', 400);
    }

    if (body.collarX === undefined || body.collarY === undefined || body.collarZ === undefined) {
      return createErrorResponse('collarX, collarY et collarZ sont requis', 400);
    }

    // Vérifier que la campagne existe
    const campaign = await db.campaign.findUnique({
      where: { id: body.campaignId },
    });

    if (!campaign) {
      return createErrorResponse('Campagne non trouvée', 404);
    }

    // Vérifier que le holeID n'existe pas déjà
    const existingHole = await db.drillHole.findUnique({
      where: { holeID: body.holeID },
    });

    if (existingHole) {
      return createErrorResponse('Un trou avec ce holeID existe déjà', 409);
    }

    const hole = await db.drillHole.create({
      data: {
        campaignId: body.campaignId,
        holeID: body.holeID,
        drillType: body.drillType,
        collarX: body.collarX,
        collarY: body.collarY,
        collarZ: body.collarZ,
        azimuth: body.azimuth,
        dip: body.dip,
        totalDepth: body.totalDepth,
        utmZone: body.utmZone,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        contractor: body.contractor,
        rigType: body.rigType,
      },
    });

    return createSuccessResponse(hole, undefined, 201);
  } catch (error) {
    console.error('[API] Error creating drill hole:', error);
    return createErrorResponse('Erreur lors de la création du trou de forage', 500, error);
  }
}

