import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/hooks/use-api';
import { queryKeys } from './queries';

// Reports queries
export function useReports(projectId?: string) {
  return useQuery({
    queryKey: [...queryKeys.reports, { projectId }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (projectId) params.append('projectId', projectId);
      
      const response = await fetch(`/api/reports?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch reports');
      const result = await response.json();
      return result.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useReport(id: string | null) {
  return useQuery({
    queryKey: queryKeys.report(id!),
    queryFn: async () => {
      if (!id) return null;
      const response = await fetch(`/api/reports/${id}`);
      if (!response.ok) throw new Error('Failed to fetch report');
      const result = await response.json();
      return result.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useGenerateReport() {
  const queryClient = useQueryClient();
  const { execute } = useApi();

  return useMutation({
    mutationFn: async (data: {
      projectId: string;
      name: string;
      description?: string;
      templateType?: string;
      includedModels?: string[];
    }) => {
      return execute(
        () => fetch('/api/reports/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }),
        { successMessage: 'Rapport généré avec succès' }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reports });
    },
  });
}

export function useDeleteReport() {
  const queryClient = useQueryClient();
  const { execute } = useApi();

  return useMutation({
    mutationFn: async (id: string) => {
      return execute(
        () => fetch(`/api/reports/${id}`, { method: 'DELETE' }),
        { successMessage: 'Rapport supprimé avec succès' }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reports });
    },
  });
}


