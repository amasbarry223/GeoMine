'use client';

import React, { useState } from 'react';
import { Plus, MapPin, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { GISType } from '@/types/geophysic';
import { useCreateGISLayer } from '@/lib/api/queries-gis';

interface CreateGISLayerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateGISLayerModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateGISLayerModalProps) {
  const [name, setName] = useState('');
  const [layerType, setLayerType] = useState<GISType>(GISType.CUSTOM);
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const createMutation = useCreateGISLayer();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !file) return;

    const formData = new FormData();
    formData.append('name', name.trim());
    formData.append('layerType', layerType);
    if (description) formData.append('description', description);
    formData.append('file', file);

    const formDataObj = {
      projectId: '1', // TODO: Get from context
      name: name.trim(),
      layerType,
      description: description || undefined,
      data: {}, // Will be populated from file parsing
    };

    createMutation.mutate(formDataObj, {
      onSuccess: () => {
        if (onSuccess) onSuccess();
        onOpenChange(false);
        setName('');
        setDescription('');
        setFile(null);
      },
    });
  };

  const layerTypes = [
    { value: GISType.GEOLOGY, label: 'Géologie' },
    { value: GISType.BOREHOLES, label: 'Forages' },
    { value: GISType.SAMPLES, label: 'Échantillons' },
    { value: GISType.TOPOGRAPHY, label: 'Topographie' },
    { value: GISType.STRUCTURES, label: 'Structures' },
    { value: GISType.CUSTOM, label: 'Personnalisé' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Nouvelle Couche SIG
          </DialogTitle>
          <DialogDescription>
            Créez une nouvelle couche SIG en important un fichier GeoJSON, Shapefile ou KML
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nom */}
          <div className="space-y-2">
            <Label htmlFor="layer-name">
              Nom de la couche <span className="text-destructive">*</span>
            </Label>
            <Input
              id="layer-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Géologie - Zone A"
              required
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="layer-type">Type de couche</Label>
            <Select value={layerType} onValueChange={(value) => setLayerType(value as GISType)}>
              <SelectTrigger id="layer-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {layerTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="layer-description">Description</Label>
            <Textarea
              id="layer-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description de la couche..."
              rows={3}
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Fichier à importer</Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                Formats supportés: GeoJSON, Shapefile (.shp), KML
              </p>
              <Input
                type="file"
                accept=".geojson,.json,.shp,.kml"
                onChange={handleFileChange}
                className="hidden"
                id="layer-file"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('layer-file')?.click()}
              >
                Choisir un fichier
              </Button>
              {file && (
                <p className="mt-2 text-sm font-medium">{file.name}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={!name.trim() || !file || createMutation.isPending}>
              {createMutation.isPending ? 'Création...' : 'Créer la couche'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

