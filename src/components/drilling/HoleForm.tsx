'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CreateDrillHoleInput, DrillHole, DrillType } from '@/types/drilling';

const holeSchema = z.object({
  holeID: z.string().min(1, 'Hole ID requis'),
  drillType: z.nativeEnum(DrillType),
  collarX: z.number(),
  collarY: z.number(),
  collarZ: z.number(),
  azimuth: z.number().optional(),
  dip: z.number().optional(),
  totalDepth: z.number().optional(),
  utmZone: z.string().optional(),
  contractor: z.string().optional(),
  rigType: z.string().optional(),
});

type HoleFormData = z.infer<typeof holeSchema>;

interface HoleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateDrillHoleInput) => Promise<void>;
  hole?: DrillHole;
  campaignId: string;
}

export function HoleForm({ open, onOpenChange, onSubmit, hole, campaignId }: HoleFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<HoleFormData>({
    resolver: zodResolver(holeSchema),
    defaultValues: hole
      ? {
          holeID: hole.holeID,
          drillType: hole.drillType,
          collarX: hole.collarX,
          collarY: hole.collarY,
          collarZ: hole.collarZ,
          azimuth: hole.azimuth,
          dip: hole.dip,
          totalDepth: hole.totalDepth,
          utmZone: hole.utmZone,
          contractor: hole.contractor,
          rigType: hole.rigType,
        }
      : {
          drillType: DrillType.DIAMOND,
        },
  });

  const drillType = watch('drillType');

  const onFormSubmit = async (data: HoleFormData) => {
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
          <DialogTitle>{hole ? 'Modifier' : 'Nouveau'} trou</DialogTitle>
          <DialogDescription>
            {hole ? 'Modifier les informations du trou' : 'Créer un nouveau trou de forage'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="holeID">Hole ID *</Label>
              <Input id="holeID" {...register('holeID')} />
              {errors.holeID && (
                <p className="text-sm text-destructive">{errors.holeID.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="drillType">Type de forage *</Label>
              <Select value={drillType} onValueChange={(value) => setValue('drillType', value as DrillType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={DrillType.ACORE}>Acore</SelectItem>
                  <SelectItem value={DrillType.RAB}>RAB</SelectItem>
                  <SelectItem value={DrillType.AUGER}>Auger</SelectItem>
                  <SelectItem value={DrillType.RC}>RC</SelectItem>
                  <SelectItem value={DrillType.DIAMOND}>Diamond</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="collarX">X (Collar) *</Label>
              <Input
                id="collarX"
                type="number"
                step="any"
                {...register('collarX', { valueAsNumber: true })}
              />
              {errors.collarX && (
                <p className="text-sm text-destructive">{errors.collarX.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="collarY">Y (Collar) *</Label>
              <Input
                id="collarY"
                type="number"
                step="any"
                {...register('collarY', { valueAsNumber: true })}
              />
              {errors.collarY && (
                <p className="text-sm text-destructive">{errors.collarY.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="collarZ">Z (Collar) *</Label>
              <Input
                id="collarZ"
                type="number"
                step="any"
                {...register('collarZ', { valueAsNumber: true })}
              />
              {errors.collarZ && (
                <p className="text-sm text-destructive">{errors.collarZ.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="azimuth">Azimuth (°)</Label>
              <Input
                id="azimuth"
                type="number"
                step="any"
                {...register('azimuth', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dip">Dip (°)</Label>
              <Input
                id="dip"
                type="number"
                step="any"
                {...register('dip', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalDepth">Profondeur totale (m)</Label>
              <Input
                id="totalDepth"
                type="number"
                step="any"
                {...register('totalDepth', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="utmZone">Zone UTM</Label>
              <Input id="utmZone" {...register('utmZone')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contractor">Contractor</Label>
              <Input id="contractor" {...register('contractor')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rigType">Type de rig</Label>
            <Input id="rigType" {...register('rigType')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement...' : hole ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


