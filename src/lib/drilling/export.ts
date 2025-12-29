import {
  DrillHole,
  DrillSurvey,
  GeologyLog,
  DrillAssay,
  StructuralMeasurement,
  DrillHoleAnalysis,
} from '@/types/drilling';

/**
 * Export drill hole data as CSV
 */
export function exportDrillHoleAsCSV(
  hole: DrillHole,
  surveys: DrillSurvey[],
  geology: GeologyLog[],
  assays: DrillAssay[],
  structures: StructuralMeasurement[]
): string {
  const lines: string[] = [];

  // Header
  lines.push('=== DRILL HOLE DATA EXPORT ===');
  lines.push(`Hole ID: ${hole.holeID}`);
  lines.push(`Type: ${hole.drillType}`);
  lines.push(`Collar X: ${hole.collarX}, Y: ${hole.collarY}, Z: ${hole.collarZ}`);
  lines.push('');

  // Surveys
  if (surveys.length > 0) {
    lines.push('=== SURVEY DATA ===');
    lines.push('Depth,Azimuth,Dip,ToolFace');
    surveys.forEach((survey) => {
      lines.push(
        `${survey.depth},${survey.azimuth || ''},${survey.dip || ''},${survey.toolFace || ''}`
      );
    });
    lines.push('');
  }

  // Geology
  if (geology.length > 0) {
    lines.push('=== GEOLOGY LOGS ===');
    lines.push('FromDepth,ToDepth,Lithology,Alteration,Mineralization,Weathering,Color,Texture,Structure,Geologist');
    geology.forEach((log) => {
      lines.push(
        `${log.fromDepth},${log.toDepth},"${log.lithology || ''}","${log.alteration || ''}","${log.mineralization || ''}","${log.weathering || ''}","${log.color || ''}","${log.texture || ''}","${log.structure || ''}","${log.geologist || ''}"`
      );
    });
    lines.push('');
  }

  // Assays
  if (assays.length > 0) {
    lines.push('=== ASSAY DATA ===');
    lines.push('SampleID,FromDepth,ToDepth,Element,Value,Unit,DetectionLimit,Method,Lab');
    assays.forEach((assay) => {
      lines.push(
        `${assay.sampleID || ''},${assay.fromDepth},${assay.toDepth},${assay.element},${assay.value},${assay.unit},${assay.detectionLimit || ''},${assay.method || ''},${assay.lab || ''}`
      );
    });
    lines.push('');
  }

  // Structures
  if (structures.length > 0) {
    lines.push('=== STRUCTURAL MEASUREMENTS ===');
    lines.push('Depth,Direction,Dip,StructureType,Description,Geologist');
    structures.forEach((struct) => {
      lines.push(
        `${struct.depth},${struct.direction},${struct.dip},"${struct.structureType || ''}","${struct.description || ''}","${struct.geologist || ''}"`
      );
    });
  }

  return lines.join('\n');
}

/**
 * Download CSV file
 */
export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generate summary report text
 */
export function generateDrillHoleSummary(
  hole: DrillHole,
  analysis: DrillHoleAnalysis
): string {
  const lines: string[] = [];

  lines.push('=== DRILL HOLE SUMMARY REPORT ===');
  lines.push('');
  lines.push(`Hole ID: ${hole.holeID}`);
  lines.push(`Type: ${hole.drillType}`);
  lines.push(`Collar Coordinates: X=${hole.collarX.toFixed(2)}, Y=${hole.collarY.toFixed(2)}, Z=${hole.collarZ.toFixed(2)}`);
  if (hole.utmZone) {
    lines.push(`UTM Zone: ${hole.utmZone}`);
  }
  if (hole.azimuth) {
    lines.push(`Azimuth: ${hole.azimuth.toFixed(1)}°`);
  }
  if (hole.dip) {
    lines.push(`Dip: ${hole.dip.toFixed(1)}°`);
  }
  if (hole.totalDepth) {
    lines.push(`Total Depth: ${hole.totalDepth.toFixed(2)} m`);
  }
  lines.push('');

  lines.push('=== STATISTICS ===');
  lines.push(`Total Depth: ${analysis.statistics.totalDepth.toFixed(2)} m`);
  lines.push(`Geology Intervals: ${analysis.statistics.geologyIntervals}`);
  lines.push(`Assay Intervals: ${analysis.statistics.assayIntervals}`);
  lines.push(`Structural Measurements: ${analysis.statistics.structuralMeasurements}`);
  lines.push(`Elements Analyzed: ${analysis.statistics.elements.join(', ')}`);
  lines.push('');

  lines.push('=== DEVIATION STATISTICS ===');
  lines.push(`Max Deviation: ${analysis.deviationStatistics.maxDeviation.toFixed(2)} m`);
  lines.push(`Max Deviation Depth: ${analysis.deviationStatistics.maxDeviationDepth.toFixed(2)} m`);
  lines.push(`Average Deviation: ${analysis.deviationStatistics.averageDeviation.toFixed(2)} m`);
  lines.push(`Total Deviation: ${analysis.deviationStatistics.totalDeviation.toFixed(2)} m`);
  lines.push('');

  if (Object.keys(analysis.elementStatistics).length > 0) {
    lines.push('=== ELEMENT STATISTICS ===');
    Object.entries(analysis.elementStatistics).forEach(([element, stats]) => {
      lines.push(`${element}:`);
      lines.push(`  Mean: ${stats.mean.toFixed(2)}`);
      lines.push(`  Min: ${stats.min.toFixed(2)}`);
      lines.push(`  Max: ${stats.max.toFixed(2)}`);
      lines.push(`  Std Dev: ${stats.stdDev.toFixed(2)}`);
      lines.push('');
    });
  }

  if (Object.keys(analysis.geologyStatistics.lithologyDistribution).length > 0) {
    lines.push('=== LITHOLOGY DISTRIBUTION ===');
    Object.entries(analysis.geologyStatistics.lithologyDistribution)
      .sort((a, b) => b[1].totalDepth - a[1].totalDepth)
      .forEach(([lithology, stats]) => {
        lines.push(`${lithology}: ${stats.totalDepth.toFixed(2)} m (${stats.percentage.toFixed(1)}%)`);
      });
    lines.push('');
  }

  if (Object.keys(analysis.structuralStatistics.structureTypeDistribution).length > 0) {
    lines.push('=== STRUCTURAL STATISTICS ===');
    lines.push(`Average Direction: ${analysis.structuralStatistics.averageDirection.toFixed(1)}°`);
    lines.push(`Average Dip: ${analysis.structuralStatistics.averageDip.toFixed(1)}°`);
    lines.push('Structure Types:');
    Object.entries(analysis.structuralStatistics.structureTypeDistribution).forEach(
      ([type, count]) => {
        lines.push(`  ${type}: ${count}`);
      }
    );
  }

  return lines.join('\n');
}

