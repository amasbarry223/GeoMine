'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { DrillAssay, ElementProfileStatistics } from '@/types/drilling';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TestTube, TrendingUp, BarChart3 } from 'lucide-react';

// Lazy load Recharts components (heavy library)
const LineChart = dynamic(
  () => import('recharts').then((mod) => mod.LineChart),
  { ssr: false }
);
const Line = dynamic(
  () => import('recharts').then((mod) => mod.Line),
  { ssr: false }
);
const XAxis = dynamic(
  () => import('recharts').then((mod) => mod.XAxis),
  { ssr: false }
);
const YAxis = dynamic(
  () => import('recharts').then((mod) => mod.YAxis),
  { ssr: false }
);
const CartesianGrid = dynamic(
  () => import('recharts').then((mod) => mod.CartesianGrid),
  { ssr: false }
);
const Tooltip = dynamic(
  () => import('recharts').then((mod) => mod.Tooltip),
  { ssr: false }
);
const Legend = dynamic(
  () => import('recharts').then((mod) => mod.Legend),
  { ssr: false }
);
const ResponsiveContainer = dynamic(
  () => import('recharts').then((mod) => mod.ResponsiveContainer),
  { ssr: false }
);

interface AssaysAnalysisProps {
  assays: DrillAssay[];
  elementStatistics: Record<string, ElementProfileStatistics>;
}

export const AssaysAnalysis = React.memo(function AssaysAnalysis({ assays, elementStatistics }: AssaysAnalysisProps) {
  const [selectedElement, setSelectedElement] = useState<string>(
    Object.keys(elementStatistics)[0] || ''
  );

  const elements = useMemo(() => Object.keys(elementStatistics), [elementStatistics]);
  const selectedStats = useMemo(
    () => (selectedElement ? elementStatistics[selectedElement] : null),
    [selectedElement, elementStatistics]
  );

  // Prepare chart data with memoization
  const chartData = useMemo(() => {
    if (!selectedStats) return [];
    return selectedStats.depth.map((depth, index) => ({
      depth,
      value: selectedStats.values[index],
    }));
  }, [selectedStats]);

  // Group assays by element for summary table (memoized)
  const assaysByElement = useMemo(() => {
    const grouped: Record<string, DrillAssay[]> = {};
    assays.forEach((assay) => {
      if (!grouped[assay.element]) {
        grouped[assay.element] = [];
      }
      grouped[assay.element].push(assay);
    });
    return grouped;
  }, [assays]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Résumé des analyses
          </CardTitle>
          <CardDescription>Statistiques par élément</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Nombre d'analyses</p>
              <p className="text-2xl font-bold">{assays.length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Éléments analysés</p>
              <p className="text-2xl font-bold">{elements.length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Intervalles</p>
              <p className="text-2xl font-bold">
                {new Set(assays.map((a) => `${a.fromDepth}-${a.toDepth}`)).size}
              </p>
            </div>
          </div>

          {elements.length > 0 && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Élément</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Moyenne</TableHead>
                    <TableHead>Min</TableHead>
                    <TableHead>Max</TableHead>
                    <TableHead>Écart-type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {elements.map((element) => {
                    const stats = elementStatistics[element];
                    return (
                      <TableRow key={element}>
                        <TableCell>
                          <Badge variant="outline">{element}</Badge>
                        </TableCell>
                        <TableCell>{stats.values.length}</TableCell>
                        <TableCell className="font-mono">{stats.mean.toFixed(2)}</TableCell>
                        <TableCell className="font-mono">{stats.min.toFixed(2)}</TableCell>
                        <TableCell className="font-mono">{stats.max.toFixed(2)}</TableCell>
                        <TableCell className="font-mono">{stats.stdDev.toFixed(2)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedStats && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Profil de l'élément
              </CardTitle>
              <CardDescription>
                <Select value={selectedElement} onValueChange={setSelectedElement}>
                  <SelectTrigger className="w-[200px] mt-2">
                    <SelectValue placeholder="Sélectionner un élément" />
                  </SelectTrigger>
                  <SelectContent>
                    {elements.map((element) => (
                      <SelectItem key={element} value={element}>
                        {element}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Moyenne</p>
                  <p className="text-xl font-bold">{selectedStats.mean.toFixed(2)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Maximum</p>
                  <p className="text-xl font-bold">{selectedStats.max.toFixed(2)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Minimum</p>
                  <p className="text-xl font-bold">{selectedStats.min.toFixed(2)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Écart-type</p>
                  <p className="text-xl font-bold">{selectedStats.stdDev.toFixed(2)}</p>
                </div>
              </div>

              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="depth"
                      label={{ value: 'Profondeur (m)', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis
                      label={{ value: `Concentration (${assays.find((a) => a.element === selectedElement)?.unit || 'ppm'})`, angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#8884d8"
                      strokeWidth={2}
                      name={selectedElement}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Données d'analyses détaillées
          </CardTitle>
          <CardDescription>Tous les résultats d'analyses par profondeur</CardDescription>
        </CardHeader>
        <CardContent>
          {assays.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Élément</TableHead>
                    <TableHead>De (m)</TableHead>
                    <TableHead>À (m)</TableHead>
                    <TableHead>Valeur</TableHead>
                    <TableHead>Unité</TableHead>
                    <TableHead>Limite détection</TableHead>
                    <TableHead>Labo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assays.map((assay) => (
                    <TableRow key={assay.id}>
                      <TableCell>
                        <Badge variant="outline">{assay.element}</Badge>
                      </TableCell>
                      <TableCell className="font-mono">{assay.fromDepth.toFixed(2)}</TableCell>
                      <TableCell className="font-mono">{assay.toDepth.toFixed(2)}</TableCell>
                      <TableCell className="font-mono font-semibold">{assay.value.toFixed(2)}</TableCell>
                      <TableCell>{assay.unit}</TableCell>
                      <TableCell>
                        {assay.detectionLimit ? assay.detectionLimit.toFixed(2) : '-'}
                      </TableCell>
                      <TableCell>{assay.lab || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Aucune analyse disponible
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

