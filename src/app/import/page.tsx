'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  Download,
  FileCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppStore } from '@/store/useAppStore';
import { DataType } from '@/types/geophysic';
import AppLayout from '@/components/layout/AppLayout';
import { useApi } from '@/hooks/use-api';
import { toast } from '@/hooks/use-toast';

interface Campaign {
  id: string;
  name: string;
}

interface SurveyLine {
  id: string;
  name: string;
  campaignId: string;
}

const mockCampaigns: Campaign[] = [
  { id: '1', name: 'Campagne Alpha' },
  { id: '2', name: 'Campagne Beta' },
  { id: '3', name: 'Campagne Gamma' },
];

const mockSurveyLines: SurveyLine[] = [
  { id: '1', name: 'Ligne RC-001', campaignId: '1' },
  { id: '2', name: 'Ligne RC-002', campaignId: '1' },
  { id: '3', name: 'Ligne RC-003', campaignId: '2' },
  { id: '4', name: 'Ligne RC-004', campaignId: '3' },
];

export default function ImportPage() {
  const { activeTab, setActiveTab } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<any[]>([]);
  const { execute: executeImport, loading: importing } = useApi();

  // Form state
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [selectedSurveyLine, setSelectedSurveyLine] = useState<string>('');
  const [datasetName, setDatasetName] = useState('');
  const [dataType, setDataType] = useState<DataType>(DataType.RESISTIVITY);
  const [fileFormat, setFileFormat] = useState('CSV');
  const [delimiter, setDelimiter] = useState(',');
  const [hasHeader, setHasHeader] = useState(true);

  useEffect(() => {
    if (activeTab !== 'import') {
      setActiveTab('import');
    }
  }, [activeTab, setActiveTab]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(selectedFiles);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(droppedFiles);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleImport = async () => {
    if (!selectedSurveyLine || files.length === 0) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner une ligne de sondage et un fichier',
        variant: 'destructive',
      });
      return;
    }

    setImportProgress(0);

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setImportProgress((prev) => Math.min(prev + 5, 90));
    }, 100);

    const formData = new FormData();
    formData.append('file', files[0]);
    formData.append('surveyLineId', selectedSurveyLine);
    formData.append('name', datasetName || files[0].name);
    formData.append('dataType', dataType);
    formData.append('format', fileFormat);
    formData.append('hasHeader', hasHeader.toString());
    formData.append('delimiter', delimiter);

    const result = await executeImport(
      () => fetch('/api/datasets/import', {
        method: 'POST',
        body: formData,
      }),
      {
        successMessage: `Import réussi: ${files[0].name}`,
        errorMessage: 'Erreur lors de l\'importation',
        onSuccess: (data) => {
          clearInterval(progressInterval);
          setImportProgress(100);
          if (data?.importResult) {
            setImportResults([{
              id: data.dataset.id,
              fileName: files[0].name,
              ...data.importResult,
            }, ...importResults]);
          }
          setFiles([]);
          setDatasetName('');
        },
        onError: () => {
          clearInterval(progressInterval);
          setImportProgress(0);
        },
      }
    );

    clearInterval(progressInterval);
  };

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const getDataTypeColor = (type: DataType): string => {
    switch (type) {
      case DataType.RESISTIVITY:
        return 'bg-blue-500/15 text-blue-500 border-blue-500/30';
      case DataType.CHARGEABILITY:
        return 'bg-orange-500/15 text-orange-500 border-orange-500/30';
      default:
        return 'bg-gray-500/15 text-gray-500 border-gray-500/30';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <AppLayout headerTitle="Import de Données">
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Upload className="w-6 h-6" />
              Import de Données
            </h1>
            <p className="text-muted-foreground mt-1">
              Importez vos fichiers géophysiques dans la base de données
            </p>
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Upload & Form */}
          <div className="space-y-6">
            {/* Upload Area */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fichiers à importer</CardTitle>
                <CardDescription>
                  Glissez-déposez ou cliquez pour sélectionner
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".csv,.txt,.dat,.stg"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Formats supportés: CSV, TXT, RES2DINV (.dat), AGI SuperSting (.stg)
                  </p>
                  <p className="text-sm font-medium text-primary">
                    {files.length > 0 ? `${files.length} fichier(s) sélectionné(s)` : 'Cliquez ou glissez-déposez'}
                  </p>
                </div>

                {/* File List */}
                {files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <FileText className="w-8 h-8 text-primary" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveFile(index)}
                          disabled={importing}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Import Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Configuration de l'import</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nom du dataset *</Label>
                  <Input
                    value={datasetName}
                    onChange={(e) => setDatasetName(e.target.value)}
                    placeholder="Ex: Données résistivité Ligne 001"
                    disabled={importing}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type de données *</Label>
                    <Select
                      value={dataType}
                      onValueChange={(value: DataType) => setDataType(value)}
                      disabled={importing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={DataType.RESISTIVITY}>Résistivité</SelectItem>
                        <SelectItem value={DataType.CHARGEABILITY}>Chargeabilité</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Format de fichier</Label>
                    <Select
                      value={fileFormat}
                      onValueChange={setFileFormat}
                      disabled={importing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CSV">CSV</SelectItem>
                        <SelectItem value="TXT">TXT</SelectItem>
                        <SelectItem value="RES2DINV">RES2DINV</SelectItem>
                        <SelectItem value="RES3DINV">RES3DINV</SelectItem>
                        <SelectItem value="AGI_SUPERSTING">AGI SuperSting</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Campagne *</Label>
                  <Select
                    value={selectedCampaign}
                    onValueChange={setSelectedCampaign}
                    disabled={importing}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une campagne" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockCampaigns.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Ligne de sondage *</Label>
                  <Select
                    value={selectedSurveyLine}
                    onValueChange={setSelectedSurveyLine}
                    disabled={importing}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une ligne" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockSurveyLines
                        .filter((l) => !selectedCampaign || l.campaignId === selectedCampaign)
                        .map((l) => (
                          <SelectItem key={l.id} value={l.id}>
                            {l.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3 border-t pt-4">
                  <Label className="text-sm">Options de parsing CSV</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Délimiteur</Label>
                      <Select
                        value={delimiter}
                        onValueChange={setDelimiter}
                        disabled={fileFormat !== 'CSV' || importing}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value=",">Virgule (,)</SelectItem>
                          <SelectItem value=";">Point-virgule (;)</SelectItem>
                          <SelectItem value="\t">Tabulation</SelectItem>
                          <SelectItem value=" ">Espace</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="hasHeader"
                        checked={hasHeader}
                        onChange={(e) => setHasHeader(e.target.checked)}
                        disabled={fileFormat !== 'CSV' || importing}
                        className="rounded"
                      />
                      <Label htmlFor="hasHeader" className="text-xs">
                        Ligne d'en-tête
                      </Label>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleImport}
                  disabled={importing || !selectedSurveyLine || files.length === 0}
                  className="w-full gap-2"
                >
                  {importing ? (
                    <>
                      Import en cours...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Importer les données
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Progress & Results */}
          <div className="space-y-6">
            {/* Import Progress */}
            {importing && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Progression de l'import</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Progress value={importProgress} className="h-2" />
                  <p className="text-sm text-center text-muted-foreground">
                    {importProgress}% terminé
                  </p>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fichier:</span>
                      <span className="font-medium">{files[0]?.name || '...'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taille:</span>
                      <span className="font-medium">
                        {files[0] ? formatFileSize(files[0].size) : '...'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span className="font-medium">{fileFormat}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Import History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Historique des imports</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {importResults.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Upload className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-sm">Aucun import récent</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {importResults.map((result) => (
                        <div
                          key={result.id}
                          className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2 flex-1">
                              {result.success ? (
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                              ) : (
                                <AlertCircle className="w-5 h-5 text-red-500" />
                              )}
                              <span className="font-medium text-sm truncate flex-1">
                                {result.fileName}
                              </span>
                            </div>
                            <Badge variant={result.success ? 'default' : 'destructive'} className="text-xs">
                              {result.success ? 'Succès' : 'Échec'}
                            </Badge>
                          </div>
                          {result.success && (
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-muted-foreground">Enregistrements:</span>
                                <span className="font-medium ml-1">
                                  {result.recordsImported}/{result.recordsProcessed}
                                </span>
                              </div>
                              {result.errors > 0 && (
                                <div className="text-red-500">
                                  <span>Erreurs:</span>
                                  <span className="font-medium ml-1">{result.errors}</span>
                                </div>
                              )}
                              {result.warnings > 0 && (
                                <div className="text-yellow-600">
                                  <span>Alertes:</span>
                                  <span className="font-medium ml-1">{result.warnings}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Format Guide */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Guide des formats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <h4 className="font-medium mb-1">CSV/ TXT</h4>
                    <p className="text-muted-foreground">
                      Colonnes: X (m), Y (m), Valeur (Ω·m), [A, B, M, N, Écart-type]
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">RES2DINV (.dat)</h4>
                    <p className="text-muted-foreground">
                      Format standard RES2DINV avec données de mesure et topographie
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">AGI SuperSting</h4>
                    <p className="text-muted-foreground">
                      Export AGI avec sections de configuration et données
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
      </div>
    </AppLayout>
  );
}
