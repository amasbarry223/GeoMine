'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Drill, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/components/layout/AppLayout';
import { Campaign } from '@/types/geophysic';

export default function DrillingPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  // TODO: Fetch campaigns with campaignType = DRILLING
  const filteredCampaigns = campaigns.filter((campaign) =>
    campaign.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout headerTitle="Sondages">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Sondages</h1>
            <p className="text-muted-foreground mt-2">
              Gestion des campagnes de forage (Acore, RAB, Auger, RC, Diamond)
            </p>
          </div>
          <Button onClick={() => router.push('/drilling/holes')}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle campagne
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Campagnes de forage</CardTitle>
                <CardDescription>Liste des campagnes de sondage</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredCampaigns.length === 0 ? (
              <div className="text-center py-12">
                <Drill className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune campagne</h3>
                <p className="text-muted-foreground mb-4">
                  Commencez par créer une nouvelle campagne de forage
                </p>
                <Button onClick={() => router.push('/drilling/holes')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Créer une campagne
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredCampaigns.map((campaign) => (
                  <Card
                    key={campaign.id}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => router.push(`/drilling/holes?campaignId=${campaign.id}`)}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg">{campaign.name}</CardTitle>
                      <CardDescription>{campaign.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        {campaign.startDate && (
                          <div>
                            <span className="text-muted-foreground">Début: </span>
                            {new Date(campaign.startDate).toLocaleDateString()}
                          </div>
                        )}
                        {campaign.endDate && (
                          <div>
                            <span className="text-muted-foreground">Fin: </span>
                            {new Date(campaign.endDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}


