'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import { DataPoint, ColorScale } from '@/types/geophysic';

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

// Color scale functions for Recharts
function getColorForValue(value: number, min: number, max: number, scale: ColorScale): string {
  if (isNaN(value) || !isFinite(value)) return '#000000';
  
  const normalized = (value - min) / (max - min || 1);
  const clamped = Math.max(0, Math.min(1, normalized));

  switch (scale) {
    case ColorScale.VIRIDIS:
      // Viridis color scale approximation
      if (clamped < 0.25) return `rgb(${68 + clamped * 40}, ${1 + clamped * 20}, ${84 + clamped * 20})`;
      if (clamped < 0.5) return `rgb(${59 + (clamped - 0.25) * 100}, ${82 + (clamped - 0.25) * 50}, ${139 + (clamped - 0.25) * 50})`;
      if (clamped < 0.75) return `rgb(${33 + (clamped - 0.5) * 100}, ${144 + (clamped - 0.5) * 50}, ${140 + (clamped - 0.5) * 50})`;
      return `rgb(${253 - (clamped - 0.75) * 100}, ${231 - (clamped - 0.75) * 50}, ${37 + (clamped - 0.75) * 50})`;
    
    case ColorScale.PLASMA:
      // Plasma color scale approximation
      if (clamped < 0.33) return `rgb(${13 + clamped * 50}, ${8 + clamped * 30}, ${135 + clamped * 50})`;
      if (clamped < 0.66) return `rgb(${75 + (clamped - 0.33) * 100}, ${3 + (clamped - 0.33) * 50}, ${125 + (clamped - 0.33) * 50})`;
      return `rgb(${252 - (clamped - 0.66) * 50}, ${141 + (clamped - 0.66) * 50}, ${89 + (clamped - 0.66) * 100})`;
    
    case ColorScale.INFERNO:
      // Inferno color scale approximation
      if (clamped < 0.33) return `rgb(${0}, ${0}, ${4 + clamped * 10})`;
      if (clamped < 0.66) return `rgb(${87 + (clamped - 0.33) * 100}, ${16 + (clamped - 0.33) * 50}, ${125 + (clamped - 0.33) * 50})`;
      return `rgb(${252 - (clamped - 0.66) * 50}, ${255 - (clamped - 0.66) * 50}, ${164 + (clamped - 0.66) * 50})`;
    
    case ColorScale.JET:
      // Jet color scale
      if (clamped < 0.25) return `rgb(${0}, ${0}, ${127 + clamped * 128})`;
      if (clamped < 0.5) return `rgb(${0}, ${(clamped - 0.25) * 1024}, ${255})`;
      if (clamped < 0.75) return `rgb(${(clamped - 0.5) * 1024}, ${255}, ${255 - (clamped - 0.5) * 255})`;
      return `rgb(${255}, ${255 - (clamped - 0.75) * 255}, ${0})`;
    
    case ColorScale.RAINBOW:
      // Rainbow color scale
      const hue = clamped * 360;
      return `hsl(${hue}, 100%, 50%)`;
    
    case ColorScale.GRAYSCALE:
      const gray = Math.floor(clamped * 255);
      return `rgb(${gray}, ${gray}, ${gray})`;
    
    case ColorScale.SEISMIC:
      // Seismic color scale (blue-white-red)
      if (clamped < 0.5) {
        const blueIntensity = Math.floor((0.5 - clamped) * 2 * 255);
        return `rgb(${blueIntensity}, ${blueIntensity}, ${255})`;
      } else {
        const redIntensity = Math.floor((clamped - 0.5) * 2 * 255);
        return `rgb(${255}, ${255 - redIntensity}, ${255 - redIntensity})`;
      }
    
    default:
      return `rgb(${Math.floor(clamped * 255)}, ${Math.floor(clamped * 255)}, ${Math.floor(clamped * 255)})`;
  }
}

// Generate heatmap data for Recharts
function generateHeatmapData(data: DataPoint[], colorScale: ColorScale, min: number, max: number) {
  const xValues = [...new Set(data.map((p) => p.x))].sort((a, b) => a - b);
  const yValues = [...new Set(data.map((p) => p.y))].sort((a, b) => b - a); // Reverse for depth

  const heatmapData: Array<{ x: number; y: number; value: number; color: string }> = [];

  for (const y of yValues) {
    for (const x of xValues) {
      const point = data.find((p) => p.x === x && p.y === y);
      if (point) {
        heatmapData.push({
          x,
          y,
          value: point.value,
          color: getColorForValue(point.value, min, max, colorScale),
        });
      }
    }
  }

  return { heatmapData, xValues, yValues };
}

// Canvas component for rendering heatmap
function HeatmapCanvas({
  heatmapData,
  xValues,
  yValues,
  opacity,
  showGrid,
  onPointClick,
  height,
  canvasRef,
  containerRef,
}: {
  heatmapData: Array<{ x: number; y: number; value: number; color: string }>;
  xValues: number[];
  yValues: number[];
  opacity: number;
  showGrid: boolean;
  onPointClick: (point: { x: number; y: number; value: number }) => void;
  height: number;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  containerRef: React.RefObject<HTMLDivElement>;
}) {

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate cell dimensions
    const cellWidth = canvas.width / xValues.length;
    const cellHeight = canvas.height / yValues.length;

    // Draw heatmap cells
    heatmapData.forEach((point) => {
      const xIndex = xValues.indexOf(point.x);
      const yIndex = yValues.indexOf(point.y);
      if (xIndex === -1 || yIndex === -1) return;

      const x = xIndex * cellWidth;
      const y = yIndex * cellHeight;

      ctx.fillStyle = point.color;
      ctx.globalAlpha = opacity;
      ctx.fillRect(x, y, cellWidth, cellHeight);
    });

    ctx.globalAlpha = 1;

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= xValues.length; i++) {
        const x = i * cellWidth;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let i = 0; i <= yValues.length; i++) {
        const y = i * cellHeight;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    }
  }, [heatmapData, xValues, yValues, opacity, showGrid, height]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cellWidth = canvas.width / xValues.length;
    const cellHeight = canvas.height / yValues.length;

    const xIndex = Math.floor(x / cellWidth);
    const yIndex = Math.floor(y / cellHeight);

    if (xIndex >= 0 && xIndex < xValues.length && yIndex >= 0 && yIndex < yValues.length) {
      const point = heatmapData.find(
        (p) => p.x === xValues[xIndex] && p.y === yValues[yIndex]
      );
      if (point) {
        onPointClick(point);
      }
    }
  };

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-pointer"
        onClick={handleCanvasClick}
      />
    </div>
  );
}

export default function PseudoSectionRecharts({
  data,
  title = 'Pseudo-section',
  description,
  onDataPointClick,
  showControls = true,
  height = 600,
}: PseudoSectionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [controls, setControls] = useState<VisualizationControls>({
    colorScale: ColorScale.VIRIDIS,
    showGrid: true,
    showContours: true,
    contourLevels: 10,
    opacity: 1,
    colorRange: { min: 0, max: 100 },
  });

  const [selectedPoint, setSelectedPoint] = useState<DataPoint | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

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

  const { heatmapData, xValues, yValues } = useMemo(
    () => generateHeatmapData(data, controls.colorScale, controls.colorRange.min, controls.colorRange.max),
    [data, controls.colorScale, controls.colorRange]
  );

  // Generate contour levels
  const contourLevels = useMemo(() => {
    if (!controls.showContours) return [];
    const levels: number[] = [];
    const step = (controls.colorRange.max - controls.colorRange.min) / (controls.contourLevels + 1);
    for (let i = 1; i <= controls.contourLevels; i++) {
      levels.push(controls.colorRange.min + step * i);
    }
    return levels;
  }, [controls.showContours, controls.contourLevels, controls.colorRange]);

  const handlePointClick = (point: { x: number; y: number; value: number }) => {
    const dataPoint = data.find((d) => d.x === point.x && d.y === point.y);
    if (dataPoint) {
      setSelectedPoint(dataPoint);
      if (onDataPointClick) {
        onDataPointClick(dataPoint);
      }
    }
  };

  const handleExport = () => {
    // Export as PNG (using canvas)
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${title || 'pseudo-section'}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }, 'image/png');
    }
  };

  const handleExportSVG = () => {
    // Export as SVG
    const svgContent = generateSVG();
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'pseudo-section'}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateSVG = (): string => {
    // Generate SVG representation of the visualization
    const width = 800;
    const height = 600;
    const minX = Math.min(...data.map((p) => p.x));
    const maxX = Math.max(...data.map((p) => p.x));
    const minY = Math.min(...data.map((p) => p.y));
    const maxY = Math.max(...data.map((p) => p.y));
    const minValue = Math.min(...data.map((p) => p.value));
    const maxValue = Math.max(...data.map((p) => p.value));

    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">\n`;
    svg += `<rect width="${width}" height="${height}" fill="#1a1a1a"/>\n`;

    // Draw data points
    data.forEach((point) => {
      const x = ((point.x - minX) / (maxX - minX)) * width;
      const y = ((point.y - minY) / (maxY - minY)) * height;
      const color = getColorForValue(point.value, minValue, maxValue, controls.colorScale);
      svg += `<circle cx="${x}" cy="${y}" r="2" fill="${color}"/>\n`;
    });

    svg += '</svg>';
    return svg;
  };

  const handleResetView = () => {
    setZoomLevel(1);
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
            <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
              <Download className="w-4 h-4" />
              PNG
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={handleExportSVG}>
              <Download className="w-4 h-4" />
              SVG
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          {/* Main Plot Area */}
          <div className="flex-1">
            <div
              className="border rounded-lg bg-slate-900 relative"
              style={{ height: `${height}px` }}
            >
              <HeatmapCanvas
                heatmapData={heatmapData}
                xValues={xValues}
                yValues={yValues}
                opacity={controls.opacity}
                showGrid={controls.showGrid}
                onPointClick={handlePointClick}
                height={height}
                canvasRef={canvasRef}
                containerRef={containerRef}
              />
              {/* Axes labels */}
              <div className="absolute bottom-0 left-0 right-0 p-2 text-xs text-muted-foreground bg-slate-900/80">
                <div className="flex justify-between">
                  <span>Distance (m): {xValues[0]?.toFixed(1)} - {xValues[xValues.length - 1]?.toFixed(1)}</span>
                  <span>Profondeur (m): {yValues[yValues.length - 1]?.toFixed(1)} - {yValues[0]?.toFixed(1)}</span>
                </div>
              </div>
            </div>

            {/* Selected Point Info */}
            {selectedPoint && (
              <Card className="mt-4 bg-muted/30">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Position X:</span>
                      <span className="ml-2 font-medium">{selectedPoint.x.toFixed(2)} m</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Position Y:</span>
                      <span className="ml-2 font-medium">{selectedPoint.y.toFixed(2)} m</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Valeur:</span>
                      <span className="ml-2 font-medium">{selectedPoint.value.toFixed(2)}</span>
                    </div>
                    {selectedPoint.electrodeA && (
                      <div>
                        <span className="text-muted-foreground">Électrodes:</span>
                        <span className="ml-2 font-medium">
                          A{selectedPoint.electrodeA} B{selectedPoint.electrodeB}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Controls Sidebar */}
          {showControls && (
            <div className="w-80 space-y-4">
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-6">
                  {/* Color Scale */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      Échelle de couleur
                    </Label>
                    <Select
                      value={controls.colorScale}
                      onValueChange={(value) =>
                        setControls((prev) => ({ ...prev, colorScale: value as ColorScale }))
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
                        <SelectItem value={ColorScale.GRAYSCALE}>Niveaux de gris</SelectItem>
                        <SelectItem value={ColorScale.SEISMIC}>Sismique</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Display Options */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Options d'affichage</Label>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-grid" className="flex items-center gap-2">
                        <Grid3x3 className="w-4 h-4" />
                        Grille
                      </Label>
                      <input
                        id="show-grid"
                        type="checkbox"
                        checked={controls.showGrid}
                        onChange={(e) =>
                          setControls((prev) => ({ ...prev, showGrid: e.target.checked }))
                        }
                        className="h-4 w-4"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-contours" className="flex items-center gap-2">
                        <Layers className="w-4 h-4" />
                        Contours
                      </Label>
                      <input
                        id="show-contours"
                        type="checkbox"
                        checked={controls.showContours}
                        onChange={(e) =>
                          setControls((prev) => ({ ...prev, showContours: e.target.checked }))
                        }
                        className="h-4 w-4"
                      />
                    </div>

                    {controls.showContours && (
                      <div className="space-y-2">
                        <Label>Niveaux de contours: {controls.contourLevels}</Label>
                        <Slider
                          value={[controls.contourLevels]}
                          onValueChange={([value]) =>
                            setControls((prev) => ({ ...prev, contourLevels: value }))
                          }
                          min={3}
                          max={20}
                          step={1}
                        />
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Opacity */}
                  <div className="space-y-2">
                    <Label>Opacité: {Math.round(controls.opacity * 100)}%</Label>
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

                  {/* Color Range */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Plage de valeurs</Label>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Min: {controls.colorRange.min.toFixed(2)}</Label>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Max: {controls.colorRange.max.toFixed(2)}</Label>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Actions */}
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full gap-2" onClick={handleResetView}>
                      <RotateCcw className="w-4 h-4" />
                      Réinitialiser la vue
                    </Button>
                    <Button variant="outline" className="w-full gap-2">
                      <Maximize className="w-4 h-4" />
                      Plein écran
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

