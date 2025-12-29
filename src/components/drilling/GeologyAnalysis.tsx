'use client';

import React, { useMemo } from 'react';
import { GeologyLog, GeologyStatistics } from '@/types/drilling';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Layers, BarChart3 } from 'lucide-react';

interface GeologyAnalysisProps {
  geology: GeologyLog[];
  statistics: GeologyStatistics;
}

export const GeologyAnalysis = React.memo(function GeologyAnalysis({ geology, statistics }: GeologyAnalysisProps) {
  // Memoize sorted distributions
  const sortedLithology = useMemo(
    () => Object.entries(statistics.lithologyDistribution).sort((a, b) => b[1].totalDepth - a[1].totalDepth),
    [statistics.lithologyDistribution]
  );

  const sortedAlteration = useMemo(
    () => Object.entries(statistics.alterationDistribution).sort((a, b) => b[1].totalDepth - a[1].totalDepth),
    [statistics.alterationDistribution]
  );

  const sortedMineralization = useMemo(
    () => Object.entries(statistics.mineralizationDistribution).sort((a, b) => b[1].totalDepth - a[1].totalDepth),
    [statistics.mineralizationDistribution]
  );
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Statistiques géologiques
          </CardTitle>
          <CardDescription>Distribution des lithologies, altérations et minéralisations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Profondeur totale loggée</p>
              <p className="text-2xl font-bold">{statistics.totalLoggedDepth.toFixed(2)} m</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Intervalles géologiques</p>
              <p className="text-2xl font-bold">{geology.length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Types de lithologie</p>
              <p className="text-2xl font-bold">
                {Object.keys(statistics.lithologyDistribution).length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {Object.keys(statistics.lithologyDistribution).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Distribution des lithologies
            </CardTitle>
            <CardDescription>Répartition par type de roche</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sortedLithology.map(([lithology, stats]) => (
                  <div key={lithology} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{lithology}</span>
                      <span className="text-sm text-muted-foreground">
                        {stats.totalDepth.toFixed(2)} m ({stats.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress value={stats.percentage} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {stats.count} intervalle{stats.count > 1 ? 's' : ''}
                    </p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {Object.keys(statistics.alterationDistribution).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Distribution des altérations</CardTitle>
            <CardDescription>Types d'altération rencontrés</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sortedAlteration.map(([alteration, stats]) => (
                  <div key={alteration} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{alteration}</span>
                      <span className="text-sm text-muted-foreground">
                        {stats.totalDepth.toFixed(2)} m ({stats.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress value={stats.percentage} className="h-2" />
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {Object.keys(statistics.mineralizationDistribution).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Distribution des minéralisations</CardTitle>
            <CardDescription>Types de minéralisation observés</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sortedMineralization.map(([mineralization, stats]) => (
                  <div key={mineralization} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{mineralization}</span>
                      <span className="text-sm text-muted-foreground">
                        {stats.totalDepth.toFixed(2)} m ({stats.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress value={stats.percentage} className="h-2" />
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Logs géologiques détaillés</CardTitle>
          <CardDescription>Description lithologique par profondeur</CardDescription>
        </CardHeader>
        <CardContent>
          {geology.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>De (m)</TableHead>
                    <TableHead>À (m)</TableHead>
                    <TableHead>Lithologie</TableHead>
                    <TableHead>Altération</TableHead>
                    <TableHead>Minéralisation</TableHead>
                    <TableHead>Géologue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {geology.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono">{log.fromDepth.toFixed(2)}</TableCell>
                      <TableCell className="font-mono">{log.toDepth.toFixed(2)}</TableCell>
                      <TableCell>{log.lithology || '-'}</TableCell>
                      <TableCell>{log.alteration || '-'}</TableCell>
                      <TableCell>{log.mineralization || '-'}</TableCell>
                      <TableCell>{log.geologist || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Aucun log géologique disponible
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

