import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/hooks/use-api';
import { addCSRFTokenToHeaders } from '@/lib/csrf-client';
import { DataType } from '@/types/geophysic';

// Query keys
export const queryKeys = {
  projects: ['projects'] as const,
  project: (id: string) => ['projects', id] as const,
  datasets: ['datasets'] as const,
  dataset: (id: string) => ['datasets', id] as const,
  inversions: ['inversions'] as const,
  inversion: (id: string) => ['inversions', id] as const,
  geochemistry: {
    samples: ['geochemistry', 'samples'] as const,
    sample: (id: string) => ['geochemistry', 'samples', id] as const,
    assays: ['geochemistry', 'assays'] as const,
    statistics: ['geochemistry', 'statistics'] as const,
  },
  drilling: {
    holes: ['drilling', 'holes'] as const,
    hole: (id: string) => ['drilling', 'holes', id] as const,
  },
  reports: ['reports'] as const,
  report: (id: string) => ['reports', id] as const,
  gis: {
    layers: ['gis', 'layers'] as const,
    layer: (id: string) => ['gis', 'layers', id] as const,
  },
};

// Projects queries
export function useProjects(options?: {
  status?: string;
  search?: string;
  userId?: string;
  page?: number;
  pageSize?: number;
}) {
  const { status, search, userId, page = 1, pageSize = 20 } = options || {};
  
  return useQuery({
    queryKey: [...queryKeys.projects, { status, search, userId, page, pageSize }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (search) params.append('search', search);
      if (userId) params.append('userId', userId);
      params.append('page', page.toString());
      params.append('pageSize', pageSize.toString());
      
      const headers = addCSRFTokenToHeaders();
      const response = await fetch(`/api/projects?${params.toString()}`, { headers });
      if (!response.ok) throw new Error('Failed to fetch projects');
      const result = await response.json();
      return result.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useProject(id: string | null) {
  return useQuery({
    queryKey: queryKeys.project(id!),
    queryFn: async () => {
      if (!id) return null;
      const headers = addCSRFTokenToHeaders();
      const response = await fetch(`/api/projects/${id}`, { headers });
      if (!response.ok) throw new Error('Failed to fetch project');
      const result = await response.json();
      return result.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  const { execute } = useApi();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      siteLocation?: string;
      gpsCoordinates?: { lat: number; lng: number };
      tags?: string[];
    }) => {
      const headers = addCSRFTokenToHeaders({ 'Content-Type': 'application/json' });
      return execute(
        () => fetch('/api/projects', {
          method: 'POST',
          headers,
          body: JSON.stringify(data),
        }),
        { successMessage: 'Projet créé avec succès' }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  const { execute } = useApi();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<{
      name: string;
      description: string;
      siteLocation: string;
      status: string;
    }> }) => {
      const headers = addCSRFTokenToHeaders({ 'Content-Type': 'application/json' });
      return execute(
        () => fetch(`/api/projects/${id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(data),
        }),
        { successMessage: 'Projet mis à jour avec succès' }
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
      queryClient.invalidateQueries({ queryKey: queryKeys.project(variables.id) });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  const { execute } = useApi();

  return useMutation({
    mutationFn: async (id: string) => {
      const headers = addCSRFTokenToHeaders();
      return execute(
        () => fetch(`/api/projects/${id}`, { method: 'DELETE', headers }),
        { successMessage: 'Projet supprimé avec succès' }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}

// Datasets queries
export function useDatasets(options?: {
  search?: string;
  dataType?: DataType | 'ALL';
  surveyLineId?: string;
  campaignId?: string;
  page?: number;
  pageSize?: number;
}) {
  const { search, dataType, surveyLineId, campaignId, page = 1, pageSize = 20 } = options || {};
  
  return useQuery({
    queryKey: [...queryKeys.datasets, { search, dataType, surveyLineId, campaignId, page, pageSize }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (dataType && dataType !== 'ALL') params.append('dataType', dataType);
      if (surveyLineId) params.append('surveyLineId', surveyLineId);
      if (campaignId) params.append('campaignId', campaignId);
      params.append('page', page.toString());
      params.append('pageSize', pageSize.toString());
      
      const headers = addCSRFTokenToHeaders();
      const response = await fetch(`/api/datasets?${params.toString()}`, { headers });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Failed to fetch datasets: ${response.status} ${response.statusText}`);
      }
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || result.message || 'Failed to fetch datasets');
      }
      return result.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnMount: true, // Toujours refetch à l'ouverture de la page pour voir les nouveaux datasets
  });
}

export function useDataset(id: string | null) {
  return useQuery({
    queryKey: queryKeys.dataset(id!),
    queryFn: async () => {
      if (!id) return null;
      const headers = addCSRFTokenToHeaders();
      const response = await fetch(`/api/datasets/${id}`, { headers });
      if (!response.ok) throw new Error('Failed to fetch dataset');
      const result = await response.json();
      return result.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useImportDataset() {
  const queryClient = useQueryClient();
  const { execute } = useApi();

  return useMutation({
    mutationFn: async (data: FormData) => {
      return execute(
        () => fetch('/api/datasets/import', {
          method: 'POST',
          body: data,
        }),
        { successMessage: 'Dataset importé avec succès' }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.datasets });
    },
  });
}

// Inversion queries
export function useRunInversion() {
  const queryClient = useQueryClient();
  const { execute } = useApi();

  return useMutation({
    mutationFn: async (data: {
      datasetId: string;
      modelName?: string;
      inversionType: string;
      parameters: Record<string, any>;
    }) => {
      return execute(
        () => fetch('/api/inversion/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }),
        { successMessage: 'Inversion lancée avec succès' }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inversions });
      queryClient.invalidateQueries({ queryKey: queryKeys.datasets });
    },
  });
}

// Export all query hooks from separate files
export * from './queries-geochemistry';
export * from './queries-drilling';
export * from './queries-reports';
export * from './queries-gis';

