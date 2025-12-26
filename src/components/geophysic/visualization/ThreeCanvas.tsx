'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Canvas from react-three/fiber
const Canvas = dynamic(
  () => import('@react-three/fiber').then((mod) => mod.Canvas),
  { ssr: false }
);

interface ThreeCanvasProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

// Wrapper component that ensures Canvas is only rendered on client side
export default function ThreeCanvas({ children, className, style }: ThreeCanvasProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || !Canvas) {
    return (
      <div className={className} style={style}>
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm">Chargement du canvas 3D...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={style}>
      <Canvas>{children}</Canvas>
    </div>
  );
}

