'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { BarChart3, Grid3x3, Layers, Maximize2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore } from '@/store/useAppStore';
import { DataPoint, ColorScale } from '@/types/geophysic';
import AppLayout from '@/components/layout/AppLayout';

// Import PseudoSection with Recharts (no SSR issues)
import PseudoSection from '@/components/geophysic/visualization/PseudoSectionRecharts';

// Mock data
const mockDatasets = [
  {
    id: '1',
    name: 'Données brutes',
    points: Array.from({ length: 100 }, (_, i) => ({
      x: (i % 10) * 10,
      y: Math.floor(i / 10) * 10,
      value: 100 + Math.random() * 900,
    })),
  },
  {
    id: '2',
    name: 'Données pré-traitées',
    points: Array.from({ length: 100 }, (_, i) => ({
      x: (i % 10) * 10,
      y: Math.floor(i / 10) * 10,
      value: 100 + Math.random() * 500,
    })),
  },
  {
    id: '3',
    name: 'Modèle inversé',
    points: Array.from({ length: 100 }, (_, i) => ({
      x: (i % 10) * 10,
      y: Math.floor(i / 10) * 10,
      value: 200 + Math.random() * 800,
    })),
  },
];

export default function Visualization2DPage() {
  const { activeTab, setActiveTab, visualizationSettings, updateVisualizationSettings } = useAppStore();
  const [selectedDataset, setSelectedDataset] = useState('1');
  const [selectedModel, setSelectedModel] = useState('3');
  const [colorScale, setColorScale] = useState<ColorScale>(visualizationSettings.colorScale);
  const [showGrid, setShowGrid] = useState(visualizationSettings.showGrid);
  const [showContours, setShowContours] = useState(visualizationSettings.showContours);

  useEffect(() => {
    if (activeTab !== 'visualization-2d') {
      setActiveTab('visualization-2d');
    }
  }, [activeTab, setActiveTab]);

  const handleColorScaleChange = (scale: ColorScale) => {
    setColorScale(scale);
    updateVisualizationSettings({ colorScale: scale });
  };

  const currentDataset = mockDatasets.find((d) => d.id === selectedDataset) || mockDatasets[0];
  const currentModel = mockDatasets.find((d) => d.id === selectedModel) || mockDatasets[2];

  return (
    <AppLayout headerTitle="Visualisation 2D">
      <div className="p-6 min-h-screen bg-background">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <BarChart3 className="w-6 h-6" />
          Visualisation 2D
        </h1>
        <p className="text-muted-foreground mt-1">
          Visualisez et analysez vos données géophysiques en pseudo-sections interactives
        </p>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <Tabs defaultValue="datasets" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:w-[400px] lg:grid-cols-4">
              <TabsTrigger value="datasets">Données</TabsTrigger>
              <TabsTrigger value="models">Modèles</TabsTrigger>
            </TabsList>

            <TabsContent value="datasets" className="space-y-2 mt-4">
              <select
                className="w-full p-2 bg-background border border-input rounded-md"
                value={selectedDataset}
                onChange={(e) => setSelectedDataset(e.target.value)}
              >
                {mockDatasets.map((dataset) => (
                  <option key={dataset.id} value={dataset.id}>
                    {dataset.name}
                  </option>
                ))}
              </select>
            </TabsContent>

            <TabsContent value="models" className="space-y-2 mt-4">
              <select
                className="w-full p-2 bg-background border border-input rounded-md"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
              >
                {mockDatasets.filter((d) => d.id === '3' || d.id === '4').map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={showGrid ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setShowGrid(!showGrid);
              updateVisualizationSettings({ showGrid: !showGrid });
            }}
          >
            <Grid3x3 className="w-4 h-4 mr-1" />
            Grille
          </Button>
          <Button
            variant={showContours ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setShowContours(!showContours);
              updateVisualizationSettings({ showContours: !showContours });
            }}
          >
            <Layers className="w-4 h-4 mr-1" />
            Contours
          </Button>
        </div>
      </div>

      {/* Main Visualization */}
      <div className="space-y-6">
        <PseudoSection
          data={currentDataset.points as DataPoint[]}
          title={currentDataset.name}
          description="Visualisation des données de résistivité"
          showControls={true}
          height={600}
          colorScale={colorScale}
          showGrid={showGrid}
          showContours={showContours}
        />

        {/* Model Visualization */}
        <PseudoSection
          data={currentModel.points as DataPoint[]}
          title={currentModel.name}
          description="Modèle inversé avec algorithme Least-Squares"
          showControls={true}
          height={600}
          colorScale={colorScale}
          showGrid={showGrid}
          showContours={showContours}
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardDescription>Valeurs min</CardDescription>
            <CardTitle className="text-2xl">
              {Math.min(...currentDataset.points.map((p) => p.value)).toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardDescription>Valeurs moyennes</CardDescription>
            <CardTitle className="text-2xl">
              {(currentDataset.points.reduce((sum, p) => sum + p.value, 0) / currentDataset.points.length).toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardDescription>Valeurs max</CardDescription>
            <CardTitle className="text-2xl">
              {Math.max(...currentDataset.points.map((p) => p.value)).toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
      </div>
    </AppLayout>
  );
}
