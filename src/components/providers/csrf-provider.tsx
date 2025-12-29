'use client';

import { useEffect } from 'react';
import { initializeCSRFToken } from '@/lib/csrf-client';

/**
 * Provider to initialize CSRF token on client-side
 */
export function CSRFProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize CSRF token on mount
    initializeCSRFToken();
  }, []);

  return <>{children}</>;
}


