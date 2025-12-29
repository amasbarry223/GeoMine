import {
  DrillHole,
  DrillSurvey,
  GeologyLog,
  DrillAssay,
  StructuralMeasurement,
  DrillHoleStatistics,
  ElementProfileStatistics,
} from '@/types/drilling';

// ============= CACHE FOR CALCULATIONS =============

// Simple in-memory cache for calculations
const calculationCache = new Map<string, unknown>();
const MAX_CACHE_SIZE = 1000; // Limit cache size to prevent memory issues

function getCacheKey(prefix: string, ...args: unknown[]): string {
  return `${prefix}:${JSON.stringify(args)}`;
}

function clearOldCacheEntries() {
  if (calculationCache.size > MAX_CACHE_SIZE) {
    // Remove oldest 20% of entries
    const entriesToRemove = Math.floor(MAX_CACHE_SIZE * 0.2);
    const keys = Array.from(calculationCache.keys());
    for (let i = 0; i < entriesToRemove; i++) {
      calculationCache.delete(keys[i]);
    }
  }
}

// ============= STATISTICS CALCULATIONS =============

/**
 * Calculate comprehensive statistics for a drill hole
 */
export function calculateDrillHoleStatistics(
  hole: DrillHole,
  surveys: DrillSurvey[],
  geology: GeologyLog[],
  assays: DrillAssay[],
  structures: StructuralMeasurement[]
): DrillHoleStatistics {
  const totalDepth = hole.totalDepth || Math.max(...surveys.map((s) => s.depth), 0);
  const depthRange = {
    min: 0,
    max: totalDepth,
  };

  // Get unique elements from assays
  const elements = Array.from(new Set(assays.map((a) => a.element)));

  return {
    holeId: hole.id,
    totalDepth,
    geologyIntervals: geology.length,
    assayIntervals: assays.length,
    structuralMeasurements: structures.length,
    elements,
    depthRange,
  };
}

/**
 * Calculate statistics for an element profile
 */
export function calculateElementProfileStatistics(
  assays: DrillAssay[],
  element: string
): ElementProfileStatistics | null {
  // Check cache first
  const cacheKey = getCacheKey('element-stats', element, assays.length, assays.map(a => `${a.fromDepth}-${a.toDepth}-${a.value}`).join('|'));
  if (calculationCache.has(cacheKey)) {
    return calculationCache.get(cacheKey);
  }

  const elementAssays = assays.filter((a) => a.element === element);
  
  if (elementAssays.length === 0) {
    return null;
  }

  // Sort by depth
  const sorted = [...elementAssays].sort((a, b) => a.fromDepth - b.fromDepth);
  
  const depth: number[] = [];
  const values: number[] = [];

  sorted.forEach((assay) => {
    // Use midpoint of interval
    const midDepth = (assay.fromDepth + assay.toDepth) / 2;
    depth.push(midDepth);
    values.push(assay.value);
  });

  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const max = Math.max(...values);
  const min = Math.min(...values);
  
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  const result = {
    element,
    depth,
    values,
    mean,
    max,
    min,
    stdDev,
  };

  // Cache the result
  clearOldCacheEntries();
  calculationCache.set(cacheKey, result);
  return result;
}

/**
 * Calculate statistics for all elements in a drill hole
 */
export function calculateAllElementStatistics(
  assays: DrillAssay[]
): Record<string, ElementProfileStatistics> {
  const elements = Array.from(new Set(assays.map((a) => a.element)));
  const stats: Record<string, ElementProfileStatistics> = {};

  elements.forEach((element) => {
    const elementStats = calculateElementProfileStatistics(assays, element);
    if (elementStats) {
      stats[element] = elementStats;
    }
  });

  return stats;
}

// ============= SURVEY ANALYSIS =============

/**
 * Calculate 3D path from survey data
 */
export function calculateHolePath(
  hole: DrillHole,
  surveys: DrillSurvey[]
): { x: number; y: number; z: number; depth: number }[] {
  if (surveys.length === 0) {
    // Return straight path if no survey data
    return [
      {
        x: hole.collarX,
        y: hole.collarY,
        z: hole.collarZ,
        depth: 0,
      },
      {
        x: hole.collarX,
        y: hole.collarY,
        z: hole.collarZ - (hole.totalDepth || 0),
        depth: hole.totalDepth || 0,
      },
    ];
  }

  // Sort surveys by depth
  const sortedSurveys = [...surveys].sort((a, b) => a.depth - b.depth);
  
  const path: { x: number; y: number; z: number; depth: number }[] = [];
  
  // Start at collar
  let currentX = hole.collarX;
  let currentY = hole.collarY;
  let currentZ = hole.collarZ;
  let currentAzimuth = hole.azimuth || 0;
  let currentDip = hole.dip || 90;
  
  path.push({
    x: currentX,
    y: currentY,
    z: currentZ,
    depth: 0,
  });

  // Calculate path segment by segment
  for (let i = 0; i < sortedSurveys.length; i++) {
    const survey = sortedSurveys[i];
    const prevDepth = i > 0 ? sortedSurveys[i - 1].depth : 0;
    const depthInterval = survey.depth - prevDepth;

    // Update azimuth and dip if provided
    if (survey.azimuth !== null && survey.azimuth !== undefined) {
      currentAzimuth = survey.azimuth;
    }
    if (survey.dip !== null && survey.dip !== undefined) {
      currentDip = survey.dip;
    }

    // Calculate displacement in 3D space
    // Convert dip to radians (dip is measured from horizontal, 90 = vertical down)
    const dipRad = ((90 - currentDip) * Math.PI) / 180;
    const azimuthRad = (currentAzimuth * Math.PI) / 180;

    // Calculate horizontal and vertical components
    const horizontalDistance = depthInterval * Math.sin(dipRad);
    const verticalDistance = depthInterval * Math.cos(dipRad);

    // Calculate north and east components
    const north = horizontalDistance * Math.cos(azimuthRad);
    const east = horizontalDistance * Math.sin(azimuthRad);

    // Update position
    currentX += east;
    currentY += north;
    currentZ -= verticalDistance; // Z decreases downward

    path.push({
      x: currentX,
      y: currentY,
      z: currentZ,
      depth: survey.depth,
    });
  }

  return path;
}

/**
 * Calculate deviation statistics
 */
export interface DeviationStatistics {
  maxDeviation: number;
  maxDeviationDepth: number;
  totalDeviation: number;
  averageDeviation: number;
  deviationAtDepth: { depth: number; deviation: number }[];
}

export function calculateDeviationStatistics(
  hole: DrillHole,
  surveys: DrillSurvey[]
): DeviationStatistics {
  const path = calculateHolePath(hole, surveys);
  
  if (path.length < 2) {
    return {
      maxDeviation: 0,
      maxDeviationDepth: 0,
      totalDeviation: 0,
      averageDeviation: 0,
      deviationAtDepth: [],
    };
  }

  const deviations: { depth: number; deviation: number }[] = [];
  let maxDeviation = 0;
  let maxDeviationDepth = 0;
  let totalDeviation = 0;

  // Calculate deviation from vertical at each point
  path.forEach((point, index) => {
    if (index === 0) {
      deviations.push({ depth: 0, deviation: 0 });
      return;
    }

    const horizontalDistance = Math.sqrt(
      Math.pow(point.x - hole.collarX, 2) + Math.pow(point.y - hole.collarY, 2)
    );
    const depth = point.depth;
    
    deviations.push({ depth, deviation: horizontalDistance });
    
    if (horizontalDistance > maxDeviation) {
      maxDeviation = horizontalDistance;
      maxDeviationDepth = depth;
    }
    
    totalDeviation += horizontalDistance;
  });

  const averageDeviation = totalDeviation / (deviations.length - 1);

  return {
    maxDeviation,
    maxDeviationDepth,
    totalDeviation,
    averageDeviation,
    deviationAtDepth: deviations,
  };
}

// ============= GEOLOGY ANALYSIS =============

/**
 * Calculate geology distribution statistics
 */
export interface GeologyStatistics {
  lithologyDistribution: Record<string, { count: number; totalDepth: number; percentage: number }>;
  alterationDistribution: Record<string, { count: number; totalDepth: number; percentage: number }>;
  mineralizationDistribution: Record<string, { count: number; totalDepth: number; percentage: number }>;
  totalLoggedDepth: number;
}

export function calculateGeologyStatistics(geology: GeologyLog[]): GeologyStatistics {
  const lithologyDist: Record<string, { count: number; totalDepth: number }> = {};
  const alterationDist: Record<string, { count: number; totalDepth: number }> = {};
  const mineralizationDist: Record<string, { count: number; totalDepth: number }> = {};
  
  let totalLoggedDepth = 0;

  geology.forEach((log) => {
    const intervalDepth = log.toDepth - log.fromDepth;
    totalLoggedDepth += intervalDepth;

    // Lithology
    if (log.lithology) {
      if (!lithologyDist[log.lithology]) {
        lithologyDist[log.lithology] = { count: 0, totalDepth: 0 };
      }
      lithologyDist[log.lithology].count++;
      lithologyDist[log.lithology].totalDepth += intervalDepth;
    }

    // Alteration
    if (log.alteration) {
      if (!alterationDist[log.alteration]) {
        alterationDist[log.alteration] = { count: 0, totalDepth: 0 };
      }
      alterationDist[log.alteration].count++;
      alterationDist[log.alteration].totalDepth += intervalDepth;
    }

    // Mineralization
    if (log.mineralization) {
      if (!mineralizationDist[log.mineralization]) {
        mineralizationDist[log.mineralization] = { count: 0, totalDepth: 0 };
      }
      mineralizationDist[log.mineralization].count++;
      mineralizationDist[log.mineralization].totalDepth += intervalDepth;
    }
  });

  // Calculate percentages
  const lithologyDistribution: Record<string, { count: number; totalDepth: number; percentage: number }> = {};
  const alterationDistribution: Record<string, { count: number; totalDepth: number; percentage: number }> = {};
  const mineralizationDistribution: Record<string, { count: number; totalDepth: number; percentage: number }> = {};

  Object.keys(lithologyDist).forEach((key) => {
    lithologyDistribution[key] = {
      ...lithologyDist[key],
      percentage: (lithologyDist[key].totalDepth / totalLoggedDepth) * 100,
    };
  });

  Object.keys(alterationDist).forEach((key) => {
    alterationDistribution[key] = {
      ...alterationDist[key],
      percentage: (alterationDist[key].totalDepth / totalLoggedDepth) * 100,
    };
  });

  Object.keys(mineralizationDist).forEach((key) => {
    mineralizationDistribution[key] = {
      ...mineralizationDist[key],
      percentage: (mineralizationDist[key].totalDepth / totalLoggedDepth) * 100,
    };
  });

  return {
    lithologyDistribution,
    alterationDistribution,
    mineralizationDistribution,
    totalLoggedDepth,
  };
}

// ============= STRUCTURAL ANALYSIS =============

/**
 * Calculate structural measurement statistics
 */
export interface StructuralStatistics {
  structureTypeDistribution: Record<string, number>;
  averageDirection: number;
  averageDip: number;
  directionDistribution: { direction: number; count: number }[];
  dipDistribution: { dip: number; count: number }[];
  roseDiagram: { direction: number; count: number }[]; // Grouped by 10-degree intervals
}

export function calculateStructuralStatistics(
  structures: StructuralMeasurement[]
): StructuralStatistics {
  if (structures.length === 0) {
    return {
      structureTypeDistribution: {},
      averageDirection: 0,
      averageDip: 0,
      directionDistribution: [],
      dipDistribution: [],
      roseDiagram: [],
    };
  }

  const structureTypeDist: Record<string, number> = {};
  let totalDirection = 0;
  let totalDip = 0;
  const directionDist: { direction: number; count: number }[] = [];
  const dipDist: { dip: number; count: number }[] = [];
  const roseData: Record<number, number> = {};

  structures.forEach((struct) => {
    // Structure type
    const type = struct.structureType || 'Non spécifié';
    structureTypeDist[type] = (structureTypeDist[type] || 0) + 1;

    // Direction and dip
    totalDirection += struct.direction;
    totalDip += struct.dip;

    // Direction distribution
    const dirKey = Math.round(struct.direction / 10) * 10;
    roseData[dirKey] = (roseData[dirKey] || 0) + 1;

    directionDist.push({ direction: struct.direction, count: 1 });
    dipDist.push({ dip: struct.dip, count: 1 });
  });

  // Convert rose data to array
  const roseDiagram = Object.keys(roseData)
    .map((key) => ({
      direction: parseInt(key),
      count: roseData[parseInt(key)],
    }))
    .sort((a, b) => a.direction - b.direction);

  return {
    structureTypeDistribution: structureTypeDist,
    averageDirection: totalDirection / structures.length,
    averageDip: totalDip / structures.length,
    directionDistribution: directionDist,
    dipDistribution: dipDist,
    roseDiagram,
  };
}

// ============= ASSAY ANALYSIS =============

/**
 * Calculate assay statistics by depth interval
 */
export interface AssayDepthStatistics {
  depthInterval: { from: number; to: number };
  elementStats: Record<string, {
    count: number;
    mean: number;
    max: number;
    min: number;
    sum: number;
  }>;
}

export function calculateAssayStatisticsByDepth(
  assays: DrillAssay[],
  depthInterval: number = 10
): AssayDepthStatistics[] {
  if (assays.length === 0) {
    return [];
  }

  // Find depth range
  const maxDepth = Math.max(...assays.map((a) => a.toDepth));
  const intervals: AssayDepthStatistics[] = [];

  // Create intervals
  for (let from = 0; from < maxDepth; from += depthInterval) {
    const to = Math.min(from + depthInterval, maxDepth);
    
    const intervalAssays = assays.filter(
      (a) => a.fromDepth < to && a.toDepth > from
    );

    const elementStats: Record<string, {
      count: number;
      mean: number;
      max: number;
      min: number;
      sum: number;
    }> = {};

    // Group by element
    const elements = Array.from(new Set(intervalAssays.map((a) => a.element)));
    
    elements.forEach((element) => {
      const elementAssays = intervalAssays.filter((a) => a.element === element);
      const values = elementAssays.map((a) => a.value);
      
      if (values.length > 0) {
        elementStats[element] = {
          count: values.length,
          mean: values.reduce((sum, v) => sum + v, 0) / values.length,
          max: Math.max(...values),
          min: Math.min(...values),
          sum: values.reduce((sum, v) => sum + v, 0),
        };
      }
    });

    if (Object.keys(elementStats).length > 0) {
      intervals.push({
        depthInterval: { from, to },
        elementStats,
      });
    }
  }

  return intervals;
}

/**
 * Detect anomalies in assay data
 */
export interface AssayAnomaly {
  depth: number;
  element: string;
  value: number;
  zScore: number;
  isAnomaly: boolean;
}

export function detectAssayAnomalies(
  assays: DrillAssay[],
  element: string,
  threshold: number = 3
): AssayAnomaly[] {
  const elementAssays = assays.filter((a) => a.element === element);
  
  if (elementAssays.length === 0) {
    return [];
  }

  const values = elementAssays.map((a) => a.value);
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) {
    return [];
  }

  const anomalies: AssayAnomaly[] = elementAssays.map((assay) => {
    const zScore = Math.abs((assay.value - mean) / stdDev);
    return {
      depth: (assay.fromDepth + assay.toDepth) / 2,
      element,
      value: assay.value,
      zScore,
      isAnomaly: zScore >= threshold,
    };
  });

  return anomalies;
}

