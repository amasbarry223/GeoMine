'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import * as z from 'zod';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCreateGeochemicalSample } from '@/lib/api/queries-geochemistry';
import { CreateGeochemicalSampleInput } from '@/types/geochemistry';
import { fetchWithCSRF } from '@/lib/csrf-client';

const sampleFormSchema = z.object({
  campaignId: z.string().min(1, 'Campagne requise'),
  sampleID: z.string().min(1, 'Sample ID requis').max(100),
  holeID: z.string().max(100).optional(),
  surfSampleType: z.string().max(100).optional(),
  qcRef: z.string().max(100).optional(),
  dupID: z.string().max(100).optional(),
  sampleStatus: z.string().max(50).optional(),
  depth_cm: z.coerce.number().min(0).max(10000).optional().or(z.literal('')),
  x: z.coerce.number().finite().optional().or(z.literal('')),
  y: z.coerce.number().finite().optional().or(z.literal('')),
  z: z.coerce.number().finite().optional().or(z.literal('')),
  utmZone: z.string().max(10).optional(),
  surveyMethod: z.string().max(100).optional(),
  weathering: z.string().max(100).optional(),
  color: z.string().max(50).optional(),
  grainSize: z.string().max(50).optional(),
  regolith: z.string().max(100).optional(),
  litho1: z.string().max(100).optional(),
  litho2: z.string().max(100).optional(),
  veinType: z.string().max(100).optional(),
  veinAbd: z.string().max(50).optional(),
  sulphideType: z.string().max(100).optional(),
  sulphideAbd: z.string().max(50).optional(),
  areaDescription: z.string().max(1000).optional(),
  operator: z.string().max(100).optional(),
  geologist: z.string().max(100).optional(),
  date: z.string().optional(),
  comments: z.string().max(2000).optional(),
});

type SampleFormData = z.infer<typeof sampleFormSchema>;

export default function NewGeochemicalSamplePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const campaignIdFromQuery = searchParams.get('campaignId');
  
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(
    campaignIdFromQuery || ''
  );

  // Fetch campaigns
  const { data: campaignsData, isLoading: isLoadingCampaigns } = useQuery({
    queryKey: ['campaigns', 'GEOCHEMISTRY'],
    queryFn: async () => {
      const response = await fetchWithCSRF('/api/campaigns?campaignType=GEOCHEMISTRY');
      if (!response.ok) {
        // If campaigns API doesn't exist yet, return empty array
        if (response.status === 404) return [];
        throw new Error('Failed to fetch campaigns');
      }
      const result = await response.json();
      return result.data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const campaigns = campaignsData || [];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<SampleFormData>({
    resolver: zodResolver(sampleFormSchema),
    defaultValues: {
      campaignId: campaignIdFromQuery || '',
      sampleID: '',
      holeID: '',
      depth_cm: '',
      x: '',
      y: '',
      z: '',
      utmZone: '',
      sampleStatus: '',
      geologist: '',
      operator: '',
      comments: '',
    },
  });

  const createSample = useCreateGeochemicalSample();

  const onSubmit = async (data: SampleFormData) => {
    // Convert empty strings to undefined for optional fields
    const sampleData: CreateGeochemicalSampleInput = {
      campaignId: data.campaignId,
      sampleID: data.sampleID,
      holeID: data.holeID || undefined,
      surfSampleType: data.surfSampleType || undefined,
      qcRef: data.qcRef || undefined,
      dupID: data.dupID || undefined,
      sampleStatus: data.sampleStatus || undefined,
      depth_cm: data.depth_cm === '' ? undefined : data.depth_cm,
      x: data.x === '' ? undefined : data.x,
      y: data.y === '' ? undefined : data.y,
      z: data.z === '' ? undefined : data.z,
      utmZone: data.utmZone || undefined,
      surveyMethod: data.surveyMethod || undefined,
      weathering: data.weathering || undefined,
      color: data.color || undefined,
      grainSize: data.grainSize || undefined,
      regolith: data.regolith || undefined,
      litho1: data.litho1 || undefined,
      litho2: data.litho2 || undefined,
      veinType: data.veinType || undefined,
      veinAbd: data.veinAbd || undefined,
      sulphideType: data.sulphideType || undefined,
      sulphideAbd: data.sulphideAbd || undefined,
      areaDescription: data.areaDescription || undefined,
      operator: data.operator || undefined,
      geologist: data.geologist || undefined,
      date: data.date ? new Date(data.date) : undefined,
      comments: data.comments || undefined,
    };

    try {
      await createSample.mutateAsync(sampleData);
      router.push(`/geochemistry/samples?campaignId=${sampleData.campaignId}`);
    } catch (error) {
      // Error is handled by the mutation hook
      console.error('Error creating sample:', error);
    }
  };

  const watchedCampaignId = watch('campaignId');

  return (
    <AppLayout headerTitle="Nouvel échantillon géochimique">
      <div className="container mx-auto p-6 space-y-6 max-w-4xl">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Nouvel échantillon géochimique</h1>
            <p className="text-muted-foreground mt-2">
              Créer un nouvel échantillon géochimique
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
              <CardDescription>
                Informations de base sur l'échantillon
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="campaignId">
                  Campagne <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={watchedCampaignId}
                  onValueChange={(value) => {
                    setValue('campaignId', value);
                    setSelectedCampaignId(value);
                  }}
                  disabled={isLoadingCampaigns || isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une campagne" />
                  </SelectTrigger>
                  <SelectContent>
                    {campaigns.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        Aucune campagne disponible
                      </div>
                    ) : (
                      campaigns.map((campaign: any) => (
                        <SelectItem key={campaign.id} value={campaign.id}>
                          {campaign.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.campaignId && (
                  <p className="text-sm text-destructive">{errors.campaignId.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sampleID">
                    Sample ID <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="sampleID"
                    {...register('sampleID')}
                    disabled={isSubmitting}
                  />
                  {errors.sampleID && (
                    <p className="text-sm text-destructive">{errors.sampleID.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="holeID">Hole ID</Label>
                  <Input
                    id="holeID"
                    {...register('holeID')}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="surfSampleType">Type d'échantillon</Label>
                  <Input
                    id="surfSampleType"
                    {...register('surfSampleType')}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qcRef">Référence QC</Label>
                  <Input
                    id="qcRef"
                    {...register('qcRef')}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dupID">ID Duplicata</Label>
                  <Input
                    id="dupID"
                    {...register('dupID')}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sampleStatus">Statut</Label>
                  <Input
                    id="sampleStatus"
                    {...register('sampleStatus')}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    {...register('date')}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Coordonnées</CardTitle>
              <CardDescription>
                Coordonnées spatiales de l'échantillon
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="x">X (UTM)</Label>
                  <Input
                    id="x"
                    type="number"
                    step="any"
                    {...register('x')}
                    disabled={isSubmitting}
                  />
                  {errors.x && (
                    <p className="text-sm text-destructive">{errors.x.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="y">Y (UTM)</Label>
                  <Input
                    id="y"
                    type="number"
                    step="any"
                    {...register('y')}
                    disabled={isSubmitting}
                  />
                  {errors.y && (
                    <p className="text-sm text-destructive">{errors.y.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="z">Z (Altitude)</Label>
                  <Input
                    id="z"
                    type="number"
                    step="any"
                    {...register('z')}
                    disabled={isSubmitting}
                  />
                  {errors.z && (
                    <p className="text-sm text-destructive">{errors.z.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="depth_cm">Profondeur (cm)</Label>
                  <Input
                    id="depth_cm"
                    type="number"
                    step="any"
                    {...register('depth_cm')}
                    disabled={isSubmitting}
                  />
                  {errors.depth_cm && (
                    <p className="text-sm text-destructive">{errors.depth_cm.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="utmZone">Zone UTM</Label>
                  <Input
                    id="utmZone"
                    {...register('utmZone')}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Caractéristiques géologiques</CardTitle>
              <CardDescription>
                Description géologique de l'échantillon
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="surveyMethod">Méthode d'échantillonnage</Label>
                  <Input
                    id="surveyMethod"
                    {...register('surveyMethod')}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weathering">Altération</Label>
                  <Input
                    id="weathering"
                    {...register('weathering')}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="color">Couleur</Label>
                  <Input
                    id="color"
                    {...register('color')}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grainSize">Taille de grain</Label>
                  <Input
                    id="grainSize"
                    {...register('grainSize')}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="regolith">Régolithe</Label>
                  <Input
                    id="regolith"
                    {...register('regolith')}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="litho1">Lithologie 1</Label>
                  <Input
                    id="litho1"
                    {...register('litho1')}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="litho2">Lithologie 2</Label>
                  <Input
                    id="litho2"
                    {...register('litho2')}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="veinType">Type de veine</Label>
                  <Input
                    id="veinType"
                    {...register('veinType')}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="veinAbd">Abondance de veine</Label>
                  <Input
                    id="veinAbd"
                    {...register('veinAbd')}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sulphideType">Type de sulfure</Label>
                  <Input
                    id="sulphideType"
                    {...register('sulphideType')}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sulphideAbd">Abondance de sulfure</Label>
                <Input
                  id="sulphideAbd"
                  {...register('sulphideAbd')}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="areaDescription">Description de la zone</Label>
                <Textarea
                  id="areaDescription"
                  {...register('areaDescription')}
                  disabled={isSubmitting}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Personnel</CardTitle>
              <CardDescription>
                Informations sur le personnel impliqué
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="operator">Opérateur</Label>
                  <Input
                    id="operator"
                    {...register('operator')}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="geologist">Géologue</Label>
                  <Input
                    id="geologist"
                    {...register('geologist')}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Commentaires</CardTitle>
              <CardDescription>
                Notes et commentaires additionnels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="comments">Commentaires</Label>
                <Textarea
                  id="comments"
                  {...register('comments')}
                  disabled={isSubmitting}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting || createSample.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting || createSample.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}

