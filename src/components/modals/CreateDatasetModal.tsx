'use client';

import React, { useState } from 'react';
import { Plus, Upload } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataType } from '@/types/geophysic';

interface CreateDatasetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateDatasetModal({ open, onOpenChange, onSuccess }: CreateDatasetModalProps) {
  const [name, setName] = useState('');
  const [dataType, setDataType] = useState<DataType>(DataType.RESISTIVITY);
  const [surveyLineId, setSurveyLineId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirect to import page with pre-filled data
    if (onSuccess) onSuccess();
    onOpenChange(false);
    // TODO: Navigate to import page with params
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Nouveau Dataset
          </DialogTitle>
          <DialogDescription>
            Créez un nouveau jeu de données. Vous pourrez importer les données après la création.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dataset-name">
              Nom du dataset <span className="text-destructive">*</span>
            </Label>
            <Input
              id="dataset-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Données résistivité - Ligne 001"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dataset-type">Type de données</Label>
            <Select value={dataType} onValueChange={(value) => setDataType(value as DataType)}>
              <SelectTrigger id="dataset-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={DataType.RESISTIVITY}>Résistivité</SelectItem>
                <SelectItem value={DataType.CHARGEABILITY}>Chargeabilité</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border border-dashed p-6 text-center">
            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Les données seront importées après la création
            </p>
            <Button type="button" variant="outline" size="sm">
              Choisir un fichier
            </Button>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Créer et importer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

