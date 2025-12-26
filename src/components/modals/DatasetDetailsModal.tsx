'use client';

import React from 'react';
import { Database, Calendar, FileText, BarChart3, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dataset, DataType } from '@/types/geophysic';

interface DatasetDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dataset: Dataset | null;
}

function getDataTypeColor(type: DataType): string {
  switch (type) {
    case DataType.RESISTIVITY:
      return 'bg-blue-500/15 text-blue-500 border-blue-500/30';
    case DataType.CHARGEABILITY:
      return 'bg-orange-500/15 text-orange-500 border-orange-500/30';
    default:
      return 'bg-gray-500/15 text-gray-500 border-gray-500/30';
  }
}

function getDataTypeLabel(type: DataType): string {
  switch (type) {
    case DataType.RESISTIVITY:
      return 'Résistivité';
    case DataType.CHARGEABILITY:
      return 'Chargeabilité';
    default:
      return type;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export function DatasetDetailsModal({
  open,
  onOpenChange,
  dataset,
}: DatasetDetailsModalProps) {
  if (!dataset) return null;

  const dataPoints = Array.isArray(dataset.rawData) ? dataset.rawData : [];
  const metadata = dataset.metadata || {};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Détails du Dataset
          </DialogTitle>
          <DialogDescription>Informations complètes sur le jeu de données</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">{dataset.name}</h3>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={getDataTypeColor(dataset.dataType)}>
                  {getDataTypeLabel(dataset.dataType)}
                </Badge>
                <Badge variant="outline">{dataset.sourceFormat}</Badge>
                {dataset.isProcessed && (
                  <Badge variant="secondary">Traité</Badge>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Exporter
            </Button>
          </div>

          <Separator />

          {/* File Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="w-4 h-4" />
                Nom du fichier
              </div>
              <p className="font-medium">{dataset.fileName || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Database className="w-4 h-4" />
                Taille
              </div>
              <p className="font-medium">{formatFileSize(dataset.fileSize || 0)}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BarChart3 className="w-4 h-4" />
                Points de données
              </div>
              <p className="font-medium">{dataPoints.length.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                Date de création
              </div>
              <p className="font-medium">
                {new Date(dataset.createdAt).toLocaleString('fr-FR')}
              </p>
            </div>
          </div>

          {/* Metadata */}
          {Object.keys(metadata).length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Métadonnées</h4>
                <div className="rounded-lg border bg-muted/30 p-4">
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(metadata, null, 2)}
                  </pre>
                </div>
              </div>
            </>
          )}

          {/* Quality Report */}
          {metadata.qualityReport && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Rapport de Qualité</h4>
                <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                  {metadata.qualityReport.statistics && (
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Min:</span>
                        <span className="ml-2 font-medium">
                          {metadata.qualityReport.statistics.min?.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Max:</span>
                        <span className="ml-2 font-medium">
                          {metadata.qualityReport.statistics.max?.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Moyenne:</span>
                        <span className="ml-2 font-medium">
                          {metadata.qualityReport.statistics.mean?.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

