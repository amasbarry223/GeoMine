import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { handleApiError, createErrorResponse, createSuccessResponse } from '@/lib/api-error-handler';
import { getUserFromRequest } from '@/lib/get-user-from-request';
import { parseKML, parseShapefile } from '@/lib/geophysic/gis';
import { logAuditEvent } from '@/lib/audit';

// POST /api/gis/layers - Create a new GIS layer
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return createErrorResponse('Non authentifié', 401);
    }

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const layerType = formData.get('layerType') as string;
    const description = formData.get('description') as string;
    const projectId = formData.get('projectId') as string | null;
    const file = formData.get('file') as File | null;

    // Validation
    if (!name || name.trim().length === 0) {
      return createErrorResponse('Le nom de la couche est requis', 400, { field: 'name' });
    }

    if (!layerType) {
      return createErrorResponse('Le type de couche est requis', 400, { field: 'layerType' });
    }

    let layerData: any = null;
    let format: string | null = null;

    // Parse file if provided
    if (file) {
      const fileName = file.name.toLowerCase();
      const fileContent = await file.text();

      if (fileName.endsWith('.kml') || fileName.endsWith('.kmz')) {
        format = 'KML';
        layerData = parseKML(fileContent);
      } else if (fileName.endsWith('.geojson') || fileName.endsWith('.json')) {
        format = 'GeoJSON';
        try {
          layerData = JSON.parse(fileContent);
        } catch (error) {
          return createErrorResponse('Fichier GeoJSON invalide', 400);
        }
      } else if (fileName.endsWith('.shp')) {
        format = 'Shapefile';
        // Shapefile parsing requires server-side processing
        // For now, we'll store the file reference
        layerData = { format: 'Shapefile', fileName: file.name };
      } else {
        return createErrorResponse(
          'Format de fichier non supporté. Formats acceptés: KML, GeoJSON, Shapefile',
          400
        );
      }
    }

    // Create GIS layer
    const layer = await db.gISLayer.create({
      data: {
        name: name.trim(),
        layerType: layerType as any,
        projectId: projectId || null,
        fileName: file ? file.name : null,
        format: format || null,
        data: layerData ? JSON.stringify(layerData) : null,
        isVisible: true,
        zIndex: 0,
      },
    });

    // Log audit event
    await logAuditEvent(
      user.id,
      'GIS_LAYER_CREATE',
      'GIS_LAYER',
      layer.id,
      {
        name: layer.name,
        layerType: layer.layerType,
        projectId: projectId || null,
      },
      request
    );

    return createSuccessResponse(layer, 'Couche SIG créée avec succès', 201);
  } catch (error) {
    return handleApiError(error, 'POST /api/gis/layers');
  }
}

