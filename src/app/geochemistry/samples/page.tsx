'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FlaskConical, Upload, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function GeochemistrySamplesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const campaignId = searchParams.get('campaignId');
  const [isImporting, setIsImporting] = useState(false);

  return (
    <AppLayout headerTitle="Échantillons géochimiques">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Échantillons géochimiques</h1>
            <p className="text-muted-foreground mt-2">
              Gestion et import des échantillons géochimiques
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setIsImporting(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Importer CSV
            </Button>
            <Button onClick={() => router.push('/geochemistry/samples/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvel échantillon
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des échantillons</CardTitle>
            <CardDescription>
              {campaignId
                ? 'Échantillons de la campagne sélectionnée'
                : 'Tous les échantillons géochimiques'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <FlaskConical className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun échantillon</h3>
              <p className="text-muted-foreground mb-4">
                Commencez par importer des échantillons ou créer un échantillon manuellement
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}


