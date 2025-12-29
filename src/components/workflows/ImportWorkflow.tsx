'use client';

import React, { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Archive } from 'lucide-react';
import { WorkflowWizard, WorkflowStep } from './WorkflowWizard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataType } from '@/types/geophysic';
import { useApi } from '@/hooks/use-api';
import { toast } from '@/hooks/use-toast';
import { useCSRFToken } from '@/lib/csrf-client';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/queries';

// Wrapper component to filter out props that shouldn't be passed to DOM elements
const StepWrapper = ({ children, updateData: _updateData, data: _data, ...props }: any) => {
  return <>{children}</>;
};

interface ImportWorkflowProps {
  onComplete?: (result: any) => void;
  onCancel?: () => void;
  initialSurveyLineId?: string;
}

interface ImportData {
  file: File | null;
  surveyLineId: string;
  name: string;
  dataType: DataType;
  format: string;
  hasHeader: boolean;
  delimiter: string;
}

export function ImportWorkflow({
  onComplete,
  onCancel,
  initialSurveyLineId,
}: ImportWorkflowProps) {
  const [importData, setImportData] = useState<ImportData>({
    file: null,
    surveyLineId: initialSurveyLineId || '',
    name: '',
    dataType: DataType.RESISTIVITY,
    format: 'CSV',
    hasHeader: true,
    delimiter: ',',
  });
  const [previewData, setPreviewData] = useState<any>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const { execute, loading } = useApi();
  const { csrfToken } = useCSRFToken();
  const queryClient = useQueryClient();

  // Mock campaigns and survey lines - should be fetched from API
  const mockCampaigns = [
    { id: '1', name: 'Campagne Alpha' },
    { id: '2', name: 'Campagne Beta' },
  ];
  const mockSurveyLines = [
    { id: '1', name: 'Ligne RC-001', campaignId: '1' },
    { id: '2', name: 'Ligne RC-002', campaignId: '1' },
  ];

  const updateData = useCallback((field: keyof ImportData, value: any) => {
    setImportData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Step 1: File Selection
  const FileSelectionStep = React.useMemo(() => {
    const fileInputRef = React.createRef<HTMLInputElement>();

    return (
      <StepWrapper>
        <div className="space-y-4">
        <div
          className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt,.dat,.stg,.zip"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                updateData('file', file);
                if (!importData.name) {
                  updateData('name', file.name.replace(/\.[^/.]+$/, ''));
                }
              }
            }}
            className="hidden"
          />
          <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground mb-2">
            Formats supportés: CSV, TXT, RES2DINV (.dat), AGI SuperSting (.stg), ZIP
          </p>
          {importData.file ? (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-center gap-2">
                {importData.file.name.toLowerCase().endsWith('.zip') ? (
                  <Archive className="w-8 h-8 text-primary" />
                ) : (
                  <FileText className="w-8 h-8 text-primary" />
                )}
                <div className="flex flex-col items-start">
                  <p className="font-medium text-sm">{importData.file.name}</p>
                  {importData.file.name.toLowerCase().endsWith('.zip') && (
                    <Badge variant="secondary" className="text-xs mt-1">
                      <Archive className="w-3 h-3 mr-1" />
                      Archive ZIP - Extraction automatique
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {importData.file.size < 1024 * 1024
                  ? `${(importData.file.size / 1024).toFixed(2)} KB`
                  : importData.file.size < 1024 * 1024 * 1024
                  ? `${(importData.file.size / (1024 * 1024)).toFixed(2)} MB`
                  : `${(importData.file.size / (1024 * 1024 * 1024)).toFixed(2)} GB`}
              </p>
              {importData.file.name.toLowerCase().endsWith('.zip') && (
                <p className="text-xs text-primary/80 mt-2 bg-primary/10 px-3 py-1.5 rounded-md">
                  Les fichiers contenus dans l'archive seront extraits et traités automatiquement
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm font-medium text-primary">Cliquez ou glissez-déposez</p>
          )}
        </div>
      </div>
      </StepWrapper>
    );
  }, [importData.file, importData.name, updateData]);

  // Step 2: Configuration
  const ConfigurationStep = React.useMemo(() => {
    return (
      <StepWrapper>
        <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="dataset-name">Nom du dataset *</Label>
          <Input
            id="dataset-name"
            value={importData.name}
            onChange={(e) => updateData('name', e.target.value)}
            placeholder="Ex: Données résistivité - Ligne 001"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="data-type">Type de données *</Label>
            <Select
              value={importData.dataType}
              onValueChange={(value) => updateData('dataType', value as DataType)}
            >
              <SelectTrigger id="data-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={DataType.RESISTIVITY}>Résistivité</SelectItem>
                <SelectItem value={DataType.CHARGEABILITY}>Chargeabilité</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="format">Format de fichier</Label>
            <Select
              value={importData.format}
              onValueChange={(value) => updateData('format', value)}
            >
              <SelectTrigger id="format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CSV">CSV</SelectItem>
                <SelectItem value="TXT">TXT</SelectItem>
                <SelectItem value="RES2DINV">RES2DINV</SelectItem>
                <SelectItem value="AGI_SUPERSTING">AGI SuperSting</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="survey-line">Ligne de sondage *</Label>
          <Select
            value={importData.surveyLineId}
            onValueChange={(value) => updateData('surveyLineId', value)}
          >
            <SelectTrigger id="survey-line">
              <SelectValue placeholder="Sélectionner une ligne" />
            </SelectTrigger>
            <SelectContent>
              {mockSurveyLines.map((line) => (
                <SelectItem key={line.id} value={line.id}>
                  {line.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {importData.format === 'CSV' && (
          <div className="space-y-3 border-t pt-4">
            <Label className="text-sm">Options de parsing CSV</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Délimiteur</Label>
                <Select
                  value={importData.delimiter}
                  onValueChange={(value) => updateData('delimiter', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=",">Virgule (,)</SelectItem>
                    <SelectItem value=";">Point-virgule (;)</SelectItem>
                    <SelectItem value="\t">Tabulation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 pt-8">
                <input
                  type="checkbox"
                  id="hasHeader"
                  checked={importData.hasHeader}
                  onChange={(e) => updateData('hasHeader', e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="hasHeader" className="text-xs cursor-pointer">
                  Ligne d'en-tête
                </Label>
              </div>
            </div>
          </div>
        )}
      </div>
      </StepWrapper>
    );
  }, [importData, updateData]);

  // Step 3: Preview & Validation
  const PreviewStep = React.useMemo(() => {
    if (!importData.file) {
      return (
        <StepWrapper>
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="w-12 h-12 mx-auto mb-4" />
            <p>Aucun fichier sélectionné</p>
          </div>
        </StepWrapper>
      );
    }

    const isZipFile = importData.file.name.toLowerCase().endsWith('.zip');
    const fileSizeFormatted =
      importData.file.size < 1024 * 1024
        ? `${(importData.file.size / 1024).toFixed(2)} KB`
        : importData.file.size < 1024 * 1024 * 1024
        ? `${(importData.file.size / (1024 * 1024)).toFixed(2)} MB`
        : `${(importData.file.size / (1024 * 1024 * 1024)).toFixed(2)} GB`;

    return (
      <StepWrapper>
        <div className="space-y-4">
        {isZipFile && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Archive className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">Archive ZIP détectée</span>
                    <Badge variant="secondary" className="text-xs">
                      <Archive className="w-3 h-3 mr-1" />
                      Extraction automatique
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Les fichiers contenus dans l'archive seront automatiquement extraits et traités lors de l'import.
                    Seuls les fichiers supportés (CSV, TXT, .dat, .stg) seront traités.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Fichier:</span>
                <div className="flex items-center gap-2">
                  {isZipFile && <Archive className="w-4 h-4 text-primary" />}
                  <span className="text-sm">{importData.file.name}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Taille:</span>
                <span className="text-sm">{fileSizeFormatted}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Type:</span>
                <Badge variant="outline">{importData.dataType}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Format:</span>
                <Badge variant="outline">{isZipFile ? 'ZIP' : importData.format}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Ligne de sondage:</span>
                <span className="text-sm">
                  {mockSurveyLines.find((l) => l.id === importData.surveyLineId)?.name || 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {importResult && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                {importResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
                <span className="font-medium">
                  {importResult.success ? 'Import réussi' : 'Erreur lors de l\'import'}
                </span>
              </div>
              {importResult.success && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Enregistrements importés:</span>
                    <span className="font-medium">{importResult.recordsImported}</span>
                  </div>
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="text-red-500">
                      <span>Erreurs: {importResult.errors.length}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      </StepWrapper>
    );
  }, [importData, importResult, mockSurveyLines]);

  const steps: WorkflowStep[] = [
    {
      id: 'file-selection',
      title: 'Sélection du fichier',
      description: 'Choisissez le fichier à importer',
      component: FileSelectionStep,
      validate: () => !!importData.file,
    },
    {
      id: 'configuration',
      title: 'Configuration',
      description: 'Configurez les paramètres d\'import',
      component: ConfigurationStep,
      validate: () => !!importData.name.trim() && !!importData.surveyLineId,
    },
    {
      id: 'preview',
      title: 'Validation',
      description: 'Vérifiez les paramètres avant l\'import',
      component: PreviewStep,
      validate: () => true,
      onNext: async () => {
        // Perform import
        if (!importData.file || !importData.surveyLineId) return;

        const formData = new FormData();
        formData.append('file', importData.file);
        formData.append('surveyLineId', importData.surveyLineId);
        formData.append('name', importData.name);
        formData.append('dataType', importData.dataType);
        formData.append('format', importData.format);
        formData.append('hasHeader', importData.hasHeader.toString());
        formData.append('delimiter', importData.delimiter);

        const headers: HeadersInit = {};
        if (csrfToken) {
          headers['x-csrf-token'] = csrfToken;
        }

        const result = await execute(
          () =>
            fetch('/api/datasets/import', {
              method: 'POST',
              headers,
              body: formData,
            }),
          {
            successMessage: 'Import réussi',
            onSuccess: (data) => {
              setImportResult(data?.importResult || { success: true });
              // Invalider le cache des datasets pour forcer le refetch
              queryClient.invalidateQueries({ queryKey: queryKeys.datasets });
              if (onComplete) {
                onComplete(data);
              }
            },
            onError: () => {
              setImportResult({ success: false });
            },
          }
        );
      },
    },
  ];

  return (
    <WorkflowWizard
      steps={steps}
      onComplete={async (data) => {
        if (onComplete) {
          onComplete(data);
        }
      }}
      onCancel={onCancel}
      title="Import de Données"
      description="Importez vos fichiers géophysiques en quelques étapes simples"
      saveState={true}
      storageKey="import-workflow-state"
    />
  );
}


