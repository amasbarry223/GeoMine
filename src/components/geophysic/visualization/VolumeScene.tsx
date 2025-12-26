'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ModelGrid, ColorScale } from '@/types/geophysic';

interface ViewControls {
  opacity: number;
  threshold: number;
  showGrid: boolean;
  showBoundingBox: boolean;
  colorScale: ColorScale;
  showContours: boolean;
  contourLevels: number;
}

interface VolumeSceneProps {
  model: ModelGrid;
  controls: ViewControls;
}

// Dynamically import the actual Scene component that uses react-three
const DynamicScene = dynamic(
  () => import('./VolumeSceneInternal'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Chargement de la scène 3D...</p>
        </div>
      </div>
    ),
  }
);

export default function VolumeScene({ model, controls }: VolumeSceneProps) {
  return <DynamicScene model={model} controls={controls} />;
}

