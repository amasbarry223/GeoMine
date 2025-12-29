'use client';

import React from 'react';
import { DrillHole, DrillSurvey, GeologyLog, DrillAssay, StructuralMeasurement } from '@/types/drilling';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DrillHoleDetailProps {
  hole: DrillHole & {
    surveys?: DrillSurvey[];
    geology?: GeologyLog[];
    assays?: DrillAssay[];
    structures?: StructuralMeasurement[];
  };
}

export function DrillHoleDetail({ hole }: DrillHoleDetailProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informations Collar</CardTitle>
          <CardDescription>Coordonnées et informations de base</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Hole ID</p>
              <p className="font-medium">{hole.holeID}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Type</p>
              <p className="font-medium">{hole.drillType}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">X</p>
              <p className="font-medium">{hole.collarX.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Y</p>
              <p className="font-medium">{hole.collarY.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Z</p>
              <p className="font-medium">{hole.collarZ.toFixed(2)}</p>
            </div>
            {hole.azimuth && (
              <div>
                <p className="text-sm text-muted-foreground">Azimuth</p>
                <p className="font-medium">{hole.azimuth.toFixed(1)}°</p>
              </div>
            )}
            {hole.dip && (
              <div>
                <p className="text-sm text-muted-foreground">Dip</p>
                <p className="font-medium">{hole.dip.toFixed(1)}°</p>
              </div>
            )}
            {hole.totalDepth && (
              <div>
                <p className="text-sm text-muted-foreground">Profondeur totale</p>
                <p className="font-medium">{hole.totalDepth.toFixed(2)} m</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="survey" className="w-full">
        <TabsList>
          <TabsTrigger value="survey">Survey ({hole.surveys?.length || 0})</TabsTrigger>
          <TabsTrigger value="geology">Geology ({hole.geology?.length || 0})</TabsTrigger>
          <TabsTrigger value="assays">Assays ({hole.assays?.length || 0})</TabsTrigger>
          <TabsTrigger value="structures">Structures ({hole.structures?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="survey">
          <Card>
            <CardHeader>
              <CardTitle>Données Survey</CardTitle>
              <CardDescription>Mesures de direction et inclinaison</CardDescription>
            </CardHeader>
            <CardContent>
              {hole.surveys && hole.surveys.length > 0 ? (
                <div className="space-y-2">
                  {hole.surveys.map((survey) => (
                    <div key={survey.id} className="flex items-center gap-4 p-2 border rounded">
                      <div>
                        <p className="text-sm font-medium">Profondeur: {survey.depth.toFixed(2)} m</p>
                        {survey.azimuth && <p className="text-xs text-muted-foreground">Azimuth: {survey.azimuth}°</p>}
                        {survey.dip && <p className="text-xs text-muted-foreground">Dip: {survey.dip}°</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">Aucune donnée survey</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geology">
          <Card>
            <CardHeader>
              <CardTitle>Logs géologiques</CardTitle>
              <CardDescription>Description lithologique par profondeur</CardDescription>
            </CardHeader>
            <CardContent>
              {hole.geology && hole.geology.length > 0 ? (
                <div className="space-y-2">
                  {hole.geology.map((log) => (
                    <div key={log.id} className="p-2 border rounded">
                      <p className="text-sm font-medium">
                        {log.fromDepth.toFixed(2)} - {log.toDepth.toFixed(2)} m
                      </p>
                      {log.lithology && <p className="text-xs text-muted-foreground">Lithologie: {log.lithology}</p>}
                      {log.alteration && <p className="text-xs text-muted-foreground">Altération: {log.alteration}</p>}
                      {log.mineralization && (
                        <p className="text-xs text-muted-foreground">Minéralisation: {log.mineralization}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">Aucun log géologique</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assays">
          <Card>
            <CardHeader>
              <CardTitle>Analyses</CardTitle>
              <CardDescription>Résultats d'analyses par profondeur</CardDescription>
            </CardHeader>
            <CardContent>
              {hole.assays && hole.assays.length > 0 ? (
                <div className="space-y-2">
                  {hole.assays.map((assay) => (
                    <div key={assay.id} className="p-2 border rounded">
                      <p className="text-sm font-medium">
                        {assay.element}: {assay.value} {assay.unit}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {assay.fromDepth.toFixed(2)} - {assay.toDepth.toFixed(2)} m
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">Aucune analyse</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="structures">
          <Card>
            <CardHeader>
              <CardTitle>Mesures structurales</CardTitle>
              <CardDescription>Direction et dip des structures</CardDescription>
            </CardHeader>
            <CardContent>
              {hole.structures && hole.structures.length > 0 ? (
                <div className="space-y-2">
                  {hole.structures.map((structure) => (
                    <div key={structure.id} className="p-2 border rounded">
                      <p className="text-sm font-medium">Profondeur: {structure.depth.toFixed(2)} m</p>
                      <p className="text-xs text-muted-foreground">
                        Direction: {structure.direction}° | Dip: {structure.dip}°
                      </p>
                      {structure.structureType && (
                        <p className="text-xs text-muted-foreground">Type: {structure.structureType}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">Aucune mesure structurale</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


