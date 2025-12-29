'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Box, Grid3x3, Layers, Maximize2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/store/useAppStore';
import { ModelGrid, ColorScale } from '@/types/geophysic';
import AppLayout from '@/components/layout/AppLayout';
import { exportToOBJ, exportToSTL, downloadFile } from '@/lib/geophysic/exports';
import { toggleFullscreen } from '@/lib/utils/fullscreen';
import type { VolumeVisualizationHandle } from '@/components/geophysic/visualization/VolumeVisualization';

// Dynamically import VolumeVisualization to avoid SSR issues with @react-three/fiber
const VolumeVisualization = dynamic(
  () => import('@/components/geophysic/visualization/VolumeVisualization'),
  {
    ssr: false,
    loading: () => (
      <Card className="w-full">
        <CardContent className="p-12" style={{ minHeight: '600px' }}>
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground">Chargement de la visualisation 3D...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    ),
  }
);

// Mock model data
const mockModel: ModelGrid & { name?: string; gridGeometry?: any } = {
  name: 'Modèle inversé - Résistivité 2D',
  dimensions: { x: 10, y: 10 },
  values: Array.from({ length: 100 }, () => 100 + Math.random() * 900),
  coordinates: {
    x: Array.from({ length: 10 }, (_, i) => i * 10),
    y: Array.from({ length: 10 }, (_, i) => i * 10),
  },
  gridGeometry: {
    origin: { x: 0, y: 0 },
    spacing: { dx: 10, dy: 10 },
    cellCount: { nx: 10, ny: 10 },
  },
};

type RenderMode = 'surface' | 'volume' | 'slices' | 'isosurfaces';

export default function Visualization3DPage() {
  const { activeTab, setActiveTab, visualizationSettings, updateVisualizationSettings } = useAppStore();
  const visualizationRef = useRef<HTMLDivElement>(null);
  const volumeVisualizationRef = useRef<VolumeVisualizationHandle>(null);

  const [selectedModel, setSelectedModel] = useState('1');
  const [isRotating, setIsRotating] = useState(false);
  const [renderMode, setRenderMode] = useState<RenderMode>('volume');

  useEffect(() => {
    if (activeTab !== 'visualization-3d') {
      setActiveTab('visualization-3d');
    }
  }, [activeTab, setActiveTab]);

  const handleAutoRotate = () => {
    setIsRotating(!isRotating);
  };

  const handleFullscreen = async () => {
    if (visualizationRef.current) {
      try {
        await toggleFullscreen(visualizationRef.current);
      } catch (error) {
        console.error('Error toggling fullscreen:', error);
      }
    }
  };

  const handleGridToggle = () => {
    updateVisualizationSettings({ showGrid: !visualizationSettings.showGrid });
  };

  const handleRenderModeChange = (mode: RenderMode) => {
    setRenderMode(mode);
  };

  const handleNewView = () => {
    // Reset camera view - this will be handled by VolumeVisualization component
    if (volumeVisualizationRef.current?.resetView) {
      volumeVisualizationRef.current.resetView();
    }
  };

  const handleExport = (format: 'OBJ' | 'STL' = 'OBJ') => {
    try {
      // Use mockModel for export (in production, fetch actual model from API)
      const modelForExport = {
        dimensions: mockModel.dimensions,
        values: mockModel.values,
        coordinates: mockModel.coordinates,
      };

      let content: string;
      let filename: string;
      let mimeType: string;

      if (format === 'OBJ') {
        content = exportToOBJ(modelForExport as any, `model_${selectedModel}.obj`);
        filename = `model_${selectedModel}.obj`;
        mimeType = 'text/plain';
      } else {
        content = exportToSTL(modelForExport as any, `model_${selectedModel}.stl`);
        filename = `model_${selectedModel}.stl`;
        mimeType = 'text/plain';
      }

      const blob = new Blob([content], { type: mimeType });
      downloadFile(blob, filename);
    } catch (error) {
      console.error('Error exporting 3D model:', error);
      alert('Erreur lors de l\'export du modèle 3D');
    }
  };

  return (
    <AppLayout headerTitle="Visualisation 3D">
      <div className="p-6 min-h-screen bg-background">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Box className="w-6 h-6" />
          Visualisation 3D Volumétrique
        </h1>
        <p className="text-muted-foreground mt-1">
          Explorez vos modèles géophysiques en trois dimensions
        </p>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <Label>Sélectionner un modèle</Label>
          <select
            className="w-full mt-2 p-2 bg-background border border-input rounded-md"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
          >
            <option value="1">Modèle inversé - Résistivité 2D</option>
            <option value="2">Modèle inversé - Chargeabilité 2D</option>
            <option value="3">Modèle inversé - Résistivité 3D</option>
          </select>
        </div>

        <div className="flex gap-2">
          <Button 
            variant={visualizationSettings.showGrid ? 'default' : 'outline'} 
            size="sm"
            onClick={handleGridToggle}
          >
            <Grid3x3 className="w-4 h-4 mr-1" />
            Grille
          </Button>
          <Button variant={isRotating ? 'default' : 'outline'} size="sm" onClick={handleAutoRotate}>
            <Layers className={`w-4 h-4 mr-1 ${isRotating ? 'animate-spin' : ''}`} />
            Rotation auto
          </Button>
          <Button variant="outline" size="sm" onClick={handleFullscreen}>
            <Maximize2 className="w-4 h-4 mr-1" />
            Plein écran
          </Button>
        </div>
      </div>

      {/* Main Visualization */}
      <div className="mb-6" ref={visualizationRef}>
        <VolumeVisualization
          model={mockModel}
          title={mockModel.name || 'Modèle Géophysique 3D'}
          description="Visualisation volumétrique du modèle inversé"
          showControls={true}
          ref={volumeVisualizationRef}
        />
      </div>

      {/* Controls Sidebar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contrôles de visualisation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Échelle de couleur</Label>
            <div className="grid grid-cols-4 gap-2">
              {[
                ColorScale.VIRIDIS,
                ColorScale.PLASMA,
                ColorScale.INFERNO,
                ColorScale.JET,
              ].map((scale) => (
                <Button
                  key={scale}
                  variant={visualizationSettings.colorScale === scale ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    updateVisualizationSettings({ colorScale: scale });
                  }}
                  className="text-xs"
                >
                  {scale.split('_')[0]}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Opacité</Label>
              <span className="text-sm text-muted-foreground">
                {visualizationSettings.opacity.toFixed(2)}
              </span>
            </div>
            <Slider
              value={[visualizationSettings.opacity]}
              onValueChange={([value]) => updateVisualizationSettings({ opacity: value })}
              min={0.1}
              max={1}
              step={0.05}
            />
          </div>

          <div className="space-y-2">
            <Label>Mode de rendu</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant={renderMode === 'surface' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => handleRenderModeChange('surface')}
              >
                Surface
              </Button>
              <Button 
                variant={renderMode === 'volume' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => handleRenderModeChange('volume')}
              >
                Volume
              </Button>
              <Button 
                variant={renderMode === 'slices' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => handleRenderModeChange('slices')}
              >
                Coupes
              </Button>
              <Button 
                variant={renderMode === 'isosurfaces' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => handleRenderModeChange('isosurfaces')}
              >
                Iso-surfaces
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex gap-2">
              <Button className="flex-1 gap-2" onClick={handleExport}>
                <Download className="w-4 h-4" />
                Exporter modèle
              </Button>
              <Button variant="outline" className="flex-1 gap-2" onClick={handleNewView}>
                <Box className="w-4 h-4" />
                Nouvelle vue
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardDescription>Nombre de cellules</CardDescription>
            <CardTitle className="text-2xl">{mockModel.values.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardDescription>Dimensions</CardDescription>
            <CardTitle className="text-2xl">
              {mockModel.dimensions.x}×{mockModel.dimensions.y}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardDescription>Résolution X</CardDescription>
            <CardTitle className="text-2xl">{mockModel.gridGeometry.spacing.dx}m</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardDescription>Résolution Y</CardDescription>
            <CardTitle className="text-2xl">{mockModel.gridGeometry.spacing.dy}m</CardTitle>
          </CardHeader>
        </Card>
      </div>
      </div>
    </AppLayout>
  );
}
