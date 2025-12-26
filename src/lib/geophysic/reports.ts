import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ReportSection {
  id: string;
  title: string;
  type: 'text' | 'chart' | 'table' | 'image';
  content: any;
  order: number;
}

export interface ReportOptions {
  title: string;
  subtitle?: string;
  author?: string;
  date?: Date;
  logo?: string;
  sections: ReportSection[];
  includeTableOfContents?: boolean;
  includePageNumbers?: boolean;
}

/**
 * Generate PDF report
 */
export async function generatePDFReport(options: ReportOptions): Promise<Blob> {
  const doc = new jsPDF();

  // Default settings
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;

  // Font setup
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  // Calculate positions
  const contentWidth = pageWidth - 2 * margin;
  const contentStartY = margin;

  // ==================== COVER PAGE ====================
  let currentY = contentStartY;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text(options.title, margin + contentWidth / 2, currentY + 30, { align: 'center' });

  // Subtitle
  if (options.subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(16);
    currentY += 20;
    doc.text(options.subtitle, margin + contentWidth / 2, currentY, { align: 'center' });
  }

  // Date and Author
  doc.setFontSize(12);
  currentY += 30;
  const dateStr = options.date?.toLocaleDateString('fr-FR') || new Date().toLocaleDateString('fr-FR');
  doc.text(`Date: ${dateStr}`, margin + contentWidth / 2, currentY, { align: 'center' });

  if (options.author) {
    currentY += 10;
    doc.text(`Auteur: ${options.author}`, margin + contentWidth / 2, currentY, { align: 'center' });
  }

  // Add new page for content
  doc.addPage();
  currentY = contentStartY;

  // ==================== TABLE OF CONTENTS ====================
  if (options.includeTableOfContents) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    currentY += 20;
    doc.text('Table des matières', margin, currentY);

    currentY += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    options.sections.forEach((section) => {
      doc.text(`${section.order}. ${section.title}`, margin, currentY);
      currentY += 7;
    });

    doc.addPage();
    currentY = contentStartY;
  }

  // ==================== SECTIONS ====================
  const sortedSections = [...options.sections].sort((a, b) => a.order - b.order);

  for (const section of sortedSections) {
    // Check if we need a new page
    if (currentY > pageHeight - margin) {
      doc.addPage();
      currentY = contentStartY;
    }

    // Section title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`${section.order}. ${section.title}`, margin, currentY);
    currentY += 15;

    // Section content
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    switch (section.type) {
      case 'text':
        currentY = renderTextSection(doc, section.content, margin, contentWidth, currentY);
        break;

      case 'table':
        currentY = await renderTableSection(doc, section.content, margin, contentWidth, currentY);
        break;

      case 'chart':
        currentY = await renderChartSection(doc, section.content, margin, contentWidth, currentY);
        break;

      case 'image':
        currentY = await renderImageSection(doc, section.content, margin, contentWidth, currentY);
        break;
    }

    currentY += 20;
  }

  // ==================== PAGE NUMBERS ====================
  if (options.includePageNumbers) {
    const totalPages = doc.internal.pages.length - 1;

    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Page ${i} / ${totalPages}`,
        pageWidth - margin,
        pageHeight - 10,
        { align: 'right' }
      );
    }
  }

  return doc.output('blob');
}

/**
 * Render text section
 */
function renderTextSection(
  doc: jsPDF,
  text: string,
  margin: number,
  contentWidth: number,
  currentY: number
): number {
  const lines = doc.splitTextToSize(text, contentWidth);

  lines.forEach((line) => {
    doc.text(line, margin, currentY);
    currentY += 6;
  });

  return currentY;
}

/**
 * Render table section
 */
async function renderTableSection(
  doc: jsPDF,
  tableData: { headers: string[]; rows: any[][]; title?: string },
  margin: number,
  contentWidth: number,
  currentY: number
): Promise<number> {
  if (tableData.title) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(tableData.title, margin, currentY);
    currentY += 10;
  }

  autoTable(doc, {
    head: [tableData.headers],
    body: tableData.rows,
    startY: currentY,
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [66, 66, 66],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  });

  return (doc as any).lastAutoTable.finalY + 10;
}

/**
 * Render chart section
 */
async function renderChartSection(
  doc: jsPDF,
  chartData: {
    type: 'bar' | 'line' | 'pie';
    title?: string;
    data: any[];
    options?: any;
  },
  margin: number,
  contentWidth: number,
  currentY: number
): Promise<number> {
  if (chartData.title) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(chartData.title, margin, currentY);
    currentY += 10;
  }

  // Simple chart rendering
  // In production, this would use a charting library or convert canvas to image
  const chartHeight = 100;
  const chartWidth = Math.min(contentWidth, 150);

  // Draw chart placeholder
  doc.setDrawColor(200);
  doc.rect(margin, currentY, chartWidth, chartHeight);

  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(
    `Chart: ${chartData.type} (${chartData.data.length} points)`,
    margin + 5,
    currentY + 10
  );

  return currentY + chartHeight + 10;
}

/**
 * Render image section
 */
async function renderImageSection(
  doc: jsPDF,
  imageData: {
    url: string;
    base64?: string;
    caption?: string;
    width?: number;
    height?: number;
  },
  margin: number,
  contentWidth: number,
  currentY: number
): Promise<number> {
  let imgData: string | undefined;

  if (imageData.base64) {
    imgData = imageData.base64;
  } else if (imageData.url) {
    try {
      const response = await fetch(imageData.url);
      const blob = await response.blob();
      imgData = await blobToBase64(blob);
    } catch (error) {
      console.error('Error loading image:', error);
      doc.text('Impossible de charger l\'image', margin, currentY);
      return currentY + 20;
    }
  }

  if (!imgData) {
    doc.text('Aucune image disponible', margin, currentY);
    return currentY + 20;
  }

  const maxWidth = Math.min(imageData.width || contentWidth, contentWidth);
  const maxHeight = imageData.height || 100;

  try {
    doc.addImage(imgData, 'JPEG', margin, currentY, maxWidth, maxHeight);
    currentY += maxHeight + 10;

    if (imageData.caption) {
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(imageData.caption, margin, currentY);
      currentY += 10;
    }
  } catch (error) {
    console.error('Error adding image:', error);
    doc.text('Erreur lors de l\'ajout de l\'image', margin, currentY);
    currentY += 20;
  }

  return currentY;
}

/**
 * Convert blob to base64
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Export data as CSV
 */
export function exportAsCSV(data: any[], filename: string = 'export.csv'): string {
  if (data.length === 0) {
    return '';
  }

  const headers = Object.keys(data[0]);
  const csvRows: string[] = [];

  // Add header row
  csvRows.push(headers.join(','));

  // Add data rows
  data.forEach((row) => {
    const values = headers.map((header) => {
      const value = row[header];
      // Escape quotes and wrap values with quotes if they contain commas
      const stringValue = value?.toString() || '';
      if (stringValue.includes(',') || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    csvRows.push(values.join(','));
  });

  return csvRows.join('\n');
}

/**
 * Download file
 */
export function downloadFile(content: string | Blob, filename: string, mimeType: string = 'text/plain') {
  let blob: Blob;

  if (content instanceof Blob) {
    blob = content;
  } else {
    blob = new Blob([content], { type: mimeType });
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate summary statistics table data
 */
export function generateStatisticsTable(statistics: {
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  q25: number;
  q75: number;
}) {
  return {
    headers: ['Statistique', 'Valeur'],
    rows: [
      ['Moyenne', statistics.mean.toFixed(4)],
      ['Médiane', statistics.median.toFixed(4)],
      ['Écart-type', statistics.stdDev.toFixed(4)],
      ['Minimum', statistics.min.toFixed(4)],
      ['Maximum', statistics.max.toFixed(4)],
      ['Q1 (25%)', statistics.q25.toFixed(4)],
      ['Q3 (75%)', statistics.q75.toFixed(4)],
      ['Étendue', (statistics.max - statistics.min).toFixed(4)],
    ],
  };
}

/**
 * Generate data quality report
 */
export function generateDataQualityReport(data: {
  totalPoints: number;
  validPoints: number;
  outliers: number;
  missingValues: number;
  statistics: any;
}): ReportSection {
  return {
    id: 'quality-report',
    title: 'Rapport de Qualité des Données',
    type: 'table',
    content: {
      headers: ['Métrique', 'Valeur'],
      rows: [
        ['Total des points', data.totalPoints.toString()],
        ['Points valides', data.validPoints.toString()],
        ['Points aberrants', data.outliers.toString()],
        ['Valeurs manquantes', data.missingValues.toString()],
        ['Taux de validité', `${((data.validPoints / data.totalPoints) * 100).toFixed(2)}%`],
        ['Taux d\'aberrants', `${((data.outliers / data.totalPoints) * 100).toFixed(2)}%`],
      ],
    },
    order: 1,
  };
}

/**
 * Generate inversion results section
 */
export function generateInversionResultsSection(inversionResults: {
  iterations: number;
  rmsError: number;
  convergence: number;
  runtime: number;
  modelSize: number;
}): ReportSection {
  return {
    id: 'inversion-results',
    title: 'Résultats de l\'Inversion',
    type: 'table',
    content: {
      headers: ['Paramètre', 'Valeur'],
      rows: [
        ['Nombre d\'itérations', inversionResults.iterations.toString()],
        ['Erreur RMS finale', inversionResults.rmsError.toFixed(6)],
        ['Taux de convergence', inversionResults.convergence.toFixed(6)],
        ['Temps de calcul', `${inversionResults.runtime}ms`],
        ['Taille du modèle', `${inversionResults.modelSize} cellules`],
      ],
    },
    order: 2,
  };
}

/**
 * Generate anomaly report section
 */
export function generateAnomalyReport(anomalies: {
  total: number;
  high: number;
  low: number;
  confidence: number;
}): ReportSection {
  return {
    id: 'anomaly-report',
    title: 'Rapport des Anomalies',
    type: 'table',
    content: {
      headers: ['Type', 'Nombre'],
      rows: [
        ['Total des anomalies', anomalies.total.toString()],
        ['Anomalies hautes', anomalies.high.toString()],
        ['Anomalies basses', anomalies.low.toString()],
        ['Confiance', `${(anomalies.confidence * 100).toFixed(2)}%`],
      ],
    },
    order: 3,
  };
}

/**
 * Combine multiple report sections into a full report
 */
export async function generateFullReport(
  options: Omit<ReportOptions, 'sections'>,
  sections: ReportSection[]
): Promise<Blob> {
  const fullOptions: ReportOptions = {
    ...options,
    sections: sections.sort((a, b) => a.order - b.order),
    includeTableOfContents: true,
    includePageNumbers: true,
  };

  return generatePDFReport(fullOptions);
}
