'use client';

import { useState, useCallback } from 'react';
import { useApi } from './use-api';
import { toast } from '@/hooks/use-toast';
import { api } from '@/lib/api/client';

export interface EntityActionsOptions<T> {
  entityName: string;
  entityNamePlural?: string;
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  showToast?: boolean;
}

export interface UseEntityActionsReturn<T> {
  create: (data: Partial<T>) => Promise<T | null>;
  update: (id: string, data: Partial<T>) => Promise<T | null>;
  remove: (id: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook pour actions CRUD standardisées sur les entités
 */
export function useEntityActions<T extends { id: string }>({
  entityName,
  entityNamePlural,
  onSuccess,
  onError,
  showToast = true,
}: EntityActionsOptions<T>): UseEntityActionsReturn<T> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { execute } = useApi();

  const pluralName = entityNamePlural || `${entityName}s`;

  const create = useCallback(
    async (data: Partial<T>): Promise<T | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.post<T>(`/api/${pluralName.toLowerCase()}`, data);

        if (!response.success) {
          const errorMsg = response.error || `Erreur lors de la création du ${entityName}`;
          setError(errorMsg);
          if (showToast) {
            toast({
              title: 'Erreur',
              description: errorMsg,
              variant: 'destructive',
            });
          }
          if (onError) {
            onError(errorMsg);
          }
          return null;
        }

        if (showToast) {
          toast({
            title: 'Succès',
            description: `${entityName} créé avec succès`,
          });
        }

        if (onSuccess) {
          onSuccess(response.data!);
        }

        return response.data!;
      } catch (err: any) {
        const errorMsg = err.message || `Erreur lors de la création du ${entityName}`;
        setError(errorMsg);
        if (showToast) {
          toast({
            title: 'Erreur',
            description: errorMsg,
            variant: 'destructive',
          });
        }
        if (onError) {
          onError(errorMsg);
        }
        return null;
      } finally {
        setLoading(false);
      }
    },
    [entityName, pluralName, onSuccess, onError, showToast]
  );

  const update = useCallback(
    async (id: string, data: Partial<T>): Promise<T | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.put<T>(`/api/${pluralName.toLowerCase()}/${id}`, data);

        if (!response.success) {
          const errorMsg = response.error || `Erreur lors de la mise à jour du ${entityName}`;
          setError(errorMsg);
          if (showToast) {
            toast({
              title: 'Erreur',
              description: errorMsg,
              variant: 'destructive',
            });
          }
          if (onError) {
            onError(errorMsg);
          }
          return null;
        }

        if (showToast) {
          toast({
            title: 'Succès',
            description: `${entityName} mis à jour avec succès`,
          });
        }

        if (onSuccess) {
          onSuccess(response.data!);
        }

        return response.data!;
      } catch (err: any) {
        const errorMsg = err.message || `Erreur lors de la mise à jour du ${entityName}`;
        setError(errorMsg);
        if (showToast) {
          toast({
            title: 'Erreur',
            description: errorMsg,
            variant: 'destructive',
          });
        }
        if (onError) {
          onError(errorMsg);
        }
        return null;
      } finally {
        setLoading(false);
      }
    },
    [entityName, pluralName, onSuccess, onError, showToast]
  );

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.delete(`/api/${pluralName.toLowerCase()}/${id}`);

        if (!response.success) {
          const errorMsg = response.error || `Erreur lors de la suppression du ${entityName}`;
          setError(errorMsg);
          if (showToast) {
            toast({
              title: 'Erreur',
              description: errorMsg,
              variant: 'destructive',
            });
          }
          if (onError) {
            onError(errorMsg);
          }
          return false;
        }

        if (showToast) {
          toast({
            title: 'Succès',
            description: `${entityName} supprimé avec succès`,
          });
        }

        return true;
      } catch (err: any) {
        const errorMsg = err.message || `Erreur lors de la suppression du ${entityName}`;
        setError(errorMsg);
        if (showToast) {
          toast({
            title: 'Erreur',
            description: errorMsg,
            variant: 'destructive',
          });
        }
        if (onError) {
          onError(errorMsg);
        }
        return false;
      } finally {
        setLoading(false);
      }
    },
    [entityName, pluralName, onError, showToast]
  );

  return {
    create,
    update,
    remove,
    loading,
    error,
  };
}


