'use client';

import { useState, useEffect } from 'react';

/**
 * Client-side CSRF token management
 */

const CSRF_TOKEN_COOKIE = 'csrf-token';
const CSRF_TOKEN_HEADER = 'x-csrf-token';

/**
 * Get CSRF token from cookies (client-side)
 */
export function getCSRFTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === CSRF_TOKEN_COOKIE) {
      return decodeURIComponent(value);
    }
  }
  return null;
}

/**
 * Add CSRF token to fetch request headers
 */
export function addCSRFTokenToHeaders(headers: HeadersInit = {}): HeadersInit {
  const token = getCSRFTokenFromCookie();
  
  if (!token) {
    return headers;
  }

  const headersObj = headers instanceof Headers ? Object.fromEntries(headers.entries()) : headers;
  
  return {
    ...headersObj,
    [CSRF_TOKEN_HEADER]: token,
  };
}

/**
 * Fetch wrapper that automatically adds CSRF token
 */
export async function fetchWithCSRF(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = addCSRFTokenToHeaders(options.headers);
  
  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Initialize CSRF token on page load
 */
export async function initializeCSRFToken(): Promise<void> {
  try {
    const response = await fetch('/api/csrf-token', {
      method: 'GET',
      credentials: 'include',
    });
    
    if (response.ok) {
      const data = await response.json();
      // Token is set via cookie, no need to store it
      return;
    }
  } catch (error) {
    console.warn('Failed to initialize CSRF token:', error);
  }
}

/**
 * React hook to get CSRF token
 */
export function useCSRFToken() {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  useEffect(() => {
    // Get token from cookie
    const token = getCSRFTokenFromCookie();
    setCsrfToken(token);

    // Refresh token periodically
    const interval = setInterval(() => {
      const newToken = getCSRFTokenFromCookie();
      setCsrfToken(newToken);
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  return { csrfToken };
}

