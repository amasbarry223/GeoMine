import {
  GeochemicalSample,
  CreateGeochemicalSampleInput,
  GeochemistryImportResult,
  ImportError,
  ImportWarning,
  GeochemistryImportSettings,
} from '@/types/geochemistry';

export interface ParseCSVOptions {
  delimiter?: string | ',' | ';' | '\t' | ' ';
  hasHeader?: boolean;
  skipRows?: number;
  decimalSeparator?: '.' | ',';
  mapping?: Record<string, string>; // Column name -> field name
}

/**
 * Parse CSV line handling quoted values
 */
function parseCSVLine(line: string, delimiter: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());

  return values;
}

/**
 * Detect delimiter from first line
 */
function detectDelimiter(line: string, defaultDelimiter: string): string {
  const delimiters = [',', ';', '\t', '|'];
  let maxCount = 0;
  let detected = defaultDelimiter;

  for (const delim of delimiters) {
    const count = (line.match(new RegExp(`\\${delim}`, 'g')) || []).length;
    if (count > maxCount) {
      maxCount = count;
      detected = delim;
    }
  }

  return detected;
}

/**
 * Normalize field name for mapping
 */
function normalizeFieldName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[_\s-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

/**
 * Map CSV column to sample field
 */
function mapColumnToField(columnName: string, mapping?: Record<string, string>): string | null {
  if (mapping && mapping[columnName]) {
    return mapping[columnName];
  }

  const normalized = normalizeFieldName(columnName);
  const fieldMap: Record<string, string> = {
    sampleid: 'sampleID',
    sample_id: 'sampleID',
    holeid: 'holeID',
    hole_id: 'holeID',
    depth_cm: 'depth_cm',
    depth: 'depth_cm',
    x: 'x',
    y: 'y',
    z: 'z',
    utmzone: 'utmZone',
    utm_zone: 'utmZone',
    surf_sample_type: 'surfSampleType',
    qcref: 'qcRef',
    qc_ref: 'qcRef',
    dupid: 'dupID',
    dup_id: 'dupID',
    sample_status: 'sampleStatus',
    survey_method: 'surveyMethod',
    grain_size: 'grainSize',
    litho1: 'litho1',
    litho2: 'litho2',
    vein_type: 'veinType',
    vein_abd: 'veinAbd',
    sulphide_type: 'sulphideType',
    sulphide_abd: 'sulphideAbd',
    area_description: 'areaDescription',
  };

  return fieldMap[normalized] || null;
}

/**
 * Parse CSV file for geochemical samples
 */
export async function parseGeochemistryCSV(
  file: File,
  options: ParseCSVOptions = {}
): Promise<{
  samples: CreateGeochemicalSampleInput[];
  errors: ImportError[];
  warnings: ImportWarning[];
}> {
  const {
    delimiter = ',',
    hasHeader = true,
    skipRows = 0,
    decimalSeparator = '.',
    mapping,
  } = options;

  const errors: ImportError[] = [];
  const warnings: ImportWarning[] = [];
  const samples: CreateGeochemicalSampleInput[] = [];

  try {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((line) => line.trim());

    if (lines.length === 0) {
      errors.push({
        line: 0,
        message: 'Le fichier est vide',
        severity: 'error',
      });
      return { samples, errors, warnings };
    }

    // Detect delimiter
    const detectedDelimiter = detectDelimiter(lines[0], delimiter);

    // Parse header
    let headerMap: Record<number, string> = {};
    let columnMapping: Record<string, string> = {};

    if (hasHeader) {
      const headerLine = lines[skipRows];
      const headers = parseCSVLine(headerLine, detectedDelimiter);
      headers.forEach((header, index) => {
        headerMap[index] = header;
        const fieldName = mapColumnToField(header, mapping);
        if (fieldName) {
          columnMapping[header] = fieldName;
        }
      });
    }

    // Parse data lines
    const startIndex = skipRows + (hasHeader ? 1 : 0);
    const dataLines = lines.slice(startIndex);

    dataLines.forEach((line, lineIndex) => {
      const actualLineNumber = lineIndex + startIndex + 1;

      try {
        const values = parseCSVLine(line, detectedDelimiter);

        // Skip empty lines
        if (values.length === 0 || values.every((v) => !v.trim())) {
          return;
        }

        // Find sampleID column
        let sampleIDIndex = -1;
        for (const [index, header] of Object.entries(headerMap)) {
          const fieldName = mapColumnToField(header, mapping);
          if (fieldName === 'sampleID') {
            sampleIDIndex = parseInt(index);
            break;
          }
        }

        // If no mapping, try common positions
        if (sampleIDIndex === -1) {
          sampleIDIndex = 0; // Assume first column
        }

        const sampleID = values[sampleIDIndex]?.trim();
        if (!sampleID) {
          errors.push({
            line: actualLineNumber,
            column: headerMap[sampleIDIndex] || 'sampleID',
            message: 'sampleID manquant',
            severity: 'error',
          });
          return;
        }

        // Build sample object
        const sample: CreateGeochemicalSampleInput = {
          campaignId: '', // Will be set by caller
          sampleID,
        };

        // Map all columns
        values.forEach((value, index) => {
          const header = headerMap[index];
          if (!header) return;

          const fieldName = mapColumnToField(header, mapping);
          if (!fieldName || fieldName === 'sampleID') return;

          const trimmedValue = value.trim();
          if (!trimmedValue) return;

          // Parse based on field type
          switch (fieldName) {
            case 'depth_cm':
            case 'x':
            case 'y':
            case 'z':
              const numValue = parseFloat(
                trimmedValue.replace(decimalSeparator === ',' ? '.' : ',', decimalSeparator)
              );
              if (!isNaN(numValue)) {
                (sample as any)[fieldName] = numValue;
              }
              break;
            case 'date':
              const dateValue = new Date(trimmedValue);
              if (!isNaN(dateValue.getTime())) {
                (sample as any)[fieldName] = dateValue;
              }
              break;
            default:
              (sample as any)[fieldName] = trimmedValue;
          }
        });

        samples.push(sample);
      } catch (error) {
        errors.push({
          line: actualLineNumber,
          message: error instanceof Error ? error.message : 'Erreur lors du parsing de la ligne',
          severity: 'error',
        });
      }
    });
  } catch (error) {
    errors.push({
      line: 0,
      message: error instanceof Error ? error.message : 'Erreur lors de la lecture du fichier',
      severity: 'error',
    });
  }

  return { samples, errors, warnings };
}

/**
 * Parse Excel file (basic implementation - would need xlsx library)
 */
export async function parseGeochemistryExcel(
  file: File,
  options: ParseCSVOptions = {}
): Promise<{
  samples: CreateGeochemicalSampleInput[];
  errors: ImportError[];
  warnings: ImportWarning[];
}> {
  // For now, return empty - would need xlsx library implementation
  return {
    samples: [],
    errors: [
      {
        line: 0,
        message: 'Import Excel non encore implémenté',
        severity: 'error',
      },
    ],
    warnings: [],
  };
}

/**
 * Main parser function
 */
export async function parseGeochemistryFile(
  file: File,
  settings: GeochemistryImportSettings
): Promise<GeochemistryImportResult> {
  try {
    let result: {
      samples: CreateGeochemicalSampleInput[];
      errors: ImportError[];
      warnings: ImportWarning[];
    };

    if (settings.format === 'EXCEL') {
      result = await parseGeochemistryExcel(file, {
        hasHeader: settings.hasHeader,
        skipRows: settings.skipRows,
        mapping: settings.mapping,
      });
    } else {
      result = await parseGeochemistryCSV(file, {
        delimiter: settings.delimiter,
        hasHeader: settings.hasHeader,
        skipRows: settings.skipRows,
        mapping: settings.mapping,
      });
    }

    return {
      success: result.errors.length === 0 || result.samples.length > 0,
      samples: result.samples as any, // Will be converted to GeochemicalSample after DB insert
      errors: result.errors,
      warnings: result.warnings,
      recordsProcessed: result.samples.length + result.errors.length,
      recordsImported: result.samples.length,
    };
  } catch (error) {
    return {
      success: false,
      samples: [],
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


