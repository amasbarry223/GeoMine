'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import { CollarAnalysis } from '@/components/drilling/CollarAnalysis';
import { SurveyAnalysis } from '@/components/drilling/SurveyAnalysis';
import { GeologyAnalysis } from '@/components/drilling/GeologyAnalysis';
import { AssaysAnalysis } from '@/components/drilling/AssaysAnalysis';
import { StructuresAnalysis } from '@/components/drilling/StructuresAnalysis';
import { LoadingState, ErrorState } from '@/components/ui/loading-state';
import { exportDrillHoleAsCSV, downloadCSV, generateDrillHoleSummary } from '@/lib/drilling/export';
import type { DrillHole, DrillHoleAnalysis } from '@/types/drilling';

// Lazy load the 3D component (heavy, only load when needed)
const HolePath3D = dynamic(
  () => import('@/components/drilling/HolePath3D').then((mod) => mod.HolePath3D),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[600px] text-muted-foreground">
        <div className="text-center space-y-2">
          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          <p className="text-sm">Chargement de la visualisation 3D...</p>
        </div>
      </div>
    ),
  }
);

async function fetchDrillHole(id: string): Promise<DrillHole> {
  const response = await fetch(`/api/drilling/holes/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch drill hole');
  }
  const result = await response.json();
  return result.data;
}

async function fetchDrillHoleAnalysis(id: string): Promise<DrillHoleAnalysis> {
  const response = await fetch(`/api/drilling/holes/${id}/analysis`);
  if (!response.ok) {
    throw new Error('Failed to fetch drill hole analysis');
  }
  const result = await response.json();
  return result.data;
}

export default function DrillHoleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const holeId = params.id as string;
  const [activeTab, setActiveTab] = useState('collar');

  // Fetch drill hole data
  const {
    data: hole,
    isLoading: isLoadingHole,
    error: holeError,
  } = useQuery({
    queryKey: ['drillHole', holeId],
    queryFn: () => fetchDrillHole(holeId),
  });

  // Fetch analysis data with optimized cache settings
  const {
    data: analysis,
    isLoading: isLoadingAnalysis,
    error: analysisError,
  } = useQuery({
    queryKey: ['drillHoleAnalysis', holeId],
    queryFn: () => fetchDrillHoleAnalysis(holeId),
    enabled: !!hole, // Only fetch when hole is loaded
    staleTime: 1000 * 60 * 30, // 30 minutes - analyses change rarely
    gcTime: 1000 * 60 * 60, // 1 hour - keep in cache longer
  });

  if (isLoadingHole) {
    return (
      <AppLayout headerTitle="Détails du trou">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (holeError || !hole) {
    return (
      <AppLayout headerTitle="Détails du trou">
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <p className="text-destructive">Erreur lors du chargement du trou de forage</p>
                <Button onClick={() => router.back()} className="mt-4" variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const isLoading = isLoadingAnalysis;
  const surveys = hole.surveys || [];
  const geology = hole.geology || [];
  const assays = hole.assays || [];
  const structures = hole.structures || [];

  return (
    <AppLayout headerTitle="Détails du trou">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button onClick={() => router.back()} variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <h1 className="text-3xl font-bold">{hole.holeID}</h1>
            <p className="text-muted-foreground mt-2">Informations complètes et analyses du trou</p>
          </div>
          {analysis && (
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  const csv = exportDrillHoleAsCSV(hole, surveys, geology, assays, structures);
                  downloadCSV(csv, `${hole.holeID}_data.csv`);
                }}
                variant="outline"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter CSV
              </Button>
              <Button
                onClick={() => {
                  const summary = generateDrillHoleSummary(hole, analysis);
                  downloadCSV(summary, `${hole.holeID}_summary.txt`);
                }}
                variant="outline"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Rapport
              </Button>
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="collar">Collar</TabsTrigger>
            <TabsTrigger value="survey">
              Survey {surveys.length > 0 && `(${surveys.length})`}
            </TabsTrigger>
            <TabsTrigger value="geology">
              Geology {geology.length > 0 && `(${geology.length})`}
            </TabsTrigger>
            <TabsTrigger value="assays">
              Assays {assays.length > 0 && `(${assays.length})`}
            </TabsTrigger>
            <TabsTrigger value="structures">
              Structures {structures.length > 0 && `(${structures.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="collar">
            <CollarAnalysis hole={hole} />
          </TabsContent>

          <TabsContent value="survey">
            {isLoading ? (
              <LoadingState message="Chargement de l'analyse..." />
            ) : analysisError ? (
              <ErrorState message="Erreur lors du chargement de l'analyse" />
            ) : analysis ? (
              <div className="space-y-4">
                <SurveyAnalysis
                  hole={hole}
                  surveys={surveys}
                  deviationStats={analysis.deviationStatistics}
                />
                {analysis.path && analysis.path.length > 0 && (
                  <HolePath3D
                    path={analysis.path}
                    collar={{ x: hole.collarX, y: hole.collarY, z: hole.collarZ }}
                  />
                )}
              </div>
            ) : null}
          </TabsContent>

          <TabsContent value="geology">
            {isLoading ? (
              <LoadingState message="Chargement de l'analyse..." />
            ) : analysisError ? (
              <ErrorState message="Erreur lors du chargement de l'analyse" />
            ) : analysis ? (
              <GeologyAnalysis geology={geology} statistics={analysis.geologyStatistics} />
            ) : null}
          </TabsContent>

          <TabsContent value="assays">
            {isLoading ? (
              <LoadingState message="Chargement de l'analyse..." />
            ) : analysisError ? (
              <ErrorState message="Erreur lors du chargement de l'analyse" />
            ) : analysis ? (
              <AssaysAnalysis assays={assays} elementStatistics={analysis.elementStatistics} />
            ) : null}
          </TabsContent>

          <TabsContent value="structures">
            {isLoading ? (
              <LoadingState message="Chargement de l'analyse..." />
            ) : analysisError ? (
              <ErrorState message="Erreur lors du chargement de l'analyse" />
            ) : analysis ? (
              <StructuresAnalysis
                structures={structures}
                statistics={analysis.structuralStatistics}
              />
            ) : null}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}


