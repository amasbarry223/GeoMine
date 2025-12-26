'use client';

import React, { useState, useEffect } from 'react';
import { Edit, X } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Project, ProjectStatus } from '@/types/geophysic';
import { useApi } from '@/hooks/use-api';

interface EditProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onSuccess?: () => void;
}

export function EditProjectModal({
  open,
  onOpenChange,
  project,
  onSuccess,
}: EditProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [siteLocation, setSiteLocation] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [status, setStatus] = useState<ProjectStatus>(ProjectStatus.ACTIVE);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const { execute, loading } = useApi();

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || '');
      setSiteLocation(project.siteLocation || '');
      setStatus(project.status);
      
      // Parse GPS coordinates
      if (project.gpsCoordinates) {
        try {
          const coords = typeof project.gpsCoordinates === 'string' 
            ? JSON.parse(project.gpsCoordinates) 
            : project.gpsCoordinates;
          if (coords.latitude) setLatitude(coords.latitude.toString());
          if (coords.longitude) setLongitude(coords.longitude.toString());
        } catch {
          // Invalid JSON, ignore
        }
      }
      
      // Parse tags
      if (project.tags) {
        try {
          const parsedTags = typeof project.tags === 'string' 
            ? JSON.parse(project.tags) 
            : project.tags;
          setTags(Array.isArray(parsedTags) ? parsedTags : []);
        } catch {
          setTags([]);
        }
      } else {
        setTags([]);
      }
    }
  }, [project]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!project || !name.trim()) return;

    const result = await execute(
      () =>
        fetch(`/api/projects/${project.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim() || null,
            siteLocation: siteLocation.trim() || null,
            gpsCoordinates:
              latitude && longitude
                ? { latitude: parseFloat(latitude), longitude: parseFloat(longitude) }
                : null,
            tags: tags.length > 0 ? tags : null,
            status,
          }),
        }),
      {
        successMessage: 'Projet mis à jour avec succès',
        onSuccess: () => {
          onOpenChange(false);
          if (onSuccess) onSuccess();
        },
      }
    );
  };

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Modifier le Projet
          </DialogTitle>
          <DialogDescription>
            Modifiez les informations du projet. Tous les champs marqués d'un * sont obligatoires.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nom du projet */}
          <div className="space-y-2">
            <Label htmlFor="edit-name">
              Nom du projet <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Site Montagne - Zone A"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez le projet, ses objectifs et son contexte..."
              rows={4}
            />
          </div>

          {/* Statut */}
          <div className="space-y-2">
            <Label htmlFor="edit-status">Statut</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as ProjectStatus)}>
              <SelectTrigger id="edit-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ProjectStatus.ACTIVE}>Actif</SelectItem>
                <SelectItem value={ProjectStatus.COMPLETED}>Terminé</SelectItem>
                <SelectItem value={ProjectStatus.ARCHIVED}>Archivé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Localisation */}
          <div className="space-y-2">
            <Label htmlFor="edit-siteLocation">Localisation du site</Label>
            <Input
              id="edit-siteLocation"
              value={siteLocation}
              onChange={(e) => setSiteLocation(e.target.value)}
              placeholder="Ex: Massif Central, France"
            />
          </div>

          {/* Coordonnées GPS */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-latitude">Latitude</Label>
              <Input
                id="edit-latitude"
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="45.234"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-longitude">Longitude</Label>
              <Input
                id="edit-longitude"
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="2.567"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="edit-tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="edit-tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Ajouter un tag (Entrée pour valider)"
              />
              <Button type="button" variant="outline" onClick={handleAddTag}>
                Ajouter
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

