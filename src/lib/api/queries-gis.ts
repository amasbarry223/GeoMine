import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/hooks/use-api';
import { queryKeys } from './queries';

// GIS Layers queries
export function useGISLayers(projectId?: string) {
  return useQuery({
    queryKey: [...queryKeys.gis.layers, { projectId }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (projectId) params.append('projectId', projectId);
      
      const response = await fetch(`/api/gis/layers?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch GIS layers');
      const result = await response.json();
      return result.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useGISLayer(id: string | null) {
  return useQuery({
    queryKey: queryKeys.gis.layer(id!),
    queryFn: async () => {
      if (!id) return null;
      const response = await fetch(`/api/gis/layers/${id}`);
      if (!response.ok) throw new Error('Failed to fetch GIS layer');
      const result = await response.json();
      return result.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateGISLayer() {
  const queryClient = useQueryClient();
  const { execute } = useApi();

  return useMutation({
    mutationFn: async (data: {
      projectId: string;
      name: string;
      description?: string;
      layerType: string;
      data: any;
      style?: any;
    }) => {
      return execute(
        () => fetch('/api/gis/layers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }),
        { successMessage: 'Couche GIS créée avec succès' }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.gis.layers });
    },
  });
}

export function useUpdateGISLayer() {
  const queryClient = useQueryClient();
  const { execute } = useApi();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<{
      name: string;
      description: string;
      data: any;
      style: any;
    }> }) => {
      return execute(
        () => fetch(`/api/gis/layers/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }),
        { successMessage: 'Couche GIS mise à jour avec succès' }
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.gis.layers });
      queryClient.invalidateQueries({ queryKey: queryKeys.gis.layer(variables.id) });
    },
  });
}

export function useDeleteGISLayer() {
  const queryClient = useQueryClient();
  const { execute } = useApi();

  return useMutation({
    mutationFn: async (id: string) => {
      return execute(
        () => fetch(`/api/gis/layers/${id}`, { method: 'DELETE' }),
        { successMessage: 'Couche GIS supprimée avec succès' }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.gis.layers });
    },
  });
}


