import { z } from 'zod';
import { DrillType } from '@/types/drilling';

export const createDrillHoleSchema = z.object({
  campaignId: z.string().min(1, 'Campaign ID requis'),
  holeID: z.string().min(1, 'Hole ID requis').max(100),
  drillType: z.nativeEnum(DrillType),
  collarX: z.number().finite('Coordonnée X invalide'),
  collarY: z.number().finite('Coordonnée Y invalide'),
  collarZ: z.number().finite('Coordonnée Z invalide'),
  azimuth: z.number().min(0).max(360).optional(),
  dip: z.number().min(-90).max(90).optional(),
  totalDepth: z.number().min(0).max(10000).optional(),
  utmZone: z.string().max(10).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  contractor: z.string().max(100).optional(),
  rigType: z.string().max(100).optional(),
});

export const updateDrillHoleSchema = createDrillHoleSchema.partial();

export const createDrillSurveySchema = z.object({
  drillHoleId: z.string().min(1, 'Drill Hole ID requis'),
  depth: z.number().min(0, 'Profondeur doit être positive'),
  azimuth: z.number().min(0).max(360).optional(),
  dip: z.number().min(-90).max(90).optional(),
  toolFace: z.number().min(0).max(360).optional(),
});

export const createGeologyLogSchema = z.object({
  drillHoleId: z.string().min(1, 'Drill Hole ID requis'),
  fromDepth: z.number().min(0),
  toDepth: z.number().min(0),
  lithology: z.string().max(200).optional(),
  alteration: z.string().max(200).optional(),
  mineralization: z.string().max(200).optional(),
  weathering: z.string().max(100).optional(),
  color: z.string().max(50).optional(),
  texture: z.string().max(100).optional(),
  structure: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
  geologist: z.string().max(100).optional(),
  logDate: z.coerce.date().optional(),
}).refine((data) => data.toDepth > data.fromDepth, {
  message: 'toDepth doit être supérieur à fromDepth',
  path: ['toDepth'],
});

export const createDrillAssaySchema = z.object({
  drillHoleId: z.string().min(1, 'Drill Hole ID requis'),
  sampleID: z.string().max(100).optional(),
  fromDepth: z.number().min(0),
  toDepth: z.number().min(0),
  element: z.string().min(1, 'Élément requis').max(10),
  value: z.number().finite('Valeur doit être un nombre valide'),
  unit: z.string().max(10).default('ppm'),
  detectionLimit: z.number().min(0).optional(),
  method: z.string().max(100).optional(),
  lab: z.string().max(100).optional(),
}).refine((data) => data.toDepth > data.fromDepth, {
  message: 'toDepth doit être supérieur à fromDepth',
  path: ['toDepth'],
});

export const createStructuralMeasurementSchema = z.object({
  drillHoleId: z.string().min(1, 'Drill Hole ID requis'),
  depth: z.number().min(0, 'Profondeur doit être positive'),
  direction: z.number().min(0).max(360, 'Direction doit être entre 0 et 360'),
  dip: z.number().min(-90).max(90, 'Dip doit être entre -90 et 90'),
  structureType: z.string().max(100).optional(),
  description: z.string().max(1000).optional(),
  geologist: z.string().max(100).optional(),
  measurementDate: z.coerce.date().optional(),
});

export const drillingQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  campaignId: z.string().optional(),
  holeID: z.string().optional(),
  drillType: z.nativeEnum(DrillType).optional(),
  search: z.string().max(200).optional(),
});


