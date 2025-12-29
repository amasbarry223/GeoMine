'use client';

import React from 'react';
import { DrillHole, DrillSurvey, DeviationStatistics } from '@/types/drilling';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, Navigation } from 'lucide-react';

interface SurveyAnalysisProps {
  hole: DrillHole;
  surveys: DrillSurvey[];
  deviationStats: DeviationStatistics;
}

export const SurveyAnalysis = React.memo(function SurveyAnalysis({ hole, surveys, deviationStats }: SurveyAnalysisProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Statistiques de déviation
          </CardTitle>
          <CardDescription>Analyse de la trajectoire du forage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Déviation maximale</p>
              <p className="text-2xl font-bold">{deviationStats.maxDeviation.toFixed(2)} m</p>
              <p className="text-xs text-muted-foreground">
                à {deviationStats.maxDeviationDepth.toFixed(2)} m
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Déviation totale</p>
              <p className="text-2xl font-bold">{deviationStats.totalDeviation.toFixed(2)} m</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Déviation moyenne</p>
              <p className="text-2xl font-bold">{deviationStats.averageDeviation.toFixed(2)} m</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Nombre de mesures</p>
              <p className="text-2xl font-bold">{surveys.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Données Survey
          </CardTitle>
          <CardDescription>Mesures de direction et inclinaison par profondeur</CardDescription>
        </CardHeader>
        <CardContent>
          {surveys.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Profondeur (m)</TableHead>
                    <TableHead>Azimuth (°)</TableHead>
                    <TableHead>Dip (°)</TableHead>
                    <TableHead>Tool Face (°)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {surveys.map((survey) => (
                    <TableRow key={survey.id}>
                      <TableCell className="font-mono">{survey.depth.toFixed(2)}</TableCell>
                      <TableCell>
                        {survey.azimuth !== null && survey.azimuth !== undefined
                          ? `${survey.azimuth.toFixed(1)}°`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {survey.dip !== null && survey.dip !== undefined
                          ? `${survey.dip.toFixed(1)}°`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {survey.toolFace !== null && survey.toolFace !== undefined
                          ? `${survey.toolFace.toFixed(1)}°`
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Aucune donnée survey disponible
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
});

