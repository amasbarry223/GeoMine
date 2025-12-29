'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CreateGeochemicalSampleInput,
  GeochemicalSample,
} from '@/types/geochemistry';

const sampleSchema = z.object({
  sampleID: z.string().min(1, 'Sample ID requis'),
  holeID: z.string().optional(),
  depth_cm: z.number().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  z: z.number().optional(),
  utmZone: z.string().optional(),
  sampleStatus: z.string().optional(),
  geologist: z.string().optional(),
  operator: z.string().optional(),
  comments: z.string().optional(),
});

type SampleFormData = z.infer<typeof sampleSchema>;

interface SampleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateGeochemicalSampleInput) => Promise<void>;
  sample?: GeochemicalSample;
  campaignId: string;
}

export function SampleForm({
  open,
  onOpenChange,
  onSubmit,
  sample,
  campaignId,
}: SampleFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SampleFormData>({
    resolver: zodResolver(sampleSchema),
    defaultValues: sample
      ? {
          sampleID: sample.sampleID,
          holeID: sample.holeID,
          depth_cm: sample.depth_cm,
          x: sample.x,
          y: sample.y,
          z: sample.z,
          utmZone: sample.utmZone,
          sampleStatus: sample.sampleStatus,
          geologist: sample.geologist,
          operator: sample.operator,
          comments: sample.comments,
        }
      : undefined,
  });

  const onFormSubmit = async (data: SampleFormData) => {
    await onSubmit({
      campaignId,
      ...data,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{sample ? 'Modifier' : 'Nouvel'} échantillon</DialogTitle>
          <DialogDescription>
            {sample ? 'Modifier les informations de l\'échantillon' : 'Créer un nouvel échantillon géochimique'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sampleID">Sample ID *</Label>
              <Input id="sampleID" {...register('sampleID')} />
              {errors.sampleID && (
                <p className="text-sm text-destructive">{errors.sampleID.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="holeID">Hole ID</Label>
              <Input id="holeID" {...register('holeID')} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="x">X</Label>
              <Input
                id="x"
                type="number"
                step="any"
                {...register('x', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="y">Y</Label>
              <Input
                id="y"
                type="number"
                step="any"
                {...register('y', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="z">Z</Label>
              <Input
                id="z"
                type="number"
                step="any"
                {...register('z', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="depth_cm">Profondeur (cm)</Label>
              <Input
                id="depth_cm"
                type="number"
                step="any"
                {...register('depth_cm', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="utmZone">Zone UTM</Label>
              <Input id="utmZone" {...register('utmZone')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sampleStatus">Statut</Label>
              <Input id="sampleStatus" {...register('sampleStatus')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="geologist">Géologue</Label>
              <Input id="geologist" {...register('geologist')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="operator">Opérateur</Label>
            <Input id="operator" {...register('operator')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="comments">Commentaires</Label>
            <Input id="comments" {...register('comments')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement...' : sample ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


