import { NextResponse } from 'next/server';

export interface ApiError {
  success: false;
  error: string;
  details?: any;
  code?: string;
}

export interface ApiSuccess<T = any> {
  success: true;
  data: T;
  message?: string;
}

export type ApiResponse<T = any> = ApiSuccess<T> | ApiError;

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  error: string,
  status: number = 500,
  details?: any,
  code?: string
): NextResponse<ApiError> {
  return NextResponse.json(
    {
      success: false,
      error,
      ...(details && { details }),
      ...(code && { code }),
    },
    { status }
  );
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
    },
    { status }
  );
}

/**
 * Handle API errors with logging
 */
export function handleApiError(error: unknown, context: string): NextResponse<ApiError> {
  console.error(`[${context}] Error:`, error);

  if (error instanceof Error) {
    // Don't expose internal error messages in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    return createErrorResponse(
      'Une erreur est survenue lors du traitement de la requête',
      500,
      isDevelopment ? error.message : undefined,
      error.name
    );
  }

  return createErrorResponse(
    'Une erreur inattendue est survenue',
    500
  );
}

/**
 * Validate required fields
 */
export function validateRequired(
  data: Record<string, any>,
  fields: string[]
): { valid: boolean; missing: string[] } {
  const missing = fields.filter((field) => !data[field] && data[field] !== 0);
  return {
    valid: missing.length === 0,
    missing,
  };
}

