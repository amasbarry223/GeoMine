import { logPerformance, logApiRequest, logDatabaseQuery } from './logger';

// Performance monitoring utilities

interface PerformanceMetric {
  operation: string;
  startTime: number;
  metadata?: Record<string, any>;
}

const activeMetrics = new Map<string, PerformanceMetric>();

/**
 * Start performance monitoring for an operation
 */
export function startPerformanceMonitoring(
  operationId: string,
  operation: string,
  metadata?: Record<string, any>
): void {
  activeMetrics.set(operationId, {
    operation,
    startTime: Date.now(),
    metadata,
  });
}

/**
 * End performance monitoring and log the result
 */
export function endPerformanceMonitoring(
  operationId: string,
  metadata?: Record<string, any>
): number {
  const metric = activeMetrics.get(operationId);
  if (!metric) {
    return 0;
  }

  const duration = Date.now() - metric.startTime;
  logPerformance(metric.operation, duration, {
    ...metric.metadata,
    ...metadata,
  });

  activeMetrics.delete(operationId);
  return duration;
}

/**
 * Measure API request performance
 */
export function measureApiRequest(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  userId?: string,
  metadata?: Record<string, any>
): void {
  logApiRequest(method, path, statusCode, duration, userId, metadata);
}

/**
 * Measure database query performance
 */
export function measureDatabaseQuery(
  operation: string,
  model: string,
  duration: number,
  metadata?: Record<string, any>
): void {
  logDatabaseQuery(operation, model, duration, metadata);
}

/**
 * Performance decorator for async functions
 */
export function withPerformanceMonitoring<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  operationName: string
): T {
  return (async (...args: any[]) => {
    const operationId = `${operationName}-${Date.now()}-${Math.random()}`;
    startPerformanceMonitoring(operationId, operationName);
    
    try {
      const result = await fn(...args);
      endPerformanceMonitoring(operationId, { success: true });
      return result;
    } catch (error) {
      endPerformanceMonitoring(operationId, { success: false, error: String(error) });
      throw error;
    }
  }) as T;
}


