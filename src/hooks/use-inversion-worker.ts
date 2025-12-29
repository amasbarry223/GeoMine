'use client';

import { useRef, useCallback, useEffect } from 'react';

export interface InversionWorkerOptions {
  onProgress?: (progress: number, iteration: number, rms: number) => void;
  onResult?: (result: any) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook to use inversion Web Worker
 */
export function useInversionWorker(options: InversionWorkerOptions = {}) {
  const workerRef = useRef<Worker | null>(null);
  const { onProgress, onResult, onError } = options;

  // Initialize worker
  useEffect(() => {
    if (typeof window !== 'undefined') {
      workerRef.current = new Worker(
        new URL('../workers/inversion.worker.ts', import.meta.url),
        { type: 'module' }
      );

      workerRef.current.onmessage = (event) => {
        const { type, payload } = event.data;

        switch (type) {
          case 'PROGRESS':
            if (onProgress && payload) {
              onProgress(payload.progress, payload.iteration, payload.rms);
            }
            break;

          case 'RESULT':
            if (onResult && payload) {
              onResult(payload);
            }
            break;

          case 'ERROR':
            if (onError) {
              onError(new Error(payload?.error || 'Unknown error'));
            }
            break;

          case 'CANCELLED':
            // Handle cancellation
            break;
        }
      };

      workerRef.current.onerror = (error) => {
        if (onError) {
          onError(new Error('Worker error'));
        }
      };
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [onProgress, onResult, onError]);

  const runInversion = useCallback(
    (dataPoints: any[], parameters: any) => {
      if (workerRef.current) {
        workerRef.current.postMessage({
          type: 'RUN_INVERSION',
          payload: { dataPoints, parameters },
        });
      }
    },
    []
  );

  const cancelInversion = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'CANCEL' });
    }
  }, []);

  return {
    runInversion,
    cancelInversion,
    isWorkerReady: workerRef.current !== null,
  };
}


