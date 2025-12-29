// ============= GEOCHEMISTRY TYPES =============

export interface GeochemicalSample {
  id: string;
  campaignId: string;
  holeID?: string;
  sampleID: string;
  surfSampleType?: string;
  qcRef?: string;
  dupID?: string;
  sampleStatus?: string;
  depth_cm?: number;
  x?: number;
  y?: number;
  z?: number;
  utmZone?: string;
  surveyMethod?: string;
  weathering?: string;
  color?: string;
  grainSize?: string;
  regolith?: string;
  litho1?: string;
  litho2?: string;
  veinType?: string;
  veinAbd?: string;
  sulphideType?: string;
  sulphideAbd?: string;
  areaDescription?: string;
  operator?: string;
  geologist?: string;
  date?: Date;
  comments?: string;
  createdAt: Date;
  updatedAt: Date;
  assays?: GeochemicalAssay[];
}

export interface GeochemicalAssay {
  id: string;
  sampleId: string;
  element: string; // Au, Ag, Cu, Pb, Zn, etc.
  value: number;
  unit: string; // ppm, ppb, %
  detectionLimit?: number;
  method?: string;
  lab?: string;
  labRef?: string;
  createdAt: Date;
  sample?: GeochemicalSample;
}

export interface CreateGeochemicalSampleInput {
  campaignId: string;
  holeID?: string;
  sampleID: string;
  surfSampleType?: string;
  qcRef?: string;
  dupID?: string;
  sampleStatus?: string;
  depth_cm?: number;
  x?: number;
  y?: number;
  z?: number;
  utmZone?: string;
  surveyMethod?: string;
  weathering?: string;
  color?: string;
  grainSize?: string;
  regolith?: string;
  litho1?: string;
  litho2?: string;
  veinType?: string;
  veinAbd?: string;
  sulphideType?: string;
  sulphideAbd?: string;
  areaDescription?: string;
  operator?: string;
  geologist?: string;
  date?: Date;
  comments?: string;
}

export interface UpdateGeochemicalSampleInput extends Partial<CreateGeochemicalSampleInput> {}

export interface CreateGeochemicalAssayInput {
  sampleId: string;
  element: string;
  value: number;
  unit?: string;
  detectionLimit?: number;
  method?: string;
  lab?: string;
  labRef?: string;
}

export interface UpdateGeochemicalAssayInput extends Partial<CreateGeochemicalAssayInput> {}

// ============= IMPORT/EXPORT TYPES =============

export interface GeochemistryImportResult {
  success: boolean;
  samples?: GeochemicalSample[];
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

export interface GeochemistryImportSettings {
  format: 'CSV' | 'EXCEL';
  delimiter?: string;
  hasHeader: boolean;
  skipRows?: number;
  sampleIDColumn?: string;
  mapping?: Record<string, string>; // Column name -> field name
}

// ============= STATISTICS TYPES =============

export interface GeochemistryStatistics {
  element: string;
  count: number;
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  q25: number;
  q75: number;
  detectionLimit?: number;
  belowDetectionLimit: number;
  skewness?: number;
  kurtosis?: number;
}

export interface ElementStatistics {
  element: string;
  statistics: GeochemistryStatistics;
  samples: GeochemicalSample[];
}

// ============= VISUALIZATION TYPES =============

export interface GeochemistryMapSettings {
  element: string;
  interpolationMethod: 'idw' | 'kriging' | 'rbf';
  gridSize: number;
  showContours: boolean;
  contourLevels?: number[];
  colorScale: string;
  opacity: number;
}

export interface InterpolatedGrid {
  x: number[];
  y: number[];
  values: number[][];
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

// ============= FILTER TYPES =============

export interface GeochemistryFilter {
  campaignId?: string;
  sampleID?: string;
  holeID?: string;
  sampleStatus?: string;
  surfSampleType?: string;
  element?: string;
  minValue?: number;
  maxValue?: number;
  minDepth?: number;
  maxDepth?: number;
  geologist?: string;
  operator?: string;
  dateFrom?: Date;
  dateTo?: Date;
  litho1?: string;
  litho2?: string;
  weathering?: string;
}

// ============= API RESPONSE TYPES =============

export interface GeochemistryApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedGeochemistryResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}


