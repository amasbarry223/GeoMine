import { GeoJSON, GeoJSONFeature, GISType, LayerStyle } from '@/types/geophysic';

// ============= GEOJSON PARSING =============

/**
 * Parse GeoJSON string into GeoJSON object
 */
export function parseGeoJSON(geojsonString: string): GeoJSON {
  try {
    return JSON.parse(geojsonString);
  } catch (error) {
    throw new Error('Invalid GeoJSON format');
  }
}

/**
 * Validate GeoJSON structure
 */
export function validateGeoJSON(geojson: any): geojson is GeoJSON {
  if (!geojson || typeof geojson !== 'object') {
    return false;
  }

  const validTypes = ['FeatureCollection', 'Feature', 'Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon', 'GeometryCollection'];

  if (!validTypes.includes(geojson.type)) {
    return false;
  }

  if (geojson.type === 'FeatureCollection') {
    if (!Array.isArray(geojson.features)) {
      return false;
    }
    return geojson.features.every((f: any) => validateGeoJSON(f));
  }

  if (geojson.type === 'Feature') {
    return geojson.geometry !== undefined && typeof geojson.properties === 'object';
  }

  if (['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon'].includes(geojson.type)) {
    return Array.isArray(geojson.coordinates);
  }

  if (geojson.type === 'GeometryCollection') {
    return Array.isArray(geojson.geometries);
  }

  return false;
}

/**
 * Convert GeoJSON to simplified format for rendering
 */
export function geoJSONToRenderFormat(geojson: GeoJSON, style?: LayerStyle) {
  if (geojson.type === 'FeatureCollection') {
    return geojson.features?.map(feature => geoJSONToRenderFormat(feature, style)) || [];
  }

  if (geojson.type === 'Feature') {
    return geoJSONToRenderFormat(geojson.geometry, style);
  }

  // For Point geometries
  if (geojson.type === 'Point') {
    const [x, y] = geojson.coordinates;
    return {
      type: 'point',
      x,
      y,
      properties: geojson.properties || {},
      style: style || {},
    };
  }

  // For LineString geometries
  if (geojson.type === 'LineString') {
    return {
      type: 'line',
      points: geojson.coordinates.map(([x, y]) => ({ x, y })),
      properties: geojson.properties || {},
      style: style || {},
    };
  }

  // For Polygon geometries
  if (geojson.type === 'Polygon') {
    return {
      type: 'polygon',
      points: geojson.coordinates[0].map(([x, y]) => ({ x, y })),
      properties: geojson.properties || {},
      style: style || {},
    };
  }

  return null;
}

// ============= GEOREFERENCING =============

export interface GeoreferencingParams {
  sourceCRS: string; // Coordinate Reference System (e.g., 'EPSG:4326', 'EPSG:2154')
  targetCRS: string;
  transform?: {
    offsetX: number;
    offsetY: number;
    rotation?: number;
    scale?: number;
  };
}

/**
 * Georeference coordinates from one CRS to another
 * Note: This is a simplified implementation. Production would use proj4js or similar
 */
export function georeferenceCoordinates(
  x: number,
  y: number,
  params: GeoreferencingParams
): { x: number; y: number } {
  let transformedX = x;
  let transformedY = y;

  // Apply transformation if provided
  if (params.transform) {
    const { offsetX, offsetY, rotation = 0, scale = 1 } = params.transform;

    // Apply scale
    transformedX *= scale;
    transformedY *= scale;

    // Apply rotation
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    const rotatedX = transformedX * cos - transformedY * sin;
    const rotatedY = transformedX * sin + transformedY * cos;
    transformedX = rotatedX;
    transformedY = rotatedY;

    // Apply offset
    transformedX += offsetX;
    transformedY += offsetY;
  }

  // Note: Full CRS transformation would use a library like proj4js
  // This is a placeholder for that functionality
  if (params.sourceCRS !== params.targetCRS) {
    console.warn(`CRS transformation from ${params.sourceCRS} to ${params.targetCRS} not fully implemented`);
  }

  return { x: transformedX, y: transformedY };
}

/**
 * Calculate bounding box of GeoJSON geometry
 */
export function calculateBoundingBox(geojson: GeoJSON): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  function processCoordinates(coords: any[]) {
    coords.forEach(coord => {
      if (typeof coord === 'number') {
        // Coordinate value - will be handled in pairs
      } else if (Array.isArray(coord)) {
        if (coord.length === 2 && typeof coord[0] === 'number' && typeof coord[1] === 'number') {
          // It's a [x, y] coordinate
          minX = Math.min(minX, coord[0]);
          minY = Math.min(minY, coord[1]);
          maxX = Math.max(maxX, coord[0]);
          maxY = Math.max(maxY, coord[1]);
        } else {
          processCoordinates(coord);
        }
      }
    });
  }

  if (geojson.type === 'FeatureCollection') {
    geojson.features?.forEach(feature => {
      if (feature.geometry && feature.geometry.coordinates) {
        processCoordinates(feature.geometry.coordinates);
      }
    });
  } else if (geojson.type === 'Feature') {
    if (geojson.geometry && geojson.geometry.coordinates) {
      processCoordinates(geojson.geometry.coordinates);
    }
  } else if (geojson.coordinates) {
    processCoordinates(geojson.coordinates);
  }

  if (!isFinite(minX) || !isFinite(minY)) {
    return null;
  }

  return { minX, minY, maxX, maxY };
}

/**
 * Check if a point is inside a polygon (ray casting algorithm)
 */
export function pointInPolygon(
  point: { x: number; y: number },
  polygon: { x: number; y: number }[]
): boolean {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;

    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;

    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Find which features contain a given point
 */
export function findFeaturesAtPoint(
  geojson: GeoJSON,
  point: { x: number; y: number }
): GeoJSONFeature[] {
  const features: GeoJSONFeature[] = [];

  if (geojson.type === 'FeatureCollection') {
    geojson.features?.forEach(feature => {
      if (featureContainsPoint(feature, point)) {
        features.push(feature);
      }
    });
  } else if (geojson.type === 'Feature') {
    if (featureContainsPoint(geojson, point)) {
      features.push(geojson);
    }
  }

  return features;
}

/**
 * Check if a feature contains a point
 */
function featureContainsPoint(feature: GeoJSONFeature, point: { x: number; y: number }): boolean {
  if (!feature.geometry) return false;

  const geometry = feature.geometry;

  if (geometry.type === 'Point') {
    return geometry.coordinates[0] === point.x && geometry.coordinates[1] === point.y;
  }

  if (geometry.type === 'Polygon') {
    const polygon = geometry.coordinates[0].map(([x, y]) => ({ x, y }));
    return pointInPolygon(point, polygon);
  }

  // For other geometry types, return false for now
  return false;
}

// ============= EXPORT FUNCTIONS =============

/**
 * Export data to GeoJSON format
 */
export function exportToGeoJSON(data: any, type: 'Point' | 'LineString' | 'Polygon' = 'Point'): GeoJSON {
  const features: GeoJSONFeature[] = [];

  if (type === 'Point') {
    if (Array.isArray(data)) {
      data.forEach((item, index) => {
        features.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [item.x || 0, item.y || 0, item.z || 0],
          },
          properties: { ...item, id: index },
        });
      });
    }
  } else if (type === 'LineString') {
    const coordinates = Array.isArray(data) ? data.map(item => [item.x, item.y]) : [];
    features.push({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates,
      },
      properties: {},
    });
  } else if (type === 'Polygon') {
    const coordinates = Array.isArray(data) ? data.map(item => [item.x, item.y]) : [];
    features.push({
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [coordinates],
      },
      properties: {},
    });
  }

  return {
    type: 'FeatureCollection',
    features,
  };
}

/**
 * Export layer as GeoJSON string
 */
export function exportLayerAsGeoJSON(
  layerName: string,
  data: any[],
  type: 'Point' | 'LineString' | 'Polygon' = 'Point'
): string {
  const geojson = exportToGeoJSON(data, type);
  geojson.properties = { name: layerName };
  return JSON.stringify(geojson, null, 2);
}

/**
 * Calculate statistics for a layer
 */
export function calculateLayerStatistics(geojson: GeoJSON): {
  featureCount: number;
  featureTypes: string[];
  boundingBox: ReturnType<typeof calculateBoundingBox>;
} | null {
  if (geojson.type !== 'FeatureCollection' || !geojson.features) {
    return null;
  }

  const featureTypes = new Set<string>();
  geojson.features.forEach(feature => {
    featureTypes.add(feature.geometry?.type || 'Unknown');
  });

  return {
    featureCount: geojson.features.length,
    featureTypes: Array.from(featureTypes),
    boundingBox: calculateBoundingBox(geojson),
  };
}

/**
 * Simplify geometry (Douglas-Peucker algorithm)
 */
export function simplifyGeometry(
  coordinates: number[][],
  tolerance: number = 0.0001
): number[][] {
  if (coordinates.length <= 2) {
    return coordinates;
  }

  // Find the point with maximum distance
  let maxDist = 0;
  let maxIndex = 0;

  for (let i = 1; i < coordinates.length - 1; i++) {
    const dist = perpendicularDistance(
      coordinates[i],
      coordinates[0],
      coordinates[coordinates.length - 1]
    );

    if (dist > maxDist) {
      maxDist = dist;
      maxIndex = i;
    }
  }

  // If max distance is greater than tolerance, recursively simplify
  if (maxDist > tolerance) {
    const left = simplifyGeometry(coordinates.slice(0, maxIndex + 1), tolerance);
    const right = simplifyGeometry(coordinates.slice(maxIndex), tolerance);
    return left.slice(0, -1).concat(right);
  } else {
    return [coordinates[0], coordinates[coordinates.length - 1]];
  }
}

/**
 * Calculate perpendicular distance from point to line
 */
function perpendicularDistance(
  point: number[],
  lineStart: number[],
  lineEnd: number[]
): number {
  if (lineStart[0] === lineEnd[0] && lineStart[1] === lineEnd[1]) {
    return Math.sqrt(
      Math.pow(point[0] - lineStart[0], 2) + Math.pow(point[1] - lineStart[1], 2)
    );
  }

  const num = Math.abs(
    (lineEnd[1] - lineStart[1]) * point[0] -
    (lineEnd[0] - lineStart[0]) * point[1] +
    lineEnd[0] * lineStart[1] -
    lineEnd[1] * lineStart[0]
  );

  const den = Math.sqrt(
    Math.pow(lineEnd[1] - lineStart[1], 2) + Math.pow(lineEnd[0] - lineStart[0], 2)
  );

  return num / den;
}

/**
 * Buffer geometry by a given distance
 */
export function bufferGeometry(
  coordinates: number[][],
  distance: number
): number[][] {
  // Simplified buffering - production would use turf.js or similar
  const buffered: number[][] = [];

  coordinates.forEach(([x, y]) => {
    // Add points around each vertex
    for (let angle = 0; angle < 360; angle += 45) {
      const radians = (angle * Math.PI) / 180;
      buffered.push([
        x + distance * Math.cos(radians),
        y + distance * Math.sin(radians),
      ]);
    }
  });

  return buffered;
}

/**
 * Calculate area of a polygon
 */
export function calculatePolygonArea(coordinates: number[][]): number {
  let area = 0;

  for (let i = 0; i < coordinates.length; i++) {
    const j = (i + 1) % coordinates.length;
    area += coordinates[i][0] * coordinates[j][1];
    area -= coordinates[j][0] * coordinates[i][1];
  }

  return Math.abs(area) / 2;
}

/**
 * Calculate length of a line
 */
export function calculateLineLength(coordinates: number[][]): number {
  let length = 0;

  for (let i = 1; i < coordinates.length; i++) {
    const dx = coordinates[i][0] - coordinates[i - 1][0];
    const dy = coordinates[i][1] - coordinates[i - 1][1];
    length += Math.sqrt(dx * dx + dy * dy);
  }

  return length;
}

/**
 * Calculate centroid of a geometry
 */
export function calculateCentroid(geojson: GeoJSON): { x: number; y: number } | null {
  let sumX = 0;
  let sumY = 0;
  let count = 0;

  function processCoordinates(coords: any[]) {
    coords.forEach(coord => {
      if (coord.length === 2 && typeof coord[0] === 'number' && typeof coord[1] === 'number') {
        sumX += coord[0];
        sumY += coord[1];
        count++;
      } else if (Array.isArray(coord)) {
        processCoordinates(coord);
      }
    });
  }

  if (geojson.type === 'FeatureCollection') {
    geojson.features?.forEach(feature => {
      if (feature.geometry && feature.geometry.coordinates) {
        processCoordinates(feature.geometry.coordinates);
      }
    });
  } else if (geojson.type === 'Feature') {
    if (geojson.geometry && geojson.geometry.coordinates) {
      processCoordinates(geojson.geometry.coordinates);
    }
  } else if (geojson.coordinates) {
    processCoordinates(geojson.coordinates);
  }

  if (count === 0) {
    return null;
  }

  return { x: sumX / count, y: sumY / count };
}

// ============= SHAPEFILE IMPORT =============

/**
 * Parse Shapefile (simplified - requires server-side processing for full support)
 * This is a placeholder that expects pre-converted GeoJSON
 * For full Shapefile support, use shapefile library on server
 */
export async function parseShapefile(file: File): Promise<GeoJSON> {
  // Note: Full Shapefile parsing requires server-side processing
  // This function expects a .shp file that has been pre-processed
  // In production, you would:
  // 1. Upload to server
  // 2. Use shapefile library to parse .shp, .shx, .dbf files
  // 3. Convert to GeoJSON
  // 4. Return GeoJSON

  // For now, throw an error indicating server-side processing is needed
  throw new Error(
    'Shapefile import requires server-side processing. Please use the API endpoint /api/gis/import/shapefile'
  );
}

/**
 * Parse KML file
 */
export async function parseKML(file: File): Promise<GeoJSON> {
  const text = await file.text();
  
  // Simple KML parser (for basic KML files)
  // For full KML support, use a proper XML parser library
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(text, 'text/xml');

  // Check for parsing errors
  const parseError = xmlDoc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Invalid KML format');
  }

  // Extract Placemarks
  const placemarks = xmlDoc.querySelectorAll('Placemark');
  const features: GeoJSONFeature[] = [];

  placemarks.forEach((placemark) => {
    const name = placemark.querySelector('name')?.textContent || '';
    const description = placemark.querySelector('description')?.textContent || '';
    
    // Extract coordinates
    const coordinates: number[][] = [];
    const coordElements = placemark.querySelectorAll('coordinates');
    
    coordElements.forEach((coordEl) => {
      const coordText = coordEl.textContent?.trim() || '';
      const coordLines = coordText.split(/\s+/);
      
      coordLines.forEach((line) => {
        const parts = line.split(',');
        if (parts.length >= 2) {
          const lon = parseFloat(parts[0]);
          const lat = parseFloat(parts[1]);
          const alt = parts.length > 2 ? parseFloat(parts[2]) : 0;
          
          if (!isNaN(lon) && !isNaN(lat)) {
            coordinates.push([lon, lat, alt]);
          }
        }
      });
    });

    // Determine geometry type
    let geometryType: 'Point' | 'LineString' | 'Polygon' = 'Point';
    if (placemark.querySelector('LineString')) {
      geometryType = 'LineString';
    } else if (placemark.querySelector('Polygon')) {
      geometryType = 'Polygon';
    }

    // Create GeoJSON feature
    let geometry: any;
    if (geometryType === 'Point' && coordinates.length > 0) {
      geometry = {
        type: 'Point',
        coordinates: coordinates[0],
      };
    } else if (geometryType === 'LineString' && coordinates.length > 0) {
      geometry = {
        type: 'LineString',
        coordinates: coordinates,
      };
    } else if (geometryType === 'Polygon' && coordinates.length > 0) {
      geometry = {
        type: 'Polygon',
        coordinates: [coordinates],
      };
    }

    if (geometry) {
      features.push({
        type: 'Feature',
        geometry,
        properties: {
          name,
          description,
        },
      });
    }
  });

  return {
    type: 'FeatureCollection',
    features,
  };
}

// ============= GIS EXPORTS =============

/**
 * Export to GeoTIFF (simplified - requires server-side processing)
 */
export async function exportToGeoTIFF(
  data: number[][],
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
  crs: string = 'EPSG:4326'
): Promise<Blob> {
  // GeoTIFF export requires server-side processing with geotiff library
  // This function creates a JSON structure that can be sent to server
  const geotiffData = {
    data,
    bounds,
    crs,
    width: data[0]?.length || 0,
    height: data.length || 0,
  };

  // For now, return as JSON. In production, send to /api/gis/export/geotiff
  const jsonContent = JSON.stringify(geotiffData, null, 2);
  return new Blob([jsonContent], { type: 'application/json' });
}

/**
 * Export to DXF format
 */
export function exportToDXF(
  geojson: GeoJSON,
  layerName: string = 'GEOMINE_LAYER'
): string {
  let dxf = `0\nSECTION\n2\nHEADER\n0\nENDSEC\n`;
  dxf += `0\nSECTION\n2\nTABLES\n0\nTABLE\n2\nLAYER\n5\n2\n`;
  dxf += `100\nAcDbSymbolTable\n70\n1\n0\nLAYER\n5\n10\n`;
  dxf += `100\nAcDbSymbolTableRecord\n100\nAcDbLayerTableRecord\n2\n${layerName}\n70\n0\n62\n7\n6\nCONTINUOUS\n0\nENDTAB\n0\nENDSEC\n`;
  dxf += `0\nSECTION\n2\nENTITIES\n`;

  if (geojson.type === 'FeatureCollection' && geojson.features) {
    geojson.features.forEach((feature) => {
      if (feature.geometry.type === 'Point') {
        const [x, y] = feature.geometry.coordinates;
        dxf += `0\nPOINT\n8\n${layerName}\n10\n${x}\n20\n${y}\n30\n0\n`;
      } else if (feature.geometry.type === 'LineString') {
        dxf += `0\nPOLYLINE\n8\n${layerName}\n66\n1\n70\n0\n`;
        feature.geometry.coordinates.forEach((coord) => {
          const [x, y] = coord;
          dxf += `0\nVERTEX\n8\n${layerName}\n10\n${x}\n20\n${y}\n30\n0\n`;
        });
        dxf += `0\nSEQEND\n8\n${layerName}\n`;
      } else if (feature.geometry.type === 'Polygon') {
        feature.geometry.coordinates.forEach((ring) => {
          dxf += `0\nPOLYLINE\n8\n${layerName}\n66\n1\n70\n1\n`;
          ring.forEach((coord) => {
            const [x, y] = coord;
            dxf += `0\nVERTEX\n8\n${layerName}\n10\n${x}\n20\n${y}\n30\n0\n`;
          });
          dxf += `0\nSEQEND\n8\n${layerName}\n`;
        });
      }
    });
  }

  dxf += `0\nENDSEC\n0\nEOF\n`;
  return dxf;
}
