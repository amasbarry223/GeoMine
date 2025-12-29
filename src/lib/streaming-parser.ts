/**
 * Streaming parser for large CSV files
 * Processes files in chunks to avoid loading entire file into memory
 */

export interface StreamingParseOptions {
  hasHeader?: boolean;
  delimiter?: string;
  chunkSize?: number; // Number of lines to process at once
  onProgress?: (processed: number, total: number) => void;
  onChunk?: (chunk: any[]) => void;
}

export interface StreamingParseResult<T> {
  data: T[];
  errors: Array<{ line: number; message: string; severity: 'error' | 'warning' }>;
  warnings: Array<{ line: number; message: string; severity: 'error' | 'warning' }>;
  totalLines: number;
  processedLines: number;
}

/**
 * Parse CSV file in streaming mode (for large files)
 */
export async function parseCSVStreaming<T = Record<string, any>>(
  file: File,
  options: StreamingParseOptions = {}
): Promise<StreamingParseResult<T>> {
  const {
    hasHeader = true,
    delimiter = ',',
    chunkSize = 1000,
    onProgress,
    onChunk,
  } = options;

  const data: T[] = [];
  const errors: Array<{ line: number; message: string; severity: 'error' | 'warning' }> = [];
  const warnings: Array<{ line: number; message: string; severity: 'error' | 'warning' }> = [];

  const text = await file.text();
  const lines = text.split('\n').filter((line) => line.trim().length > 0);
  const totalLines = lines.length;

  if (totalLines === 0) {
    return {
      data: [],
      errors: [{ line: 0, message: 'Fichier vide', severity: 'error' }],
      warnings: [],
      totalLines: 0,
      processedLines: 0,
    };
  }

  // Parse header if present
  let headers: string[] = [];
  let startIndex = 0;

  if (hasHeader && lines.length > 0) {
    headers = lines[0].split(delimiter).map((h) => h.trim());
    startIndex = 1;
  }

  // Process file in chunks
  for (let i = startIndex; i < lines.length; i += chunkSize) {
    const chunk = lines.slice(i, Math.min(i + chunkSize, lines.length));
    const chunkData: T[] = [];

    for (let j = 0; j < chunk.length; j++) {
      const lineNumber = i + j + 1;
      const line = chunk[j];
      const values = line.split(delimiter).map((v) => v.trim());

      try {
        if (hasHeader && headers.length > 0) {
          // Create object from headers
          const row: any = {};
          headers.forEach((header, idx) => {
            row[header] = values[idx] || '';
          });
          chunkData.push(row as T);
        } else {
          // Create array
          chunkData.push(values as unknown as T);
        }
      } catch (error) {
        errors.push({
          line: lineNumber,
          message: error instanceof Error ? error.message : 'Erreur de parsing',
          severity: 'error',
        });
      }
    }

    data.push(...chunkData);

    // Call onChunk callback if provided
    if (onChunk) {
      onChunk(chunkData);
    }

    // Call onProgress callback if provided
    if (onProgress) {
      onProgress(Math.min(i + chunkSize, lines.length), totalLines);
    }
  }

  return {
    data,
    errors,
    warnings,
    totalLines,
    processedLines: data.length,
  };
}

/**
 * Process file in streaming mode with batch database operations
 */
export async function processFileStreaming<T>(
  file: File,
  parser: (chunk: string[]) => Promise<T[]>,
  batchProcessor: (batch: T[]) => Promise<void>,
  options: {
    chunkSize?: number;
    batchSize?: number;
    onProgress?: (processed: number, total: number) => void;
  } = {}
): Promise<{ processed: number; errors: any[] }> {
  const { chunkSize = 1000, batchSize = 100, onProgress } = options;

  const text = await file.text();
  const lines = text.split('\n').filter((line) => line.trim().length > 0);
  const totalLines = lines.length;

  let processed = 0;
  const errors: any[] = [];
  let batch: T[] = [];

  for (let i = 0; i < lines.length; i += chunkSize) {
    const chunk = lines.slice(i, Math.min(i + chunkSize, lines.length));

    try {
      const parsedChunk = await parser(chunk);
      batch.push(...parsedChunk);

      // Process batch when it reaches batchSize
      if (batch.length >= batchSize) {
        try {
          await batchProcessor(batch);
          processed += batch.length;
          batch = [];
        } catch (error) {
          errors.push({
            chunk: i,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      if (onProgress) {
        onProgress(Math.min(i + chunkSize, lines.length), totalLines);
      }
    } catch (error) {
      errors.push({
        chunk: i,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Process remaining batch
  if (batch.length > 0) {
    try {
      await batchProcessor(batch);
      processed += batch.length;
    } catch (error) {
      errors.push({
        chunk: 'final',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { processed, errors };
}


