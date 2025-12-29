'use client';

import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { addCSRFTokenToHeaders } from '@/lib/csrf-client';

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  showToast?: boolean;
  successMessage?: string;
  errorMessage?: string;
}

export function useApi<T = any>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(
    async (
      apiCall: () => Promise<Response> | (() => Promise<Response>),
      options: UseApiOptions = {}
    ): Promise<T | null> => {
      // Wrap apiCall to add CSRF token if it's a fetch call
      const wrappedApiCall = async () => {
        const call = typeof apiCall === 'function' ? apiCall() : apiCall;
        const response = await call;
        
        // If it's a fetch Response, we can't modify headers after creation
        // So we need to ensure CSRF is added before the fetch call
        return response;
      };
      const {
        onSuccess,
        onError,
        showToast = true,
        successMessage,
        errorMessage,
      } = options;

      setLoading(true);
      setError(null);

      try {
        const response = await apiCall();
        const result = await response.json();

        if (!response.ok || !result.success) {
          const errorMsg = result.error || errorMessage || 'Une erreur est survenue';
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

        setData(result.data);
        if (showToast && successMessage) {
          toast({
            title: 'Succès',
            description: successMessage,
          });
        }

        if (onSuccess) {
          onSuccess(result.data);
        }

        return result.data;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : errorMessage || 'Une erreur inattendue est survenue';
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
    []
  );

  const reset = useCallback(() => {
    setError(null);
    setData(null);
    setLoading(false);
  }, []);

  return {
    execute,
    loading,
    error,
    data,
    reset,
  };
}

