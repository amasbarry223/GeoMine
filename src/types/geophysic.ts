// ============= DOMAIN TYPES =============

export interface GPSCoordinates {
  latitude: number;
  longitude: number;
  elevation?: number;
}

export interface TopographicPoint {
  x: number;
  y: number;
  z: number;
}

// ============= PROJECT TYPES =============

export interface Project {
  id: string;
  name: string;
  description?: string;
  siteLocation?: string;
  gpsCoordinates?: string;
  status: ProjectStatus;
  tags?: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  GEOPHYSICIST = 'GEOPHYSICIST',
  VIEWER = 'VIEWER'
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  siteLocation?: string;
  gpsCoordinates?: GPSCoordinates;
  tags?: string[];
}

export interface UpdateProjectInput extends Partial<CreateProjectInput> {
  status?: ProjectStatus;
}

// ============= CAMPAIGN TYPES =============

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  projectId: string;
  startDate?: Date;
  endDate?: Date;
  fieldTeam?: string;
  weatherConditions?: string;
  equipmentUsed?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCampaignInput {
  name: string;
  projectId: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  fieldTeam?: string;
  weatherConditions?: string;
  equipmentUsed?: string;
}

// ============= SURVEY LINE TYPES =============

export interface SurveyLine {
  id: string;
  name: string;
  campaignId: string;
  lineType: LineType;
  azimuth?: number;
  dipAngle?: number;
  electrodeSpacing?: number;
  numberOfElectrodes?: number;
  totalLength?: number;
  topography?: TopographicPoint[];
  createdAt: Date;
  updatedAt: Date;
}

export enum LineType {
  POLE_DIPOLE = 'POLE_DIPOLE',
  DIPOLE_DIPOLE = 'DIPOLE_DIPOLE',
  WENNER = 'WENNER',
  SCHLUMBERGER = 'SCHLUMBERGER',
  POLE_POLE = 'POLE_POLE'
}

export interface CreateSurveyLineInput {
  name: string;
  campaignId: string;
  lineType: LineType;
  azimuth?: number;
  dipAngle?: number;
  electrodeSpacing?: number;
  numberOfElectrodes?: number;
  totalLength?: number;
  topography?: TopographicPoint[];
}

// ============= DATA TYPES =============

export interface DataPoint {
  x: number;      // Distance along line
  y: number;      // Depth
  value: number;  // Resistivity or chargeability value
  electrodeA?: number;
  electrodeB?: number;
  electrodeM?: number;
  electrodeN?: number;
  apparentResistivity?: number;
  chargeability?: number;
  standardDeviation?: number;
}

export interface Dataset {
  id: string;
  name: string;
  surveyLineId: string;
  dataType: DataType;
  sourceFormat?: string;
  fileName?: string;
  fileSize?: number;
  rawData: DataPoint[];
  metadata?: Record<string, any>;
  isProcessed: boolean;
  processingHistory?: ProcessingOperation[];
  createdAt: Date;
  updatedAt: Date;
}

export enum DataType {
  RESISTIVITY = 'RESISTIVITY',
  CHARGEABILITY = 'CHARGEABILITY'
}

export interface ProcessingOperation {
  type: string;
  parameters: Record<string, any>;
  timestamp: Date;
  result?: string;
}

export interface CreateDatasetInput {
  name: string;
  surveyLineId: string;
  dataType: DataType;
  sourceFormat?: string;
  fileName?: string;
  rawData: DataPoint[];
  metadata?: Record<string, any>;
}

// ============= PREPROCESSED DATA TYPES =============

export interface PreprocessedData {
  id: string;
  datasetId: string;
  filteredData: DataPoint[];
  outliersRemoved?: number[];
  topographicCorrection?: Record<string, any>;
  normalizationData?: Record<string, any>;
  filterSettings?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface FilterSettings {
  filterType: 'median' | 'moving_average' | 'savitzky_golay';
  windowSize?: number;
  polynomialOrder?: number;
  sigmaThreshold?: number;
}

// ============= INVERSION MODEL TYPES =============

export interface InversionModel {
  id: string;
  datasetId: string;
  modelName: string;
  inversionType: InversionType;
  algorithm: string;
  iterations: number;
  rmsError: number;
  convergence?: number;
  regularizationFactor?: number;
  smoothingFactor?: number;
  modelParameters: InversionParameters;
  modelData: ModelGrid;
  qualityIndicators?: QualityIndicators;
  gridGeometry: GridGeometry;
  createdAt: Date;
  updatedAt: Date;
}

export enum InversionType {
  RESISTIVITY_2D = 'RESISTIVITY_2D',
  CHARGEABILITY_2D = 'CHARGEABILITY_2D',
  RESISTIVITY_3D = 'RESISTIVITY_3D',
  CHARGEABILITY_3D = 'CHARGEABILITY_3D',
  JOINT_INVERSION = 'JOINT_INVERSION'
}

export interface InversionParameters {
  maxIterations: number;
  convergenceThreshold: number;
  regularizationFactor: number;
  smoothingFactor: number;
  dampingFactor?: number;
  initialModel?: number[];
  constraints?: InversionConstraints;
}

export interface InversionConstraints {
  minResistivity?: number;
  maxResistivity?: number;
  minChargeability?: number;
  maxChargeability?: number;
  depthWeights?: number[];
  referenceModel?: number[];
}

export interface ModelGrid {
  dimensions: {
    x: number;
    y: number;
    z?: number;
  };
  values: number[];
  coordinates: {
    x: number[];
    y: number[];
    z?: number[];
  };
}

export interface GridGeometry {
  origin: { x: number; y: number; z?: number };
  spacing: { dx: number; dy: number; dz?: number };
  cellCount: { nx: number; ny: number; nz?: number };
}

export interface QualityIndicators {
  rmsError: number;
  dataMisfit: number;
  modelRoughness: number;
  sensitivityMatrix?: number[][];
  resolutionMatrix?: number[][];
  depthOfInvestigation?: number[];
}

export interface CreateInversionInput {
  datasetId: string;
  modelName: string;
  inversionType: InversionType;
  algorithm: string;
  parameters: InversionParameters;
}

// ============= ANNOTATION TYPES =============

export interface Annotation {
  id: string;
  inversionModelId: string;
  type: AnnotationType;
  title: string;
  description?: string;
  geometry: AnnotationGeometry;
  properties?: Record<string, any>;
  createdBy?: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum AnnotationType {
  ANOMALY = 'ANOMALY',
  MINERALIZED_ZONE = 'MINERALIZED_ZONE',
  FAULT = 'FAULT',
  INTERPRETATION = 'INTERPRETATION',
  DRILL_TARGET = 'DRILL_TARGET',
  NOTE = 'NOTE',
  MEASUREMENT = 'MEASUREMENT'
}

export interface AnnotationGeometry {
  type: 'point' | 'line' | 'polygon' | 'rectangle';
  coordinates: number[][] | number[][];
  properties?: Record<string, any>;
}

export interface CreateAnnotationInput {
  inversionModelId: string;
  type: AnnotationType;
  title: string;
  description?: string;
  geometry: AnnotationGeometry;
  properties?: Record<string, any>;
  color?: string;
}

// ============= VISUALIZATION TYPES =============

export interface VisualizationSettings {
  colorScale: ColorScale;
  showTopography: boolean;
  showAnnotations: boolean;
  showGrid: boolean;
  showContours: boolean;
  contourLevels?: number[];
  opacity: number;
}

export enum ColorScale {
  RAINBOW = 'rainbow',
  JET = 'jet',
  VIRIDIS = 'viridis',
  PLASMA = 'plasma',
  INFERNO = 'inferno',
  GRAYSCALE = 'grayscale',
  SEISMIC = 'seismic',
  CUSTOM = 'custom'
}

export interface ColorRange {
  min: number;
  max: number;
  scale: 'linear' | 'logarithmic';
  colors?: string[];
}

export interface ViewSettings {
  zoom: number;
  pan: { x: number; y: number };
  rotation?: number;
  pitch?: number;
}

// ============= IMPORT TYPES =============

export interface ImportResult {
  success: boolean;
  dataset?: Dataset;
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

export interface ImportSettings {
  format: 'CSV' | 'TXT' | 'RES2DINV' | 'RES3DINV' | 'AGI_SUPERSTING';
  delimiter?: string;
  hasHeader: boolean;
  skipRows?: number;
  coordinateSystem: string;
  units: string;
}

// ============= STATISTICS TYPES =============

export interface Statistics {
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  q25: number;
  q75: number;
  skewness?: number;
  kurtosis?: number;
}

export interface AnomalyDetection {
  anomalies: Anomaly[];
  detectionMethod: string;
  threshold: number;
  confidence: number;
}

export interface Anomaly {
  id: string;
  location: { x: number; y: number; z?: number };
  value: number;
  significance: number;
  type: 'high' | 'low';
  size?: number;
}

// ============= GIS TYPES =============

export interface GISLayer {
  id: string;
  name: string;
  layerType: GISType;
  projectId?: string;
  fileName?: string;
  filePath?: string;
  format?: string;
  data?: GeoJSON;
  style?: LayerStyle;
  isVisible: boolean;
  zIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

export enum GISType {
  GEOLOGY = 'GEOLOGY',
  BOREHOLES = 'BOREHOLES',
  SAMPLES = 'SAMPLES',
  TOPOGRAPHY = 'TOPOGRAPHY',
  STRUCTURES = 'STRUCTURES',
  CUSTOM = 'CUSTOM'
}

export interface GeoJSON {
  type: 'FeatureCollection' | 'Feature' | 'Point' | 'LineString' | 'Polygon';
  features?: GeoJSONFeature[];
  geometry?: any;
  properties?: Record<string, any>;
}

export interface GeoJSONFeature {
  type: 'Feature';
  geometry: any;
  properties: Record<string, any>;
}

export interface LayerStyle {
  strokeColor?: string;
  fillColor?: string;
  strokeWidth?: number;
  opacity?: number;
  pointSize?: number;
}

// ============= REPORT TYPES =============

export interface Report {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  templateType?: string;
  content: ReportContent;
  includedModels: string[];
  generatedAt: Date;
  generatedBy?: string;
  fileUrl?: string;
  status: ReportStatus;
}

export enum ReportStatus {
  DRAFT = 'DRAFT',
  GENERATING = 'GENERATING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface ReportContent {
  title: string;
  sections: ReportSection[];
  metadata: Record<string, any>;
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'text' | 'chart' | 'map' | 'table' | 'image';
  content: any;
  order: number;
}

// ============= API RESPONSE TYPES =============

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============= UI TYPES =============

export interface TabConfig {
  id: string;
  label: string;
  icon?: string;
  content: React.ReactNode;
}

export interface PanelConfig {
  id: string;
  title: string;
  size?: number | string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}
