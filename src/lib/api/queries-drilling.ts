import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/hooks/use-api';
import { queryKeys } from './queries';
import { CreateDrillHoleInput, CreateDrillSurveyInput, CreateGeologyLogInput, CreateDrillAssayInput, CreateStructuralMeasurementInput } from '@/types/drilling';

// Drilling Holes queries
export function useDrillHoles(options?: {
  campaignId?: string;
  holeID?: string;
  drillType?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const { campaignId, holeID, drillType, search, page = 1, pageSize = 10 } = options || {};
  
  return useQuery({
    queryKey: [...queryKeys.drilling.holes, { campaignId, holeID, drillType, search, page, pageSize }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (campaignId) params.append('campaignId', campaignId);
      if (holeID) params.append('holeID', holeID);
      if (drillType) params.append('drillType', drillType);
      if (search) params.append('search', search);
      params.append('page', page.toString());
      params.append('pageSize', pageSize.toString());
      
      const response = await fetch(`/api/drilling/holes?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch drill holes');
      const result = await response.json();
      return result.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useDrillHole(id: string | null) {
  return useQuery({
    queryKey: queryKeys.drilling.hole(id!),
    queryFn: async () => {
      if (!id) return null;
      const response = await fetch(`/api/drilling/holes/${id}`);
      if (!response.ok) throw new Error('Failed to fetch drill hole');
      const result = await response.json();
      return result.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateDrillHole() {
  const queryClient = useQueryClient();
  const { execute } = useApi();

  return useMutation({
    mutationFn: async (data: CreateDrillHoleInput) => {
      return execute(
        () => fetch('/api/drilling/holes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }),
        { successMessage: 'Trou de forage créé avec succès' }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.drilling.holes });
    },
  });
}

export function useUpdateDrillHole() {
  const queryClient = useQueryClient();
  const { execute } = useApi();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateDrillHoleInput> }) => {
      return execute(
        () => fetch(`/api/drilling/holes/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }),
        { successMessage: 'Trou de forage mis à jour avec succès' }
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.drilling.holes });
      queryClient.invalidateQueries({ queryKey: queryKeys.drilling.hole(variables.id) });
    },
  });
}

export function useDeleteDrillHole() {
  const queryClient = useQueryClient();
  const { execute } = useApi();

  return useMutation({
    mutationFn: async (id: string) => {
      return execute(
        () => fetch(`/api/drilling/holes/${id}`, { method: 'DELETE' }),
        { successMessage: 'Trou de forage supprimé avec succès' }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.drilling.holes });
    },
  });
}

// Drill Survey queries
export function useDrillSurveys(drillHoleId: string | null) {
  return useQuery({
    queryKey: [...queryKeys.drilling.hole(drillHoleId!), 'surveys'],
    queryFn: async () => {
      if (!drillHoleId) return null;
      const response = await fetch(`/api/drilling/holes/${drillHoleId}/survey`);
      if (!response.ok) throw new Error('Failed to fetch drill surveys');
      const result = await response.json();
      return result.data;
    },
    enabled: !!drillHoleId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateDrillSurvey() {
  const queryClient = useQueryClient();
  const { execute } = useApi();

  return useMutation({
    mutationFn: async ({ drillHoleId, data }: { drillHoleId: string; data: CreateDrillSurveyInput }) => {
      return execute(
        () => fetch(`/api/drilling/holes/${drillHoleId}/survey`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }),
        { successMessage: 'Survey créé avec succès' }
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.drilling.hole(variables.drillHoleId) });
    },
  });
}

// Geology Log queries
export function useGeologyLogs(drillHoleId: string | null) {
  return useQuery({
    queryKey: [...queryKeys.drilling.hole(drillHoleId!), 'geology'],
    queryFn: async () => {
      if (!drillHoleId) return null;
      const response = await fetch(`/api/drilling/holes/${drillHoleId}/geology`);
      if (!response.ok) throw new Error('Failed to fetch geology logs');
      const result = await response.json();
      return result.data;
    },
    enabled: !!drillHoleId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateGeologyLog() {
  const queryClient = useQueryClient();
  const { execute } = useApi();

  return useMutation({
    mutationFn: async ({ drillHoleId, data }: { drillHoleId: string; data: CreateGeologyLogInput }) => {
      return execute(
        () => fetch(`/api/drilling/holes/${drillHoleId}/geology`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }),
        { successMessage: 'Log géologique créé avec succès' }
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.drilling.hole(variables.drillHoleId) });
    },
  });
}

// Drill Assay queries
export function useDrillAssays(drillHoleId: string | null) {
  return useQuery({
    queryKey: [...queryKeys.drilling.hole(drillHoleId!), 'assays'],
    queryFn: async () => {
      if (!drillHoleId) return null;
      const response = await fetch(`/api/drilling/holes/${drillHoleId}/assays`);
      if (!response.ok) throw new Error('Failed to fetch drill assays');
      const result = await response.json();
      return result.data;
    },
    enabled: !!drillHoleId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateDrillAssay() {
  const queryClient = useQueryClient();
  const { execute } = useApi();

  return useMutation({
    mutationFn: async ({ drillHoleId, data }: { drillHoleId: string; data: CreateDrillAssayInput }) => {
      return execute(
        () => fetch(`/api/drilling/holes/${drillHoleId}/assays`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }),
        { successMessage: 'Analyse créée avec succès' }
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.drilling.hole(variables.drillHoleId) });
    },
  });
}

// Structural Measurements queries
export function useStructuralMeasurements(drillHoleId: string | null) {
  return useQuery({
    queryKey: [...queryKeys.drilling.hole(drillHoleId!), 'structures'],
    queryFn: async () => {
      if (!drillHoleId) return null;
      const response = await fetch(`/api/drilling/holes/${drillHoleId}/structures`);
      if (!response.ok) throw new Error('Failed to fetch structural measurements');
      const result = await response.json();
      return result.data;
    },
    enabled: !!drillHoleId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateStructuralMeasurement() {
  const queryClient = useQueryClient();
  const { execute } = useApi();

  return useMutation({
    mutationFn: async ({ drillHoleId, data }: { drillHoleId: string; data: CreateStructuralMeasurementInput }) => {
      return execute(
        () => fetch(`/api/drilling/holes/${drillHoleId}/structures`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }),
        { successMessage: 'Mesure structurale créée avec succès' }
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.drilling.hole(variables.drillHoleId) });
    },
  });
}


