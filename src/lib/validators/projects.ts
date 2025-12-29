import { z } from 'zod';
import { ProjectStatus } from '@/types/geophysic';

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Le nom du projet est requis').max(200, 'Le nom est trop long'),
  description: z.string().max(1000, 'La description est trop longue').optional().nullable(),
  siteLocation: z.string().max(500, 'La localisation est trop longue').optional().nullable(),
  gpsCoordinates: z
    .union([
      z.string().regex(/^-?\d+\.?\d*,-?\d+\.?\d*$/, 'Format GPS invalide (lat,lng)'),
      z.object({
        lat: z.number(),
        lng: z.number(),
      }),
      z.object({
        latitude: z.number(),
        longitude: z.number(),
      }),
    ])
    .optional()
    .nullable(),
  tags: z.array(z.string()).max(20, 'Trop de tags').optional().nullable(),
  status: z.nativeEnum(ProjectStatus).optional(),
  // Duplication fields
  duplicateFrom: z.string().uuid().optional(),
  includeCampaigns: z.boolean().optional(),
  includeData: z.boolean().optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export const projectQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  status: z.nativeEnum(ProjectStatus).optional(),
  search: z.string().max(200).optional(),
  userId: z.string().optional(),
});

