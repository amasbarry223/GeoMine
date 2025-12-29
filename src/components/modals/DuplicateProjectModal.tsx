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
import { addCSRFTokenToHeaders } from '@/lib/csrf-client';

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

    // Normalize GPS coordinates
    // The schema accepts: string "lat,lng", object {lat, lng}, object {latitude, longitude}, or null
    let normalizedGpsCoordinates: string | { latitude: number; longitude: number } | { lat: number; lng: number } | null = null;
    
    if (project.gpsCoordinates) {
      if (typeof project.gpsCoordinates === 'string') {
        const trimmed = project.gpsCoordinates.trim();
        // Check if it's already in "lat,lng" format (matches the regex in schema)
        if (/^-?\d+\.?\d*,-?\d+\.?\d*$/.test(trimmed)) {
          // Keep as string format - this is what the schema expects
          normalizedGpsCoordinates = trimmed;
        } else {
          // Try to parse as JSON string
          try {
            const parsed = JSON.parse(trimmed);
            if (typeof parsed === 'object' && parsed !== null) {
              // Convert to {latitude, longitude} format (preferred format)
              if ('latitude' in parsed && 'longitude' in parsed) {
                normalizedGpsCoordinates = { 
                  latitude: Number(parsed.latitude), 
                  longitude: Number(parsed.longitude) 
                };
              } else if ('lat' in parsed && 'lng' in parsed) {
                normalizedGpsCoordinates = { 
                  lat: Number(parsed.lat), 
                  lng: Number(parsed.lng) 
                };
              }
            }
          } catch (e) {
            // If JSON parsing fails, try to parse as comma-separated string manually
            if (trimmed.includes(',')) {
              const parts = trimmed.split(',');
              if (parts.length === 2) {
                const lat = parseFloat(parts[0].trim());
                const lng = parseFloat(parts[1].trim());
                if (!isNaN(lat) && !isNaN(lng)) {
                  // Convert to object format
                  normalizedGpsCoordinates = { latitude: lat, longitude: lng };
                }
              }
            }
          }
        }
      } else if (typeof project.gpsCoordinates === 'object' && project.gpsCoordinates !== null) {
        // Already an object, ensure it has the right format
        const coords = project.gpsCoordinates as any;
        if ('latitude' in coords && 'longitude' in coords) {
          normalizedGpsCoordinates = { 
            latitude: Number(coords.latitude), 
            longitude: Number(coords.longitude) 
          };
        } else if ('lat' in coords && 'lng' in coords) {
          normalizedGpsCoordinates = { 
            lat: Number(coords.lat), 
            lng: Number(coords.lng) 
          };
        }
      }
    }

    // Normalize tags - must be array or null
    let normalizedTags: string[] | null = null;
    if (project.tags) {
      if (typeof project.tags === 'string') {
        try {
          const parsed = JSON.parse(project.tags);
          normalizedTags = Array.isArray(parsed) ? parsed : null;
        } catch (e) {
          normalizedTags = null;
        }
      } else if (Array.isArray(project.tags)) {
        normalizedTags = project.tags;
      }
    }

    // Normalize description and siteLocation - must be string or null
    const normalizedDescription = project.description && typeof project.description === 'string' 
      ? project.description.trim() || null 
      : null;
    const normalizedSiteLocation = project.siteLocation && typeof project.siteLocation === 'string'
      ? project.siteLocation.trim() || null
      : null;

    // Prepare headers with CSRF token
    const headers = addCSRFTokenToHeaders({ 'Content-Type': 'application/json' });

    const result = await execute(
      () =>
        fetch('/api/projects', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            name: name.trim(),
            description: normalizedDescription,
            siteLocation: normalizedSiteLocation,
            gpsCoordinates: normalizedGpsCoordinates,
            tags: normalizedTags,
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

