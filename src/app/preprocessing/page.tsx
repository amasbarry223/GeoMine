'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Sliders,
  TrendingUp,
  Filter,
  Save,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { useAppStore } from '@/store/useAppStore';
import AppLayout from '@/components/layout/AppLayout';

export default function PreprocessingPage() {
  const { activeTab, setActiveTab } = useAppStore();

  const [selectedDataset, setSelectedDataset] = useState('1');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

  // Filter settings
  const [filterType, setFilterType] = useState<'none' | 'median' | 'moving_average' | 'savitzky_golay'>('none');
  const [windowSize, setWindowSize] = useState(5);
  const [polynomialOrder, setPolynomialOrder] = useState(3);

  // Outlier detection settings
  const [outlierMethod, setOutlierMethod] = useState<'none' | 'iqr' | 'zscore' | 'percentile'>('none');
  const [outlierThreshold, setOutlierThreshold] = useState(3);
  const [outlierPercentileLower, setOutlierPercentileLower] = useState(5);
  const [outlierPercentileUpper, setOutlierPercentileUpper] = useState(95);

  // Topographic correction
  const [enableTopographicCorrection, setEnableTopographicCorrection] = useState(false);
  const [topographicMethod, setTopographicMethod] = useState<'simple' | 'interpolated' | 'weighted'>('simple');

  // Normalization
  const [normalizationMethod, setNormalizationMethod] = useState<'none' | 'minmax' | 'zscore' | 'log'>('none');

  // Results
  const [originalPoints, setOriginalPoints] = useState(1000);
  const [processedPoints, setProcessedPoints] = useState(1000);
  const [outliersRemoved, setOutliersRemoved] = useState(13);

  useEffect(() => {
    if (activeTab !== 'preprocessing') {
      setActiveTab('preprocessing');
    }
  }, [activeTab, setActiveTab]);

  const handleApplyPreprocessing = async () => {
    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      // Simulate processing progress
      const interval = setInterval(() => {
        setProcessingProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 5;
        });
      }, 100);

      // Simulate processing completion
      await new Promise((resolve) => setTimeout(resolve, 2000));

      clearInterval(interval);
      setProcessingProgress(100);

      // Update results
      setProcessedPoints(originalPoints - outliersRemoved);
    } catch (error) {
      console.error('Processing error:', error);
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  const handleReset = () => {
    setFilterType('none');
    setOutlierMethod('none');
    setEnableTopographicCorrection(false);
    setNormalizationMethod('none');
    setProcessedPoints(originalPoints);
    setOutliersRemoved(0);
  };

  return (
    <AppLayout headerTitle="Pré-traitement des Données">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Activity className="w-6 h-6" />
            Pré-traitement des Données
          </h1>
          <p className="text-muted-foreground mt-1">
            Appliquez des filtres et corrections pour améliorer la qualité des données
          </p>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dataset Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Jeux de données</CardTitle>
              <CardDescription>Sélectionnez les données à traiter</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedDataset} onValueChange={setSelectedDataset}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un dataset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Données résistivité - Ligne 001</SelectItem>
                  <SelectItem value="2">Données chargeabilité - Ligne 001</SelectItem>
                  <SelectItem value="3">Données RES2DINV - Ligne 002</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Preprocessing Tabs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Options de pré-traitement</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="filter" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="filter">Filtrage</TabsTrigger>
                  <TabsTrigger value="outliers">Outliers</TabsTrigger>
                  <TabsTrigger value="topography">Topographie</TabsTrigger>
                  <TabsTrigger value="normalization">Normalisation</TabsTrigger>
                </TabsList>

                {/* Filter Tab */}
                <TabsContent value="filter" className="space-y-4 mt-4">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Type de filtre</Label>
                      <Select value={filterType} onValueChange={(v: any) => setFilterType(v)} disabled={isProcessing}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Aucun</SelectItem>
                          <SelectItem value="median">Médian</SelectItem>
                          <SelectItem value="moving_average">Moyenne mobile</SelectItem>
                          <SelectItem value="savitzky_golay">Savitzky-Golay</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {filterType !== 'none' && (
                      <>
                        <div className="space-y-2">
                          <Label>Taille de fenêtre: {windowSize}</Label>
                          <Slider
                            value={[windowSize]}
                            onValueChange={([v]) => setWindowSize(v)}
                            min={3}
                            max={21}
                            step={2}
                            disabled={isProcessing}
                          />
                        </div>

                        {filterType === 'savitzky_golay' && (
                          <div className="space-y-2">
                            <Label>Ordre du polynôme: {polynomialOrder}</Label>
                            <Slider
                              value={[polynomialOrder]}
                              onValueChange={([v]) => setPolynomialOrder(v)}
                              min={2}
                              max={5}
                              step={1}
                              disabled={isProcessing}
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </TabsContent>

                {/* Outliers Tab */}
                <TabsContent value="outliers" className="space-y-4 mt-4">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Méthode de détection</Label>
                      <Select value={outlierMethod} onValueChange={(v: any) => setOutlierMethod(v)} disabled={isProcessing}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Aucune</SelectItem>
                          <SelectItem value="iqr">IQR (Interquartile Range)</SelectItem>
                          <SelectItem value="zscore">Z-Score</SelectItem>
                          <SelectItem value="percentile">Percentile</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {outlierMethod !== 'none' && (
                      <>
                        {(outlierMethod === 'iqr' || outlierMethod === 'zscore') && (
                          <div className="space-y-2">
                            <Label>Seuil: {outlierThreshold}</Label>
                            <Slider
                              value={[outlierThreshold]}
                              onValueChange={([v]) => setOutlierThreshold(v)}
                              min={1}
                              max={5}
                              step={0.1}
                              disabled={isProcessing}
                            />
                          </div>
                        )}

                        {outlierMethod === 'percentile' && (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Percentile inférieur: {outlierPercentileLower}%</Label>
                              <Slider
                                value={[outlierPercentileLower]}
                                onValueChange={([v]) => setOutlierPercentileLower(v)}
                                min={1}
                                max={25}
                                step={1}
                                disabled={isProcessing}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Percentile supérieur: {outlierPercentileUpper}%</Label>
                              <Slider
                                value={[outlierPercentileUpper]}
                                onValueChange={([v]) => setOutlierPercentileUpper(v)}
                                min={75}
                                max={99}
                                step={1}
                                disabled={isProcessing}
                              />
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </TabsContent>

                {/* Topography Tab */}
                <TabsContent value="topography" className="space-y-4 mt-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="topo-correction">Correction topographique</Label>
                        <p className="text-xs text-muted-foreground">
                          Appliquer les corrections liées au relief
                        </p>
                      </div>
                      <Switch
                        id="topo-correction"
                        checked={enableTopographicCorrection}
                        onCheckedChange={setEnableTopographicCorrection}
                        disabled={isProcessing}
                      />
                    </div>

                    {enableTopographicCorrection && (
                      <div className="space-y-2">
                        <Label>Méthode de correction</Label>
                        <Select value={topographicMethod} onValueChange={(v: any) => setTopographicMethod(v)} disabled={isProcessing}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="simple">Simple</SelectItem>
                            <SelectItem value="interpolated">Interpolée</SelectItem>
                            <SelectItem value="weighted">Pondérée</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Normalization Tab */}
                <TabsContent value="normalization" className="space-y-4 mt-4">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Méthode de normalisation</Label>
                      <Select value={normalizationMethod} onValueChange={(v: any) => setNormalizationMethod(v)} disabled={isProcessing}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Aucune</SelectItem>
                          <SelectItem value="minmax">Min-Max [0,1]</SelectItem>
                          <SelectItem value="zscore">Z-Score</SelectItem>
                          <SelectItem value="log">Logarithmique</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleApplyPreprocessing}
              disabled={isProcessing}
              className="flex-1 gap-2"
              size="lg"
            >
              {isProcessing ? (
                <>
                  Traitement en cours...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Appliquer le pré-traitement
                </>
              )}
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              disabled={isProcessing}
              size="lg"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Réinitialiser
            </Button>
          </div>
        </div>

        {/* Right Column - Results */}
        <div className="space-y-6">
          {/* Processing Progress */}
          {isProcessing && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Progression</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">
                    {processingProgress}%
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Traitement en cours...
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quality Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Métriques de qualité</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Points originaux</span>
                    <span className="font-semibold">{originalPoints}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Points traités</span>
                    <span className="font-semibold">{processedPoints}</span>
                  </div>
                  <div className="flex items-center justify-between text-red-500">
                    <span className="text-sm">Outliers supprimés</span>
                    <span className="font-semibold">{outliersRemoved}</span>
                  </div>
                </div>

                {outliersRemoved > 0 && (
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm text-green-700">Amélioration de qualité</p>
                        <p className="text-xs text-green-600 mt-1">
                          {(outliersRemoved / originalPoints * 100).toFixed(2)}% des valeurs aberrantes supprimées
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Processing Pipeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pipeline de traitement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className={`w-8 h-8 rounded flex items-center justify-center ${
                    filterType !== 'none' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    1
                  </div>
                  <span>Filtrage: {filterType !== 'none' ? filterType : 'Désactivé'}</span>
                  {filterType !== 'none' && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />}
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <div className={`w-8 h-8 rounded flex items-center justify-center ${
                    outlierMethod !== 'none' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    2
                  </div>
                  <span>Détection outliers: {outlierMethod !== 'none' ? outlierMethod : 'Désactivée'}</span>
                  {outlierMethod !== 'none' && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />}
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <div className={`w-8 h-8 rounded flex items-center justify-center ${
                    enableTopographicCorrection ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    3
                  </div>
                  <span>Correction topographique: {enableTopographicCorrection ? topographicMethod : 'Désactivée'}</span>
                  {enableTopographicCorrection && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />}
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <div className={`w-8 h-8 rounded flex items-center justify-center ${
                    normalizationMethod !== 'none' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    4
                  </div>
                  <span>Normalisation: {normalizationMethod !== 'none' ? normalizationMethod : 'Désactivée'}</span>
                  {normalizationMethod !== 'none' && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </AppLayout>
  );
}

