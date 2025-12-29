'use client';

import React from 'react';
import { BarChart3 } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function GeochemistryAnalysisPage() {
  return (
    <AppLayout headerTitle="Analyses géochimiques">
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analyses géochimiques</h1>
          <p className="text-muted-foreground mt-2">
            Visualisation et interprétation des analyses géochimiques
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Statistiques par élément</CardTitle>
            <CardDescription>Analyse statistique des éléments géochimiques</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune analyse</h3>
              <p className="text-muted-foreground">
                Les analyses apparaîtront ici une fois les échantillons importés
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}


