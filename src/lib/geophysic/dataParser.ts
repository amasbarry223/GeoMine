import { DataPoint, ImportError, ImportWarning, DataType, ImportResult } from '@/types/geophysic';

// ============= CSV PARSER =============

export interface ParseCSVOptions {
  delimiter?: string | ',' | ';' | '\t' | ' ';
  hasHeader?: boolean;
  skipRows?: number;
  decimalSeparator?: '.' | ',';
  encoding?: BufferEncoding;
}

/**
 * Parse a CSV file into an array of DataPoint objects
 */
export async function parseCSVFile(
  file: File,
  options: ParseCSVOptions = {}
): Promise<{ data: DataPoint[]; errors: ImportError[]; warnings: ImportWarning[] }> {
  const {
    delimiter = ',',
    hasHeader = true,
    skipRows = 0,
    decimalSeparator = '.',
    encoding = 'utf-8',
  } = options;

  const errors: ImportError[] = [];
  const warnings: ImportWarning[] = [];
  const dataPoints: DataPoint[] = [];

  try {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((line) => line.trim());

    // Skip specified rows
    const startIndex = skipRows + (hasHeader ? 1 : 0);
    const dataLines = lines.slice(startIndex);

    // Detect delimiter if not specified
    const detectedDelimiter = detectDelimiter(lines[0] || '', delimiter);

    // Parse each line
    dataLines.forEach((line, lineIndex) => {
      const actualLineNumber = lineIndex + startIndex + 1;

      try {
        const values = parseCSVLine(line, detectedDelimiter);

        // Skip empty lines
        if (values.length === 0 || values.every((v) => !v.trim())) {
          return;
        }

        // Validate minimum columns (at least x, y, value)
        if (values.length < 3) {
          errors.push({
            line: actualLineNumber,
            message: `Nombre de colonnes insuffisant (${values.length} au lieu de 3 minimum)`,
            severity: 'error',
          });
          return;
        }

        // Parse numeric values
        const x = parseFloat(values[0].replace(decimalSeparator === ',' ? '.' : ',', decimalSeparator));
        const y = parseFloat(values[1].replace(decimalSeparator === ',' ? '.' : ',', decimalSeparator));
        const value = parseFloat(values[2].replace(decimalSeparator === ',' ? '.' : ',', decimalSeparator));

        // Validate numeric values
        if (isNaN(x) || isNaN(y) || isNaN(value)) {
          errors.push({
            line: actualLineNumber,
            message: 'Valeurs numériques invalides',
            severity: 'error',
          });
          return;
        }

        // Parse optional fields
        const electrodeA = values[3] ? parseInt(values[3]) : undefined;
        const electrodeB = values[4] ? parseInt(values[4]) : undefined;
        const electrodeM = values[5] ? parseInt(values[5]) : undefined;
        const electrodeN = values[6] ? parseInt(values[6]) : undefined;
        const apparentResistivity = values[7] ? parseFloat(values[7]) : undefined;
        const chargeability = values[8] ? parseFloat(values[8]) : undefined;
        const standardDeviation = values[9] ? parseFloat(values[9]) : undefined;

        const dataPoint: DataPoint = {
          x,
          y,
          value,
          electrodeA: isNaN(electrodeA || NaN) ? undefined : electrodeA,
          electrodeB: isNaN(electrodeB || NaN) ? undefined : electrodeB,
          electrodeM: isNaN(electrodeM || NaN) ? undefined : electrodeM,
          electrodeN: isNaN(electrodeN || NaN) ? undefined : electrodeN,
          apparentResistivity: isNaN(apparentResistivity || NaN) ? undefined : apparentResistivity,
          chargeability: isNaN(chargeability || NaN) ? undefined : chargeability,
          standardDeviation: isNaN(standardDeviation || NaN) ? undefined : standardDeviation,
        };

        dataPoints.push(dataPoint);

        // Check for obvious outliers
        if (Math.abs(value) > 1e6) {
          warnings.push({
            line: actualLineNumber,
            message: `Valeur anormalement élevée détectée: ${value}`,
            suggestion: 'Vérifiez les unités et les valeurs aberrantes',
          });
        }
      } catch (parseError) {
        errors.push({
          line: actualLineNumber,
          message: parseError instanceof Error ? parseError.message : 'Erreur de parsing',
          severity: 'error',
        });
      }
    });

    return { data: dataPoints, errors, warnings };
  } catch (error) {
    throw new Error(`Erreur lors de la lecture du fichier: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

/**
 * Detect the delimiter used in a CSV line
 */
function detectDelimiter(line: string, defaultDelimiter: string): string {
  if (defaultDelimiter !== ',' && defaultDelimiter !== ';' && defaultDelimiter !== '\t') {
    return defaultDelimiter;
  }

  const delimiters = [',', ';', '\t'];
  const counts = delimiters.map((del) => (line.split(del).length - 1));

  const maxCount = Math.max(...counts);
  const maxIndex = counts.indexOf(maxCount);

  return delimiters[maxIndex];
}

/**
 * Parse a single CSV line respecting quoted values
 */
function parseCSVLine(line: string, delimiter: string): string[] {
  const values: string[] = [];
  let currentValue = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      values.push(currentValue.trim());
      currentValue = '';
    } else {
      currentValue += char;
    }
  }

  values.push(currentValue.trim());

  return values;
}

// ============= RES2DINV PARSER =============

/**
 * Parse RES2DINV .dat file format
 */
export async function parseRES2DINVFile(
  file: File
): Promise<{ data: DataPoint[]; metadata: Record<string, any>; errors: ImportError[]; warnings: ImportWarning[] }> {
  const errors: ImportError[] = [];
  const warnings: ImportWarning[] = [];
  const dataPoints: DataPoint[] = [];
  const metadata: Record<string, any> = {};

  try {
    const text = await file.text();
    const lines = text.split(/\r?\n/);

    let inDataSection = false;
    let lineIndex = 0;

    for (let line of lines) {
      lineIndex++;
      line = line.trim();

      // Skip comments
      if (line.startsWith('!') || line.startsWith('#')) {
        continue;
      }

      // Detect data section
      if (line.toLowerCase().includes('data') || line.toLowerCase().includes('data block')) {
        inDataSection = true;
        continue;
      }

      // Parse metadata
      if (!inDataSection) {
        const parts = line.split(/[=:]/);
        if (parts.length === 2) {
          const key = parts[0].trim();
          const value = parts[1].trim();
          metadata[key] = value;
        }
        continue;
      }

      // Parse data points
      try {
        const values = line.split(/\s+/).filter((v) => v);

        if (values.length < 4) {
          continue;
        }

        const x = parseFloat(values[0]);
        const y = parseFloat(values[1]);
        const value = parseFloat(values[2]);

        if (isNaN(x) || isNaN(y) || isNaN(value)) {
          continue;
        }

        const electrodeA = parseInt(values[3]) || undefined;
        const electrodeB = parseInt(values[4]) || undefined;
        const electrodeM = parseInt(values[5]) || undefined;
        const electrodeN = parseInt(values[6]) || undefined;

        dataPoints.push({
          x,
          y,
          value,
          electrodeA,
          electrodeB,
          electrodeM,
          electrodeN,
        });
      } catch (parseError) {
        errors.push({
          line: lineIndex,
          message: 'Erreur de parsing de la ligne de données',
          severity: 'error',
        });
      }
    }

    return { data: dataPoints, metadata, errors, warnings };
  } catch (error) {
    throw new Error(`Erreur lors de la lecture du fichier RES2DINV: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

// ============= AGI SUPERSTING PARSER =============

/**
 * Parse AGI SuperSting file format
 */
export async function parseAGISuperStingFile(
  file: File
): Promise<{ data: DataPoint[]; metadata: Record<string, any>; errors: ImportError[]; warnings: ImportWarning[] }> {
  const errors: ImportError[] = [];
  const warnings: ImportWarning[] = [];
  const dataPoints: DataPoint[] = [];
  const metadata: Record<string, any> = {};

  try {
    const text = await file.text();
    const lines = text.split(/\r?\n/);

    let inDataSection = false;
    let lineIndex = 0;

    for (let line of lines) {
      lineIndex++;
      line = line.trim();

      // AGI format typically starts with metadata sections
      if (line.toLowerCase().startsWith('data') || line.toLowerCase().includes('measurements')) {
        inDataSection = true;
        continue;
      }

      // Parse metadata
      if (!inDataSection) {
        const match = line.match(/^([^=]+)=\s*(.+)$/);
        if (match) {
          metadata[match[1].trim()] = match[2].trim();
        }
        continue;
      }

      // Parse data points (comma or space separated)
      const values = line.split(/[,\s]+/).filter((v) => v);

      if (values.length < 4) {
        continue;
      }

      try {
        const x = parseFloat(values[0]);
        const z = parseFloat(values[1]); // AGI uses z for depth
        const resistivity = parseFloat(values[2]);
        const chargeability = values[3] ? parseFloat(values[3]) : undefined;

        if (isNaN(x) || isNaN(z) || isNaN(resistivity)) {
          continue;
        }

        dataPoints.push({
          x,
          y: z, // Convert to y for consistency
          value: resistivity,
          chargeability,
        });
      } catch (parseError) {
        errors.push({
          line: lineIndex,
          message: 'Erreur de parsing de la ligne de données',
          severity: 'error',
        });
      }
    }

    return { data: dataPoints, metadata, errors, warnings };
  } catch (error) {
    throw new Error(`Erreur lors de la lecture du fichier AGI SuperSting: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

// ============= MAIN IMPORT FUNCTION =============

/**
 * Detect file format and parse accordingly
 */
export async function parseGeophysicalDataFile(
  file: File,
  options?: {
    format?: 'CSV' | 'TXT' | 'RES2DINV' | 'RES3DINV' | 'AGI_SUPERSTING';
    csvOptions?: ParseCSVOptions;
  }
): Promise<ImportResult> {
  const { format, csvOptions } = options || {};

  try {
    let result: {
      data: DataPoint[];
      metadata?: Record<string, any>;
      errors: ImportError[];
      warnings: ImportWarning[];
    };

    // Auto-detect format if not specified
    const detectedFormat = format || detectFileFormat(file.name);

    switch (detectedFormat) {
      case 'RES2DINV':
      case 'RES3DINV':
        result = await parseRES2DINVFile(file);
        break;

      case 'AGI_SUPERSTING':
        result = await parseAGISuperStingFile(file);
        break;

      case 'CSV':
      case 'TXT':
      default:
        result = await parseCSVFile(file, csvOptions);
        break;
    }

    const success = result.errors.length === 0 || result.data.length > 0;

    return {
      success,
      errors: result.errors,
      warnings: result.warnings,
      recordsProcessed: result.data.length + result.errors.length,
      recordsImported: result.data.length,
    };
  } catch (error) {
    return {
      success: false,
      errors: [
        {
          line: 0,
          message: error instanceof Error ? error.message : 'Erreur inconnue',
          severity: 'error',
        },
      ],
      warnings: [],
      recordsProcessed: 0,
      recordsImported: 0,
    };
  }
}

/**
 * Detect file format from filename
 */
export function detectFileFormat(filename: string): 'CSV' | 'TXT' | 'RES2DINV' | 'RES3DINV' | 'AGI_SUPERSTING' {
  const ext = filename.toLowerCase();

  if (ext.endsWith('.dat')) {
    return 'RES2DINV';
  }

  if (ext.includes('sting') || ext.endsWith('.stg')) {
    return 'AGI_SUPERSTING';
  }

  if (ext.endsWith('.csv')) {
    return 'CSV';
  }

  return 'TXT';
}

// ============= DATA VALIDATION =============

/**
 * Validate imported data points
 */
export function validateDataPoints(
  dataPoints: DataPoint[]
): { valid: DataPoint[]; invalid: number[]; warnings: ImportWarning[] } {
  const valid: DataPoint[] = [];
  const invalid: number[] = [];
  const warnings: ImportWarning[] = [];

  dataPoints.forEach((point, index) => {
    // Check for NaN values
    if (isNaN(point.x) || isNaN(point.y) || isNaN(point.value)) {
      invalid.push(index);
      return;
    }

    // Check for zero or negative values (if not expected)
    if (point.value <= 0) {
      warnings.push({
        line: index + 1,
        message: `Valeur nulle ou négative détectée: ${point.value}`,
        suggestion: 'Vérifiez si les valeurs négatives sont attendues',
      });
    }

    // Check for extreme values
    if (point.value > 1e9 || point.value < 1e-9) {
      warnings.push({
        line: index + 1,
        message: `Valeur extrême détectée: ${point.value.toExponential(2)}`,
        suggestion: 'Vérifiez les unités et les valeurs aberrantes',
      });
    }

    valid.push(point);
  });

  return { valid, invalid, warnings };
}

/**
 * Generate statistics on data quality
 */
export function generateDataQualityReport(dataPoints: DataPoint[]) {
  const values = dataPoints.map((p) => p.value).filter((v) => !isNaN(v));

  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const median = sorted[Math.floor(sorted.length / 2)];
  const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);

  // Detect outliers using IQR method
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;

  const outliers = values.filter((v) => v < lowerFence || v > upperFence);

  return {
    count: values.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    mean,
    median,
    stdDev,
    q1,
    q3,
    iqr,
    outlierCount: outliers.length,
    outlierPercentage: (outliers.length / values.length) * 100,
    range: sorted[sorted.length - 1] - sorted[0],
  };
}
