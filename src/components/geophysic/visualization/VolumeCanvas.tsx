'use client';

import React, { useRef, useMemo, useImperativeHandle, forwardRef, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Box, Grid, Line, Plane } from '@react-three/drei';
import * as THREE from 'three';
import { ModelGrid, ColorScale } from '@/types/geophysic';

interface ViewControls {
  opacity: number;
  threshold: number;
  showGrid: boolean;
  showBoundingBox: boolean;
  colorScale: ColorScale;
  showContours: boolean;
  contourLevels: number;
  crossSections: {
    xy: { position: number; visible: boolean };
    xz: { position: number; visible: boolean };
    yz: { position: number; visible: boolean };
  };
  isosurfaces: {
    levels: number[];
    visible: boolean;
  };
}

export interface VolumeCanvasHandle {
  resetCamera: () => void;
}

interface VolumeCanvasProps {
  model: ModelGrid;
  controls: ViewControls;
}

// Helper function to get color scale value
function getColorScaleValue(t: number, scale: ColorScale): THREE.Color {
  // Implementation from VolumeVisualization
  switch (scale) {
    case ColorScale.VIRIDIS:
      return new THREE.Color(0.267, 0.005, 0.329).lerp(new THREE.Color(0.993, 0.906, 0.144), t);
    case ColorScale.PLASMA:
      return new THREE.Color(0.058, 0.028, 0.201).lerp(new THREE.Color(0.988, 0.998, 0.645), t);
    case ColorScale.INFERNO:
      return new THREE.Color(0.001, 0, 0.014).lerp(new THREE.Color(0.988, 0.998, 0.644), t);
    case ColorScale.JET:
      return new THREE.Color(0, 0, 0.5).lerp(new THREE.Color(0.5, 1, 0.5), t).lerp(new THREE.Color(1, 0.5, 0), t);
    default:
      return new THREE.Color(t, t, t);
  }
}

// Shared geometry cache - reuse BoxGeometry across renders
const sharedBoxGeometry = new THREE.BoxGeometry(1, 1, 0.1);

// Volume Cube component with Instanced Rendering optimization
const VolumeCube = React.memo(function VolumeCube({
  model,
  opacity,
  threshold,
  colorScale,
}: {
  model: ModelGrid;
  opacity: number;
  threshold: number;
  colorScale: ColorScale;
}) {
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const values = model.values;
  
  // Memoize min/max calculations
  const { minValue, maxValue, range } = useMemo(() => {
    const min = Math.min(...values);
    const max = Math.max(...values);
    return {
      minValue: min,
      maxValue: max,
      range: max - min || 1,
    };
  }, [values]);

  // Calculate instance data
  const instanceData = useMemo(() => {
    const instances: Array<{
      position: [number, number, number];
      color: THREE.Color;
      scale: [number, number, number];
    }> = [];

    for (let i = 0; i < model.dimensions.y; i++) {
      for (let j = 0; j < model.dimensions.x; j++) {
        const index = i * model.dimensions.x + j;
        const value = values[index];
        const normalizedValue = (value - minValue) / range;
        if (normalizedValue < threshold) continue;
        
        const x = model.coordinates.x[j];
        const y = model.coordinates.y[i];
        const color = getColorScaleValue(normalizedValue, colorScale);
        
        instances.push({
          position: [x, y, 0],
          color,
          scale: [
            model.gridGeometry.spacing.dx * 0.9,
            model.gridGeometry.spacing.dy * 0.9,
            1,
          ],
        });
      }
    }
    return instances;
  }, [model, threshold, values, minValue, range, colorScale]);

  // Create material with opacity and instance colors
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: opacity,
        side: THREE.DoubleSide,
        vertexColors: true, // Enable for instance colors
      }),
    [opacity]
  );

  // Update instance matrices and colors
  useEffect(() => {
    if (!instancedMeshRef.current || instanceData.length === 0) return;

    const mesh = instancedMeshRef.current;
    const matrix = new THREE.Matrix4();

    // Resize if needed
    if (mesh.count !== instanceData.length) {
      mesh.count = instanceData.length;
      // Create instanceColor attribute if it doesn't exist
      if (!mesh.instanceColor) {
        mesh.instanceColor = new THREE.InstancedBufferAttribute(
          new Float32Array(instanceData.length * 3),
          3
        );
      } else {
        // Resize the color buffer
        const newColors = new Float32Array(instanceData.length * 3);
        mesh.instanceColor = new THREE.InstancedBufferAttribute(newColors, 3);
      }
    }

    instanceData.forEach((instance, index) => {
      // Set matrix (position + scale)
      matrix.makeScale(...instance.scale);
      matrix.setPosition(...instance.position);
      mesh.setMatrixAt(index, matrix);
      
      // Set color
      if (mesh.instanceColor) {
        mesh.instanceColor.setXYZ(index, instance.color.r, instance.color.g, instance.color.b);
      }
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  }, [instanceData]);

  if (instanceData.length === 0) {
    return null;
  }

  return (
    <instancedMesh
      ref={instancedMeshRef}
      args={[sharedBoxGeometry, material, instanceData.length]}
      frustumCulled={true}
    />
  );
});

// Scene component with camera controls
const Scene = React.memo(function Scene({ 
  model, 
  controls,
  onCameraReady,
}: { 
  model: ModelGrid; 
  controls: ViewControls;
  onCameraReady?: (resetFn: () => void) => void;
}) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  const handleCameraReady = useCallback(() => {
    if (onCameraReady && controlsRef.current) {
      onCameraReady(() => {
        // Reset camera position
        camera.position.set(10, 10, 10);
        camera.lookAt(0, 0, 0);
        // Reset orbit controls
        if (controlsRef.current) {
          controlsRef.current.reset();
        }
      });
    }
  }, [camera, onCameraReady]);

  useEffect(() => {
    handleCameraReady();
  }, [handleCameraReady]);

  return (
    <>
      <PerspectiveCamera makeDefault position={[10, 10, 10]} />
      <OrbitControls ref={controlsRef} enableDamping dampingFactor={0.05} />
      {controls.showGrid && (
        <Grid
          args={[20, 20]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#2c3e50"
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#34495e"
          fadeDistance={30}
          fadeStrength={1}
          followCamera={false}
          infiniteGrid
        />
      )}
      {controls.showBoundingBox && (
        <Box
          args={[
            model.gridGeometry.spacing.dx * model.dimensions.x,
            model.gridGeometry.spacing.dy * model.dimensions.y,
            1,
          ]}
          position={[
            (model.coordinates.x[0] + model.coordinates.x[model.coordinates.x.length - 1]) / 2,
            (model.coordinates.y[0] + model.coordinates.y[model.coordinates.y.length - 1]) / 2,
            0,
          ]}
        >
          <meshBasicMaterial color="#2c3e50" wireframe opacity={0.3} transparent />
        </Box>
      )}
      <VolumeCube
        model={model}
        opacity={controls.opacity}
        threshold={controls.threshold}
        colorScale={controls.colorScale}
      />
      
      {/* Cross Sections */}
      {controls.crossSections.xy.visible && model.dimensions.z && (
        <Plane
          args={[
            (model.coordinates.x[model.coordinates.x.length - 1] - model.coordinates.x[0]) * 1.2,
            (model.coordinates.y[model.coordinates.y.length - 1] - model.coordinates.y[0]) * 1.2,
          ]}
          position={[
            (model.coordinates.x[0] + model.coordinates.x[model.coordinates.x.length - 1]) / 2,
            (model.coordinates.y[0] + model.coordinates.y[model.coordinates.y.length - 1]) / 2,
            controls.crossSections.xy.position,
          ]}
          rotation={[0, 0, 0]}
        >
          <meshBasicMaterial color="#ff0000" opacity={0.3} transparent side={THREE.DoubleSide} />
        </Plane>
      )}
      
      {controls.crossSections.xz.visible && (
        <Plane
          args={[
            (model.coordinates.x[model.coordinates.x.length - 1] - model.coordinates.x[0]) * 1.2,
            model.dimensions.z ? (model.coordinates.z![model.coordinates.z!.length - 1] - model.coordinates.z![0]) * 1.2 : 1,
          ]}
          position={[
            (model.coordinates.x[0] + model.coordinates.x[model.coordinates.x.length - 1]) / 2,
            controls.crossSections.xz.position,
            model.dimensions.z ? (model.coordinates.z![0] + model.coordinates.z![model.coordinates.z!.length - 1]) / 2 : 0,
          ]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <meshBasicMaterial color="#00ff00" opacity={0.3} transparent side={THREE.DoubleSide} />
        </Plane>
      )}
      
      {controls.crossSections.yz.visible && (
        <Plane
          args={[
            (model.coordinates.y[model.coordinates.y.length - 1] - model.coordinates.y[0]) * 1.2,
            model.dimensions.z ? (model.coordinates.z![model.coordinates.z!.length - 1] - model.coordinates.z![0]) * 1.2 : 1,
          ]}
          position={[
            controls.crossSections.yz.position,
            (model.coordinates.y[0] + model.coordinates.y[model.coordinates.y.length - 1]) / 2,
            model.dimensions.z ? (model.coordinates.z![0] + model.coordinates.z![model.coordinates.z!.length - 1]) / 2 : 0,
          ]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <meshBasicMaterial color="#0000ff" opacity={0.3} transparent side={THREE.DoubleSide} />
        </Plane>
      )}
      
      {/* Isosurfaces */}
      <Isosurfaces
        model={model}
        levels={controls.isosurfaces.visible && controls.isosurfaces.levels.length > 0 ? controls.isosurfaces.levels : []}
        colorScale={controls.colorScale}
        opacity={controls.opacity}
      />
      
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
    </>
  );
});

/**
 * Isosurfaces component using simplified Marching Cubes algorithm
 */
const Isosurfaces = React.memo(function Isosurfaces({
  model,
  levels,
  colorScale,
  opacity,
}: {
  model: ModelGrid;
  levels: number[];
  colorScale: ColorScale;
  opacity: number;
}) {
  // Early return after hooks to maintain hook order consistency
  const values = model.values;
  
  // Memoize min/max calculations
  const { minValue, maxValue, range } = useMemo(() => {
    const min = Math.min(...values);
    const max = Math.max(...values);
    return {
      minValue: min,
      maxValue: max,
      range: max - min || 1,
    };
  }, [values]);

  const isosurfaceMeshes = useMemo(() => {
    // Return empty array if no levels provided
    if (levels.length === 0) {
      return [];
    }
    const meshes: Array<{ geometry: THREE.BufferGeometry; material: THREE.MeshBasicMaterial; level: number }> = [];

    levels.forEach((level) => {
      const normalizedLevel = (level - minValue) / range;
      if (normalizedLevel < 0 || normalizedLevel > 1) return;

      // Simplified isosurface generation
      // In production, use proper Marching Cubes algorithm
      const vertices: number[] = [];
      const indices: number[] = [];
      let vertexIndex = 0;

      // Generate isosurface geometry (simplified)
      for (let i = 0; i < model.dimensions.y - 1; i++) {
        for (let j = 0; j < model.dimensions.x - 1; j++) {
          const idx = i * model.dimensions.x + j;
          const value = values[idx];
          const normalizedValue = (value - minValue) / range;

          // Check if this cell intersects the isosurface
          if (Math.abs(normalizedValue - normalizedLevel) < 0.1) {
            const x = model.coordinates.x[j];
            const y = model.coordinates.y[i];
            const z = model.dimensions.z ? (model.coordinates.z?.[0] || 0) : 0;

            // Create a simple quad for the isosurface
            const size = Math.min(
              model.gridGeometry.spacing.dx,
              model.gridGeometry.spacing.dy
            ) * 0.5;

            vertices.push(
              x - size, y - size, z,
              x + size, y - size, z,
              x + size, y + size, z,
              x - size, y + size, z,
            );

            indices.push(
              vertexIndex, vertexIndex + 1, vertexIndex + 2,
              vertexIndex, vertexIndex + 2, vertexIndex + 3,
            );

            vertexIndex += 4;
          }
        }
      }

      if (vertices.length > 0) {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();

        const color = getColorScaleValue(normalizedLevel, colorScale);
        const material = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: opacity * 0.7,
          side: THREE.DoubleSide,
        });

        meshes.push({ geometry, material, level });
      }
    });

    return meshes;
  }, [model, levels, values, minValue, range, colorScale, opacity]);

  return (
    <>
      {isosurfaceMeshes.map((mesh, index) => (
        <mesh key={index} geometry={mesh.geometry} material={mesh.material} />
      ))}
    </>
  );
});

const VolumeCanvas = forwardRef<VolumeCanvasHandle, VolumeCanvasProps>(({ model, controls }, ref) => {
  const resetCameraRef = useRef<(() => void) | null>(null);

  const handleCameraReady = useCallback((resetFn: () => void) => {
    resetCameraRef.current = resetFn;
  }, []);

  useImperativeHandle(ref, () => ({
    resetCamera: () => {
      if (resetCameraRef.current) {
        resetCameraRef.current();
      }
    },
  }), []);

  return (
    <Canvas>
      <Scene 
        model={model} 
        controls={controls}
        onCameraReady={handleCameraReady}
      />
    </Canvas>
  );
});

VolumeCanvas.displayName = 'VolumeCanvas';

export default VolumeCanvas;

