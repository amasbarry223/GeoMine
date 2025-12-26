import { DataPoint, FilterSettings, ProcessingOperation } from '@/types/geophysic';

// ============= FILTERING ALGORITHMS =============

/**
 * Apply median filter to smooth data
 * @param data - Array of data points
 * @param windowSize - Size of the median window (must be odd)
 * @returns Filtered data points
 */
export function applyMedianFilter(data: DataPoint[], windowSize: number = 5): DataPoint[] {
  if (windowSize % 2 === 0) {
    windowSize++; // Ensure odd number
  }
  if (windowSize < 3) windowSize = 3;

  const halfWindow = Math.floor(windowSize / 2);
  const filtered: DataPoint[] = [];

  for (let i = 0; i < data.length; i++) {
    // For edges, use available points
    const startIdx = Math.max(0, i - halfWindow);
    const endIdx = Math.min(data.length - 1, i + halfWindow);

    // Collect values in window
    const windowValues: number[] = [];
    for (let j = startIdx; j <= endIdx; j++) {
      windowValues.push(data[j].value);
    }

    // Calculate median
    windowValues.sort((a, b) => a - b);
    const median = windowValues[Math.floor(windowValues.length / 2)];

    filtered.push({
      ...data[i],
      value: median,
    });
  }

  return filtered;
}

/**
 * Apply moving average filter
 * @param data - Array of data points
 * @param windowSize - Size of the averaging window
 * @returns Filtered data points
 */
export function applyMovingAverage(data: DataPoint[], windowSize: number = 5): DataPoint[] {
  if (windowSize < 2) windowSize = 2;

  const halfWindow = Math.floor(windowSize / 2);
  const filtered: DataPoint[] = [];

  for (let i = 0; i < data.length; i++) {
    const startIdx = Math.max(0, i - halfWindow);
    const endIdx = Math.min(data.length - 1, i + halfWindow);

    let sum = 0;
    let count = 0;

    for (let j = startIdx; j <= endIdx; j++) {
      sum += data[j].value;
      count++;
    }

    filtered.push({
      ...data[i],
      value: sum / count,
    });
  }

  return filtered;
}

/**
 * Apply Savitzky-Golay filter for smoothing
 * @param data - Array of data points
 * @param windowSize - Size of the window (must be odd)
 * @param polynomialOrder - Order of the polynomial (must be less than windowSize)
 * @returns Filtered data points
 */
export function applySavitzkyGolayFilter(
  data: DataPoint[],
  windowSize: number = 7,
  polynomialOrder: number = 3
): DataPoint[] {
  // Validate parameters
  if (windowSize % 2 === 0) windowSize++;
  if (windowSize < 3) windowSize = 3;
  if (polynomialOrder >= windowSize) polynomialOrder = windowSize - 1;

  // Calculate convolution coefficients
  const coefficients = calculateSavitzkyGolayCoefficients(windowSize, polynomialOrder);
  const halfWindow = Math.floor(windowSize / 2);

  const filtered: DataPoint[] = [];

  for (let i = 0; i < data.length; i++) {
    // Handle edges by using smaller windows
    let actualWindowSize = windowSize;
    let actualCoefficients = coefficients;

    if (i < halfWindow) {
      actualWindowSize = i + halfWindow + 1;
      if (actualWindowSize % 2 === 0) actualWindowSize++;
      actualCoefficients = calculateSavitzkyGolayCoefficients(actualWindowSize, polynomialOrder);
    } else if (i >= data.length - halfWindow) {
      actualWindowSize = (data.length - i) + halfWindow;
      if (actualWindowSize % 2 === 0) actualWindowSize++;
      actualCoefficients = calculateSavitzkyGolayCoefficients(actualWindowSize, polynomialOrder);
    }

    // Apply convolution
    let smoothedValue = 0;
    const actualHalfWindow = Math.floor(actualWindowSize / 2);

    for (let j = 0; j < actualWindowSize; j++) {
      const dataIndex = i + j - actualHalfWindow;
      if (dataIndex >= 0 && dataIndex < data.length) {
        smoothedValue += data[dataIndex].value * actualCoefficients[j];
      }
    }

    filtered.push({
      ...data[i],
      value: smoothedValue,
    });
  }

  return filtered;
}

/**
 * Calculate Savitzky-Golay convolution coefficients
 */
function calculateSavitzkyGolayCoefficients(windowSize: number, polynomialOrder: number): number[] {
  const halfWindow = Math.floor(windowSize / 2);

  // Build design matrix
  const J: number[][] = [];
  for (let i = -halfWindow; i <= halfWindow; i++) {
    const row: number[] = [];
    for (let j = 0; j <= polynomialOrder; j++) {
      row.push(Math.pow(i, j));
    }
    J.push(row);
  }

  // Compute J^T * J
  const JtJ = multiplyMatrices(transposeMatrix(J), J);

  // Compute inverse of J^T * J
  const JtJInv = invertMatrix(JtJ);

  // Compute (J^T * J)^-1 * J^T
  const JtJInvJt = multiplyMatrices(JtJInv, transposeMatrix(J));

  // Extract smoothing coefficients (first row)
  const coefficients = JtJInvJt[0];

  return coefficients;
}

/**
 * Matrix multiplication helper
 */
function multiplyMatrices(A: number[][], B: number[][]): number[][] {
  const rowsA = A.length;
  const colsA = A[0].length;
  const colsB = B[0].length;

  const result: number[][] = [];
  for (let i = 0; i < rowsA; i++) {
    result[i] = [];
    for (let j = 0; j < colsB; j++) {
      let sum = 0;
      for (let k = 0; k < colsA; k++) {
        sum += A[i][k] * B[k][j];
      }
      result[i][j] = sum;
    }
  }
  return result;
}

/**
 * Matrix transpose helper
 */
function transposeMatrix(matrix: number[][]): number[][] {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const result: number[][] = [];

  for (let j = 0; j < cols; j++) {
    result[j] = [];
    for (let i = 0; i < rows; i++) {
      result[j][i] = matrix[i][j];
    }
  }
  return result;
}

/**
 * Matrix inversion helper (for small matrices)
 */
function invertMatrix(matrix: number[][]): number[][] {
  const n = matrix.length;
  const augmented: number[][] = [];

  // Create augmented matrix [A|I]
  for (let i = 0; i < n; i++) {
    augmented[i] = [...matrix[i]];
    for (let j = 0; j < n; j++) {
      augmented[i].push(i === j ? 1 : 0);
    }
  }

  // Gaussian elimination
  for (let i = 0; i < n; i++) {
    // Find pivot
    let pivot = i;
    for (let j = i + 1; j < n; j++) {
      if (Math.abs(augmented[j][i]) > Math.abs(augmented[pivot][i])) {
        pivot = j;
      }
    }

    // Swap rows
    [augmented[i], augmented[pivot]] = [augmented[pivot], augmented[i]];

    // Scale row
    const scale = augmented[i][i];
    for (let j = 0; j < 2 * n; j++) {
      augmented[i][j] /= scale;
    }

    // Eliminate column
    for (let j = 0; j < n; j++) {
      if (j !== i) {
        const factor = augmented[j][i];
        for (let k = 0; k < 2 * n; k++) {
          augmented[j][k] -= factor * augmented[i][k];
        }
      }
    }
  }

  // Extract inverse matrix
  const inverse: number[][] = [];
  for (let i = 0; i < n; i++) {
    inverse[i] = augmented[i].slice(n);
  }

  return inverse;
}

// ============= OUTLIER DETECTION =============

export interface OutlierDetectionResult {
  cleanedData: DataPoint[];
  outlierIndices: number[];
  outlierValues: number[];
  thresholds: {
    lower: number;
    upper: number;
  };
  method: string;
}

/**
 * Detect and remove outliers using IQR (Interquartile Range) method
 * @param data - Array of data points
 * @param multiplier - IQR multiplier for outlier threshold (default: 1.5)
 * @returns Cleaned data and outlier information
 */
export function detectAndRemoveOutliersIQR(
  data: DataPoint[],
  multiplier: number = 1.5
): OutlierDetectionResult {
  const values = data.map((p) => p.value).filter((v) => !isNaN(v) && isFinite(v));
  const sorted = [...values].sort((a, b) => a - b);

  // Calculate quartiles
  const q1Index = Math.floor(sorted.length * 0.25);
  const q3Index = Math.floor(sorted.length * 0.75);
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];

  // Calculate IQR and thresholds
  const iqr = q3 - q1;
  const lowerThreshold = q1 - multiplier * iqr;
  const upperThreshold = q3 + multiplier * iqr;

  // Detect outliers
  const outlierIndices: number[] = [];
  const outlierValues: number[] = [];
  const cleanedData: DataPoint[] = [];

  data.forEach((point, index) => {
    if (point.value < lowerThreshold || point.value > upperThreshold) {
      outlierIndices.push(index);
      outlierValues.push(point.value);
    } else {
      cleanedData.push(point);
    }
  });

  return {
    cleanedData,
    outlierIndices,
    outlierValues,
    thresholds: {
      lower: lowerThreshold,
      upper: upperThreshold,
    },
    method: `IQR (multiplier=${multiplier})`,
  };
}

/**
 * Detect and remove outliers using Z-score method
 * @param data - Array of data points
 * @param threshold - Z-score threshold for outliers (default: 3)
 * @returns Cleaned data and outlier information
 */
export function detectAndRemoveOutliersZScore(
  data: DataPoint[],
  threshold: number = 3
): OutlierDetectionResult {
  const values = data.map((p) => p.value).filter((v) => !isNaN(v) && isFinite(v));

  // Calculate mean and standard deviation
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  // Detect outliers
  const outlierIndices: number[] = [];
  const outlierValues: number[] = [];
  const cleanedData: DataPoint[] = [];

  data.forEach((point, index) => {
    const zScore = Math.abs((point.value - mean) / stdDev);
    if (zScore > threshold && stdDev > 0) {
      outlierIndices.push(index);
      outlierValues.push(point.value);
    } else {
      cleanedData.push(point);
    }
  });

  return {
    cleanedData,
    outlierIndices,
    outlierValues,
    thresholds: {
      lower: mean - threshold * stdDev,
      upper: mean + threshold * stdDev,
    },
    method: `Z-Score (threshold=${threshold})`,
  };
}

/**
 * Detect and remove outliers using Modified Z-score method (more robust)
 * @param data - Array of data points
 * @param threshold - Modified Z-score threshold (default: 3.5)
 * @returns Cleaned data and outlier information
 */
export function detectAndRemoveOutliersModifiedZScore(
  data: DataPoint[],
  threshold: number = 3.5
): OutlierDetectionResult {
  const values = data.map((p) => p.value).filter((v) => !isNaN(v) && isFinite(v));
  const sorted = [...values].sort((a, b) => a - b);

  // Calculate median and MAD (Median Absolute Deviation)
  const median = sorted[Math.floor(sorted.length / 2)];
  const deviations = values.map((v) => Math.abs(v - median));
  const mad = deviations[Math.floor(deviations.length / 2)];

  // Detect outliers using modified Z-score
  const outlierIndices: number[] = [];
  const outlierValues: number[] = [];
  const cleanedData: DataPoint[] = [];

  data.forEach((point, index) => {
    const modifiedZScore = 0.6745 * Math.abs(point.value - median) / (mad || 1);
    if (modifiedZScore > threshold) {
      outlierIndices.push(index);
      outlierValues.push(point.value);
    } else {
      cleanedData.push(point);
    }
  });

  return {
    cleanedData,
    outlierIndices,
    outlierValues,
    thresholds: {
      lower: median - threshold * mad,
      upper: median + threshold * mad,
    },
    method: `Modified Z-Score (threshold=${threshold})`,
  };
}

/**
 * Detect and remove outliers using percentile method
 * @param data - Array of data points
 * @param lowerPercentile - Lower percentile threshold (default: 5)
 * @param upperPercentile - Upper percentile threshold (default: 95)
 * @returns Cleaned data and outlier information
 */
export function detectAndRemoveOutliersPercentile(
  data: DataPoint[],
  lowerPercentile: number = 5,
  upperPercentile: number = 95
): OutlierDetectionResult {
  const values = data.map((p) => p.value).filter((v) => !isNaN(v) && isFinite(v));
  const sorted = [...values].sort((a, b) => a - b);

  // Calculate percentile thresholds
  const lowerIndex = Math.floor(sorted.length * (lowerPercentile / 100));
  const upperIndex = Math.floor(sorted.length * (upperPercentile / 100));
  const lowerThreshold = sorted[lowerIndex];
  const upperThreshold = sorted[upperIndex];

  // Detect outliers
  const outlierIndices: number[] = [];
  const outlierValues: number[] = [];
  const cleanedData: DataPoint[] = [];

  data.forEach((point, index) => {
    if (point.value < lowerThreshold || point.value > upperThreshold) {
      outlierIndices.push(index);
      outlierValues.push(point.value);
    } else {
      cleanedData.push(point);
    }
  });

  return {
    cleanedData,
    outlierIndices,
    outlierValues,
    thresholds: {
      lower: lowerThreshold,
      upper: upperThreshold,
    },
    method: `Percentile (${lowerPercentile}-${upperPercentile})`,
  };
}

// ============= TOPOGRAPHIC CORRECTION =============

export interface TopographicCorrectionParams {
  elevationData: { x: number; y: number; z: number }[];
  correctionMethod: 'simple' | 'interpolated' | 'weighted';
  referenceElevation?: number;
}

/**
 * Apply topographic correction to geophysical data
 * @param data - Array of data points
 * @param params - Correction parameters
 * @returns Corrected data points
 */
export function applyTopographicCorrection(
  data: DataPoint[],
  params: TopographicCorrectionParams
): DataPoint[] {
  const { elevationData, correctionMethod, referenceElevation } = params;

  if (!elevationData || elevationData.length === 0) {
    return data;
  }

  // Calculate reference elevation if not provided
  const refElevation = referenceElevation ||
    elevationData.reduce((sum, p) => sum + p.z, 0) / elevationData.length;

  switch (correctionMethod) {
    case 'simple':
      return applySimpleTopographicCorrection(data, elevationData, refElevation);
    case 'interpolated':
      return applyInterpolatedTopographicCorrection(data, elevationData, refElevation);
    case 'weighted':
      return applyWeightedTopographicCorrection(data, elevationData, refElevation);
    default:
      return applySimpleTopographicCorrection(data, elevationData, refElevation);
  }
}

function applySimpleTopographicCorrection(
  data: DataPoint[],
  elevationData: { x: number; y: number; z: number }[],
  refElevation: number
): DataPoint[] {
  // Create elevation map
  const elevationMap = new Map<number, number>();
  elevationData.forEach((point) => {
    elevationMap.set(point.x, point.z);
  });

  return data.map((point) => {
    const elevation = elevationMap.get(point.x) || refElevation;
    const elevationDifference = elevation - refElevation;

    // Apply correction based on elevation difference
    // This is a simplified correction factor
    const correctionFactor = Math.exp(0.0001 * elevationDifference);

    return {
      ...point,
      value: point.value / correctionFactor,
    };
  });
}

function applyInterpolatedTopographicCorrection(
  data: DataPoint[],
  elevationData: { x: number; y: number; z: number }[],
  refElevation: number
): DataPoint[] {
  // Sort elevation data by x coordinate
  const sortedElevation = [...elevationData].sort((a, b) => a.x - b.x);

  return data.map((point) => {
    // Find surrounding elevation points for interpolation
    let lowerPoint = sortedElevation[0];
    let upperPoint = sortedElevation[sortedElevation.length - 1];

    for (let i = 0; i < sortedElevation.length - 1; i++) {
      if (point.x >= sortedElevation[i].x && point.x <= sortedElevation[i + 1].x) {
        lowerPoint = sortedElevation[i];
        upperPoint = sortedElevation[i + 1];
        break;
      }
    }

    // Linear interpolation
    let interpolatedElevation: number;
    if (upperPoint.x === lowerPoint.x) {
      interpolatedElevation = lowerPoint.z;
    } else {
      const t = (point.x - lowerPoint.x) / (upperPoint.x - lowerPoint.x);
      interpolatedElevation = lowerPoint.z + t * (upperPoint.z - lowerPoint.z);
    }

    const elevationDifference = interpolatedElevation - refElevation;
    const correctionFactor = Math.exp(0.0001 * elevationDifference);

    return {
      ...point,
      value: point.value / correctionFactor,
    };
  });
}

function applyWeightedTopographicCorrection(
  data: DataPoint[],
  elevationData: { x: number; y: number; z: number }[],
  refElevation: number
): DataPoint[] {
  return data.map((point) => {
    // Calculate weighted average elevation based on inverse distance
    let weightedSum = 0;
    let totalWeight = 0;

    elevationData.forEach((elevPoint) => {
      const distance = Math.sqrt(Math.pow(point.x - elevPoint.x, 2) + Math.pow(point.y - elevPoint.y, 2));
      const weight = 1 / (distance + 1); // Avoid division by zero
      weightedSum += weight * elevPoint.z;
      totalWeight += weight;
    });

    const weightedElevation = weightedSum / totalWeight;
    const elevationDifference = weightedElevation - refElevation;
    const correctionFactor = Math.exp(0.0001 * elevationDifference);

    return {
      ...point,
      value: point.value / correctionFactor,
    };
  });
}

// ============= NORMALIZATION =============

export interface NormalizationResult {
  normalizedData: DataPoint[];
  parameters: {
    method: string;
    offset?: number;
    scale?: number;
    min?: number;
    max?: number;
  };
}

/**
 * Min-Max normalization to [0, 1] range
 */
export function normalizeMinMax(data: DataPoint[]): NormalizationResult {
  const values = data.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;

  const normalizedData = data.map((point) => ({
    ...point,
    value: range > 0 ? (point.value - min) / range : 0.5,
  }));

  return {
    normalizedData,
    parameters: {
      method: 'min-max',
      min,
      max,
    },
  };
}

/**
 * Z-score normalization (standardization)
 */
export function normalizeZScore(data: DataPoint[]): NormalizationResult {
  const values = data.map((p) => p.value);
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  const normalizedData = data.map((point) => ({
    ...point,
    value: stdDev > 0 ? (point.value - mean) / stdDev : 0,
  }));

  return {
    normalizedData,
    parameters: {
      method: 'z-score',
      offset: mean,
      scale: stdDev,
    },
  };
}

/**
 * Logarithmic transformation
 */
export function normalizeLog(data: DataPoint[], offset: number = 1): NormalizationResult {
  const normalizedData = data.map((point) => ({
    ...point,
    value: Math.log10(Math.max(point.value + offset, 1e-10)),
  }));

  return {
    normalizedData,
    parameters: {
      method: 'logarithmic',
      offset,
    },
  };
}

// ============= MAIN PREPROCESSING FUNCTION =============

export interface PreprocessingOptions {
  filter?: {
    type: 'median' | 'moving_average' | 'savitzky_golay';
    windowSize?: number;
    polynomialOrder?: number;
  };
  outlierDetection?: {
    method: 'iqr' | 'zscore' | 'modified_zscore' | 'percentile';
    threshold?: number;
    lowerPercentile?: number;
    upperPercentile?: number;
  };
  topographicCorrection?: {
    enabled: boolean;
    elevationData: { x: number; y: number; z: number }[];
    method: 'simple' | 'interpolated' | 'weighted';
    referenceElevation?: number;
  };
  normalization?: {
    method: 'minmax' | 'zscore' | 'log';
    offset?: number;
  };
}

export interface PreprocessingResult {
  data: DataPoint[];
  operations: ProcessingOperation[];
  qualityMetrics: {
    originalCount: number;
    finalCount: number;
    outliersRemoved: number;
    meanChange: number;
    stdDevChange: number;
  };
}

/**
 * Apply complete preprocessing pipeline
 */
export function applyPreprocessingPipeline(
  data: DataPoint[],
  options: PreprocessingOptions
): PreprocessingResult {
  let processedData = [...data];
  const operations: ProcessingOperation[] = [];

  // Step 1: Apply filtering
  if (options.filter) {
    const startTime = Date.now();
    let filteredData: DataPoint[];

    switch (options.filter.type) {
      case 'median':
        filteredData = applyMedianFilter(processedData, options.filter.windowSize);
        break;
      case 'moving_average':
        filteredData = applyMovingAverage(processedData, options.filter.windowSize);
        break;
      case 'savitzky_golay':
        filteredData = applySavitzkyGolayFilter(
          processedData,
          options.filter.windowSize,
          options.filter.polynomialOrder
        );
        break;
      default:
        filteredData = processedData;
    }

    processedData = filteredData;
    operations.push({
      type: 'filter',
      parameters: options.filter,
      timestamp: new Date(startTime),
      result: `Applied ${options.filter.type} filter`,
    });
  }

  // Step 2: Remove outliers
  let outlierIndices: number[] = [];
  if (options.outlierDetection) {
    const startTime = Date.now();
    let outlierResult: OutlierDetectionResult;

    switch (options.outlierDetection.method) {
      case 'iqr':
        outlierResult = detectAndRemoveOutliersIQR(processedData, options.outlierDetection.threshold || 1.5);
        break;
      case 'zscore':
        outlierResult = detectAndRemoveOutliersZScore(processedData, options.outlierDetection.threshold || 3);
        break;
      case 'modified_zscore':
        outlierResult = detectAndRemoveOutliersModifiedZScore(
          processedData,
          options.outlierDetection.threshold || 3.5
        );
        break;
      case 'percentile':
        outlierResult = detectAndRemoveOutliersPercentile(
          processedData,
          options.outlierDetection.lowerPercentile || 5,
          options.outlierDetection.upperPercentile || 95
        );
        break;
      default:
        outlierResult = {
          cleanedData: processedData,
          outlierIndices: [],
          outlierValues: [],
          thresholds: { lower: 0, upper: 0 },
          method: 'none',
        };
    }

    processedData = outlierResult.cleanedData;
    outlierIndices = outlierResult.outlierIndices;

    operations.push({
      type: 'outlier_detection',
      parameters: options.outlierDetection,
      timestamp: new Date(startTime),
      result: `Removed ${outlierIndices.length} outliers using ${outlierResult.method}`,
    });
  }

  // Step 3: Apply topographic correction
  if (options.topographicCorrection && options.topographicCorrection.enabled) {
    const startTime = Date.now();
    processedData = applyTopographicCorrection(processedData, {
      elevationData: options.topographicCorrection.elevationData,
      correctionMethod: options.topographicCorrection.method,
      referenceElevation: options.topographicCorrection.referenceElevation,
    });

    operations.push({
      type: 'topographic_correction',
      parameters: options.topographicCorrection,
      timestamp: new Date(startTime),
      result: 'Applied topographic correction',
    });
  }

  // Step 4: Apply normalization
  if (options.normalization) {
    const startTime = Date.now();
    let normalizationResult: NormalizationResult;

    switch (options.normalization.method) {
      case 'minmax':
        normalizationResult = normalizeMinMax(processedData);
        break;
      case 'zscore':
        normalizationResult = normalizeZScore(processedData);
        break;
      case 'log':
        normalizationResult = normalizeLog(processedData, options.normalization.offset);
        break;
      default:
        normalizationResult = { normalizedData: processedData, parameters: { method: 'none' } };
    }

    processedData = normalizationResult.normalizedData;
    operations.push({
      type: 'normalization',
      parameters: options.normalization,
      timestamp: new Date(startTime),
      result: `Applied ${normalizationResult.parameters.method} normalization`,
    });
  }

  // Calculate quality metrics
  const originalMean = data.reduce((sum, p) => sum + p.value, 0) / data.length;
  const originalVariance = data.reduce((sum, p) => sum + Math.pow(p.value - originalMean, 2), 0) / data.length;
  const originalStdDev = Math.sqrt(originalVariance);

  const finalMean = processedData.reduce((sum, p) => sum + p.value, 0) / processedData.length;
  const finalVariance =
    processedData.reduce((sum, p) => sum + Math.pow(p.value - finalMean, 2), 0) / processedData.length;
  const finalStdDev = Math.sqrt(finalVariance);

  return {
    data: processedData,
    operations,
    qualityMetrics: {
      originalCount: data.length,
      finalCount: processedData.length,
      outliersRemoved: outlierIndices.length,
      meanChange: ((finalMean - originalMean) / Math.abs(originalMean)) * 100,
      stdDevChange: ((finalStdDev - originalStdDev) / Math.abs(originalStdDev)) * 100,
    },
  };
}
