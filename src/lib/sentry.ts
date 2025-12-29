// Sentry integration (optional - only loads if @sentry/nextjs is installed)
// Initialize Sentry only in production
let Sentry: any = null;

try {
  Sentry = require('@sentry/nextjs');
  
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1, // 10% of transactions for performance monitoring
      profilesSampleRate: 0.1, // 10% of transactions for profiling
      beforeSend(event: any, hint: any) {
        // Filter out sensitive data
        if (event.request) {
          // Remove sensitive headers
          if (event.request.headers) {
            delete event.request.headers['authorization'];
            delete event.request.headers['cookie'];
          }
        }
        return event;
      },
      ignoreErrors: [
        // Ignore common browser errors
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
      ],
    });
  }
} catch (e) {
  // Sentry not installed, continue without it
  console.debug('Sentry not available, continuing without error tracking');
}

export const captureException = (error: Error, context?: Record<string, any>) => {
  if (process.env.NODE_ENV === 'production' && Sentry) {
    try {
      Sentry.captureException(error, {
        extra: context,
      });
    } catch (e) {
      // Sentry not configured, ignore
    }
  }
};

export const captureMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
  if (process.env.NODE_ENV === 'production' && Sentry) {
    try {
      Sentry.captureMessage(message, level);
    } catch (e) {
      // Sentry not configured, ignore
    }
  }
};

export const setUserContext = (user: { id: string; email: string; role?: string }) => {
  if (process.env.NODE_ENV === 'production' && Sentry) {
    try {
      Sentry.setUser({
        id: user.id,
        email: user.email,
        role: user.role,
      });
    } catch (e) {
      // Sentry not configured, ignore
    }
  }
};

export const addBreadcrumb = (message: string, category: string, data?: Record<string, any>) => {
  if (process.env.NODE_ENV === 'production' && Sentry) {
    try {
      Sentry.addBreadcrumb({
        message,
        category,
        data,
        level: 'info',
      });
    } catch (e) {
      // Sentry not configured, ignore
    }
  }
};

