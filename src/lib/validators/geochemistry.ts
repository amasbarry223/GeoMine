import { z } from 'zod';

export const createGeochemicalSampleSchema = z.object({
  campaignId: z.string().min(1, 'Campaign ID requis'),
  sampleID: z.string().min(1, 'Sample ID requis').max(100),
  holeID: z.string().max(100).optional(),
  surfSampleType: z.string().max(100).optional(),
  qcRef: z.string().max(100).optional(),
  dupID: z.string().max(100).optional(),
  sampleStatus: z.string().max(50).optional(),
  depth_cm: z.number().min(0).max(10000).optional(),
  x: z.number().finite().optional(),
  y: z.number().finite().optional(),
  z: z.number().finite().optional(),
  utmZone: z.string().max(10).optional(),
  surveyMethod: z.string().max(100).optional(),
  weathering: z.string().max(100).optional(),
  color: z.string().max(50).optional(),
  grainSize: z.string().max(50).optional(),
  regolith: z.string().max(100).optional(),
  litho1: z.string().max(100).optional(),
  litho2: z.string().max(100).optional(),
  veinType: z.string().max(100).optional(),
  veinAbd: z.string().max(50).optional(),
  sulphideType: z.string().max(100).optional(),
  sulphideAbd: z.string().max(50).optional(),
  areaDescription: z.string().max(1000).optional(),
  operator: z.string().max(100).optional(),
  geologist: z.string().max(100).optional(),
  date: z.coerce.date().optional(),
  comments: z.string().max(2000).optional(),
});

export const updateGeochemicalSampleSchema = createGeochemicalSampleSchema.partial();

export const createGeochemicalAssaySchema = z.object({
  sampleId: z.string().min(1, 'Sample ID requis'),
  element: z.string().min(1, 'Élément requis').max(10),
  value: z.number().finite('Valeur doit être un nombre valide'),
  unit: z.string().max(10).default('ppm'),
  detectionLimit: z.number().min(0).optional(),
  method: z.string().max(100).optional(),
  lab: z.string().max(100).optional(),
  labRef: z.string().max(100).optional(),
});

export const geochemistryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  campaignId: z.string().optional(),
  sampleID: z.string().optional(),
  holeID: z.string().optional(),
  sampleStatus: z.string().optional(),
  search: z.string().max(200).optional(),
});


