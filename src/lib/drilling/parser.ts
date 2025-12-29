import {
  DrillHole,
  CreateDrillHoleInput,
  CreateDrillSurveyInput,
  CreateGeologyLogInput,
  CreateDrillAssayInput,
  DrillingImportResult,
  ImportError,
  ImportWarning,
  DrillingImportSettings,
  DrillingFileType,
  DrillType,
} from '@/types/drilling';

export interface ParseCSVOptions {
  delimiter?: string | ',' | ';' | '\t' | ' ';
  hasHeader?: boolean;
  skipRows?: number;
  decimalSeparator?: '.' | ',';
  mapping?: Record<string, string>;
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
        i++;
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
 * Parse Collar file (hole information)
 */
export async function parseCollarFile(
  file: File,
  campaignId: string,
  options: ParseCSVOptions = {}
): Promise<{
  holes: CreateDrillHoleInput[];
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
  const holes: CreateDrillHoleInput[] = [];

  try {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((line) => line.trim());

    if (lines.length === 0) {
      errors.push({
        line: 0,
        message: 'Le fichier est vide',
        severity: 'error',
      });
      return { holes, errors, warnings };
    }

    const detectedDelimiter = detectDelimiter(lines[0], delimiter);
    const startIndex = skipRows + (hasHeader ? 1 : 0);
    const dataLines = lines.slice(startIndex);

    dataLines.forEach((line, lineIndex) => {
      const actualLineNumber = lineIndex + startIndex + 1;

      try {
        const values = parseCSVLine(line, detectedDelimiter);

        if (values.length === 0 || values.every((v) => !v.trim())) {
          return;
        }

        // Minimum required: holeID, collarX, collarY, collarZ
        if (values.length < 4) {
          errors.push({
            line: actualLineNumber,
            message: 'Nombre de colonnes insuffisant (minimum: holeID, X, Y, Z)',
            severity: 'error',
          });
          return;
        }

        const hole: CreateDrillHoleInput = {
          campaignId,
          holeID: values[0].trim(),
          drillType: (values[4]?.trim().toUpperCase() as DrillType) || DrillType.DIAMOND,
          collarX: parseFloat(values[1].replace(decimalSeparator === ',' ? '.' : ',', decimalSeparator)),
          collarY: parseFloat(values[2].replace(decimalSeparator === ',' ? '.' : ',', decimalSeparator)),
          collarZ: parseFloat(values[3].replace(decimalSeparator === ',' ? '.' : ',', decimalSeparator)),
        };

        // Optional fields
        if (values[5]) hole.azimuth = parseFloat(values[5]);
        if (values[6]) hole.dip = parseFloat(values[6]);
        if (values[7]) hole.totalDepth = parseFloat(values[7]);
        if (values[8]) hole.utmZone = values[8].trim();
        if (values[9]) hole.startDate = new Date(values[9]);
        if (values[10]) hole.endDate = new Date(values[10]);
        if (values[11]) hole.contractor = values[11].trim();
        if (values[12]) hole.rigType = values[12].trim();

        if (isNaN(hole.collarX) || isNaN(hole.collarY) || isNaN(hole.collarZ)) {
          errors.push({
            line: actualLineNumber,
            message: 'Coordonnées invalides (X, Y, Z doivent être numériques)',
            severity: 'error',
          });
          return;
        }

        holes.push(hole);
      } catch (error) {
        errors.push({
          line: actualLineNumber,
          message: error instanceof Error ? error.message : 'Erreur lors du parsing',
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

  return { holes, errors, warnings };
}

/**
 * Parse Survey file
 */
export async function parseSurveyFile(
  file: File,
  options: ParseCSVOptions = {}
): Promise<{
  surveys: CreateDrillSurveyInput[];
  errors: ImportError[];
  warnings: ImportWarning[];
}> {
  const {
    delimiter = ',',
    hasHeader = true,
    skipRows = 0,
    decimalSeparator = '.',
  } = options;

  const errors: ImportError[] = [];
  const warnings: ImportWarning[] = [];
  const surveys: CreateDrillSurveyInput[] = [];

  try {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((line) => line.trim());

    const detectedDelimiter = detectDelimiter(lines[0], delimiter);
    const startIndex = skipRows + (hasHeader ? 1 : 0);
    const dataLines = lines.slice(startIndex);

    dataLines.forEach((line, lineIndex) => {
      const actualLineNumber = lineIndex + startIndex + 1;

      try {
        const values = parseCSVLine(line, detectedDelimiter);

        if (values.length < 2) {
          errors.push({
            line: actualLineNumber,
            message: 'Nombre de colonnes insuffisant (minimum: holeID, depth)',
            severity: 'error',
          });
          return;
        }

        const survey: CreateDrillSurveyInput = {
          drillHoleId: '', // Will be mapped by holeID
          depth: parseFloat(values[1].replace(decimalSeparator === ',' ? '.' : ',', decimalSeparator)),
        };

        if (values[2]) survey.azimuth = parseFloat(values[2]);
        if (values[3]) survey.dip = parseFloat(values[3]);
        if (values[4]) survey.toolFace = parseFloat(values[4]);

        if (isNaN(survey.depth)) {
          errors.push({
            line: actualLineNumber,
            message: 'Profondeur invalide',
            severity: 'error',
          });
          return;
        }

        surveys.push(survey);
      } catch (error) {
        errors.push({
          line: actualLineNumber,
          message: error instanceof Error ? error.message : 'Erreur lors du parsing',
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

  return { surveys, errors, warnings };
}

/**
 * Parse Geology file
 */
export async function parseGeologyFile(
  file: File,
  options: ParseCSVOptions = {}
): Promise<{
  geology: CreateGeologyLogInput[];
  errors: ImportError[];
  warnings: ImportWarning[];
}> {
  const {
    delimiter = ',',
    hasHeader = true,
    skipRows = 0,
    decimalSeparator = '.',
  } = options;

  const errors: ImportError[] = [];
  const warnings: ImportWarning[] = [];
  const geology: CreateGeologyLogInput[] = [];

  try {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((line) => line.trim());

    const detectedDelimiter = detectDelimiter(lines[0], delimiter);
    const startIndex = skipRows + (hasHeader ? 1 : 0);
    const dataLines = lines.slice(startIndex);

    dataLines.forEach((line, lineIndex) => {
      const actualLineNumber = lineIndex + startIndex + 1;

      try {
        const values = parseCSVLine(line, detectedDelimiter);

        if (values.length < 3) {
          errors.push({
            line: actualLineNumber,
            message: 'Nombre de colonnes insuffisant (minimum: holeID, fromDepth, toDepth)',
            severity: 'error',
          });
          return;
        }

        const log: CreateGeologyLogInput = {
          drillHoleId: '', // Will be mapped
          fromDepth: parseFloat(values[1].replace(decimalSeparator === ',' ? '.' : ',', decimalSeparator)),
          toDepth: parseFloat(values[2].replace(decimalSeparator === ',' ? '.' : ',', decimalSeparator)),
        };

        if (values[3]) log.lithology = values[3].trim();
        if (values[4]) log.alteration = values[4].trim();
        if (values[5]) log.mineralization = values[5].trim();
        if (values[6]) log.weathering = values[6].trim();
        if (values[7]) log.color = values[7].trim();
        if (values[8]) log.texture = values[8].trim();
        if (values[9]) log.structure = values[9].trim();
        if (values[10]) log.notes = values[10].trim();
        if (values[11]) log.geologist = values[11].trim();
        if (values[12]) log.logDate = new Date(values[12]);

        if (isNaN(log.fromDepth) || isNaN(log.toDepth)) {
          errors.push({
            line: actualLineNumber,
            message: 'Profondeurs invalides',
            severity: 'error',
          });
          return;
        }

        geology.push(log);
      } catch (error) {
        errors.push({
          line: actualLineNumber,
          message: error instanceof Error ? error.message : 'Erreur lors du parsing',
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

  return { geology, errors, warnings };
}

/**
 * Parse Assay file
 */
export async function parseAssayFile(
  file: File,
  options: ParseCSVOptions = {}
): Promise<{
  assays: CreateDrillAssayInput[];
  errors: ImportError[];
  warnings: ImportWarning[];
}> {
  const {
    delimiter = ',',
    hasHeader = true,
    skipRows = 0,
    decimalSeparator = '.',
  } = options;

  const errors: ImportError[] = [];
  const warnings: ImportWarning[] = [];
  const assays: CreateDrillAssayInput[] = [];

  try {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((line) => line.trim());

    const detectedDelimiter = detectDelimiter(lines[0], delimiter);
    const startIndex = skipRows + (hasHeader ? 1 : 0);
    const dataLines = lines.slice(startIndex);

    dataLines.forEach((line, lineIndex) => {
      const actualLineNumber = lineIndex + startIndex + 1;

      try {
        const values = parseCSVLine(line, detectedDelimiter);

        if (values.length < 5) {
          errors.push({
            line: actualLineNumber,
            message: 'Nombre de colonnes insuffisant (minimum: holeID, fromDepth, toDepth, element, value)',
            severity: 'error',
          });
          return;
        }

        const assay: CreateDrillAssayInput = {
          drillHoleId: '', // Will be mapped
          fromDepth: parseFloat(values[1].replace(decimalSeparator === ',' ? '.' : ',', decimalSeparator)),
          toDepth: parseFloat(values[2].replace(decimalSeparator === ',' ? '.' : ',', decimalSeparator)),
          element: values[3].trim(),
          value: parseFloat(values[4].replace(decimalSeparator === ',' ? '.' : ',', decimalSeparator)),
        };

        if (values[5]) assay.sampleID = values[5].trim();
        if (values[6]) assay.unit = values[6].trim();
        if (values[7]) assay.detectionLimit = parseFloat(values[7]);
        if (values[8]) assay.method = values[8].trim();
        if (values[9]) assay.lab = values[9].trim();

        if (isNaN(assay.fromDepth) || isNaN(assay.toDepth) || isNaN(assay.value)) {
          errors.push({
            line: actualLineNumber,
            message: 'Valeurs numériques invalides',
            severity: 'error',
          });
          return;
        }

        assays.push(assay);
      } catch (error) {
        errors.push({
          line: actualLineNumber,
          message: error instanceof Error ? error.message : 'Erreur lors du parsing',
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

  return { assays, errors, warnings };
}

/**
 * Main parser function
 */
export async function parseDrillingFile(
  file: File,
  settings: DrillingImportSettings,
  campaignId: string
): Promise<DrillingImportResult> {
  try {
    const options: ParseCSVOptions = {
      delimiter: settings.delimiter,
      hasHeader: settings.hasHeader,
      skipRows: settings.skipRows,
      mapping: settings.mapping,
    };

    let result: any;

    switch (settings.fileType) {
      case DrillingFileType.COLLAR:
        result = await parseCollarFile(file, campaignId, options);
        return {
          success: result.errors.length === 0 || result.holes.length > 0,
          holes: result.holes as any,
          errors: result.errors,
          warnings: result.warnings,
          recordsProcessed: result.holes.length + result.errors.length,
          recordsImported: result.holes.length,
        };

      case DrillingFileType.SURVEY:
        result = await parseSurveyFile(file, options);
        return {
          success: result.errors.length === 0 || result.surveys.length > 0,
          holes: [],
          errors: result.errors,
          warnings: result.warnings,
          recordsProcessed: result.surveys.length + result.errors.length,
          recordsImported: result.surveys.length,
        };

      case DrillingFileType.GEOLOGY:
        result = await parseGeologyFile(file, options);
        return {
          success: result.errors.length === 0 || result.geology.length > 0,
          holes: [],
          errors: result.errors,
          warnings: result.warnings,
          recordsProcessed: result.geology.length + result.errors.length,
          recordsImported: result.geology.length,
        };

      case DrillingFileType.ASSAY:
        result = await parseAssayFile(file, options);
        return {
          success: result.errors.length === 0 || result.assays.length > 0,
          holes: [],
          errors: result.errors,
          warnings: result.warnings,
          recordsProcessed: result.assays.length + result.errors.length,
          recordsImported: result.assays.length,
        };

      default:
        return {
          success: false,
          holes: [],
          errors: [
            {
              line: 0,
              message: `Type de fichier non supporté: ${settings.fileType}`,
              severity: 'error',
            },
          ],
          warnings: [],
          recordsProcessed: 0,
          recordsImported: 0,
        };
    }
  } catch (error) {
    return {
      success: false,
      holes: [],
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


