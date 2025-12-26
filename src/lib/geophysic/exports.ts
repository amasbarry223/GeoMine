import * as XLSX from 'xlsx';
import { DataPoint, Dataset } from '@/types/geophysic';

/**
 * Export dataset to Excel format
 */
export function exportToExcel(
  dataset: Dataset,
  includeMetadata: boolean = true,
  includeQualityReport: boolean = false
): Blob {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Raw Data
  const dataRows: any[] = [];
  
  // Headers
  dataRows.push(['X', 'Y', 'Z', 'Value', 'Electrode A', 'Electrode B', 'Electrode M', 'Electrode N']);
  
  // Data rows
  const rawData = typeof dataset.rawData === 'string' 
    ? JSON.parse(dataset.rawData) 
    : dataset.rawData;
  
  if (Array.isArray(rawData)) {
    rawData.forEach((point: DataPoint) => {
      dataRows.push([
        point.x,
        point.y,
        point.z || 0,
        point.value,
        point.electrodes?.A || '',
        point.electrodes?.B || '',
        point.electrodes?.M || '',
        point.electrodes?.N || '',
      ]);
    });
  }

  const dataSheet = XLSX.utils.aoa_to_sheet(dataRows);
  XLSX.utils.book_append_sheet(workbook, dataSheet, 'Données Brutes');

  // Sheet 2: Metadata
  if (includeMetadata) {
    const metadataRows: any[] = [
      ['Propriété', 'Valeur'],
      ['Nom', dataset.name || ''],
      ['Type de données', dataset.dataType || ''],
      ['Format source', dataset.sourceFormat || ''],
      ['Nom du fichier', dataset.fileName || ''],
      ['Taille du fichier', dataset.fileSize ? `${(dataset.fileSize / 1024).toFixed(2)} KB` : ''],
      ['Date de création', dataset.createdAt ? new Date(dataset.createdAt).toLocaleString() : ''],
    ];

    const metadataSheet = XLSX.utils.aoa_to_sheet(metadataRows);
    XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Métadonnées');
  }

  // Sheet 3: Quality Report
  if (includeQualityReport && dataset.metadata) {
    const qualityData = typeof dataset.metadata === 'string'
      ? JSON.parse(dataset.metadata)
      : dataset.metadata;

    if (qualityData.qualityReport) {
      const qualityRows: any[] = [
        ['Métrique', 'Valeur'],
        ['Nombre de points', qualityData.qualityReport.totalPoints || 0],
        ['Moyenne', qualityData.qualityReport.statistics?.mean?.toFixed(4) || ''],
        ['Médiane', qualityData.qualityReport.statistics?.median?.toFixed(4) || ''],
        ['Écart-type', qualityData.qualityReport.statistics?.stdDev?.toFixed(4) || ''],
        ['Minimum', qualityData.qualityReport.statistics?.min?.toFixed(4) || ''],
        ['Maximum', qualityData.qualityReport.statistics?.max?.toFixed(4) || ''],
        ['Outliers détectés', qualityData.qualityReport.outliers?.length || 0],
      ];

      const qualitySheet = XLSX.utils.aoa_to_sheet(qualityRows);
      XLSX.utils.book_append_sheet(workbook, qualitySheet, 'Rapport de Qualité');
    }
  }

  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Export dataset to CSV format
 */
export function exportToCSV(dataset: Dataset): string {
  const rawData = typeof dataset.rawData === 'string' 
    ? JSON.parse(dataset.rawData) 
    : dataset.rawData;

  if (!Array.isArray(rawData)) {
    return '';
  }

  // Headers
  const headers = ['X', 'Y', 'Z', 'Value', 'Electrode A', 'Electrode B', 'Electrode M', 'Electrode N'];
  const rows = [headers.join(',')];

  // Data rows
  rawData.forEach((point: DataPoint) => {
    rows.push([
      point.x,
      point.y,
      point.z || 0,
      point.value,
      point.electrodes?.A || '',
      point.electrodes?.B || '',
      point.electrodes?.M || '',
      point.electrodes?.N || '',
    ].join(','));
  });

  return rows.join('\n');
}

/**
 * Export dataset to HDF5 format
 * Note: This is a simplified implementation. For full HDF5 support, 
 * you would need a server-side implementation with h5wasm or hdf5-js
 */
export async function exportToHDF5(
  dataset: Dataset,
  includeMetadata: boolean = true,
  includeQualityReport: boolean = false
): Promise<Blob> {
  // Since HDF5 requires server-side processing, we'll create a structured JSON
  // that can be converted to HDF5 on the server
  const rawData = typeof dataset.rawData === 'string' 
    ? JSON.parse(dataset.rawData) 
    : dataset.rawData;

  const hdf5Structure = {
    '/data': {
      values: Array.isArray(rawData) ? rawData.map((p: DataPoint) => p.value) : [],
      coordinates: Array.isArray(rawData) ? rawData.map((p: DataPoint) => ({
        x: p.x,
        y: p.y,
        z: p.z || 0,
      })) : [],
      electrodes: Array.isArray(rawData) ? rawData.map((p: DataPoint) => p.electrodes || {}) : [],
    },
  };

  if (includeMetadata) {
    hdf5Structure['/metadata'] = {
      name: dataset.name || '',
      dataType: dataset.dataType || '',
      sourceFormat: dataset.sourceFormat || '',
      fileName: dataset.fileName || '',
      fileSize: dataset.fileSize || 0,
      createdAt: dataset.createdAt ? new Date(dataset.createdAt).toISOString() : '',
    };
  }

  if (includeQualityReport && dataset.metadata) {
    const qualityData = typeof dataset.metadata === 'string'
      ? JSON.parse(dataset.metadata)
      : dataset.metadata;

    if (qualityData.qualityReport) {
      hdf5Structure['/quality'] = qualityData.qualityReport;
    }
  }

  // For now, return as JSON. In production, this would be sent to a server endpoint
  // that converts it to actual HDF5 format
  const jsonContent = JSON.stringify(hdf5Structure, null, 2);
  return new Blob([jsonContent], { type: 'application/json' });
}

/**
 * Export 3D model to OBJ format
 */
export function exportToOBJ(
  model: { dimensions: { x: number; y: number; z?: number }; values: number[]; coordinates: { x: number[]; y: number[]; z?: number[] } },
  filename: string = 'model.obj'
): string {
  let objContent = `# OBJ file generated from GeoMine RC-Insight\n`;
  objContent += `# Model dimensions: ${model.dimensions.x} x ${model.dimensions.y}${model.dimensions.z ? ` x ${model.dimensions.z}` : ''}\n\n`;

  const minValue = Math.min(...model.values);
  const maxValue = Math.max(...model.values);
  const range = maxValue - minValue || 1;

  // Generate vertices
  const hasZ = model.dimensions.z && model.coordinates.z;
  const zCoords = model.coordinates.z || [0];

  for (let k = 0; k < (model.dimensions.z || 1); k++) {
    for (let j = 0; j < model.dimensions.y; j++) {
      for (let i = 0; i < model.dimensions.x; i++) {
        const idx = k * model.dimensions.x * model.dimensions.y + j * model.dimensions.x + i;
        const x = model.coordinates.x[i];
        const y = model.coordinates.y[j];
        const z = hasZ ? zCoords[k] : 0;
        objContent += `v ${x} ${y} ${z}\n`;
      }
    }
  }

  // Generate faces (simplified - creates boxes for each cell)
  objContent += `\n# Faces\n`;
  let vertexOffset = 1; // OBJ indices start at 1

  for (let k = 0; k < (model.dimensions.z || 1); k++) {
    for (let j = 0; j < model.dimensions.y - 1; j++) {
      for (let i = 0; i < model.dimensions.x - 1; i++) {
        const idx = k * model.dimensions.x * model.dimensions.y + j * model.dimensions.x + i;
        const value = model.values[idx];
        const normalizedValue = (value - minValue) / range;

        // Only export cells above threshold
        if (normalizedValue > 0.1) {
          const v1 = vertexOffset + idx;
          const v2 = vertexOffset + idx + 1;
          const v3 = vertexOffset + idx + model.dimensions.x + 1;
          const v4 = vertexOffset + idx + model.dimensions.x;

          // Top face
          objContent += `f ${v1} ${v2} ${v3} ${v4}\n`;
        }
      }
    }
    vertexOffset += model.dimensions.x * model.dimensions.y;
  }

  return objContent;
}

/**
 * Export 3D model to STL format (ASCII)
 */
export function exportToSTL(
  model: { dimensions: { x: number; y: number; z?: number }; values: number[]; coordinates: { x: number[]; y: number[]; z?: number[] } },
  filename: string = 'model.stl'
): string {
  let stlContent = `solid ${filename.replace('.stl', '')}\n`;

  const minValue = Math.min(...model.values);
  const maxValue = Math.max(...model.values);
  const range = maxValue - minValue || 1;

  const hasZ = model.dimensions.z && model.coordinates.z;
  const zCoords = model.coordinates.z || [0];

  // Generate triangular faces for each cell
  for (let k = 0; k < (model.dimensions.z || 1); k++) {
    for (let j = 0; j < model.dimensions.y - 1; j++) {
      for (let i = 0; i < model.dimensions.x - 1; i++) {
        const idx = k * model.dimensions.x * model.dimensions.y + j * model.dimensions.x + i;
        const value = model.values[idx];
        const normalizedValue = (value - minValue) / range;

        // Only export cells above threshold
        if (normalizedValue > 0.1) {
          const x1 = model.coordinates.x[i];
          const y1 = model.coordinates.y[j];
          const z1 = hasZ ? zCoords[k] : 0;

          const x2 = model.coordinates.x[i + 1];
          const y2 = model.coordinates.y[j];
          const z2 = hasZ ? zCoords[k] : 0;

          const x3 = model.coordinates.x[i + 1];
          const y3 = model.coordinates.y[j + 1];
          const z3 = hasZ ? zCoords[k] : 0;

          const x4 = model.coordinates.x[i];
          const y4 = model.coordinates.y[j + 1];
          const z4 = hasZ ? zCoords[k] : 0;

          // Face 1: Triangle 1
          stlContent += `  facet normal 0 0 1\n`;
          stlContent += `    outer loop\n`;
          stlContent += `      vertex ${x1} ${y1} ${z1}\n`;
          stlContent += `      vertex ${x2} ${y2} ${z2}\n`;
          stlContent += `      vertex ${x3} ${y3} ${z3}\n`;
          stlContent += `    endloop\n`;
          stlContent += `  endfacet\n`;

          // Face 2: Triangle 2
          stlContent += `  facet normal 0 0 1\n`;
          stlContent += `    outer loop\n`;
          stlContent += `      vertex ${x1} ${y1} ${z1}\n`;
          stlContent += `      vertex ${x3} ${y3} ${z3}\n`;
          stlContent += `      vertex ${x4} ${y4} ${z4}\n`;
          stlContent += `    endloop\n`;
          stlContent += `  endfacet\n`;
        }
      }
    }
  }

  stlContent += `endsolid ${filename.replace('.stl', '')}\n`;
  return stlContent;
}

/**
 * Download file helper
 */
export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

