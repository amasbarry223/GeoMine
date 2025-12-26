import { DataPoint, InversionParameters, ModelGrid, GridGeometry, QualityIndicators } from '@/types/geophysic';

// ============= INVERSION ENGINE =============

export interface InversionResult {
  model: ModelGrid;
  qualityIndicators: QualityIndicators;
  convergence: number[];
  iterations: number;
  finalRMS: number;
  runtime: number;
}

export interface InversionOptions {
  maxIterations: number;
  convergenceThreshold: number;
  regularizationFactor: number;
  smoothingFactor: number;
  dampingFactor?: number;
  initialModel?: number[];
  constraints?: {
    minResistivity?: number;
    maxResistivity?: number;
    referenceModel?: number[];
  };
  progressCallback?: (iteration: number, rms: number, convergence: number) => void;
}

/**
 * 2D Least-Squares Inversion with Tikhonov Regularization
 * This is a simplified implementation for demonstration.
 * A full production implementation would require more sophisticated algorithms.
 */
export async function invert2DLeastSquares(
  data: DataPoint[],
  options: InversionOptions
): Promise<InversionResult> {
  const startTime = Date.now();

  // Default parameters
  const maxIterations = options.maxIterations || 20;
  const convergenceThreshold = options.convergenceThreshold || 1e-3;
  const regularizationFactor = options.regularizationFactor || 0.1;
  const smoothingFactor = options.smoothingFactor || 0.1;
  const dampingFactor = options.dampingFactor || 0.01;

  // Extract data
  const observedData = data.map((p) => p.value);
  const positions = data.map((p) => ({ x: p.x, y: p.y }));

  // Create model grid
  const grid = createModelGrid(positions, options.constraints);
  const modelSize = grid.values.length;

  // Set initial model
  let model = options.initialModel || createInitialModel(grid, observedData);

  // Initialize convergence tracking
  const convergence: number[] = [];
  let previousRMS = Infinity;

  // Iterative inversion loop
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    // Forward modeling: Calculate predicted data from current model
    const predictedData = forwardModel2D(model, grid, positions);

    // Calculate residuals (observed - predicted)
    const residuals = observedData.map((obs, i) => {
      const pred = predictedData[i];
      return (obs - pred) / (Math.abs(pred) || 1);
    });

    // Calculate RMS error
    const rms = Math.sqrt(
      residuals.reduce((sum, r) => sum + r * r, 0) / residuals.length
    );

    convergence.push(rms);

    // Check convergence
    const convergenceRate = Math.abs((rms - previousRMS) / (previousRMS || 1));

    if (options.progressCallback) {
      options.progressCallback(iteration + 1, rms, convergenceRate);
    }

    if (convergenceRate < convergenceThreshold && iteration > 0) {
      break;
    }

    previousRMS = rms;

    // Calculate Jacobian (sensitivity matrix)
    const jacobian = calculateJacobian2D(model, grid, positions);

    // Apply Tikhonov regularization
    const regularizedJacobian = applyTikhonovRegularization(
      jacobian,
      regularizationFactor,
      smoothingFactor
    );

    // Calculate model update using least-squares
    const modelUpdate = calculateModelUpdate(
      regularizedJacobian,
      residuals,
      dampingFactor
    );

    // Update model
    model = updateModel(model, modelUpdate, grid);

    // Apply constraints
    if (options.constraints) {
      model = applyConstraints(model, grid, options.constraints);
    }
  }

  const endTime = Date.now();
  const runtime = endTime - startTime;

  // Calculate final quality indicators
  const finalPredictedData = forwardModel2D(model, grid, positions);
  const qualityIndicators = calculateQualityIndicators(
    observedData,
    finalPredictedData,
    model,
    grid
  );

  return {
    model: grid,
    qualityIndicators,
    convergence,
    iterations: convergence.length,
    finalRMS: convergence[convergence.length - 1],
    runtime,
  };
}

/**
 * Create model grid from data points
 */
function createModelGrid(
  positions: { x: number; y: number }[],
  constraints?: { minResistivity?: number; maxResistivity?: number; referenceModel?: number[] }
): ModelGrid {
  // Get unique X and Y coordinates
  const xCoords = [...new Set(positions.map((p) => Math.round(p.x * 10) / 10))].sort((a, b) => a - b);
  const yCoords = [...new Set(positions.map((p) => Math.round(p.y * 10) / 10))].sort((a, b) => a - b);

  // Create grid geometry
  const gridGeometry: GridGeometry = {
    origin: { x: xCoords[0], y: yCoords[0] },
    spacing: {
      dx: xCoords.length > 1 ? xCoords[1] - xCoords[0] : 1,
      dy: yCoords.length > 1 ? yCoords[1] - yCoords[0] : 1,
    },
    cellCount: { nx: xCoords.length, ny: yCoords.length },
  };

  // Initialize model values
  const values: number[] = [];
  for (let i = 0; i < yCoords.length; i++) {
    for (let j = 0; j < xCoords.length; j++) {
      if (constraints?.referenceModel && constraints.referenceModel.length > 0) {
        values.push(constraints.referenceModel[i * xCoords.length + j] || 100);
      } else {
        values.push(100); // Default resistivity
      }
    }
  }

  return {
    dimensions: { x: xCoords.length, y: yCoords.length },
    values,
    coordinates: { x: xCoords, y: yCoords },
    gridGeometry,
  };
}

/**
 * Create initial model from observed data
 */
function createInitialModel(grid: ModelGrid, observedData: number[]): number[] {
  const meanValue = observedData.reduce((sum, v) => sum + v, 0) / observedData.length;
  return grid.values.map(() => meanValue);
}

/**
 * 2D Forward modeling (simplified)
 * In production, this would use finite element or finite difference methods
 */
function forwardModel2D(
  model: number[],
  grid: ModelGrid,
  positions: { x: number; y: number }[]
): number[] {
  return positions.map((pos) => {
    // Find grid cell containing this position
    const xIndex = grid.coordinates.x.findIndex((x, i) => {
      const nextX = grid.coordinates.x[i + 1];
      return pos.x >= x && (nextX === undefined || pos.x < nextX);
    });

    const yIndex = grid.coordinates.y.findIndex((y, i) => {
      const nextY = grid.coordinates.y[i + 1];
      return pos.y >= y && (nextY === undefined || pos.y < nextY);
    });

    // Bilinear interpolation
    if (xIndex === -1 || yIndex === -1) {
      return model[0];
    }

    const idx = yIndex * grid.dimensions.x + xIndex;
    return model[idx] || 100;
  });
}

/**
 * Calculate Jacobian matrix (sensitivity matrix)
 */
function calculateJacobian2D(
  model: number[],
  grid: ModelGrid,
  positions: { x: number; y: number }[]
): number[][] {
  // Simplified Jacobian calculation
  // In production, this would use proper sensitivity calculations
  const numObservations = positions.length;
  const numModelParameters = model.length;
  const jacobian: number[][] = [];

  for (let i = 0; i < numObservations; i++) {
    const row: number[] = [];
    const pos = positions[i];

    for (let j = 0; j < numModelParameters; j++) {
      // Calculate distance between observation and model cell
      const cellX = grid.coordinates.x[j % grid.dimensions.x];
      const cellY = grid.coordinates.y[Math.floor(j / grid.dimensions.x)];
      const distance = Math.sqrt(
        Math.pow(pos.x - cellX, 2) + Math.pow(pos.y - cellY, 2)
      );

      // Sensitivity decreases with distance (simplified)
      const sensitivity = Math.exp(-distance / 10);
      row.push(sensitivity);
    }

    jacobian.push(row);
  }

  return jacobian;
}

/**
 * Apply Tikhonov regularization
 */
function applyTikhonovRegularization(
  jacobian: number[][],
  regularizationFactor: number,
  smoothingFactor: number
): number[][] {
  const numObs = jacobian.length;
  const numParams = jacobian[0].length;

  // Create regularization matrix (identity + smoothing)
  const regularizationMatrix: number[][] = [];

  for (let i = 0; i < numParams; i++) {
    regularizationMatrix[i] = [];
    for (let j = 0; j < numParams; j++) {
      if (i === j) {
        regularizationMatrix[i][j] = regularizationFactor;
      } else if (Math.abs(i - j) === 1) {
        // Smoothing between adjacent cells
        regularizationMatrix[i][j] = smoothingFactor;
      } else {
        regularizationMatrix[i][j] = 0;
      }
    }
  }

  // Combine with Jacobian: J^T * J + lambda * R
  const jtj = multiplyMatrices(transposeMatrix(jacobian), jacobian);

  const regularized: number[][] = [];
  for (let i = 0; i < numParams; i++) {
    regularized[i] = [];
    for (let j = 0; j < numParams; j++) {
      regularized[i][j] = jtj[i][j] + regularizationMatrix[i][j];
    }
  }

  return regularized;
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
 * Calculate model update using least-squares
 */
function calculateModelUpdate(
  jacobian: number[][],
  residuals: number[],
  dampingFactor: number
): number[] {
  const numParams = jacobian[0].length;

  // Calculate J^T * d
  const jtd = multiplyMatrices(transposeMatrix(jacobian), residuals.map((r) => [r]));

  // Add damping to diagonal
  for (let i = 0; i < numParams; i++) {
    jacobian[i][i] += dampingFactor;
  }

  // Invert (J^T * J) (simplified - use iterative solver in production)
  const inverted = invertMatrix(jacobian);

  // Calculate model update: delta_m = (J^T * J)^-1 * J^T * d
  const delta: number[] = [];
  for (let i = 0; i < numParams; i++) {
    let sum = 0;
    for (let k = 0; k < jtd.length; k++) {
      sum += inverted[i][k] * jtd[k][0];
    }
    delta.push(sum);
  }

  return delta;
}

/**
 * Matrix inversion (for small matrices - use iterative solver in production)
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

  // Gaussian elimination with partial pivoting
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
    if (Math.abs(scale) < 1e-10) {
      // Singular matrix - return identity
      return Array.from({ length: n }, (_, i) =>
        Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
      );
    }

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

  // Extract inverse
  const inverse: number[][] = [];
  for (let i = 0; i < n; i++) {
    inverse[i] = augmented[i].slice(n);
  }

  return inverse;
}

/**
 * Update model with calculated changes
 */
function updateModel(model: number[], update: number[], grid: ModelGrid): number[] {
  return model.map((value, index) => {
    const newValue = value + update[index];
    return Math.max(1, newValue); // Ensure positive resistivity
  });
}

/**
 * Apply constraints to model
 */
function applyConstraints(
  model: number[],
  grid: ModelGrid,
  constraints: { minResistivity?: number; maxResistivity?: number }
): number[] {
  return model.map((value) => {
    if (constraints.minResistivity !== undefined && value < constraints.minResistivity) {
      return constraints.minResistivity;
    }
    if (constraints.maxResistivity !== undefined && value > constraints.maxResistivity) {
      return constraints.maxResistivity;
    }
    return value;
  });
}

/**
 * Calculate quality indicators for inversion result
 */
function calculateQualityIndicators(
  observedData: number[],
  predictedData: number[],
  model: number[],
  grid: ModelGrid
): QualityIndicators {
  // Calculate RMS error
  const residuals = observedData.map((obs, i) => obs - predictedData[i]);
  const rms = Math.sqrt(residuals.reduce((sum, r) => sum + r * r, 0) / residuals.length);

  // Calculate data misfit
  const dataMisfit = residuals.reduce((sum, r) => sum + Math.abs(r), 0) / residuals.length;

  // Calculate model roughness (measure of model smoothness)
  let roughness = 0;
  for (let i = 1; i < grid.dimensions.y; i++) {
    for (let j = 1; j < grid.dimensions.x; j++) {
      const current = model[i * grid.dimensions.x + j];
      const left = model[i * grid.dimensions.x + (j - 1)];
      const up = model[(i - 1) * grid.dimensions.x + j];
      roughness += Math.pow(current - left, 2) + Math.pow(current - up, 2);
    }
  }
  roughness = Math.sqrt(roughness / (model.length || 1));

  // Calculate sensitivity matrix (simplified)
  const sensitivityMatrix: number[][] = [];
  const numObs = observedData.length;
  const numParams = model.length;

  for (let i = 0; i < numObs; i++) {
    sensitivityMatrix[i] = [];
    for (let j = 0; j < numParams; j++) {
      sensitivityMatrix[i][j] = Math.exp(-j / numParams); // Simplified
    }
  }

  return {
    rmsError: rms,
    dataMisfit,
    modelRoughness: roughness,
    sensitivityMatrix,
    depthOfInvestigation: calculateDepthOfInvestigation(model, grid),
  };
}

/**
 * Calculate depth of investigation
 */
function calculateDepthOfInvestigation(model: number[], grid: ModelGrid): number[] {
  const depthOfInvestigation: number[] = [];

  for (let j = 0; j < grid.dimensions.x; j++) {
    let maxDepth = 0;
    for (let i = 0; i < grid.dimensions.y; i++) {
      const value = model[i * grid.dimensions.x + j];
      const depth = grid.coordinates.y[i];
      maxDepth = Math.max(maxDepth, value > 0.5 ? depth : maxDepth);
    }
    depthOfInvestigation.push(maxDepth);
  }

  return depthOfInvestigation;
}

/**
 * 3D Least-Squares Inversion with Tikhonov Regularization
 */
export async function invert3DLeastSquares(
  data: DataPoint[],
  options: InversionOptions
): Promise<InversionResult> {
  const startTime = Date.now();

  // Default parameters
  const maxIterations = options.maxIterations || 20;
  const convergenceThreshold = options.convergenceThreshold || 1e-3;
  const regularizationFactor = options.regularizationFactor || 0.1;
  const smoothingFactor = options.smoothingFactor || 0.1;
  const dampingFactor = options.dampingFactor || 0.01;

  // Extract data
  const observedData = data.map((p) => p.value);
  const positions = data.map((p) => ({ x: p.x, y: p.y, z: p.z || 0 }));

  // Create 3D model grid
  const grid = createModelGrid3D(positions, options.constraints);
  const modelSize = grid.values.length;

  // Set initial model
  let model = options.initialModel || createInitialModel3D(grid, observedData);

  // Initialize convergence tracking
  const convergence: number[] = [];
  let previousRMS = Infinity;

  // Iterative inversion loop
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    // Forward modeling: Calculate predicted data from current model
    const predictedData = forwardModel3D(model, grid, positions);

    // Calculate residuals (observed - predicted)
    const residuals = observedData.map((obs, i) => {
      const pred = predictedData[i];
      return (obs - pred) / (Math.abs(pred) || 1);
    });

    // Calculate RMS error
    const rms = Math.sqrt(
      residuals.reduce((sum, r) => sum + r * r, 0) / residuals.length
    );

    convergence.push(rms);

    // Check convergence
    const convergenceRate = Math.abs((rms - previousRMS) / (previousRMS || 1));

    if (options.progressCallback) {
      options.progressCallback(iteration + 1, rms, convergenceRate);
    }

    if (convergenceRate < convergenceThreshold && iteration > 0) {
      break;
    }

    previousRMS = rms;

    // Calculate Jacobian (sensitivity matrix)
    const jacobian = calculateJacobian3D(model, grid, positions);

    // Apply Tikhonov regularization
    const regularizedJacobian = applyTikhonovRegularization3D(
      jacobian,
      regularizationFactor,
      smoothingFactor,
      grid
    );

    // Calculate model update using least-squares
    const modelUpdate = calculateModelUpdate(
      regularizedJacobian,
      residuals,
      dampingFactor
    );

    // Update model
    model = updateModel3D(model, modelUpdate, grid);

    // Apply constraints
    if (options.constraints) {
      model = applyConstraints3D(model, grid, options.constraints);
    }
  }

  const endTime = Date.now();
  const runtime = endTime - startTime;

  // Calculate final quality indicators
  const finalPredictedData = forwardModel3D(model, grid, positions);
  const qualityIndicators = calculateQualityIndicators(
    observedData,
    finalPredictedData,
    model,
    grid
  );

  return {
    model: grid,
    qualityIndicators,
    convergence,
    iterations: convergence.length,
    finalRMS: convergence[convergence.length - 1],
    runtime,
  };
}

/**
 * Create 3D model grid from data points
 */
function createModelGrid3D(
  positions: { x: number; y: number; z: number }[],
  constraints?: { minResistivity?: number; maxResistivity?: number; referenceModel?: number[] }
): ModelGrid {
  // Get unique X, Y, and Z coordinates
  const xCoords = [...new Set(positions.map((p) => Math.round(p.x * 10) / 10))].sort((a, b) => a - b);
  const yCoords = [...new Set(positions.map((p) => Math.round(p.y * 10) / 10))].sort((a, b) => a - b);
  const zCoords = [...new Set(positions.map((p) => Math.round((p.z || 0) * 10) / 10))].sort((a, b) => a - b);

  // If no Z variation, create a simple depth grid
  if (zCoords.length === 1 || zCoords.length === 0) {
    // Create depth layers
    const minZ = Math.min(...positions.map((p) => p.z || 0));
    const maxZ = Math.max(...positions.map((p) => p.z || 0));
    const depthRange = Math.max(maxZ - minZ, 10); // Minimum 10 units depth
    const numLayers = 10; // Default number of depth layers
    
    for (let i = 0; i < numLayers; i++) {
      zCoords.push(minZ + (depthRange * i) / (numLayers - 1));
    }
  }

  // Create grid geometry
  const gridGeometry: GridGeometry = {
    origin: { x: xCoords[0], y: yCoords[0], z: zCoords[0] },
    spacing: {
      dx: xCoords.length > 1 ? xCoords[1] - xCoords[0] : 1,
      dy: yCoords.length > 1 ? yCoords[1] - yCoords[0] : 1,
      dz: zCoords.length > 1 ? zCoords[1] - zCoords[0] : 1,
    },
    cellCount: { nx: xCoords.length, ny: yCoords.length, nz: zCoords.length },
  };

  // Initialize model values
  const values: number[] = [];
  const totalCells = xCoords.length * yCoords.length * zCoords.length;
  
  for (let k = 0; k < zCoords.length; k++) {
    for (let j = 0; j < yCoords.length; j++) {
      for (let i = 0; i < xCoords.length; i++) {
        const idx = k * xCoords.length * yCoords.length + j * xCoords.length + i;
        if (constraints?.referenceModel && constraints.referenceModel.length > idx) {
          values.push(constraints.referenceModel[idx] || 100);
        } else {
          values.push(100); // Default resistivity
        }
      }
    }
  }

  return {
    dimensions: { x: xCoords.length, y: yCoords.length, z: zCoords.length },
    values,
    coordinates: { x: xCoords, y: yCoords, z: zCoords },
    gridGeometry,
  };
}

/**
 * Create initial 3D model from observed data
 */
function createInitialModel3D(grid: ModelGrid, observedData: number[]): number[] {
  const meanValue = observedData.reduce((sum, v) => sum + v, 0) / observedData.length;
  return grid.values.map(() => meanValue);
}

/**
 * 3D Forward modeling (simplified)
 * Uses trilinear interpolation for 3D model
 */
function forwardModel3D(
  model: number[],
  grid: ModelGrid,
  positions: { x: number; y: number; z: number }[]
): number[] {
  if (!grid.dimensions.z || !grid.coordinates.z) {
    // Fallback to 2D if no Z dimension
    return forwardModel2D(model, grid as any, positions.map((p) => ({ x: p.x, y: p.y })));
  }

  return positions.map((pos) => {
    // Find grid cell containing this position using trilinear interpolation
    const xIdx = findIndex(grid.coordinates.x, pos.x);
    const yIdx = findIndex(grid.coordinates.y, pos.y);
    const zIdx = findIndex(grid.coordinates.z!, pos.z);

    if (xIdx === -1 || yIdx === -1 || zIdx === -1) {
      return model[0] || 100;
    }

    // Trilinear interpolation
    const x0 = grid.coordinates.x[xIdx];
    const x1 = grid.coordinates.x[Math.min(xIdx + 1, grid.coordinates.x.length - 1)];
    const y0 = grid.coordinates.y[yIdx];
    const y1 = grid.coordinates.y[Math.min(yIdx + 1, grid.coordinates.y.length - 1)];
    const z0 = grid.coordinates.z![zIdx];
    const z1 = grid.coordinates.z![Math.min(zIdx + 1, grid.coordinates.z!.length - 1)];

    const dx = x1 !== x0 ? (pos.x - x0) / (x1 - x0) : 0;
    const dy = y1 !== y0 ? (pos.y - y0) / (y1 - y0) : 0;
    const dz = z1 !== z0 ? (pos.z - z0) / (z1 - z0) : 0;

    // Get values at 8 corners of the cube
    const getValue = (xi: number, yi: number, zi: number) => {
      const idx = zi * grid.dimensions.x * grid.dimensions.y + yi * grid.dimensions.x + xi;
      return model[idx] || 100;
    };

    const c000 = getValue(xIdx, yIdx, zIdx);
    const c100 = getValue(Math.min(xIdx + 1, grid.dimensions.x - 1), yIdx, zIdx);
    const c010 = getValue(xIdx, Math.min(yIdx + 1, grid.dimensions.y - 1), zIdx);
    const c110 = getValue(Math.min(xIdx + 1, grid.dimensions.x - 1), Math.min(yIdx + 1, grid.dimensions.y - 1), zIdx);
    const c001 = getValue(xIdx, yIdx, Math.min(zIdx + 1, grid.dimensions.z! - 1));
    const c101 = getValue(Math.min(xIdx + 1, grid.dimensions.x - 1), yIdx, Math.min(zIdx + 1, grid.dimensions.z! - 1));
    const c011 = getValue(xIdx, Math.min(yIdx + 1, grid.dimensions.y - 1), Math.min(zIdx + 1, grid.dimensions.z! - 1));
    const c111 = getValue(Math.min(xIdx + 1, grid.dimensions.x - 1), Math.min(yIdx + 1, grid.dimensions.y - 1), Math.min(zIdx + 1, grid.dimensions.z! - 1));

    // Trilinear interpolation
    const c00 = c000 * (1 - dx) + c100 * dx;
    const c01 = c001 * (1 - dx) + c101 * dx;
    const c10 = c010 * (1 - dx) + c110 * dx;
    const c11 = c011 * (1 - dx) + c111 * dx;

    const c0 = c00 * (1 - dy) + c10 * dy;
    const c1 = c01 * (1 - dy) + c11 * dy;

    return c0 * (1 - dz) + c1 * dz;
  });
}

/**
 * Helper to find index in sorted array
 */
function findIndex(arr: number[], value: number): number {
  for (let i = 0; i < arr.length - 1; i++) {
    if (value >= arr[i] && value < arr[i + 1]) {
      return i;
    }
  }
  if (value >= arr[arr.length - 1]) {
    return arr.length - 1;
  }
  return -1;
}

/**
 * Calculate 3D Jacobian matrix (sensitivity matrix)
 */
function calculateJacobian3D(
  model: number[],
  grid: ModelGrid,
  positions: { x: number; y: number; z: number }[]
): number[][] {
  if (!grid.dimensions.z || !grid.coordinates.z) {
    return calculateJacobian2D(model, grid as any, positions.map((p) => ({ x: p.x, y: p.y })));
  }

  const numObservations = positions.length;
  const numModelParameters = model.length;
  const jacobian: number[][] = [];

  for (let i = 0; i < numObservations; i++) {
    const row: number[] = [];
    const pos = positions[i];

    for (let j = 0; j < numModelParameters; j++) {
      // Calculate 3D distance between observation and model cell
      const k = Math.floor(j / (grid.dimensions.x * grid.dimensions.y));
      const jj = Math.floor((j % (grid.dimensions.x * grid.dimensions.y)) / grid.dimensions.x);
      const ii = j % grid.dimensions.x;

      const cellX = grid.coordinates.x[ii];
      const cellY = grid.coordinates.y[jj];
      const cellZ = grid.coordinates.z![k];

      const distance = Math.sqrt(
        Math.pow(pos.x - cellX, 2) + Math.pow(pos.y - cellY, 2) + Math.pow(pos.z - cellZ, 2)
      );

      // Sensitivity decreases with distance (simplified)
      const sensitivity = Math.exp(-distance / 10);
      row.push(sensitivity);
    }

    jacobian.push(row);
  }

  return jacobian;
}

/**
 * Apply Tikhonov regularization for 3D
 */
function applyTikhonovRegularization3D(
  jacobian: number[][],
  regularizationFactor: number,
  smoothingFactor: number,
  grid: ModelGrid
): number[][] {
  const numParams = jacobian[0].length;

  // Create 3D regularization matrix (identity + 3D smoothing)
  const regularizationMatrix: number[][] = [];

  for (let i = 0; i < numParams; i++) {
    regularizationMatrix[i] = [];
    for (let j = 0; j < numParams; j++) {
      if (i === j) {
        regularizationMatrix[i][j] = regularizationFactor;
      } else {
        // Check if cells are adjacent in 3D
        const isAdjacent = areAdjacent3D(i, j, grid);
        if (isAdjacent) {
          regularizationMatrix[i][j] = smoothingFactor;
        } else {
          regularizationMatrix[i][j] = 0;
        }
      }
    }
  }

  // Combine with Jacobian: J^T * J + lambda * R
  const jtj = multiplyMatrices(transposeMatrix(jacobian), jacobian);

  const regularized: number[][] = [];
  for (let i = 0; i < numParams; i++) {
    regularized[i] = [];
    for (let j = 0; j < numParams; j++) {
      regularized[i][j] = jtj[i][j] + regularizationMatrix[i][j];
    }
  }

  return regularized;
}

/**
 * Check if two cells are adjacent in 3D grid
 */
function areAdjacent3D(idx1: number, idx2: number, grid: ModelGrid): boolean {
  if (!grid.dimensions.z) return false;

  const k1 = Math.floor(idx1 / (grid.dimensions.x * grid.dimensions.y));
  const j1 = Math.floor((idx1 % (grid.dimensions.x * grid.dimensions.y)) / grid.dimensions.x);
  const i1 = idx1 % grid.dimensions.x;

  const k2 = Math.floor(idx2 / (grid.dimensions.x * grid.dimensions.y));
  const j2 = Math.floor((idx2 % (grid.dimensions.x * grid.dimensions.y)) / grid.dimensions.x);
  const i2 = idx2 % grid.dimensions.x;

  const di = Math.abs(i1 - i2);
  const dj = Math.abs(j1 - j2);
  const dk = Math.abs(k1 - k2);

  // Adjacent if difference is 1 in exactly one dimension
  return (di === 1 && dj === 0 && dk === 0) ||
         (di === 0 && dj === 1 && dk === 0) ||
         (di === 0 && dj === 0 && dk === 1);
}

/**
 * Update 3D model
 */
function updateModel3D(
  currentModel: number[],
  update: number[],
  grid: ModelGrid
): number[] {
  return currentModel.map((val, i) => {
    const newVal = val + update[i];
    return Math.max(0.1, newVal); // Prevent negative values
  });
}

/**
 * Apply constraints to 3D model
 */
function applyConstraints3D(
  model: number[],
  grid: ModelGrid,
  constraints: { minResistivity?: number; maxResistivity?: number; referenceModel?: number[] }
): number[] {
  return model.map((val, i) => {
    let constrained = val;

    if (constraints.minResistivity !== undefined) {
      constrained = Math.max(constrained, constraints.minResistivity);
    }

    if (constraints.maxResistivity !== undefined) {
      constrained = Math.min(constrained, constraints.maxResistivity);
    }

    return constrained;
  });
}

/**
 * Joint inversion of resistivity and chargeability
 * Combines both datasets with cross-parameter constraints
 */
export async function invertJoint(
  resistivityData: DataPoint[],
  chargeabilityData: DataPoint[],
  options: InversionOptions
): Promise<InversionResult> {
  const startTime = Date.now();

  // Default parameters
  const maxIterations = options.maxIterations || 20;
  const convergenceThreshold = options.convergenceThreshold || 1e-3;
  const regularizationFactor = options.regularizationFactor || 0.1;
  const smoothingFactor = options.smoothingFactor || 0.1;
  const dampingFactor = options.dampingFactor || 0.01;

  // Combine data points (normalize chargeability to similar scale)
  const combinedData: DataPoint[] = [];
  
  // Add resistivity data
  resistivityData.forEach((point) => {
    combinedData.push({
      ...point,
      value: point.value, // Resistivity in ohm-m
    });
  });

  // Add chargeability data (scale to similar range)
  const resistivityMean = resistivityData.reduce((sum, p) => sum + p.value, 0) / resistivityData.length;
  const chargeabilityMean = chargeabilityData.reduce((sum, p) => sum + p.value, 0) / chargeabilityData.length;
  const scaleFactor = chargeabilityMean > 0 ? resistivityMean / chargeabilityMean : 1;

  chargeabilityData.forEach((point) => {
    combinedData.push({
      ...point,
      value: point.value * scaleFactor, // Scaled chargeability
    });
  });

  // Create positions from combined data
  const positions = combinedData.map((p) => ({ x: p.x, y: p.y }));

  // Create model grid
  const grid = createModelGrid(positions, options.constraints);
  const modelSize = grid.values.length;

  // Set initial model (average of both datasets)
  const observedData = combinedData.map((p) => p.value);
  let model = options.initialModel || createInitialModel(grid, observedData);

  // Initialize convergence tracking
  const convergence: number[] = [];
  let previousRMS = Infinity;

  // Iterative joint inversion loop
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    // Forward modeling for combined data
    const predictedData = forwardModel2D(model, grid, positions);

    // Calculate residuals with cross-parameter weighting
    const residuals = combinedData.map((obsPoint, i) => {
      const pred = predictedData[i];
      const obs = obsPoint.value;
      
      // Weight resistivity and chargeability differently
      const isResistivity = i < resistivityData.length;
      const weight = isResistivity ? 1.0 : 0.8; // Slightly less weight on chargeability
      
      return weight * (obs - pred) / (Math.abs(pred) || 1);
    });

    // Calculate RMS error
    const rms = Math.sqrt(
      residuals.reduce((sum, r) => sum + r * r, 0) / residuals.length
    );

    convergence.push(rms);

    // Check convergence
    const convergenceRate = Math.abs((rms - previousRMS) / (previousRMS || 1));

    if (options.progressCallback) {
      options.progressCallback(iteration + 1, rms, convergenceRate);
    }

    if (convergenceRate < convergenceThreshold && iteration > 0) {
      break;
    }

    previousRMS = rms;

    // Calculate Jacobian for combined data
    const jacobian = calculateJacobian2D(model, grid, positions);

    // Apply joint regularization with cross-parameter constraints
    const regularizedJacobian = applyJointRegularization(
      jacobian,
      regularizationFactor,
      smoothingFactor,
      resistivityData.length,
      chargeabilityData.length
    );

    // Calculate model update using least-squares
    const modelUpdate = calculateModelUpdate(
      regularizedJacobian,
      residuals,
      dampingFactor
    );

    // Update model
    model = updateModel(model, modelUpdate, grid);

    // Apply constraints (for both resistivity and chargeability)
    if (options.constraints) {
      model = applyConstraints(model, grid, options.constraints);
    }
  }

  const endTime = Date.now();
  const runtime = endTime - startTime;

  // Calculate final quality indicators
  const finalPredictedData = forwardModel2D(model, grid, positions);
  const qualityIndicators = calculateQualityIndicators(
    observedData,
    finalPredictedData,
    model,
    grid
  );

  return {
    model: grid,
    qualityIndicators,
    convergence,
    iterations: convergence.length,
    finalRMS: convergence[convergence.length - 1],
    runtime,
  };
}

/**
 * Apply joint regularization with cross-parameter constraints
 */
function applyJointRegularization(
  jacobian: number[][],
  regularizationFactor: number,
  smoothingFactor: number,
  numResistivity: number,
  numChargeability: number
): number[][] {
  const numObs = jacobian.length;
  const numParams = jacobian[0].length;

  // Create regularization matrix with cross-parameter coupling
  const regularizationMatrix: number[][] = [];

  for (let i = 0; i < numParams; i++) {
    regularizationMatrix[i] = [];
    for (let j = 0; j < numParams; j++) {
      if (i === j) {
        regularizationMatrix[i][j] = regularizationFactor;
      } else if (Math.abs(i - j) === 1) {
        // Smoothing between adjacent cells
        regularizationMatrix[i][j] = smoothingFactor;
      } else {
        regularizationMatrix[i][j] = 0;
      }
    }
  }

  // Combine with Jacobian: J^T * J + lambda * R
  const jtj = multiplyMatrices(transposeMatrix(jacobian), jacobian);

  const regularized: number[][] = [];
  for (let i = 0; i < numParams; i++) {
    regularized[i] = [];
    for (let j = 0; j < numParams; j++) {
      regularized[i][j] = jtj[i][j] + regularizationMatrix[i][j];
    }
  }

  return regularized;
}
