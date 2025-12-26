import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { InversionType, DataType } from '@/types/geophysic';
import { invert2DLeastSquares } from '@/lib/geophysic/inversion';
import { v4 as uuidv4 } from 'uuid';
import { handleApiError, createErrorResponse, createSuccessResponse } from '@/lib/api-error-handler';
import { getUserFromRequest } from '@/lib/get-user-from-request';
import { canRunInversion } from '@/lib/permissions';
import { logAuditEvent } from '@/lib/audit';

// POST /api/inversion/run - Run geophysical inversion
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getUserFromRequest(request);
    if (!user) {
      return createErrorResponse('Non authentifié', 401);
    }

    // Check permissions
    const permission = canRunInversion(user);
    if (!permission.allowed) {
      return createErrorResponse(permission.reason || 'Permission refusée', 403);
    }

    const body = await request.json();
    const {
      datasetId,
      modelName,
      inversionType,
      parameters,
    } = body;

    if (!datasetId) {
      return createErrorResponse('ID du jeu de données requis', 400, { field: 'datasetId' });
    }

    if (!modelName || modelName.trim().length === 0) {
      return createErrorResponse('Nom du modèle requis', 400, { field: 'modelName' });
    }

    if (!inversionType) {
      return createErrorResponse('Type d\'inversion requis', 400, { field: 'inversionType' });
    }

    // Fetch dataset
    const dataset = await db.dataset.findUnique({
      where: { id: datasetId },
    });

    if (!dataset) {
      return createErrorResponse('Jeu de données non trouvé', 404, { datasetId });
    }

    // Parse raw data
    const rawData = typeof dataset.rawData === 'string'
      ? JSON.parse(dataset.rawData)
      : dataset.rawData;

    // Validate inversion type
    if (
      inversionType !== InversionType.RESISTIVITY_2D &&
      inversionType !== InversionType.CHARGEABILITY_2D
    ) {
      return createErrorResponse(
        'Type d\'inversion non supporté. Utilisez RESISTIVITY_2D ou CHARGEABILITY_2D',
        400,
        { inversionType, supportedTypes: [InversionType.RESISTIVITY_2D, InversionType.CHARGEABILITY_2D] }
      );
    }

    // Set default parameters if not provided
    const inversionOptions = {
      maxIterations: parameters?.maxIterations || 20,
      convergenceThreshold: parameters?.convergenceThreshold || 0.001,
      regularizationFactor: parameters?.regularizationFactor || 0.1,
      smoothingFactor: parameters?.smoothingFactor || 0.1,
      dampingFactor: parameters?.dampingFactor || 0.01,
      initialModel: parameters?.initialModel,
      constraints: parameters?.constraints,
      progressCallback: (iteration: number, rms: number, convergence: number) => {
        console.log(`Iteration ${iteration}: RMS=${rms.toFixed(6)}, Conv=${convergence.toFixed(6)}`);
      },
    };

    // Run inversion
    const result = await invert2DLeastSquares(rawData, inversionOptions);

    // Prepare model data for storage
    const modelData = {
      dimensions: result.model.dimensions,
      values: result.model.values,
      coordinates: result.model.coordinates,
      gridGeometry: result.model.gridGeometry,
    };

    // Prepare quality indicators
    const qualityIndicators = {
      rmsError: result.qualityIndicators.rmsError,
      dataMisfit: result.qualityIndicators.dataMisfit,
      modelRoughness: result.qualityIndicators.modelRoughness,
      depthOfInvestigation: result.qualityIndicators.depthOfInvestigation,
    };

    // Store inversion result in database
    const inversionModel = await db.inversionModel.create({
      data: {
        id: uuidv4(),
        datasetId,
        modelName,
        inversionType,
        algorithm: 'LEAST_SQUARES',
        iterations: result.iterations,
        rmsError: result.finalRMS,
        convergence: result.convergence[result.convergence.length - 1],
        regularizationFactor: inversionOptions.regularizationFactor,
        smoothingFactor: inversionOptions.smoothingFactor,
        modelParameters: inversionOptions,
        modelData: modelData as any,
        qualityIndicators: qualityIndicators as any,
        gridGeometry: result.model.gridGeometry as any,
      },
    });

    // Log audit event
    await logAuditEvent(
      user.id,
      'INVERSION_RUN',
      'INVERSION_MODEL',
      inversionModel.id,
      {
        modelName: inversionModel.modelName,
        inversionType: inversionModel.inversionType,
        iterations: inversionModel.iterations,
        rmsError: inversionModel.rmsError,
        datasetId,
      },
      request
    );

    return createSuccessResponse(
      {
        model: inversionModel,
        inversionResult: result,
      },
      `Inversion terminée en ${result.runtime}ms avec ${result.iterations} itérations`
    );
  } catch (error) {
    return handleApiError(error, 'POST /api/inversion/run');
  }
}

// GET /api/inversion/[id] - Get inversion model by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const model = await db.inversionModel.findUnique({
      where: { id: params.id },
      include: {
        dataset: {
          include: {
            surveyLine: {
              include: {
                campaign: true,
              },
            },
          },
        },
        annotations: true,
      },
    });

    if (!model) {
      return NextResponse.json(
        {
          success: false,
          error: 'Modèle d\'inversion non trouvé',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: model,
    });
  } catch (error) {
    console.error('Error fetching inversion model:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la récupération du modèle d\'inversion',
      },
      { status: 500 }
    );
  }
}
