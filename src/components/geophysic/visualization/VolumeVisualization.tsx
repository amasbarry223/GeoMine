'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Layers,
  RotateCw,
  Maximize2,
  Grid3x3,
  Box,
  ScanLine,
  Download,
} from 'lucide-react';
import { ModelGrid, ColorScale } from '@/types/geophysic';
import { exportToOBJ, exportToSTL, downloadFile } from '@/lib/geophysic/exports';
import { CrossSectionControls } from './CrossSectionControls';

// Dynamically import the 3D canvas component to avoid SSR issues with react-three
const DynamicVolumeCanvas = dynamic(
  () => import('./VolumeCanvas'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Chargement du canvas 3D...</p>
        </div>
      </div>
    ),
  }
);

interface VolumeVisualizationProps {
  model: ModelGrid;
  title?: string;
  description?: string;
  showControls?: boolean;
}

interface ViewControls {
  opacity: number;
  threshold: number;
  showGrid: boolean;
  showBoundingBox: true;
  colorScale: ColorScale;
  showContours: boolean;
  contourLevels: number;
  crossSections: {
    xy: { position: number; visible: boolean };
    xz: { position: number; visible: boolean };
    yz: { position: number; visible: boolean };
  };
}

// Note: Color scale functions have been moved to VolumeCanvas.tsx
// This file now only handles the UI controls

// Note: All 3D rendering components (VolumeCube, Scene, ContourLines) have been moved to VolumeCanvas.tsx
// This file now only handles the UI controls and uses DynamicVolumeCanvas for rendering

export default function VolumeVisualization({
  model,
  title = 'Modèle 3D',
  description,
  showControls = true,
}: VolumeVisualizationProps) {
  const [controls, setControls] = useState<ViewControls>({
    opacity: 0.8,
    threshold: 0.2,
    showGrid: true,
    showBoundingBox: true,
    colorScale: ColorScale.VIRIDIS,
    showContours: false,
    contourLevels: 5,
    crossSections: {
      xy: { position: model.coordinates.z?.[Math.floor((model.coordinates.z?.length || 1) / 2)] || 0, visible: false },
      xz: { position: model.coordinates.y[Math.floor(model.coordinates.y.length / 2)], visible: false },
      yz: { position: model.coordinates.x[Math.floor(model.coordinates.x.length / 2)], visible: false },
    },
    isosurfaces: {
      levels: [],
      visible: false,
    },
  });

  // Calculate value range
  const minValue = Math.min(...model.values);
  const maxValue = Math.max(...model.values);
  const valueRange = maxValue - minValue;

  const handleExportOBJ = () => {
    const objContent = exportToOBJ(model, `${title || 'model'}.obj`);
    const blob = new Blob([objContent], { type: 'text/plain' });
    downloadFile(blob, `${title || 'model'}.obj`);
  };

  const handleExportSTL = () => {
    const stlContent = exportToSTL(model, `${title || 'model'}.stl`);
    const blob = new Blob([stlContent], { type: 'text/plain' });
    downloadFile(blob, `${title || 'model'}.stl`);
  };

  const handleCrossSectionChange = (section: 'xy' | 'xz' | 'yz', position: number) => {
    setControls((prev) => ({
      ...prev,
      crossSections: {
        ...prev.crossSections,
        [section]: { ...prev.crossSections[section], position },
      },
    }));
  };

  const handleVisibilityToggle = (section: 'xy' | 'xz' | 'yz') => {
    setControls((prev) => ({
      ...prev,
      crossSections: {
        ...prev.crossSections,
        [section]: { ...prev.crossSections[section], visible: !prev.crossSections[section].visible },
      },
    }));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5" />
              {title}
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {model.dimensions.x}×{model.dimensions.y} cellules
            </Badge>
            <Button variant="outline" size="sm" onClick={handleExportOBJ}>
              <Download className="w-4 h-4 mr-1" />
              OBJ
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportSTL}>
              <Download className="w-4 h-4 mr-1" />
              STL
            </Button>
            <Button variant="outline" size="sm">
              <Maximize2 className="w-4 h-4 mr-1" />
              Plein écran
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          {/* 3D Viewport */}
          <div className="flex-1">
            <div className="aspect-square bg-slate-900 rounded-lg overflow-hidden">
              <DynamicVolumeCanvas model={model} controls={controls} />
            </div>

            {/* Value range display */}
            <div className="mt-4 flex items-center gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Min:</span>
                <span className="font-medium ml-1">{minValue.toFixed(2)}</span>
              </div>
              <div className="flex-1 h-4 bg-gradient-to-r from-blue-500 via-green-500 to-red-500 rounded" />
              <div>
                <span className="text-muted-foreground">Max:</span>
                <span className="font-medium ml-1">{maxValue.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Controls Sidebar */}
          {showControls && (
            <Card className="w-80">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Contrôles 3D</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-4">
                    {/* Color Scale */}
                    <div className="space-y-2">
                      <Label>Échelle de couleur</Label>
                      <Select
                        value={controls.colorScale}
                        onValueChange={(value: ColorScale) =>
                          setControls((prev) => ({ ...prev, colorScale: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ColorScale.VIRIDIS}>Viridis</SelectItem>
                          <SelectItem value={ColorScale.PLASMA}>Plasma</SelectItem>
                          <SelectItem value={ColorScale.INFERNO}>Inferno</SelectItem>
                          <SelectItem value={ColorScale.JET}>Jet</SelectItem>
                          <SelectItem value={ColorScale.RAINBOW}>Arc-en-ciel</SelectItem>
                          <SelectItem value={ColorScale.SEISMIC}>Sismique</SelectItem>
                          <SelectItem value={ColorScale.GRAYSCALE}>Niveaux de gris</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    {/* Opacity */}
                    <div className="space-y-2">
                      <Label>Opacité: {controls.opacity.toFixed(2)}</Label>
                      <Slider
                        value={[controls.opacity]}
                        onValueChange={([value]) =>
                          setControls((prev) => ({ ...prev, opacity: value }))
                        }
                        min={0.1}
                        max={1}
                        step={0.05}
                      />
                    </div>

                    {/* Threshold */}
                    <div className="space-y-2">
                      <Label>Seuil: {(controls.threshold * 100).toFixed(0)}%</Label>
                      <Slider
                        value={[controls.threshold]}
                        onValueChange={([value]) =>
                          setControls((prev) => ({ ...prev, threshold: value }))
                        }
                        min={0}
                        max={1}
                        step={0.01}
                      />
                    </div>

                    <Separator />

                    {/* Grid */}
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Grid3x3 className="w-4 h-4" />
                        Grille
                      </Label>
                      <Button
                        variant={controls.showGrid ? 'default' : 'outline'}
                        size="sm"
                        onClick={() =>
                          setControls((prev) => ({ ...prev, showGrid: !prev.showGrid }))
                        }
                      >
                        {controls.showGrid ? 'Activé' : 'Désactivé'}
                      </Button>
                    </div>

                    {/* Bounding Box */}
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Box className="w-4 h-4" />
                        Boîte englobante
                      </Label>
                      <Button
                        variant={controls.showBoundingBox ? 'default' : 'outline'}
                        size="sm"
                        onClick={() =>
                          setControls((prev) => ({ ...prev, showBoundingBox: !prev.showBoundingBox }))
                        }
                      >
                        {controls.showBoundingBox ? 'Activé' : 'Désactivé'}
                      </Button>
                    </div>

                    {/* Contours */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <ScanLine className="w-4 h-4" />
                          Contours
                        </Label>
                        <Button
                          variant={controls.showContours ? 'default' : 'outline'}
                          size="sm"
                          onClick={() =>
                            setControls((prev) => ({ ...prev, showContours: !prev.showContours }))
                          }
                        >
                          {controls.showContours ? 'Activé' : 'Désactivé'}
                        </Button>
                      </div>
                      {controls.showContours && (
                        <div className="space-y-2">
                          <Label className="text-xs">Niveaux: {controls.contourLevels}</Label>
                          <Slider
                            value={[controls.contourLevels]}
                            onValueChange={([value]) =>
                              setControls((prev) => ({ ...prev, contourLevels: value }))
                            }
                            min={2}
                            max={10}
                            step={1}
                          />
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Isosurfaces */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <ScanLine className="w-4 h-4" />
                          Isosurfaces
                        </Label>
                        <Button
                          variant={controls.isosurfaces.visible ? 'default' : 'outline'}
                          size="sm"
                          onClick={() =>
                            setControls((prev) => ({
                              ...prev,
                              isosurfaces: { ...prev.isosurfaces, visible: !prev.isosurfaces.visible },
                            }))
                          }
                        >
                          {controls.isosurfaces.visible ? 'Activé' : 'Désactivé'}
                        </Button>
                      </div>
                      {controls.isosurfaces.visible && (
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">
                            Niveaux: {controls.isosurfaces.levels.length > 0
                              ? controls.isosurfaces.levels.map((l) => l.toFixed(2)).join(', ')
                              : 'Aucun'}
                          </Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newLevel = minValue + (maxValue - minValue) * 0.5;
                              setControls((prev) => ({
                                ...prev,
                                isosurfaces: {
                                  ...prev.isosurfaces,
                                  levels: [...prev.isosurfaces.levels, newLevel],
                                },
                              }));
                            }}
                          >
                            Ajouter niveau
                          </Button>
                          {controls.isosurfaces.levels.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setControls((prev) => ({
                                  ...prev,
                                  isosurfaces: { ...prev.isosurfaces, levels: [] },
                                }))
                              }
                            >
                              Effacer tous
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* View Controls */}
                    <div className="space-y-2">
                      <Label>Vue</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" onClick={() => setControls((prev) => ({ ...prev }))}>
                          <RotateCw className="w-4 h-4 mr-1" />
                          Reset
                        </Button>
                        <Button variant="outline" size="sm">
                          <Maximize2 className="w-4 h-4 mr-1" />
                          Vue de dessus
                        </Button>
                      </div>
                    </div>

                    {/* Statistics */}
                    <div className="space-y-2">
                      <Label>Statistiques</Label>
                      <div className="bg-muted rounded-lg p-3 space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Nombre de cellules:</span>
                          <span className="font-medium">{model.values.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Valeur min:</span>
                          <span className="font-medium">{minValue.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Valeur max:</span>
                          <span className="font-medium">{maxValue.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Étendue:</span>
                          <span className="font-medium">{valueRange.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Cross Section Controls */}
          {showControls && (
            <CrossSectionControls
              model={model}
              crossSections={controls.crossSections}
              onCrossSectionChange={handleCrossSectionChange}
              onVisibilityToggle={handleVisibilityToggle}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
