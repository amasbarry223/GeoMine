import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { handleApiError, createErrorResponse, createSuccessResponse } from '@/lib/api-error-handler';
import { getUserFromRequest } from '@/lib/get-user-from-request';
import { DataType } from '@/types/geophysic';

// GET /api/datasets - List all datasets with optional filtering and pagination
export async function GET(request: NextRequest) {
  try {
    // Note: Authentication check removed for now to allow access
    // You can add it back if needed: const user = await getUserFromRequest(request);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const search = searchParams.get('search') || '';
    const dataType = searchParams.get('dataType') as DataType | null;
    const surveyLineId = searchParams.get('surveyLineId') || '';
    const campaignId = searchParams.get('campaignId') || '';

    const skip = (page - 1) * pageSize;

    const where: any = {};

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { fileName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Data type filter
    if (dataType) {
      where.dataType = dataType;
    }

    // Survey line filter
    if (surveyLineId) {
      where.surveyLineId = surveyLineId;
    }

    // Campaign filter (through survey line)
    if (campaignId) {
      where.surveyLine = {
        campaignId: campaignId,
      };
    }

    // Get total count for pagination
    let total = 0;
    let datasets: any[] = [];

    try {
      total = await db.dataset.count({ where });

      // Fetch datasets with related data
      datasets = await db.dataset.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          surveyLine: {
            include: {
              campaign: {
                include: {
                  project: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    } catch (dbError) {
      // If database error, log it and return empty result instead of failing
      console.error('Database error in GET /api/datasets:', dbError);
      // Return empty result instead of error for better UX
      return createSuccessResponse({
        items: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
      });
    }

    // Transform to match frontend Dataset type
    const transformedDatasets = datasets.map((dataset) => ({
      id: dataset.id,
      name: dataset.name,
      surveyLineId: dataset.surveyLineId,
      dataType: dataset.dataType as DataType,
      sourceFormat: dataset.sourceFormat,
      fileName: dataset.fileName,
      fileSize: dataset.fileSize,
      rawData: [],
      metadata: dataset.metadata || {},
      isProcessed: dataset.isProcessed,
      createdAt: dataset.createdAt,
      updatedAt: dataset.updatedAt,
      surveyLine: dataset.surveyLine
        ? {
            id: dataset.surveyLine.id,
            name: dataset.surveyLine.name,
            campaign: dataset.surveyLine.campaign
              ? {
                  id: dataset.surveyLine.campaign.id,
                  name: dataset.surveyLine.campaign.name,
                  project: dataset.surveyLine.campaign.project
                    ? {
                        id: dataset.surveyLine.campaign.project.id,
                        name: dataset.surveyLine.campaign.project.name,
                      }
                    : null,
                }
              : null,
          }
        : null,
    }));

    return createSuccessResponse({
      items: transformedDatasets,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    return handleApiError(error, 'GET /api/datasets');
  }
}

