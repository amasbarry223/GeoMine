'use client';

import { getCSRFTokenFromCookie } from '@/lib/csrf-client';

export interface ApiClientOptions extends RequestInit {
  skipCSRF?: boolean;
  retries?: number;
  timeout?: number;
}

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

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = '') {
    this.baseURL = baseURL;
  }

  private async fetchWithRetry(
    url: string,
    options: ApiClientOptions = {},
    retries = 3
  ): Promise<Response> {
    const { retries: maxRetries = retries, timeout = 30000, ...fetchOptions } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Retry on 5xx errors
      if (response.status >= 500 && maxRetries > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return this.fetchWithRetry(url, { ...options, retries: maxRetries - 1 }, maxRetries - 1);
      }

      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      if (maxRetries > 0 && !error.message.includes('timeout')) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return this.fetchWithRetry(url, { ...options, retries: maxRetries - 1 }, maxRetries - 1);
      }
      throw error;
    }
  }

  private prepareHeaders(options: ApiClientOptions): HeadersInit {
    const headers = new Headers(options.headers);

    // Add CSRF token for mutating requests
    if (!options.skipCSRF && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method || 'GET')) {
      const csrfToken = getCSRFTokenFromCookie();
      if (csrfToken) {
        headers.set('x-csrf-token', csrfToken);
      }
    }

    // Set Content-Type for JSON requests
    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
    }

    return headers;
  }

  async request<T = any>(
    endpoint: string,
    options: ApiClientOptions = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = this.prepareHeaders(options);

    // Stringify body if it's an object
    let body = options.body;
    if (body && typeof body === 'object' && !(body instanceof FormData)) {
      body = JSON.stringify(body);
    }

    try {
      const response = await this.fetchWithRetry(url, {
        ...options,
        headers,
        body,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Une erreur est survenue',
          details: data.details,
          code: data.code,
        };
      }

      return {
        success: true,
        data: data.data,
        message: data.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Une erreur inattendue est survenue',
      };
    }
  }

  async get<T = any>(endpoint: string, options?: ApiClientOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T = any>(
    endpoint: string,
    body?: any,
    options?: ApiClientOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  async put<T = any>(
    endpoint: string,
    body?: any,
    options?: ApiClientOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  async patch<T = any>(
    endpoint: string,
    body?: any,
    options?: ApiClientOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  async delete<T = any>(endpoint: string, options?: ApiClientOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export convenience functions
export const api = {
  get: <T = any>(endpoint: string, options?: ApiClientOptions) =>
    apiClient.get<T>(endpoint, options),
  post: <T = any>(endpoint: string, body?: any, options?: ApiClientOptions) =>
    apiClient.post<T>(endpoint, body, options),
  put: <T = any>(endpoint: string, body?: any, options?: ApiClientOptions) =>
    apiClient.put<T>(endpoint, body, options),
  patch: <T = any>(endpoint: string, body?: any, options?: ApiClientOptions) =>
    apiClient.patch<T>(endpoint, body, options),
  delete: <T = any>(endpoint: string, options?: ApiClientOptions) =>
    apiClient.delete<T>(endpoint, options),
};


