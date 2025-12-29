/**
 * Centralized validators using Zod
 * Export all validators from a single entry point
 */

import { z } from 'zod';

export * from './projects';
export * from './geochemistry';
export * from './drilling';

/**
 * Helper function to validate request body
 */
export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string; details?: any }> {
  try {
    const body = await request.json();
    const validated = schema.parse(body);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation error',
        details: error.errors,
      };
    }
    return {
      success: false,
      error: 'Invalid request body',
    };
  }
}

/**
 * Helper function to validate query parameters
 */
export function validateQueryParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: string; details?: any } {
  try {
    const params = Object.fromEntries(searchParams.entries());
    const validated = schema.parse(params);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid query parameters',
        details: error.errors,
      };
    }
    return {
      success: false,
      error:       'Invalid query parameters',
    };
  }
}

