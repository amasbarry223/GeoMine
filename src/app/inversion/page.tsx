'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Zap,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Download,
  TrendingUp,
  Settings2,
  FileText,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore } from '@/store/useAppStore';
import { InversionType } from '@/types/geophysic';
import AppLayout from '@/components/layout/AppLayout';
import { useApi } from '@/hooks/use-api';
import { toast } from '@/hooks/use-toast';
import { exportToExcel, downloadFile } from '@/lib/geophysic/exports';

export default function InversionPage() {
  const router = useRouter();
  const { activeTab, setActiveTab } = useAppStore();

  const [selectedDataset, setSelectedDataset] = useState('1');
  const [inversionType, setInversionType] = useState<InversionType>(InversionType.RESISTIVITY_2D);
  const [progress, setProgress] = useState(0);
  const [currentIteration, setCurrentIteration] = useState(0);
  const [currentRMS, setCurrentRMS] = useState(1.234567);

  // Parameters
  const [maxIterations, setMaxIterations] = useState(20);
  const [convergenceThreshold, setConvergenceThreshold] = useState(0.001);
  const [regularizationFactor, setRegularizationFactor] = useState(0.1);
  const [smoothingFactor, setSmoothingFactor] = useState(0.1);
  const [dampingFactor, setDampingFactor] = useState(0.01);

  // Results
  const [results, setResults] = useState<any>(null);
  const [rmsHistory, setRmsHistory] = useState<number[]>([]);
  const { execute: executeInversion, loading: isRunning } = useApi();

  useEffect(() => {
    if (activeTab !== 'inversion') {
      setActiveTab('inversion');
    }
  }, [activeTab, setActiveTab]);

  const handleRunInversion = async () => {
    if (!selectedDataset) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un jeu de données',
        variant: 'destructive',
      });
      return;
    }

    setProgress(0);
    setCurrentIteration(0);
    setRmsHistory([]);

    const result = await executeInversion(
      () => fetch('/api/inversion/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datasetId: selectedDataset,
          modelName: `Modèle ${inversionType} - ${new Date().toLocaleString()}`,
          inversionType,
          parameters: {
            maxIterations,
            convergenceThreshold,
            regularizationFactor,
            smoothingFactor,
            dampingFactor,
          },
        }),
      }),
      {
        successMessage: 'Inversion terminée avec succès',
        errorMessage: 'Erreur lors de l\'exécution de l\'inversion',
        onSuccess: (data) => {
          if (data?.inversionResult) {
            const invResult = data.inversionResult;
            setResults(data);
            setCurrentIteration(invResult.iterations);
            setCurrentRMS(invResult.finalRMS);
            if (invResult.convergence) {
              setRmsHistory(invResult.convergence);
            }
            setProgress(100);
          }
        },
      }
    );
  };

  const handleReset = () => {
    setMaxIterations(20);
    setConvergenceThreshold(0.001);
    setRegularizationFactor(0.1);
    setSmoothingFactor(0.1);
    setDampingFactor(0.01);
    setProgress(0);
    setCurrentIteration(0);
    setCurrentRMS(0);
    setResults(null);
    setRmsHistory([]);
  };

  const getInversionTypeLabel = (type: InversionType): string => {
    switch (type) {
      case InversionType.RESISTIVITY_2D:
        return 'Résistivité 2D';
      case InversionType.CHARGEABILITY_2D:
        return 'Chargeabilité 2D';
      case InversionType.RESISTIVITY_3D:
        return 'Résistivité 3D';
      case InversionType.CHARGEABILITY_3D:
        return 'Chargeabilité 3D';
      case InversionType.JOINT_INVERSION:
        return 'Inversion conjointe';
      default:
        return type;
    }
  };

  return (
    <AppLayout headerTitle="Inversion Géophysique">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Zap className="w-6 h-6" />
              Inversion Géophysique
            </h1>
            <p className="text-muted-foreground mt-1">
              Convertissez les données de mesure en modèles de résistivité
            </p>
          </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dataset Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Jeux de données</CardTitle>
              <CardDescription>Sélectionnez les données à inverser</CardDescription>
            </CardHeader>
            <CardContent>
              <Label>Nom du dataset</Label>
              <select
                className="w-full mt-2 p-2 bg-background border border-input rounded-md"
                value={selectedDataset}
                onChange={(e) => setSelectedDataset(e.target.value)}
                disabled={isRunning}
              >
                <option value="1">Données résistivité - Ligne 001</option>
                <option value="2">Données chargeabilité - Ligne 001</option>
                <option value="3">Données RES2DINV - Ligne 002</option>
              </select>
            </CardContent>
          </Card>

          {/* Inversion Type */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Type d'inversion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    inversionType === InversionType.RESISTIVITY_2D
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setInversionType(InversionType.RESISTIVITY_2D)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="w-5 h-5 text-primary" />
                    <span className="font-medium">Résistivité 2D</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Inversion en coupe transversale
                  </p>
                </div>

                <div
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    inversionType === InversionType.CHARGEABILITY_2D
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setInversionType(InversionType.CHARGEABILITY_2D)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="w-5 h-5 text-orange-500" />
                    <span className="font-medium">Chargeabilité 2D</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Inversion de la chargeabilité
                  </p>
                </div>

                <div
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    inversionType === InversionType.RESISTIVITY_3D
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setInversionType(InversionType.RESISTIVITY_3D)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="w-5 h-5 text-blue-500" />
                    <span className="font-medium">Résistivité 3D</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Inversion volumétrique complète
                  </p>
                </div>

                <div
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    inversionType === InversionType.JOINT_INVERSION
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setInversionType(InversionType.JOINT_INVERSION)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    <span className="font-medium">Inversion conjointe</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Combinaison résistivité/chargeabilité
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Parameters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings2 className="w-5 h-5" />
                Paramètres avancés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic">Basique</TabsTrigger>
                  <TabsTrigger value="advanced">Avancé</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Nombre d'itérations maximum</Label>
                      <span className="text-sm font-mono">{maxIterations}</span>
                    </div>
                    <Slider
                      value={[maxIterations]}
                      onValueChange={(v) => setMaxIterations(v[0])}
                      min={5}
                      max={100}
                      step={5}
                      disabled={isRunning}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Seuil de convergence</Label>
                      <span className="text-sm font-mono">{convergenceThreshold.toExponential(2)}</span>
                    </div>
                    <Slider
                      value={[convergenceThreshold]}
                      onValueChange={(v) => setConvergenceThreshold(v[0])}
                      min={0.0001}
                      max={0.1}
                      step={0.0001}
                      disabled={isRunning}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Facteur de régularisation</Label>
                      <span className="text-sm font-mono">{regularizationFactor}</span>
                    </div>
                    <Slider
                      value={[regularizationFactor]}
                      onValueChange={(v) => setRegularizationFactor(v[0])}
                      min={0.001}
                      max={1}
                      step={0.01}
                      disabled={isRunning}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Contrôle la rugosité du modèle
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Facteur de lissage</Label>
                      <span className="text-sm font-mono">{smoothingFactor}</span>
                    </div>
                    <Slider
                      value={[smoothingFactor]}
                      onValueChange={(v) => setSmoothingFactor(v[0])}
                      min={0}
                      max={1}
                      step={0.01}
                      disabled={isRunning}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Lissage spatial entre cellules adjacentes
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Facteur d'amortissement</Label>
                      <span className="text-sm font-mono">{dampingFactor}</span>
                    </div>
                    <Slider
                      value={[dampingFactor]}
                      onValueChange={(v) => setDampingFactor(v[0])}
                      min={0.001}
                      max={0.1}
                      step={0.001}
                      disabled={isRunning}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Stabilité numérique pour l'inversion
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleRunInversion}
              disabled={isRunning}
              className="flex-1 gap-2"
              size="lg"
            >
              {isRunning ? (
                <>
                  Inversion en cours...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Lancer l'inversion
                </>
              )}
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              disabled={isRunning}
              size="lg"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Réinitialiser
            </Button>
          </div>
        </div>

        {/* Right Column - Progress & Results */}
        <div className="space-y-6">
          {/* Progress */}
          {isRunning && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Progression</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-5xl font-bold text-primary mb-2">
                    {progress.toFixed(0)}%
                  </div>
                  <div className="flex items-center justify-center gap-4 text-sm">
                    <span>Itération: <strong className="ml-1">{currentIteration}/{maxIterations}</strong></span>
                    <span>RMS: <strong className="ml-1">{currentRMS.toFixed(6)}</strong></span>
                  </div>
                </div>
                <Progress value={progress} className="h-3" />
                <p className="text-sm text-center text-muted-foreground">
                  Calcul du modèle en cours...
                </p>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {results && !isRunning && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Résultats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="font-medium text-green-700 mb-2">Inversion terminée avec succès</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-600">Itérations finales:</span>
                      <span className="font-medium">{results.finalIteration}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-600">Erreur RMS finale:</span>
                      <span className="font-medium">{results.finalRMS.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-600">Temps de calcul:</span>
                      <span className="font-medium">{results.runtime.toFixed(2)}s</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm mb-2">Historique de convergence</h4>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-end gap-1 h-20">
                        {rmsHistory.map((rms, index) => {
                          const maxRMS = Math.max(...rmsHistory);
                          const height = (rms / maxRMS) * 70;
                          const isLast = index === rmsHistory.length - 1;
                          return (
                            <div
                              key={index}
                              className="w-3 flex-shrink-0 bg-blue-500 rounded-t-sm"
                              style={{ height: `${height}px` }}
                              title={`Itération ${index + 1}: ${rms.toFixed(4)}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1 gap-2"
                      onClick={() => router.push(`/visualization-2d?model=${results.modelId || '1'}`)}
                    >
                      <FileText className="w-4 h-4" />
                      Voir modèle
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 gap-2"
                      onClick={() => {
                        if (results && results.model) {
                          try {
                            // Export model data as JSON
                            const exportData = {
                              model: results.model,
                              qualityIndicators: results.qualityIndicators,
                              convergence: results.convergence,
                              iterations: results.finalIteration,
                              rmsError: results.finalRMS,
                              runtime: results.runtime,
                              exportedAt: new Date().toISOString(),
                            };
                            const jsonData = JSON.stringify(exportData, null, 2);
                            const blob = new Blob([jsonData], { type: 'application/json' });
                            downloadFile(blob, `inversion_model_${results.modelId || Date.now()}.json`);
                            
                            toast({
                              title: 'Export réussi',
                              description: 'Modèle exporté en JSON',
                            });
                          } catch (error) {
                            toast({
                              title: 'Erreur d\'export',
                              description: 'Impossible d\'exporter le modèle',
                              variant: 'destructive',
                            });
                          }
                        } else {
                          toast({
                            title: 'Aucun modèle',
                            description: 'Aucun modèle disponible pour l\'export',
                            variant: 'destructive',
                          });
                        }
                      }}
                    >
                      <Download className="w-4 h-4" />
                      Exporter
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                Conseils
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <p>Commencez avec les paramètres par défaut, ajustez-les ensuite</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <p>Augmentez le nombre d'itérations pour une convergence plus précise</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <p>Un facteur de régularisation élevé produit un modèle plus lisse</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <p>Surveillez la convergence RMS pour détecter les problèmes</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <p>Les données bruitées peuvent nécessiter plus d'itérations</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </AppLayout>
  );
}
