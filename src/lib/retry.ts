/**
 * Retry logic with exponential backoff
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number; // in milliseconds
  maxDelay?: number; // in milliseconds
  factor?: number; // exponential factor
  onRetry?: (error: Error, attempt: number) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  factor: 2,
  onRetry: () => {},
};

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate delay with exponential backoff
 */
function calculateDelay(attempt: number, options: Required<RetryOptions>): number {
  const delay = options.initialDelay * Math.pow(options.factor, attempt);
  return Math.min(delay, options.maxDelay);
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on last attempt
      if (attempt === opts.maxRetries) {
        break;
      }

      // Call onRetry callback
      opts.onRetry(lastError, attempt + 1);

      // Calculate delay and wait
      const delay = calculateDelay(attempt, opts);
      await sleep(delay);
    }
  }

  // If we get here, all retries failed
  throw lastError || new Error('Retry failed');
}

/**
 * Retry with specific error types to retry on
 */
export async function retryOnErrors<T>(
  fn: () => Promise<T>,
  retryableErrors: (string | ErrorConstructor)[],
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if error is retryable
      const isRetryable = retryableErrors.some((retryableError) => {
        if (typeof retryableError === 'string') {
          return lastError?.message.includes(retryableError) || lastError?.name === retryableError;
        }
        return error instanceof retryableError;
      });

      // Don't retry if error is not retryable or on last attempt
      if (!isRetryable || attempt === opts.maxRetries) {
        throw lastError;
      }

      // Call onRetry callback
      opts.onRetry(lastError, attempt + 1);

      // Calculate delay and wait
      const delay = calculateDelay(attempt, opts);
      await sleep(delay);
    }
  }

  throw lastError || new Error('Retry failed');
}

/**
 * Retry HTTP requests with exponential backoff
 */
export async function retryFetch(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  return retry(
    async () => {
      const response = await fetch(url, options);

      // Retry on server errors (5xx)
      if (response.status >= 500) {
        throw new Error(`Server error: ${response.status}`);
      }

      return response;
    },
    {
      ...retryOptions,
      onRetry: (error, attempt) => {
        console.warn(`Retrying fetch to ${url} (attempt ${attempt}):`, error.message);
        retryOptions.onRetry?.(error, attempt);
      },
    }
  );
}

/**
 * Retry database operations
 */
export async function retryDatabase<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  return retryOnErrors(
    operation,
    ['PrismaClientKnownRequestError', 'Connection', 'Timeout', 'ECONNREFUSED'],
    {
      ...options,
      onRetry: (error, attempt) => {
        console.warn(`Retrying database operation (attempt ${attempt}):`, error.message);
        options.onRetry?.(error, attempt);
      },
    }
  );
}


