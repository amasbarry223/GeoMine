// Simple logger implementation (can be replaced with Winston later)
// For now, using console with structured format

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  metadata?: Record<string, any>;
}

function formatLogEntry(level: LogLevel, message: string, metadata?: Record<string, any>): string {
  const timestamp = new Date().toISOString();
  const entry: LogEntry = {
    timestamp,
    level,
    message,
    ...(metadata && { metadata }),
  };

  if (isDevelopment) {
    // Colorized console output for development
    const colors: Record<LogLevel, string> = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[32m',  // Green
      warn: '\x1b[33m',  // Yellow
      error: '\x1b[31m', // Red
    };
    const reset = '\x1b[0m';
    const levelColor = colors[level] || '';
    
    let output = `${levelColor}[${level.toUpperCase()}]${reset} ${message}`;
    if (metadata && Object.keys(metadata).length > 0) {
      output += ` ${JSON.stringify(metadata, null, 2)}`;
    }
    return output;
  }

  // JSON format for production
  return JSON.stringify(entry);
}

function log(level: LogLevel, message: string, metadata?: Record<string, any>): void {
  const formatted = formatLogEntry(level, message, metadata);
  
  switch (level) {
    case 'debug':
      if (isDevelopment) {
        console.debug(formatted);
      }
      break;
    case 'info':
      console.info(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    case 'error':
      console.error(formatted);
      break;
  }
}

// Helper functions for structured logging
export const logInfo = (message: string, metadata?: Record<string, any>) => {
  log('info', message, metadata);
};

export const logError = (message: string, error?: Error | unknown, metadata?: Record<string, any>) => {
  const errorMetadata = {
    ...metadata,
    ...(error instanceof Error
      ? {
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
        }
      : { error: String(error) }),
  };
  log('error', message, errorMetadata);
  
  // Also send to Sentry in production
  if (process.env.NODE_ENV === 'production' && error instanceof Error) {
    try {
      const { captureException } = require('./sentry');
      captureException(error, metadata);
    } catch (e) {
      // Sentry not configured, ignore
    }
  }
};

export const logWarn = (message: string, metadata?: Record<string, any>) => {
  log('warn', message, metadata);
};

export const logDebug = (message: string, metadata?: Record<string, any>) => {
  log('debug', message, metadata);
};

// Performance logging
export const logPerformance = (
  operation: string,
  duration: number,
  metadata?: Record<string, any>
) => {
  log('info', `Performance: ${operation}`, {
    duration,
    unit: 'ms',
    ...metadata,
  });
};

// API request logging
export const logApiRequest = (
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  userId?: string,
  metadata?: Record<string, any>
) => {
  log('info', `API Request: ${method} ${path}`, {
    method,
    path,
    statusCode,
    duration,
    userId,
    ...metadata,
  });
};

// Database query logging
export const logDatabaseQuery = (
  operation: string,
  model: string,
  duration: number,
  metadata?: Record<string, any>
) => {
  log('debug', `Database Query: ${operation}`, {
    operation,
    model,
    duration,
    unit: 'ms',
    ...metadata,
  });
};

