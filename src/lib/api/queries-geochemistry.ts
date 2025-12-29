import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/hooks/use-api';
import { queryKeys } from './queries';
import { CreateGeochemicalSampleInput, CreateGeochemicalAssayInput } from '@/types/geochemistry';

// Geochemistry Samples queries
export function useGeochemicalSamples(options?: {
  campaignId?: string;
  sampleID?: string;
  holeID?: string;
  sampleStatus?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const { campaignId, sampleID, holeID, sampleStatus, search, page = 1, pageSize = 10 } = options || {};
  
  return useQuery({
    queryKey: [...queryKeys.geochemistry.samples, { campaignId, sampleID, holeID, sampleStatus, search, page, pageSize }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (campaignId) params.append('campaignId', campaignId);
      if (sampleID) params.append('sampleID', sampleID);
      if (holeID) params.append('holeID', holeID);
      if (sampleStatus) params.append('sampleStatus', sampleStatus);
      if (search) params.append('search', search);
      params.append('page', page.toString());
      params.append('pageSize', pageSize.toString());
      
      const response = await fetch(`/api/geochemistry/samples?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch geochemical samples');
      const result = await response.json();
      return result.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useGeochemicalSample(id: string | null) {
  return useQuery({
    queryKey: queryKeys.geochemistry.sample(id!),
    queryFn: async () => {
      if (!id) return null;
      const response = await fetch(`/api/geochemistry/samples/${id}`);
      if (!response.ok) throw new Error('Failed to fetch geochemical sample');
      const result = await response.json();
      return result.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateGeochemicalSample() {
  const queryClient = useQueryClient();
  const { execute } = useApi();

  return useMutation({
    mutationFn: async (data: CreateGeochemicalSampleInput) => {
      return execute(
        () => fetch('/api/geochemistry/samples', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }),
        { successMessage: 'Échantillon créé avec succès' }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.geochemistry.samples });
    },
  });
}

export function useUpdateGeochemicalSample() {
  const queryClient = useQueryClient();
  const { execute } = useApi();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateGeochemicalSampleInput> }) => {
      return execute(
        () => fetch(`/api/geochemistry/samples/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }),
        { successMessage: 'Échantillon mis à jour avec succès' }
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.geochemistry.samples });
      queryClient.invalidateQueries({ queryKey: queryKeys.geochemistry.sample(variables.id) });
    },
  });
}

export function useDeleteGeochemicalSample() {
  const queryClient = useQueryClient();
  const { execute } = useApi();

  return useMutation({
    mutationFn: async (id: string) => {
      return execute(
        () => fetch(`/api/geochemistry/samples/${id}`, { method: 'DELETE' }),
        { successMessage: 'Échantillon supprimé avec succès' }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.geochemistry.samples });
    },
  });
}

// Geochemistry Assays queries
export function useGeochemicalAssays(sampleId?: string) {
  return useQuery({
    queryKey: [...queryKeys.geochemistry.assays, { sampleId }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (sampleId) params.append('sampleId', sampleId);
      
      const response = await fetch(`/api/geochemistry/assays?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch geochemical assays');
      const result = await response.json();
      return result.data;
    },
    enabled: !!sampleId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateGeochemicalAssay() {
  const queryClient = useQueryClient();
  const { execute } = useApi();

  return useMutation({
    mutationFn: async (data: CreateGeochemicalAssayInput) => {
      return execute(
        () => fetch('/api/geochemistry/assays', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }),
        { successMessage: 'Analyse créée avec succès' }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.geochemistry.assays });
    },
  });
}

// Geochemistry Statistics
export function useGeochemicalStatistics(campaignId?: string, element?: string) {
  return useQuery({
    queryKey: [...queryKeys.geochemistry.statistics, { campaignId, element }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (campaignId) params.append('campaignId', campaignId);
      if (element) params.append('element', element);
      
      const response = await fetch(`/api/geochemistry/statistics?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch geochemical statistics');
      const result = await response.json();
      return result.data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes for statistics
  });
}


