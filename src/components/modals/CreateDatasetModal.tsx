'use client';

import React, { useState, useRef } from 'react';
import { Plus, Upload, X } from 'lucide-react';
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
import { useRouter } from 'next/navigation';
import { useApi } from '@/hooks/use-api';
import { toast } from '@/hooks/use-toast';

interface CreateDatasetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  surveyLineId?: string;
}

export function CreateDatasetModal({ open, onOpenChange, onSuccess, surveyLineId: initialSurveyLineId }: CreateDatasetModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [dataType, setDataType] = useState<DataType>(DataType.RESISTIVITY);
  const [surveyLineId, setSurveyLineId] = useState(initialSurveyLineId || '');
  const [file, setFile] = useState<File | null>(null);
  const { execute: executeCreate, loading: creating } = useApi();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!surveyLineId) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner une ligne de sondage',
        variant: 'destructive',
      });
      return;
    }

    // Si un fichier est sélectionné, utiliser l'API d'import qui crée le dataset et importe
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('surveyLineId', surveyLineId);
      formData.append('name', name);
      formData.append('dataType', dataType);
      formData.append('format', 'CSV'); // Format par défaut, peut être détecté automatiquement
      formData.append('hasHeader', 'true');
      formData.append('delimiter', ',');

      const importResult = await executeCreate(
        () => fetch('/api/datasets/import', {
          method: 'POST',
          body: formData,
        }),
        {
          successMessage: 'Dataset créé et données importées avec succès',
          errorMessage: 'Erreur lors de l\'importation',
        }
      );

      if (importResult && onSuccess) {
        onSuccess();
      }
      onOpenChange(false);
      setName('');
      setFile(null);
      setSurveyLineId(initialSurveyLineId || '');
    } else {
      // Pas de fichier, rediriger vers la page d'import avec les paramètres pré-remplis
      onOpenChange(false);
      const params = new URLSearchParams({
        surveyLineId,
        name,
        dataType,
      });
      router.push(`/import?${params.toString()}`);
    }
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

          <div className="space-y-2">
            <Label>Fichier à importer (optionnel)</Label>
            <div className="rounded-lg border border-dashed p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,.dat,.stg,.zip"
                onChange={handleFileSelect}
                className="hidden"
                id="dataset-file-input"
              />
              {!file ? (
                <>
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Les données peuvent être importées maintenant ou après la création
                  </p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Formats supportés: CSV, TXT, RES2DINV (.dat), AGI SuperSting (.stg), ZIP
                  </p>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choisir un fichier
                  </Button>
                </>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Upload className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm font-medium truncate">{file.name}</span>
                      {file.name.toLowerCase().endsWith('.zip') && (
                        <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded flex-shrink-0">
                          Archive
                        </span>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 flex-shrink-0"
                      onClick={handleRemoveFile}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                    {file.size > 1024 * 1024 && ` (${(file.size / (1024 * 1024)).toFixed(2)} MB)`}
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={!name.trim() || creating}>
              {creating 
                ? 'Création...' 
                : file 
                  ? 'Créer et importer' 
                  : 'Créer le dataset'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

