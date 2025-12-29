'use client';

import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Axes } from '@react-three/drei';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

interface HolePath3DProps {
  path: { x: number; y: number; z: number; depth: number }[];
  collar: { x: number; y: number; z: number };
}

function PathLine({ path, collar }: { path: { x: number; y: number; z: number; depth: number }[]; collar: { x: number; y: number; z: number } }) {
  const points = path.map((p) => [p.x - collar.x, p.z - collar.z, p.y - collar.y] as [number, number, number]);
  
  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={new Float32Array(points.flat())}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#ff0000" linewidth={3} />
    </line>
  );
}

function PathPoints({ path, collar }: { path: { x: number; y: number; z: number; depth: number }[]; collar: { x: number; y: number; z: number } }) {
  const points = path.map((p) => [p.x - collar.x, p.z - collar.z, p.y - collar.y] as [number, number, number]);
  
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={new Float32Array(points.flat())}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial color="#00ff00" size={5} />
    </points>
  );
}

function CollarPoint() {
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={1}
          array={new Float32Array([0, 0, 0])}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial color="#0000ff" size={10} />
    </points>
  );
}

export function HolePath3D({ path, collar }: HolePath3DProps) {
  const controlsRef = useRef<any>(null);

  const resetView = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  if (path.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            Aucune trajectoire disponible
          </div>
        </CardContent>
      </Card>
    );
  }

  if (path.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            Aucune trajectoire disponible
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate camera position
  const points = path.map((p) => ({
    x: p.x - collar.x,
    y: p.z - collar.z,
    z: p.y - collar.y,
  }));
  
  const centerX = (Math.max(...points.map((p) => p.x)) + Math.min(...points.map((p) => p.x))) / 2;
  const centerY = (Math.max(...points.map((p) => p.y)) + Math.min(...points.map((p) => p.y))) / 2;
  const centerZ = (Math.max(...points.map((p) => p.z)) + Math.min(...points.map((p) => p.z))) / 2;
  
  const maxDistance = Math.max(
    ...points.map((p) => Math.sqrt(Math.pow(p.x - centerX, 2) + Math.pow(p.y - centerY, 2) + Math.pow(p.z - centerZ, 2))),
    100
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Visualisation 3D de la trajectoire</CardTitle>
            <CardDescription>Représentation 3D du chemin du forage</CardDescription>
          </div>
          <Button onClick={resetView} variant="outline" size="sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="w-full h-[600px] rounded-md border bg-background">
          <Canvas
            camera={{
              position: [centerX + maxDistance, centerY + maxDistance, centerZ + maxDistance],
              fov: 75,
            }}
          >
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <Grid args={[1000, 50]} />
            <Axes />
            <OrbitControls
              ref={controlsRef}
              enableDamping
              dampingFactor={0.05}
              target={[centerX, centerY, centerZ]}
            />
            <PathLine path={path} collar={collar} />
            <PathPoints path={path} collar={collar} />
            <CollarPoint />
          </Canvas>
        </div>
        <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>Trajectoire</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span>Points de mesure</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span>Collar</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

