'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BarChart3, TrendingUp, Activity, Download, Filter, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore } from '@/store/useAppStore';
import AppLayout from '@/components/layout/AppLayout';
import {
  calculateStatistics,
  detectAnomaliesZScore,
  detectAnomaliesIQR,
  calculateHistogram,
  calculateAutoCorrelation,
  calculateCorrelation,
} from '@/lib/geophysic/statistics';
import {
  generatePDFReport,
  downloadFile,
  generateStatisticsTable,
  generateAnomalyReport,
} from '@/lib/geophysic/reports';

// Mock data
const mockData = Array.from({ length: 100 }, (_, i) => ({
  x: (i % 10) * 10,
  y: Math.floor(i / 10) * 10,
  value: 100 + Math.random() * 900,
  electrodeA: i,
  electrodeB: i + 1,
  electrodeM: i + 2,
  electrodeN: i + 3,
}));

const mockChargeabilityData = Array.from({ length: 100 }, (_, i) => ({
  x: (i % 10) * 10,
  y: Math.floor(i / 10) * 10,
  value: 10 + Math.random() * 90,
}));

function StatisticsPageContent() {
  const searchParams = useSearchParams();
  const { activeTab, setActiveTab } = useAppStore();

  // Get dataset ID from query params
  const datasetIdFromQuery = searchParams?.get('dataset') || '1';
  const [selectedDataset, setSelectedDataset] = useState(datasetIdFromQuery);
  const [activeAnalysis, setActiveAnalysis] = useState<'descriptive' | 'anomaly' | 'correlation'>('descriptive');

  // Statistics state
  const [statistics, setStatistics] = useState(null);
  const [anomalies, setAnomalies] = useState(null);
  const [histogram, setHistogram] = useState([]);

  // Anomaly detection settings
  const [anomalyMethod, setAnomalyMethod] = useState<'zscore' | 'iqr'>('zscore');
  const [anomalyThreshold, setAnomalyThreshold] = useState(3);

  useEffect(() => {
    if (activeTab !== 'statistics') {
      setActiveTab('statistics');
    }
  }, [activeTab, setActiveTab]);

  // Update selected dataset when query param changes
  useEffect(() => {
    if (datasetIdFromQuery) {
      setSelectedDataset(datasetIdFromQuery);
    }
  }, [datasetIdFromQuery]);

  const handleCalculateStatistics = () => {
    const stats = calculateStatistics(mockData);
    setStatistics(stats);
    setActiveAnalysis('descriptive');
  };

  const handleDetectAnomalies = () => {
    let anomalyResult;

    if (anomalyMethod === 'zscore') {
      anomalyResult = detectAnomaliesZScore(mockData, anomalyThreshold);
    } else {
      anomalyResult = detectAnomaliesIQR(mockData, anomalyThreshold);
    }

    setAnomalies(anomalyResult);
    setActiveAnalysis('anomaly');
  };

  const handleGenerateHistogram = () => {
    const hist = calculateHistogram(mockData, 20);
    setHistogram(hist);
    setActiveAnalysis('descriptive');
  };

  const handleCalculateCorrelation = () => {
    const correlation = calculateCorrelation(mockData, mockChargeabilityData);
    console.log('Correlation:', correlation);
  };

  const handleExportReport = async () => {
    if (!statistics) return;

    const sections = [
      {
        id: 'statistics',
        title: 'Statistiques Descriptives',
        type: 'table' as const,
        content: generateStatisticsTable(statistics),
        order: 1,
      },
    ];

    if (anomalies) {
      sections.push({
        id: 'anomalies',
        title: 'Rapport des Anomalies',
        type: 'table' as const,
        content: {
          headers: ['Méthode', 'Total anomalies', 'Confiance'],
          rows: [
            [
              anomalies.detectionMethod,
              anomalies.anomalies.length,
              `${(anomalies.confidence * 100).toFixed(2)}%`,
            ],
          ],
        },
        order: 2,
      });
    }

    try {
      const pdf = await generatePDFReport({
        title: 'Rapport d\'Analyse Statistique',
        subtitle: `Dataset: ${selectedDataset}`,
        sections,
      });
      downloadFile(pdf, `statistiques_report_${Date.now()}.pdf`, 'application/pdf');
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  return (
    <AppLayout headerTitle="Statistiques">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <BarChart3 className="w-6 h-6" />
          Analyse Statistique
        </h1>
        <p className="text-muted-foreground mt-1">
          Statistiques descriptives, détection d'anomalies et corrélations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Controls */}
        <div className="space-y-6">
          {/* Dataset Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Jeux de données</CardTitle>
            </CardHeader>
            <CardContent>
              <select
                className="w-full p-2 bg-background border border-input rounded-md"
                value={selectedDataset}
                onChange={(e) => setSelectedDataset(e.target.value)}
              >
                <option value="1">Données résistivité - Ligne 001</option>
                <option value="2">Données chargeabilité - Ligne 001</option>
                <option value="3">Données RES2DINV - Ligne 002</option>
              </select>
            </CardContent>
          </Card>

          {/* Analysis Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Analyses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                onClick={handleCalculateStatistics}
                className="w-full justify-start gap-2"
                variant="outline"
              >
                <Activity className="w-4 h-4" />
                Statistiques descriptives
              </Button>
              <Button
                onClick={handleDetectAnomalies}
                className="w-full justify-start gap-2"
                variant="outline"
              >
                <TrendingUp className="w-4 h-4" />
                Détection d'anomalies
              </Button>
              <Button
                onClick={handleGenerateHistogram}
                className="w-full justify-start gap-2"
                variant="outline"
              >
                <BarChart3 className="w-4 h-4" />
                Histogramme
              </Button>
              <Button
                onClick={handleCalculateCorrelation}
                className="w-full justify-start gap-2"
                variant="outline"
              >
                <Activity className="w-4 h-4" />
                Corrélation R-IP
              </Button>
            </CardContent>
          </Card>

          {/* Anomaly Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Paramètres Anomalies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-2 block">Méthode de détection</label>
                <select
                  className="w-full p-2 bg-background border border-input rounded-md"
                  value={anomalyMethod}
                  onChange={(e) => setAnomalyMethod(e.target.value as any)}
                >
                  <option value="zscore">Z-Score</option>
                  <option value="iqr">IQR (Interquartile Range)</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Seuil: {anomalyThreshold}σ</label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={0.1}
                  value={anomalyThreshold}
                  onChange={(e) => setAnomalyThreshold(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Results */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs value={activeAnalysis} onValueChange={(v: any) => setActiveAnalysis(v)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="descriptive">Descriptives</TabsTrigger>
              <TabsTrigger value="anomaly">Anomalies</TabsTrigger>
              <TabsTrigger value="correlation">Corrélation</TabsTrigger>
            </TabsList>

            {/* Descriptive Statistics Tab */}
            <TabsContent value="descriptive" className="space-y-4 mt-4">
              {statistics ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Statistiques Principales</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">Moyenne</div>
                          <div className="text-2xl font-bold text-primary">{statistics.mean.toFixed(2)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">Médiane</div>
                          <div className="text-2xl font-bold text-primary">{statistics.median.toFixed(2)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">Écart-type</div>
                          <div className="text-2xl font-bold text-primary">{statistics.stdDev.toFixed(2)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">Étendue</div>
                          <div className="text-2xl font-bold text-primary">{(statistics.max - statistics.min).toFixed(2)}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardDescription>Tendance</CardDescription>
                        <CardTitle className="text-xl">
                          {statistics.skewness && statistics.skewness > 0 ? 'Positively skewée' : 'Négativement skewée'}
                        </CardTitle>
                      </CardHeader>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardDescription>Aplatissement</CardDescription>
                        <CardTitle className="text-xl">
                          {statistics.kurtosis && statistics.kurtosis > 0 ? 'Leptokurtique' : 'Platykurtique'}
                        </CardTitle>
                      </CardHeader>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Minimum:</span>
                          <span className="font-medium">{statistics.min.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Q1 (25%):</span>
                          <span className="font-medium">{statistics.q25.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Q3 (75%):</span>
                          <span className="font-medium">{statistics.q75.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Maximum:</span>
                          <span className="font-medium">{statistics.max.toFixed(2)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="flex items-center justify-center p-12">
                  <div className="text-center space-y-4">
                    <Activity className="w-12 h-12 text-muted-foreground mx-auto" />
                    <div>
                      <h3 className="font-semibold text-lg">Aucune analyse</h3>
                      <p className="text-muted-foreground text-sm mt-1">
                        Sélectionnez une analyse dans le menu de gauche
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </TabsContent>

            {/* Anomalies Tab */}
            <TabsContent value="anomaly" className="space-y-4 mt-4">
              {anomalies ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Résultats de Détection</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                          <div className="text-sm text-orange-700 mb-1">Anomalies détectées</div>
                          <div className="text-3xl font-bold text-orange-500">
                            {anomalies.anomalies.length}
                          </div>
                        </div>
                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                          <div className="text-sm text-green-700 mb-1">Confiance</div>
                          <div className="text-3xl font-bold text-green-500">
                            {(anomalies.confidence * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                        <div className="text-sm text-muted-foreground">
                          <p><strong>Méthode:</strong> {anomalies.detectionMethod}</p>
                          <p className="mt-1"><strong>Seuil:</strong> {anomalies.threshold}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Détail des Anomalies</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="max-h-[300px] overflow-y-auto space-y-2">
                        {anomalies.anomalies.map((anomaly, index) => (
                          <div
                            key={index}
                            className="p-3 border rounded-lg flex items-center justify-between hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-1">
                              <div className="text-sm font-medium">
                                Position: X={anomaly.location.x}m, Y={anomaly.location.y}m
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Valeur: {anomaly.value.toFixed(2)} | Signification: {anomaly.significance.toFixed(2)}
                              </div>
                            </div>
                            <Badge
                              variant={anomaly.type === 'high' ? 'destructive' : 'default'}
                              className="ml-2"
                            >
                              {anomaly.type === 'high' ? 'Haut' : 'Bas'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="flex items-center justify-center p-12">
                  <div className="text-center space-y-4">
                    <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto" />
                    <div>
                      <h3 className="font-semibold text-lg">Aucune anomalie détectée</h3>
                      <p className="text-muted-foreground text-sm mt-1">
                        Exécutez la détection d'anomalies
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </TabsContent>

            {/* Correlation Tab */}
            <TabsContent value="correlation" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Corrélation R-IP</CardTitle>
                  <CardDescription>
                    Analyse de la relation entre résistivité et chargeabilité
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center p-8 bg-muted/30 rounded-lg">
                    <Activity className="w-12 h-12 text-primary mx-auto mb-4" />
                    <div className="text-2xl font-bold text-primary mb-2">
                      En cours...
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Calcul du coefficient de corrélation
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Export Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleExportReport}
              disabled={!statistics}
              className="gap-2"
              size="lg"
            >
              <Download className="w-5 h-5" />
              Exporter le rapport
            </Button>
          </div>
        </div>
      </div>
      </div>
    </AppLayout>
  );
}

export default function StatisticsPage() {
  return (
    <Suspense fallback={
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        </div>
      </AppLayout>
    }>
      <StatisticsPageContent />
    </Suspense>
  );
}
