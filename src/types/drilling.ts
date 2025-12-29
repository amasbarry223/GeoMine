// ============= DRILLING TYPES =============

export enum DrillType {
  ACORE = 'ACORE',
  RAB = 'RAB',
  AUGER = 'AUGER',
  RC = 'RC',
  DIAMOND = 'DIAMOND'
}

export interface DrillHole {
  id: string;
  campaignId: string;
  holeID: string;
  drillType: DrillType;
  collarX: number;
  collarY: number;
  collarZ: number;
  azimuth?: number;
  dip?: number;
  totalDepth?: number;
  utmZone?: string;
  startDate?: Date;
  endDate?: Date;
  contractor?: string;
  rigType?: string;
  createdAt: Date;
  updatedAt: Date;
  surveys?: DrillSurvey[];
  geology?: GeologyLog[];
  assays?: DrillAssay[];
  structures?: StructuralMeasurement[];
}

export interface DrillSurvey {
  id: string;
  drillHoleId: string;
  depth: number;
  azimuth?: number;
  dip?: number;
  toolFace?: number;
  createdAt: Date;
  drillHole?: DrillHole;
}

export interface GeologyLog {
  id: string;
  drillHoleId: string;
  fromDepth: number;
  toDepth: number;
  lithology?: string;
  alteration?: string;
  mineralization?: string;
  weathering?: string;
  color?: string;
  texture?: string;
  structure?: string;
  notes?: string;
  geologist?: string;
  logDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  drillHole?: DrillHole;
}

export interface DrillAssay {
  id: string;
  drillHoleId: string;
  sampleID?: string;
  fromDepth: number;
  toDepth: number;
  element: string;
  value: number;
  unit: string; // ppm, ppb, %
  detectionLimit?: number;
  method?: string;
  lab?: string;
  createdAt: Date;
  drillHole?: DrillHole;
}

export interface StructuralMeasurement {
  id: string;
  drillHoleId: string;
  depth: number;
  direction: number; // Azimuth en degrés
  dip: number; // Plongement en degrés
  structureType?: string; // Faille, joint, foliation, etc.
  description?: string;
  geologist?: string;
  measurementDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  drillHole?: DrillHole;
}

// ============= CREATE/UPDATE INPUT TYPES =============

export interface CreateDrillHoleInput {
  campaignId: string;
  holeID: string;
  drillType: DrillType;
  collarX: number;
  collarY: number;
  collarZ: number;
  azimuth?: number;
  dip?: number;
  totalDepth?: number;
  utmZone?: string;
  startDate?: Date;
  endDate?: Date;
  contractor?: string;
  rigType?: string;
}

export interface UpdateDrillHoleInput extends Partial<CreateDrillHoleInput> {}

export interface CreateDrillSurveyInput {
  drillHoleId: string;
  depth: number;
  azimuth?: number;
  dip?: number;
  toolFace?: number;
}

export interface UpdateDrillSurveyInput extends Partial<CreateDrillSurveyInput> {}

export interface CreateGeologyLogInput {
  drillHoleId: string;
  fromDepth: number;
  toDepth: number;
  lithology?: string;
  alteration?: string;
  mineralization?: string;
  weathering?: string;
  color?: string;
  texture?: string;
  structure?: string;
  notes?: string;
  geologist?: string;
  logDate?: Date;
}

export interface UpdateGeologyLogInput extends Partial<CreateGeologyLogInput> {}

export interface CreateDrillAssayInput {
  drillHoleId: string;
  sampleID?: string;
  fromDepth: number;
  toDepth: number;
  element: string;
  value: number;
  unit?: string;
  detectionLimit?: number;
  method?: string;
  lab?: string;
}

export interface UpdateDrillAssayInput extends Partial<CreateDrillAssayInput> {}

export interface CreateStructuralMeasurementInput {
  drillHoleId: string;
  depth: number;
  direction: number;
  dip: number;
  structureType?: string;
  description?: string;
  geologist?: string;
  measurementDate?: Date;
}

export interface UpdateStructuralMeasurementInput extends Partial<CreateStructuralMeasurementInput> {}

// ============= IMPORT TYPES =============

export interface DrillingImportResult {
  success: boolean;
  holes?: DrillHole[];
  errors: ImportError[];
  warnings: ImportWarning[];
  recordsProcessed: number;
  recordsImported: number;
}

export interface ImportError {
  line: number;
  column?: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ImportWarning {
  line: number;
  message: string;
  suggestion?: string;
}

export enum DrillingFileType {
  COLLAR = 'COLLAR',
  SURVEY = 'SURVEY',
  GEOLOGY = 'GEOLOGY',
  ASSAY = 'ASSAY'
}

export interface DrillingImportSettings {
  fileType: DrillingFileType;
  format: 'CSV' | 'EXCEL';
  delimiter?: string;
  hasHeader: boolean;
  skipRows?: number;
  holeIDColumn?: string;
  mapping?: Record<string, string>; // Column name -> field name
}

// ============= VISUALIZATION TYPES =============

export interface DrillHoleVisualization {
  hole: DrillHole;
  path: { x: number; y: number; z: number }[]; // Calculated path from survey data
  geologyIntervals: GeologyLog[];
  assayIntervals: DrillAssay[];
  structuralMeasurements: StructuralMeasurement[];
}

export interface CrossSection {
  holes: DrillHoleVisualization[];
  plane: {
    origin: { x: number; y: number; z: number };
    normal: { x: number; y: number; z: number };
  };
}

export interface DrillHoleProfile {
  hole: DrillHole;
  depth: number[];
  assays: Record<string, number[]>; // element -> values at depths
  geology: GeologyLog[];
  structures: StructuralMeasurement[];
}

// ============= STATISTICS TYPES =============

export interface DrillHoleStatistics {
  holeId: string;
  totalDepth: number;
  geologyIntervals: number;
  assayIntervals: number;
  structuralMeasurements: number;
  elements: string[];
  depthRange: { min: number; max: number };
}

export interface ElementProfileStatistics {
  element: string;
  depth: number[];
  values: number[];
  mean: number;
  max: number;
  min: number;
  stdDev: number;
}

// ============= ANALYSIS TYPES =============

export interface DeviationStatistics {
  maxDeviation: number;
  maxDeviationDepth: number;
  totalDeviation: number;
  averageDeviation: number;
  deviationAtDepth: { depth: number; deviation: number }[];
}

export interface GeologyStatistics {
  lithologyDistribution: Record<string, { count: number; totalDepth: number; percentage: number }>;
  alterationDistribution: Record<string, { count: number; totalDepth: number; percentage: number }>;
  mineralizationDistribution: Record<string, { count: number; totalDepth: number; percentage: number }>;
  totalLoggedDepth: number;
}

export interface StructuralStatistics {
  structureTypeDistribution: Record<string, number>;
  averageDirection: number;
  averageDip: number;
  directionDistribution: { direction: number; count: number }[];
  dipDistribution: { dip: number; count: number }[];
  roseDiagram: { direction: number; count: number }[];
}

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

export interface AssayAnomaly {
  depth: number;
  element: string;
  value: number;
  zScore: number;
  isAnomaly: boolean;
}

export interface DrillHoleAnalysis {
  statistics: DrillHoleStatistics;
  elementStatistics: Record<string, ElementProfileStatistics>;
  deviationStatistics: DeviationStatistics;
  geologyStatistics: GeologyStatistics;
  structuralStatistics: StructuralStatistics;
  path: { x: number; y: number; z: number; depth: number }[];
}

// ============= FILTER TYPES =============

export interface DrillHoleFilter {
  campaignId?: string;
  holeID?: string;
  drillType?: DrillType;
  minDepth?: number;
  maxDepth?: number;
  contractor?: string;
  startDateFrom?: Date;
  startDateTo?: Date;
  element?: string;
  minValue?: number;
  maxValue?: number;
}

// ============= API RESPONSE TYPES =============

export interface DrillingApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedDrillingResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}


