'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { StructuralMeasurement, StructuralStatistics } from '@/types/drilling';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Compass, TrendingUp, BarChart3 } from 'lucide-react';

// Lazy load Recharts components (heavy library)
const PieChart = dynamic(
  () => import('recharts').then((mod) => mod.PieChart),
  { ssr: false }
);
const Pie = dynamic(
  () => import('recharts').then((mod) => mod.Pie),
  { ssr: false }
);
const Cell = dynamic(
  () => import('recharts').then((mod) => mod.Cell),
  { ssr: false }
);
const ResponsiveContainer = dynamic(
  () => import('recharts').then((mod) => mod.ResponsiveContainer),
  { ssr: false }
);
const Legend = dynamic(
  () => import('recharts').then((mod) => mod.Legend),
  { ssr: false }
);
const Tooltip = dynamic(
  () => import('recharts').then((mod) => mod.Tooltip),
  { ssr: false }
);

interface StructuresAnalysisProps {
  structures: StructuralMeasurement[];
  statistics: StructuralStatistics;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export const StructuresAnalysis = React.memo(function StructuresAnalysis({
  structures,
  statistics,
}: StructuresAnalysisProps) {
  // Prepare pie chart data for structure types (memoized)
  const structureTypeData = useMemo(
    () =>
      Object.entries(statistics.structureTypeDistribution).map(([type, count]) => ({
        name: type,
        value: count,
      })),
    [statistics.structureTypeDistribution]
  );

  // Prepare rose diagram data (direction distribution) (memoized)
  const roseData = useMemo(
    () =>
      statistics.roseDiagram.map((item) => ({
        direction: item.direction,
        count: item.count,
      })),
    [statistics.roseDiagram]
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Compass className="h-5 w-5" />
            Statistiques structurales
          </CardTitle>
          <CardDescription>Analyse des mesures structurales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Nombre de mesures</p>
              <p className="text-2xl font-bold">{structures.length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Direction moyenne</p>
              <p className="text-2xl font-bold">{statistics.averageDirection.toFixed(1)}°</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Dip moyen</p>
              <p className="text-2xl font-bold">{statistics.averageDip.toFixed(1)}°</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Types de structures</p>
              <p className="text-2xl font-bold">
                {Object.keys(statistics.structureTypeDistribution).length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {structureTypeData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Distribution des types de structures
            </CardTitle>
            <CardDescription>Répartition par type de structure géologique</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={structureTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {structureTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {roseData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Rose des directions
            </CardTitle>
            <CardDescription>Distribution des directions par intervalle de 10°</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Direction (°)</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Pourcentage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roseData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono">{item.direction}°</TableCell>
                      <TableCell>{item.count}</TableCell>
                      <TableCell>
                        {((item.count / structures.length) * 100).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Mesures structurales détaillées</CardTitle>
          <CardDescription>Direction et dip des structures par profondeur</CardDescription>
        </CardHeader>
        <CardContent>
          {structures.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Profondeur (m)</TableHead>
                    <TableHead>Direction (°)</TableHead>
                    <TableHead>Dip (°)</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Géologue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {structures.map((structure) => (
                    <TableRow key={structure.id}>
                      <TableCell className="font-mono">{structure.depth.toFixed(2)}</TableCell>
                      <TableCell className="font-mono font-semibold">
                        {structure.direction.toFixed(1)}°
                      </TableCell>
                      <TableCell className="font-mono font-semibold">
                        {structure.dip.toFixed(1)}°
                      </TableCell>
                      <TableCell>
                        {structure.structureType ? (
                          <Badge variant="outline">{structure.structureType}</Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {structure.description || '-'}
                      </TableCell>
                      <TableCell>{structure.geologist || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Aucune mesure structurale disponible
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

