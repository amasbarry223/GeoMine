/**
 * Web Worker for geophysical inversion calculations
 * Runs heavy computations in a separate thread to avoid blocking the UI
 */

import { invert2DLeastSquares } from '../lib/geophysic/inversion';
import { DataPoint } from '../types/geophysic';

export interface InversionWorkerMessage {
  type: 'RUN_INVERSION' | 'CANCEL' | 'PROGRESS';
  payload?: any;
}

export interface InversionWorkerResponse {
  type: 'RESULT' | 'PROGRESS' | 'ERROR' | 'CANCELLED';
  payload?: any;
}

// Worker context
let isCancelled = false;

self.onmessage = async (event: MessageEvent<InversionWorkerMessage>) => {
  const { type, payload } = event.data;

  try {
    switch (type) {
      case 'RUN_INVERSION': {
        isCancelled = false;
        const { dataPoints, parameters } = payload;

        // Run inversion with progress callbacks
        const result = await invert2DLeastSquares(
          dataPoints as DataPoint[],
          {
            ...parameters,
            onProgress: (progress: number, iteration: number, rms: number) => {
              if (!isCancelled) {
                self.postMessage({
                  type: 'PROGRESS',
                  payload: { progress, iteration, rms },
                } as InversionWorkerResponse);
              }
            },
          }
        );

        if (!isCancelled) {
          self.postMessage({
            type: 'RESULT',
            payload: result,
          } as InversionWorkerResponse);
        }
        break;
      }

      case 'CANCEL': {
        isCancelled = true;
        self.postMessage({
          type: 'CANCELLED',
        } as InversionWorkerResponse);
        break;
      }

      default:
        self.postMessage({
          type: 'ERROR',
          payload: { error: 'Unknown message type' },
        } as InversionWorkerResponse);
    }
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      payload: {
        error: error instanceof Error ? error.message : String(error),
      },
    } as InversionWorkerResponse);
  }
};


