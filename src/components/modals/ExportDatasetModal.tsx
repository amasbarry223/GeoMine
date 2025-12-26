'use client';

import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, FileJson } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dataset } from '@/types/geophysic';
import { useApi } from '@/hooks/use-api';
import { exportToExcel, exportToCSV, downloadFile } from '@/lib/geophysic/exports';

interface ExportDatasetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dataset: Dataset | null;
}

type ExportFormat = 'CSV' | 'JSON' | 'EXCEL';

export function ExportDatasetModal({
  open,
  onOpenChange,
  dataset,
}: ExportDatasetModalProps) {
  const [format, setFormat] = useState<ExportFormat>('CSV');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeQualityReport, setIncludeQualityReport] = useState(false);
  const { execute, loading } = useApi();

  const handleExport = async () => {
    if (!dataset) return;

    try {
      let blob: Blob;
      let filename: string;

      switch (format) {
        case 'EXCEL':
          blob = exportToExcel(dataset, includeMetadata, includeQualityReport);
          filename = `${dataset.name || 'dataset'}.xlsx`;
          break;
        case 'CSV':
          const csvContent = exportToCSV(dataset);
          blob = new Blob([csvContent], { type: 'text/csv' });
          filename = `${dataset.name || 'dataset'}.csv`;
          break;
        case 'JSON':
        default:
          const jsonData = {
            dataset,
            metadata: includeMetadata ? dataset.metadata : undefined,
            qualityReport: includeQualityReport && dataset.metadata ? 
              (typeof dataset.metadata === 'string' ? JSON.parse(dataset.metadata) : dataset.metadata).qualityReport : undefined,
          };
          blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
          filename = `${dataset.name || 'dataset'}.json`;
          break;
      }

      downloadFile(blob, filename);
      onOpenChange(false);
    } catch (error) {
      console.error('Error exporting dataset:', error);
      // You might want to show a toast notification here
    }
  };

  if (!dataset) return null;

  const formatOptions = [
    { value: 'CSV', label: 'CSV', icon: FileSpreadsheet, description: 'Format tabulaire standard' },
    { value: 'JSON', label: 'JSON', icon: FileJson, description: 'Format structuré avec métadonnées' },
    { value: 'EXCEL', label: 'Excel', icon: FileText, description: 'Fichier Excel (.xlsx)' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Exporter le Dataset
          </DialogTitle>
          <DialogDescription>
            Choisissez le format et les options d'export pour {dataset.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label>Format d'export</Label>
            <div className="grid gap-3">
              {formatOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormat(option.value as ExportFormat)}
                    className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-all ${
                      format === option.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Icon className="w-5 h-5 mt-0.5" />
                    <div className="flex-1 text-left">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-muted-foreground">{option.description}</div>
                    </div>
                    {format === option.value && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <Label>Options d'export</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-metadata"
                  checked={includeMetadata}
                  onCheckedChange={(checked) => setIncludeMetadata(checked === true)}
                />
                <Label htmlFor="include-metadata" className="cursor-pointer">
                  Inclure les métadonnées
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-quality"
                  checked={includeQualityReport}
                  onCheckedChange={(checked) => setIncludeQualityReport(checked === true)}
                />
                <Label htmlFor="include-quality" className="cursor-pointer">
                  Inclure le rapport de qualité
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleExport} disabled={loading} className="gap-2">
            <Download className="w-4 h-4" />
            {loading ? 'Export en cours...' : 'Exporter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

