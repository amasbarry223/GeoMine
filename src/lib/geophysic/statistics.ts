import { DataPoint, Statistics, Anomaly, AnomalyDetection } from '@/types/geophysic';

// ============= DESCRIPTIVE STATISTICS =============

/**
 * Calculate comprehensive descriptive statistics
 */
export function calculateStatistics(data: DataPoint[]): Statistics {
  const values = data.map((p) => p.value).filter((v) => !isNaN(v) && isFinite(v));

  if (values.length === 0) {
    return {
      mean: 0,
      median: 0,
      stdDev: 0,
      min: 0,
      max: 0,
      q25: 0,
      q75: 0,
    };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const n = values.length;

  // Basic statistics
  const mean = values.reduce((sum, v) => sum + v, 0) / n;
  const median = n % 2 === 0
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
    : sorted[Math.floor(n / 2)];
  const min = sorted[0];
  const max = sorted[n - 1];

  // Quartiles
  const q25 = sorted[Math.floor(n * 0.25)];
  const q75 = sorted[Math.floor(n * 0.75)];

  // Standard deviation
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  // Skewness (measure of asymmetry)
  const skewness =
    values.reduce((sum, v) => sum + Math.pow((v - mean) / stdDev, 3), 0) / n;

  // Kurtosis (measure of tailedness)
  const kurtosis =
    values.reduce((sum, v) => sum + Math.pow((v - mean) / stdDev, 4), 0) / n - 3;

  return {
    mean,
    median,
    stdDev,
    min,
    max,
    q25,
    q75,
    skewness,
    kurtosis,
  };
}

/**
 * Calculate statistics for spatial regions
 */
export function calculateRegionalStatistics(
  data: DataPoint[],
  regions: { name: string; bounds: { minX: number; maxX: number; minY: number; maxY: number } }[]
): Map<string, Statistics> {
  const statistics = new Map<string, Statistics>();

  regions.forEach((region) => {
    const regionData = data.filter(
      (p) =>
        p.x >= region.bounds.minX &&
        p.x <= region.bounds.maxX &&
        p.y >= region.bounds.minY &&
        p.y <= region.bounds.maxY
    );

    statistics.set(region.name, calculateStatistics(regionData));
  });

  return statistics;
}

// ============= ANOMALY DETECTION =============

/**
 * Detect anomalies using Z-score method
 */
export function detectAnomaliesZScore(
  data: DataPoint[],
  threshold: number = 3,
  minSignificance: number = 0.5
): AnomalyDetection {
  const stats = calculateStatistics(data);
  const anomalies: Anomaly[] = [];

  data.forEach((point, index) => {
    const zScore = Math.abs((point.value - stats.mean) / (stats.stdDev || 1));
    const significance = Math.min(1, zScore / threshold);

    if (zScore > threshold && significance >= minSignificance) {
      anomalies.push({
        id: `anomaly-${index}`,
        location: { x: point.x, y: point.y },
        value: point.value,
        significance,
        type: point.value > stats.mean ? 'high' : 'low',
        size: 1,
      });
    }
  });

  return {
    anomalies,
    detectionMethod: 'Z-Score',
    threshold,
    confidence: calculateConfidence(anomalies.length, data.length),
  };
}

/**
 * Detect anomalies using IQR method
 */
export function detectAnomaliesIQR(
  data: DataPoint[],
  multiplier: number = 1.5,
  minSignificance: number = 0.5
): AnomalyDetection {
  const stats = calculateStatistics(data);
  const iqr = stats.q75 - stats.q25;
  const lowerFence = stats.q25 - multiplier * iqr;
  const upperFence = stats.q75 + multiplier * iqr;
  const anomalies: Anomaly[] = [];

  data.forEach((point, index) => {
    let significance = 0;
    let type: 'high' | 'low';

    if (point.value < lowerFence) {
      type = 'low';
      significance = Math.min(1, Math.abs(point.value - lowerFence) / iqr);
    } else if (point.value > upperFence) {
      type = 'high';
      significance = Math.min(1, Math.abs(point.value - upperFence) / iqr);
    } else {
      return;
    }

    if (significance >= minSignificance) {
      anomalies.push({
        id: `anomaly-${index}`,
        location: { x: point.x, y: point.y },
        value: point.value,
        significance,
        type,
        size: 1,
      });
    }
  });

  return {
    anomalies,
    detectionMethod: 'IQR',
    threshold: multiplier,
    confidence: calculateConfidence(anomalies.length, data.length),
  };
}

/**
 * Detect anomalies using Local Outlier Factor (LOF) - simplified version
 */
export function detectAnomaliesLOF(
  data: DataPoint[],
  k: number = 5,
  threshold: number = 1.5,
  minSignificance: number = 0.5
): AnomalyDetection {
  const anomalies: Anomaly[] = [];

  // Calculate local density for each point
  const densities = data.map((point, i) => {
    // Find k nearest neighbors
    const distances = data
      .map((other, j) => ({
        index: j,
        distance: Math.sqrt(
          Math.pow(point.x - other.x, 2) + Math.pow(point.y - other.y, 2)
        ),
      }))
      .filter((d) => d.distance > 0)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, k);

    // Calculate local reachability density (simplified)
    const avgDistance = distances.reduce((sum, d) => sum + d.distance, 0) / distances.length;
    return { index: i, density: 1 / (avgDistance || 1) };
  });

  // Calculate LOF for each point
  densities.forEach(({ index, density }) => {
    // Find k nearest neighbors
    const neighbors = densities
      .map((d) => ({
        index: d.index,
        density: d.density,
        distance: Math.sqrt(
          Math.pow(data[index].x - data[d.index].x, 2) +
          Math.pow(data[index].y - data[d.index].y, 2)
        ),
      }))
      .filter((d) => d.distance > 0)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, k);

    // Calculate LOF
    const avgNeighborDensity = neighbors.reduce((sum, n) => sum + n.density, 0) / neighbors.length;
    const lof = avgNeighborDensity / (density || 1);

    if (lof > threshold) {
      const significance = Math.min(1, lof / threshold);

      if (significance >= minSignificance) {
        anomalies.push({
          id: `anomaly-${index}`,
          location: { x: data[index].x, y: data[index].y },
          value: data[index].value,
          significance,
          type: lof > 2 ? 'high' : 'low', // Very high LOF indicates strong outlier
          size: lof,
        });
      }
    }
  });

  return {
    anomalies,
    detectionMethod: 'LOF',
    threshold,
    confidence: calculateConfidence(anomalies.length, data.length),
  };
}

/**
 * Detect anomalies using Isolation Forest (simplified version)
 */
export function detectAnomaliesIsolationForest(
  data: DataPoint[],
  sampleSize: number = 256,
  numTrees: number = 100,
  contamination: number = 0.1
): AnomalyDetection {
  const anomalies: Anomaly[] = [];
  const n = data.length;

  // Simplified isolation forest - use random partitions
  const scores: number[] = [];

  for (let i = 0; i < n; i++) {
    let totalPathLength = 0;

    for (let tree = 0; tree < numTrees; tree++) {
      // Randomly sample points
      const sampleIndices = [];
      for (let j = 0; j < sampleSize && j < n; j++) {
        sampleIndices.push(Math.floor(Math.random() * n));
      }

      // Calculate path length for point i
      let pathLength = 0;
      let currentPoint = data[i];

      while (sampleIndices.length > 1) {
        // Random split
        const splitDim = Math.random() < 0.5 ? 'x' : 'y';
        const splitIndex = Math.floor(Math.random() * sampleIndices.length);
        const splitPoint = data[sampleIndices[splitIndex]];

        // Go left or right
        const newIndices = sampleIndices.filter(
          (idx) =>
            (splitDim === 'x' ? data[idx].x : data[idx].y) <
            (splitDim === 'x' ? splitPoint.x : splitPoint.y)
        );

        if (newIndices.length === 0) break;

        sampleIndices.splice(0, sampleIndices.length, ...newIndices);
        pathLength++;
      }

      totalPathLength += pathLength;
    }

    const avgPathLength = totalPathLength / numTrees;
    scores.push(avgPathLength);
  }

  // Normalize scores and detect anomalies
  const maxPathLength = Math.max(...scores);
  const normalizedScores = scores.map((s) => s / maxPathLength);

  const thresholdScore = normalizedScores.sort((a, b) => b - a)[Math.floor(n * contamination)] || 0.5;

  normalizedScores.forEach((score, index) => {
    if (score < thresholdScore) {
      const significance = 1 - score;
      anomalies.push({
        id: `anomaly-${index}`,
        location: { x: data[index].x, y: data[index].y },
        value: data[index].value,
        significance,
        type: data[index].value > (calculateStatistics(data).mean) ? 'high' : 'low',
        size: 1 / (score || 1),
      });
    }
  });

  return {
    anomalies,
    detectionMethod: 'Isolation Forest',
    threshold: contamination,
    confidence: calculateConfidence(anomalies.length, data.length),
  };
}

/**
 * Calculate confidence score based on anomaly proportion
 */
function calculateConfidence(anomalyCount: number, totalCount: number): number {
  const proportion = anomalyCount / totalCount;
  // Higher confidence if anomalies are not too common or too rare
  return Math.max(0, Math.min(1, 1 - Math.abs(proportion - 0.1) * 5));
}

// ============= CORRELATION ANALYSIS =============

/**
 * Calculate correlation between two datasets
 */
export function calculateCorrelation(data1: DataPoint[], data2: DataPoint[]): number {
  // Create value maps for matching by position
  const map1 = new Map<string, number>();
  data1.forEach((p) => {
    map1.set(`${p.x.toFixed(2)},${p.y.toFixed(2)}`, p.value);
  });

  const map2 = new Map<string, number>();
  data2.forEach((p) => {
    map2.set(`${p.x.toFixed(2)},${p.y.toFixed(2)}`, p.value);
  });

  // Get matching pairs
  const pairs: [number, number][] = [];
  map1.forEach((val1, key) => {
    if (map2.has(key)) {
      pairs.push([val1, map2.get(key)!]);
    }
  });

  if (pairs.length < 2) return 0;

  // Calculate Pearson correlation coefficient
  const n = pairs.length;
  const sumX = pairs.reduce((sum, [x]) => sum + x, 0);
  const sumY = pairs.reduce((sum, [, y]) => sum + y, 0);
  const sumXY = pairs.reduce((sum, [x, y]) => sum + x * y, 0);
  const sumX2 = pairs.reduce((sum, [x]) => sum + x * x, 0);
  const sumY2 = pairs.reduce((sum, [, y]) => sum + y * y, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  return denominator !== 0 ? numerator / denominator : 0;
}

/**
 * Calculate auto-correlation of a dataset
 */
export function calculateAutoCorrelation(data: DataPoint[], maxLag: number = 10): number[] {
  const values = data.map((p) => p.value);
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;

  const correlations: number[] = [];

  for (let lag = 0; lag <= maxLag; lag++) {
    let sum = 0;
    let count = 0;

    for (let i = 0; i < values.length - lag; i++) {
      sum += (values[i] - mean) * (values[i + lag] - mean);
      count++;
    }

    const correlation = count > 0 ? sum / (count * variance) : 0;
    correlations.push(correlation);
  }

  return correlations;
}

// ============= HISTOGRAM AND DISTRIBUTION =============

/**
 * Calculate histogram bins
 */
export function calculateHistogram(data: DataPoint[], numBins: number = 20): number[] {
  const values = data.map((p) => p.value).filter((v) => !isNaN(v) && isFinite(v));
  if (values.length === 0) return [];

  const min = Math.min(...values);
  const max = Math.max(...values);
  const binSize = (max - min) / numBins;

  const bins = new Array(numBins).fill(0);

  values.forEach((value) => {
    const binIndex = Math.min(Math.floor((value - min) / binSize), numBins - 1);
    bins[binIndex]++;
  });

  return bins;
}

/**
 * Calculate probability density function (PDF)
 */
export function calculatePDF(data: DataPoint[], numBins: number = 50): {
  binEdges: number[];
  densities: number[];
} {
  const values = data.map((p) => p.value).filter((v) => !isNaN(v) && isFinite(v));
  if (values.length === 0) return { binEdges: [], densities: [] };

  const min = Math.min(...values);
  const max = Math.max(...values);
  const binSize = (max - min) / numBins;

  const binEdges: number[] = [];
  const densities: number[] = [];
  const counts = new Array(numBins).fill(0);

  for (let i = 0; i <= numBins; i++) {
    binEdges.push(min + i * binSize);
  }

  values.forEach((value) => {
    const binIndex = Math.min(Math.floor((value - min) / binSize), numBins - 1);
    counts[binIndex]++;
  });

  // Convert counts to densities
  const totalCount = values.length;
  counts.forEach((count) => {
    densities.push(count / (totalCount * binSize));
  });

  return { binEdges, densities };
}

/**
 * Fit normal distribution to data
 */
export function fitNormalDistribution(data: DataPoint[]): {
  mean: number;
  stdDev: number;
} {
  const stats = calculateStatistics(data);
  return {
    mean: stats.mean,
    stdDev: stats.stdDev,
  };
}

/**
 * Calculate cumulative distribution function (CDF)
 */
export function calculateCDF(data: DataPoint[], numBins: number = 50): {
  binEdges: number[];
  cumulative: number[];
} {
  const values = data.map((p) => p.value).filter((v) => !isNaN(v) && isFinite(v)).sort((a, b) => a - b);
  if (values.length === 0) return { binEdges: [], cumulative: [] };

  const min = values[0];
  const max = values[values.length - 1];
  const binSize = (max - min) / numBins;

  const binEdges: number[] = [];
  const cumulative: number[] = [];

  for (let i = 0; i <= numBins; i++) {
    binEdges.push(min + i * binSize);
  }

  const totalCount = values.length;
  let currentBin = 0;

  values.forEach((value) => {
    while (currentBin < numBins && value > binEdges[currentBin + 1]) {
      currentBin++;
    }
  });

  // Calculate cumulative probabilities
  let count = 0;
  for (let i = 0; i < numBins; i++) {
    const binCount = values.filter((v) => v <= binEdges[i + 1] && v > binEdges[i]).length;
    count += binCount;
    cumulative.push(count / totalCount);
  }

  return { binEdges: binEdges.slice(0, numBins), cumulative };
}

// ============= SPATIAL ANALYSIS =============

/**
 * Calculate spatial clustering (simplified)
 */
export function calculateSpatialClustering(data: DataPoint[], threshold: number = 2): Map<string, DataPoint[]> {
  const clusters = new Map<string, DataPoint[]>();
  let clusterId = 0;
  const visited = new Set<number>();

  data.forEach((point, index) => {
    if (visited.has(index)) return;

    // Find connected points using distance threshold
    const cluster: DataPoint[] = [];
    const queue = [index];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;

      visited.add(current);
      cluster.push(data[current]);

      // Find neighbors
      data.forEach((other, otherIndex) => {
        if (visited.has(otherIndex)) return;

        const distance = Math.sqrt(
          Math.pow(point.x - other.x, 2) + Math.pow(point.y - other.y, 2)
        );

        if (distance <= threshold && !queue.includes(otherIndex)) {
          queue.push(otherIndex);
        }
      });
    }

    if (cluster.length > 0) {
      clusters.set(`cluster-${clusterId++}`, cluster);
    }
  });

  return clusters;
}

/**
 * Calculate gradient (spatial derivative)
 */
export function calculateGradient(data: DataPoint[]): {
  xGradient: DataPoint[];
  yGradient: DataPoint[];
} {
  const xGradient: DataPoint[] = [];
  const yGradient: DataPoint[] = [];

  const values = data.map((p) => p.value);

  data.forEach((point, index) => {
    // Find neighbors for gradient calculation
    const left = data.find((p) => p.x === point.x - (data[1]?.x || 1) && p.y === point.y);
    const right = data.find((p) => p.x === point.x + (data[1]?.x || 1) && p.y === point.y);
    const up = data.find((p) => p.x === point.x && p.y === point.y + (data[1]?.y || 1));
    const down = data.find((p) => p.x === point.x && p.y === point.y - (data[1]?.y || 1));

    // X gradient (central difference)
    if (left && right) {
      xGradient.push({
        ...point,
        value: (right.value - left.value) / (2 * (data[1]?.x || 1)),
      });
    }

    // Y gradient (central difference)
    if (up && down) {
      yGradient.push({
        ...point,
        value: (up.value - down.value) / (2 * (data[1]?.y || 1)),
      });
    }
  });

  return { xGradient, yGradient };
}

// ============= VOLUME AND RESOURCE ESTIMATION =============

/**
 * Calculate volume of a zone based on threshold
 */
export function calculateVolume(
  data: DataPoint[],
  threshold: { min?: number; max?: number },
  cellSize?: { dx: number; dy: number; dz?: number }
): {
  volume: number;
  cellCount: number;
  averageValue: number;
} {
  // Filter data points within threshold
  const filteredData = data.filter((point) => {
    if (threshold.min !== undefined && point.value < threshold.min) return false;
    if (threshold.max !== undefined && point.value > threshold.max) return false;
    return true;
  });

  if (filteredData.length === 0) {
    return { volume: 0, cellCount: 0, averageValue: 0 };
  }

  // Calculate average cell size if not provided
  const dx = cellSize?.dx || calculateAverageSpacing(data, 'x');
  const dy = cellSize?.dy || calculateAverageSpacing(data, 'y');
  const dz = cellSize?.dz || calculateAverageSpacing(data, 'z') || 1;

  // Calculate volume
  const cellVolume = dx * dy * dz;
  const totalVolume = filteredData.length * cellVolume;

  // Calculate average value
  const averageValue = filteredData.reduce((sum, p) => sum + p.value, 0) / filteredData.length;

  return {
    volume: totalVolume,
    cellCount: filteredData.length,
    averageValue,
  };
}

/**
 * Calculate average spacing between data points
 */
function calculateAverageSpacing(data: DataPoint[], axis: 'x' | 'y' | 'z'): number {
  if (data.length < 2) return 1;

  const values = data.map((p) => p[axis] || 0).sort((a, b) => a - b);
  const spacings: number[] = [];

  for (let i = 1; i < values.length; i++) {
    const spacing = Math.abs(values[i] - values[i - 1]);
    if (spacing > 0) {
      spacings.push(spacing);
    }
  }

  if (spacings.length === 0) return 1;
  return spacings.reduce((sum, s) => sum + s, 0) / spacings.length;
}

/**
 * Estimate resources based on volume and density
 */
export function estimateResources(
  volume: number,
  averageDensity: number,
  averageGrade?: number
): {
  tonnage: number; // in tonnes
  metalContent?: number; // in tonnes (if grade provided)
  volumeM3: number;
} {
  // Convert volume to cubic meters (assuming input is in m³)
  const volumeM3 = volume;

  // Calculate tonnage: Volume (m³) × Density (t/m³)
  const tonnage = volumeM3 * averageDensity;

  // Calculate metal content if grade is provided
  const metalContent = averageGrade !== undefined ? tonnage * (averageGrade / 100) : undefined;

  return {
    tonnage,
    metalContent,
    volumeM3,
  };
}

// ============= MULTI-PROFILE COMPARISON =============

/**
 * Compare multiple profiles
 */
export function compareProfiles(
  profiles: { name: string; data: DataPoint[] }[]
): {
  correlations: Map<string, number>;
  differences: Map<string, { mean: number; stdDev: number }>;
  statistics: Map<string, Statistics>;
} {
  const correlations = new Map<string, number>();
  const differences = new Map<string, { mean: number; stdDev: number }>();
  const statistics = new Map<string, Statistics>();

  // Calculate statistics for each profile
  profiles.forEach((profile) => {
    statistics.set(profile.name, calculateStatistics(profile.data));
  });

  // Calculate correlations between profiles
  for (let i = 0; i < profiles.length; i++) {
    for (let j = i + 1; j < profiles.length; j++) {
      const profile1 = profiles[i];
      const profile2 = profiles[j];

      // Match data points by position
      const matchedData: { value1: number; value2: number }[] = [];
      profile1.data.forEach((p1) => {
        const p2 = profile2.data.find(
          (p) => Math.abs(p.x - p1.x) < 0.01 && Math.abs(p.y - p1.y) < 0.01
        );
        if (p2) {
          matchedData.push({ value1: p1.value, value2: p2.value });
        }
      });

      if (matchedData.length > 0) {
        const values1 = matchedData.map((d) => d.value1);
        const values2 = matchedData.map((d) => d.value2);
        const correlation = calculateCorrelationHelper(values1, values2);
        correlations.set(`${profile1.name} vs ${profile2.name}`, correlation);

        // Calculate differences
        const diffs = matchedData.map((d) => d.value2 - d.value1);
        const meanDiff = diffs.reduce((sum, d) => sum + d, 0) / diffs.length;
        const variance = diffs.reduce((sum, d) => sum + Math.pow(d - meanDiff, 2), 0) / diffs.length;
        const stdDev = Math.sqrt(variance);

        differences.set(`${profile1.name} - ${profile2.name}`, { mean: meanDiff, stdDev });
      }
    }
  }

  return { correlations, differences, statistics };
}

/**
 * Calculate correlation between two arrays (helper function)
 */
function calculateCorrelationHelper(arr1: number[], arr2: number[]): number {
  if (arr1.length !== arr2.length || arr1.length === 0) return 0;

  const mean1 = arr1.reduce((sum, v) => sum + v, 0) / arr1.length;
  const mean2 = arr2.reduce((sum, v) => sum + v, 0) / arr2.length;

  let numerator = 0;
  let sumSq1 = 0;
  let sumSq2 = 0;

  for (let i = 0; i < arr1.length; i++) {
    const diff1 = arr1[i] - mean1;
    const diff2 = arr2[i] - mean2;
    numerator += diff1 * diff2;
    sumSq1 += diff1 * diff1;
    sumSq2 += diff2 * diff2;
  }

  const denominator = Math.sqrt(sumSq1 * sumSq2);
  return denominator === 0 ? 0 : numerator / denominator;
}
