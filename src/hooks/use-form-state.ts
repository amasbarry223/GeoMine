'use client';

import { useState, useCallback, useEffect } from 'react';
import { useForm as useReactHookForm, UseFormReturn, FieldValues, Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ZodSchema } from 'zod';

export interface UseFormStateOptions<T extends FieldValues> {
  schema?: ZodSchema<T>;
  defaultValues?: Partial<T>;
  onSubmit: (data: T) => Promise<void> | void;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  resetOnSuccess?: boolean;
}

export interface UseFormStateReturn<T extends FieldValues> {
  form: UseFormReturn<T>;
  handleSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  reset: () => void;
  isSubmitting: boolean;
  error: string | null;
}

/**
 * Hook unifié pour la gestion d'état des formulaires
 * Combine react-hook-form avec gestion d'état personnalisée
 */
export function useFormState<T extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  onSuccess,
  onError,
  resetOnSuccess = true,
}: UseFormStateOptions<T>): UseFormStateReturn<T> {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useReactHookForm<T>({
    resolver: schema ? zodResolver(schema) : undefined,
    defaultValues: defaultValues as T,
  });

  const handleSubmit = useCallback(
    async (e?: React.BaseSyntheticEvent) => {
      e?.preventDefault();
      setError(null);
      setIsSubmitting(true);

      try {
        const isValid = await form.trigger();
        if (!isValid) {
          setIsSubmitting(false);
          return;
        }

        const data = form.getValues();
        await onSubmit(data);

        if (resetOnSuccess) {
          form.reset();
        }

        if (onSuccess) {
          onSuccess();
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
        setError(errorMessage);
        if (onError) {
          onError(err instanceof Error ? err : new Error(errorMessage));
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [form, onSubmit, onSuccess, onError, resetOnSuccess]
  );

  const reset = useCallback(() => {
    form.reset(defaultValues as T);
    setError(null);
  }, [form, defaultValues]);

  // Reset form when defaultValues change
  useEffect(() => {
    if (defaultValues) {
      form.reset(defaultValues as T);
    }
  }, [form, defaultValues]);

  return {
    form,
    handleSubmit,
    reset,
    isSubmitting,
    error,
  };
}


