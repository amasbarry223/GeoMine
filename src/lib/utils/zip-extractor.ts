/**
 * Utility functions for extracting ZIP archives
 */

import { logInfo, logError, logWarn } from '@/lib/logger';

export interface ExtractedFile {
  name: string;
  content: string;
  size: number;
}

/**
 * Extract files from a ZIP archive
 * Server-side only: uses adm-zip
 */
export async function extractZipFile(file: File): Promise<ExtractedFile[]> {
  const startTime = Date.now();
  const supportedExtensions = ['.csv', '.txt', '.dat', '.stg'];
  let totalEntries = 0;
  let skippedDirectories = 0;
  let skippedUnsupported = 0;
  let extractionErrors = 0;

  try {
    // Verify it's actually a ZIP file by magic number
    const isZip = await isZipFileByMagic(file);
    if (!isZip && !isZipFile(file.name)) {
      throw new Error('Le fichier ne semble pas être une archive ZIP valide');
    }

    logInfo('Starting ZIP extraction', { 
      fileName: file.name, 
      fileSize: file.size,
      verifiedByMagic: isZip 
    });

    // Server-side: use adm-zip
    const AdmZipModule = await import('adm-zip');
    const AdmZip = AdmZipModule.default;
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Validate ZIP structure
    if (buffer.length < 4) {
      throw new Error('Fichier ZIP trop petit ou corrompu');
    }

    let zip: any;
    try {
      zip = new AdmZip(buffer);
    } catch (zipError) {
      logError('Failed to parse ZIP file', zipError);
      throw new Error('Impossible de lire l\'archive ZIP. Le fichier est peut-être corrompu.');
    }

    const zipEntries = zip.getEntries();
    totalEntries = zipEntries.length;
    
    logInfo(`ZIP archive contains ${totalEntries} entries`, { fileName: file.name });
    
    const extractedFiles: ExtractedFile[] = [];
    
    for (const entry of zipEntries) {
      // Skip directories
      if (entry.isDirectory) {
        skippedDirectories++;
        continue;
      }
      
      // Only process supported file types
      const lowerName = entry.entryName.toLowerCase();
      const hasSupportedExtension = supportedExtensions.some(ext => lowerName.endsWith(ext));
      
      if (!hasSupportedExtension) {
        skippedUnsupported++;
        logInfo(`Skipping unsupported file: ${entry.entryName}`, { 
          fileName: file.name,
          entryName: entry.entryName 
        });
        continue;
      }

      try {
        // Validate entry before extraction
        if (!entry.header || entry.header.size === 0) {
          logWarn(`Skipping empty or invalid entry: ${entry.entryName}`, { fileName: file.name });
          continue;
        }

        const content = entry.getData().toString('utf-8');
        
        if (!content || content.length === 0) {
          logWarn(`Skipping empty file: ${entry.entryName}`, { fileName: file.name });
          continue;
        }

        extractedFiles.push({
          name: entry.entryName,
          content,
          size: entry.header.size,
        });
        
        logInfo(`Extracted file from ZIP: ${entry.entryName}`, { 
          size: content.length,
          originalSize: entry.header.size,
          fileName: file.name 
        });
      } catch (err) {
        extractionErrors++;
        logWarn(`Failed to extract ${entry.entryName} from ZIP`, { 
          error: err,
          fileName: file.name,
          entryName: entry.entryName 
        });
      }
    }
    
    const duration = Date.now() - startTime;
    
    logInfo('ZIP extraction completed', {
      fileName: file.name,
      duration: `${duration}ms`,
      totalEntries,
      extractedFiles: extractedFiles.length,
      skippedDirectories,
      skippedUnsupported,
      extractionErrors,
    });
    
    if (extractedFiles.length === 0) {
      const errorMsg = skippedUnsupported > 0
        ? `Aucun fichier supporté trouvé dans l'archive ZIP. ${skippedUnsupported} fichier(s) ignoré(s). Formats supportés: ${supportedExtensions.join(', ')}`
        : 'Aucun fichier valide trouvé dans l\'archive ZIP';
      logWarn(errorMsg, { 
        fileName: file.name,
        totalEntries,
        skippedUnsupported 
      });
      throw new Error(errorMsg);
    }
    
    return extractedFiles;
  } catch (error) {
    const duration = Date.now() - startTime;
    logError('Error extracting ZIP file', error, {
      fileName: file.name,
      duration: `${duration}ms`,
      totalEntries,
      skippedDirectories,
      skippedUnsupported,
      extractionErrors,
    });
    
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Erreur lors de l'extraction du fichier ZIP: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

/**
 * Check if a file is a ZIP archive by extension
 */
export function isZipFile(fileName: string): boolean {
  return fileName.toLowerCase().endsWith('.zip');
}

/**
 * Check if a file is a ZIP archive by magic number (more reliable)
 * ZIP files start with PK (0x504B) signature
 */
export async function isZipFileByMagic(file: File): Promise<boolean> {
  try {
    const buffer = await file.slice(0, 4).arrayBuffer();
    const view = new Uint8Array(buffer);
    // ZIP files start with "PK" (0x50 0x4B) - either PKZIP (0x50 0x4B 0x03 0x04) 
    // or empty ZIP (0x50 0x4B 0x05 0x06) or spanned ZIP (0x50 0x4B 0x07 0x08)
    return view[0] === 0x50 && view[1] === 0x4B;
  } catch {
    // Fallback to extension check if magic number check fails
    return isZipFile(file.name);
  }
}

