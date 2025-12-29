'use client';

import React from 'react';
import { DrillHole } from '@/types/drilling';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Wrench } from 'lucide-react';

interface CollarAnalysisProps {
  hole: DrillHole;
}

export const CollarAnalysis = React.memo(function CollarAnalysis({ hole }: CollarAnalysisProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Coordonnées Collar
          </CardTitle>
          <CardDescription>Informations de base et localisation du trou</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Hole ID</p>
              <p className="text-lg font-semibold">{hole.holeID}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Type de forage</p>
              <Badge variant="outline">{hole.drillType}</Badge>
            </div>
            {hole.utmZone && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Zone UTM</p>
                <p className="text-lg font-medium">{hole.utmZone}</p>
              </div>
            )}
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Coordonnée X</p>
              <p className="text-lg font-mono">{hole.collarX.toFixed(2)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Coordonnée Y</p>
              <p className="text-lg font-mono">{hole.collarY.toFixed(2)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Altitude (Z)</p>
              <p className="text-lg font-mono">{hole.collarZ.toFixed(2)} m</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Orientation
          </CardTitle>
          <CardDescription>Direction et inclinaison du trou</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {hole.azimuth !== null && hole.azimuth !== undefined && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Azimuth</p>
                <p className="text-2xl font-bold">{hole.azimuth.toFixed(1)}°</p>
              </div>
            )}
            {hole.dip !== null && hole.dip !== undefined && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Dip</p>
                <p className="text-2xl font-bold">{hole.dip.toFixed(1)}°</p>
              </div>
            )}
            {hole.totalDepth !== null && hole.totalDepth !== undefined && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Profondeur totale</p>
                <p className="text-2xl font-bold">{hole.totalDepth.toFixed(2)} m</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {(hole.contractor || hole.rigType || hole.startDate || hole.endDate) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Informations opérationnelles
            </CardTitle>
            <CardDescription>Détails de l'exécution du forage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {hole.contractor && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Contractant</p>
                  <p className="font-medium">{hole.contractor}</p>
                </div>
              )}
              {hole.rigType && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Type de foreuse</p>
                  <p className="font-medium">{hole.rigType}</p>
                </div>
              )}
              {hole.startDate && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Date de début</p>
                  <p className="font-medium">
                    {new Date(hole.startDate).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              )}
              {hole.endDate && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Date de fin</p>
                  <p className="font-medium">
                    {new Date(hole.endDate).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});

