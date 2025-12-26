'use client';

import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff } from 'lucide-react';

interface CrossSectionControlsProps {
  model: { dimensions: { x: number; y: number; z?: number }; coordinates: { x: number[]; y: number[]; z?: number[] } };
  crossSections: {
    xy: { position: number; visible: boolean };
    xz: { position: number; visible: boolean };
    yz: { position: number; visible: boolean };
  };
  onCrossSectionChange: (section: 'xy' | 'xz' | 'yz', position: number) => void;
  onVisibilityToggle: (section: 'xy' | 'xz' | 'yz') => void;
}

export function CrossSectionControls({
  model,
  crossSections,
  onCrossSectionChange,
  onVisibilityToggle,
}: CrossSectionControlsProps) {
  const hasZ = model.dimensions.z && model.coordinates.z;

  const getMinMax = (axis: 'x' | 'y' | 'z') => {
    const coords = model.coordinates[axis] || [];
    if (coords.length === 0) return { min: 0, max: 1 };
    return { min: Math.min(...coords), max: Math.max(...coords) };
  };

  const xyRange = getMinMax('z');
  const xzRange = getMinMax('y');
  const yzRange = getMinMax('x');

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Coupes Interactives</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* XY Cross Section (horizontal) */}
        {hasZ && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Coupe XY (Z = {crossSections.xy.position.toFixed(2)})</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onVisibilityToggle('xy')}
                >
                  {crossSections.xy.visible ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <Slider
                value={[crossSections.xy.position]}
                onValueChange={([value]) => onCrossSectionChange('xy', value)}
                min={xyRange.min}
                max={xyRange.max}
                step={(xyRange.max - xyRange.min) / 100}
              />
            </div>
            <Separator />
          </>
        )}

        {/* XZ Cross Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Coupe XZ (Y = {crossSections.xz.position.toFixed(2)})</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onVisibilityToggle('xz')}
            >
              {crossSections.xz.visible ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </Button>
          </div>
          <Slider
            value={[crossSections.xz.position]}
            onValueChange={([value]) => onCrossSectionChange('xz', value)}
            min={xzRange.min}
            max={xzRange.max}
            step={(xzRange.max - xzRange.min) / 100}
          />
        </div>

        <Separator />

        {/* YZ Cross Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Coupe YZ (X = {crossSections.yz.position.toFixed(2)})</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onVisibilityToggle('yz')}
            >
              {crossSections.yz.visible ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </Button>
          </div>
          <Slider
            value={[crossSections.yz.position]}
            onValueChange={([value]) => onCrossSectionChange('yz', value)}
            min={yzRange.min}
            max={yzRange.max}
            step={(yzRange.max - yzRange.min) / 100}
          />
        </div>
      </CardContent>
    </Card>
  );
}

