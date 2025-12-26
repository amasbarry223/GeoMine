'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  Grid3x3,
  Palette,
  Maximize,
} from 'lucide-react';
import { DataPoint, ColorScale, ModelGrid } from '@/types/geophysic';
import Plot from './PlotlyChart';

interface PseudoSectionProps {
  data: DataPoint[];
  title?: string;
  description?: string;
  onDataPointClick?: (point: DataPoint) => void;
  showControls?: boolean;
  height?: number;
}

interface VisualizationControls {
  colorScale: ColorScale;
  showGrid: boolean;
  showContours: boolean;
  contourLevels: number;
  opacity: number;
  colorRange: { min: number; max: number };
}

// Color scale definitions
const COLOR_SCALES: Record<ColorScale, { colorscale: any; name: string }> = {
  [ColorScale.RAINBOW]: { colorscale: 'Rainbow', name: 'Arc-en-ciel' },
  [ColorScale.JET]: { colorscale: 'Jet', name: 'Jet' },
  [ColorScale.VIRIDIS]: { colorscale: 'Viridis', name: 'Viridis' },
  [ColorScale.PLASMA]: { colorscale: 'Plasma', name: 'Plasma' },
  [ColorScale.INFERNO]: { colorscale: 'Inferno', name: 'Inferno' },
  [ColorScale.GRAYSCALE]: { colorscale: 'Greys', name: 'Niveaux de gris' },
  [ColorScale.SEISMIC]: { colorscale: 'Seismic', name: 'Sismique' },
  [ColorScale.CUSTOM]: { colorscale: 'Rainbow', name: 'Personnalisé' },
};

function generateHeatmapData(data: DataPoint[], colorScale: ColorScale) {
  // Organize data into a grid
  const xValues = [...new Set(data.map((p) => p.x))].sort((a, b) => a - b);
  const yValues = [...new Set(data.map((p) => p.y))].sort((a, b) => a - b);

  // Create 2D grid
  const zValues: number[][] = [];
  for (const y of yValues) {
    const row: number[] = [];
    for (const x of xValues) {
      const point = data.find((p) => p.x === x && p.y === y);
      row.push(point ? point.value : null);
    }
    zValues.push(row);
  }

  return {
    x: xValues,
    y: yValues,
    z: zValues,
    colorscale: COLOR_SCALES[colorScale].colorscale,
    type: 'heatmap' as const,
    showscale: true,
    colorbar: {
      title: {
        text: 'Valeur',
        side: 'right',
      },
      thickness: 20,
      len: 0.8,
    },
  };
}

export default function PseudoSection({
  data,
  title = 'Pseudo-section',
  description,
  onDataPointClick,
  showControls = true,
  height = 600,
}: PseudoSectionProps) {
  const [controls, setControls] = useState<VisualizationControls>({
    colorScale: ColorScale.VIRIDIS,
    showGrid: true,
    showContours: true,
    contourLevels: 10,
    opacity: 1,
    colorRange: { min: 0, max: 100 },
  });

  const [selectedPoint, setSelectedPoint] = useState<DataPoint | null>(null);

  // Calculate automatic color range from data
  useEffect(() => {
    if (data.length > 0) {
      const values = data.map((p) => p.value).filter((v) => !isNaN(v) && isFinite(v));
      const min = Math.min(...values);
      const max = Math.max(...values);
      setControls((prev) => ({
        ...prev,
        colorRange: { min, max },
      }));
    }
  }, [data]);

  const heatmapData = generateHeatmapData(data, controls.colorScale);

  const layout = {
    title: {
      text: title,
      font: {
        size: 16,
        color: '#95a5a6',
      },
    },
    xaxis: {
      title: 'Distance (m)',
      titlefont: { color: '#95a5a6' },
      tickfont: { color: '#95a5a6' },
      gridcolor: controls.showGrid ? '#2c3e50' : 'transparent',
      showgrid: controls.showGrid,
    },
    yaxis: {
      title: 'Profondeur (m)',
      titlefont: { color: '#95a5a6' },
      tickfont: { color: '#95a5a6' },
      gridcolor: controls.showGrid ? '#2c3e50' : 'transparent',
      showgrid: controls.showGrid,
      autorange: 'reversed' as const, // Depth increases downward
    },
    plot_bgcolor: '#1a1a2e',
    paper_bgcolor: '#1a1a2e',
    font: { color: '#95a5a6' },
    margin: {
      l: 80,
      r: 80,
      t: 60,
      b: 80,
    },
    hovermode: 'closest' as const,
    dragmode: 'pan' as const,
  };

  const config = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['sendDataToCloud', 'hoverClosestCartesian', 'hoverCompareCartesian'],
    toImageButtonOptions: {
      format: 'png',
      filename: `pseudosection-${title.replace(/\s+/g, '-').toLowerCase()}`,
      height: height,
      width: 1200,
      scale: 2,
    },
  };

  const handleRelayout = (event: any) => {
    console.log('Plot relayout:', event);
  };

  const handlePointClick = (event: any) => {
    const points = event.points;
    if (points && points.length > 0) {
      const point = points[0];
      const dataPoint = data.find((d) => d.x === point.x && d.y === point.y);
      if (dataPoint) {
        setSelectedPoint(dataPoint);
        if (onDataPointClick) {
          onDataPointClick(dataPoint);
        }
      }
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {data.length} points
            </Badge>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Exporter
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          {/* Main Plot Area */}
          <div className="flex-1">
            {Plot ? (
              <Plot
                data={[
                  {
                    ...heatmapData,
                    opacity: controls.opacity,
                    contours: controls.showContours
                      ? {
                          show: true,
                          color: '#e74c3c',
                          width: 1,
                          type: 'constraint',
                          operation: '=',
                          value: 0.5,
                        }
                      : undefined,
                  },
                ]}
                layout={layout}
                config={config}
                onRelayout={handleRelayout}
                onClick={handlePointClick}
                style={{ width: '100%', height: `${height}px` }}
                useResizeHandler
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm">Chargement du graphique...</p>
                </div>
              </div>
            )}

            {/* Selected Point Info */}
            {selectedPoint && (
              <Card className="mt-4 bg-muted/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="text-xs text-muted-foreground">Position</div>
                        <div className="text-sm font-medium">
                          X: {selectedPoint.x.toFixed(2)}m, Y: {selectedPoint.y.toFixed(2)}m
                        </div>
                      </div>
                      <Separator orientation="vertical" className="h-8" />
                      <div>
                        <div className="text-xs text-muted-foreground">Valeur</div>
                        <div className="text-sm font-medium">
                          {selectedPoint.value.toFixed(4)}
                        </div>
                      </div>
                      {selectedPoint.electrodeA !== undefined && (
                        <>
                          <Separator orientation="vertical" className="h-8" />
                          <div>
                            <div className="text-xs text-muted-foreground">Électrodes</div>
                            <div className="text-sm font-medium">
                              A{selectedPoint.electrodeA} B{selectedPoint.electrodeB} M{selectedPoint.electrodeM} N{selectedPoint.electrodeN}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedPoint(null)}>
                      Fermer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Controls Sidebar */}
          {showControls && (
            <Card className="w-72">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Contrôles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-4">
                    {/* Color Scale */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-sm">
                        <Palette className="w-4 h-4" />
                        Échelle de couleur
                      </Label>
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
                          {Object.entries(COLOR_SCALES).map(([key, { name }]) => (
                            <SelectItem key={key} value={key}>
                              {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    {/* Opacity */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-sm">
                        <Maximize className="w-4 h-4" />
                        Opacité: {controls.opacity.toFixed(2)}
                      </Label>
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

                    <Separator />

                    {/* Grid */}
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2 text-sm">
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

                    {/* Contours */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2 text-sm">
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
                            max={20}
                            step={1}
                          />
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Zoom Controls */}
                    <div className="space-y-2">
                      <Label className="text-sm">Zoom</Label>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-1"
                          onClick={() => {
                            // Programmatic zoom in
                            window.dispatchEvent(new KeyboardEvent('keydown', { key: '+' }));
                          }}
                        >
                          <ZoomIn className="w-4 h-4" />
                          +
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-1"
                          onClick={() => {
                            // Programmatic zoom out
                            window.dispatchEvent(new KeyboardEvent('keydown', { key: '-' }));
                          }}
                        >
                          <ZoomOut className="w-4 h-4" />
                          -
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-1"
                          onClick={() => {
                            // Reset zoom
                            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home' }));
                          }}
                        >
                          <RotateCcw className="w-4 h-4" />
                          Reset
                        </Button>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
