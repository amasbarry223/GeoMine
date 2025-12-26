'use client';

import React, { useState } from 'react';
import { Copy } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Project } from '@/types/geophysic';
import { useApi } from '@/hooks/use-api';

interface DuplicateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onSuccess?: () => void;
}

export function DuplicateProjectModal({
  open,
  onOpenChange,
  project,
  onSuccess,
}: DuplicateProjectModalProps) {
  const [name, setName] = useState('');
  const [includeCampaigns, setIncludeCampaigns] = useState(true);
  const [includeData, setIncludeData] = useState(false);
  const { execute, loading } = useApi();

  React.useEffect(() => {
    if (project) {
      setName(`${project.name} (Copie)`);
    }
  }, [project]);

  const handleDuplicate = async () => {
    if (!project || !name.trim()) return;

    // Parse gpsCoordinates if it's a string
    let parsedGpsCoordinates = null;
    if (project.gpsCoordinates) {
      try {
        parsedGpsCoordinates = typeof project.gpsCoordinates === 'string' 
          ? JSON.parse(project.gpsCoordinates) 
          : project.gpsCoordinates;
      } catch (e) {
        // If parsing fails, try to parse as comma-separated string
        if (typeof project.gpsCoordinates === 'string' && project.gpsCoordinates.includes(',')) {
          const [lat, lng] = project.gpsCoordinates.split(',').map(s => parseFloat(s.trim()));
          if (!isNaN(lat) && !isNaN(lng)) {
            parsedGpsCoordinates = { latitude: lat, longitude: lng };
          }
        }
      }
    }

    // Parse tags if it's a string
    let parsedTags = null;
    if (project.tags) {
      try {
        parsedTags = typeof project.tags === 'string' 
          ? JSON.parse(project.tags) 
          : project.tags;
      } catch (e) {
        parsedTags = Array.isArray(project.tags) ? project.tags : [];
      }
    }

    const result = await execute(
      () =>
        fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            description: project.description,
            siteLocation: project.siteLocation,
            gpsCoordinates: parsedGpsCoordinates,
            tags: parsedTags,
            duplicateFrom: project.id,
            includeCampaigns,
            includeData,
          }),
        }),
      {
        successMessage: 'Projet dupliqué avec succès',
        onSuccess: () => {
          // Reset form
          setName('');
          setIncludeCampaigns(true);
          setIncludeData(false);
          onOpenChange(false);
          // Call parent's onSuccess callback to refresh the list
          if (onSuccess) {
            onSuccess();
          }
        },
      }
    );
  };

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="w-5 h-5" />
            Dupliquer le Projet
          </DialogTitle>
          <DialogDescription>
            Créez une copie du projet "{project.name}" avec les options sélectionnées
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Nom */}
          <div className="space-y-2">
            <Label htmlFor="duplicate-name">
              Nom du nouveau projet <span className="text-destructive">*</span>
            </Label>
            <Input
              id="duplicate-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom du projet dupliqué"
              required
            />
          </div>

          {/* Options */}
          <div className="space-y-3">
            <Label>Options de duplication</Label>
            <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-campaigns"
                  checked={includeCampaigns}
                  onCheckedChange={(checked) => setIncludeCampaigns(checked === true)}
                />
                <Label htmlFor="include-campaigns" className="cursor-pointer flex-1">
                  <div className="font-medium">Inclure les campagnes</div>
                  <div className="text-xs text-muted-foreground">
                    Copie toutes les campagnes et lignes de sondage
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-data"
                  checked={includeData}
                  onCheckedChange={(checked) => setIncludeData(checked === true)}
                />
                <Label htmlFor="include-data" className="cursor-pointer flex-1">
                  <div className="font-medium">Inclure les données</div>
                  <div className="text-xs text-muted-foreground">
                    Copie tous les datasets et modèles d'inversion
                  </div>
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleDuplicate} disabled={loading || !name.trim()}>
            {loading ? 'Duplication...' : 'Dupliquer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

