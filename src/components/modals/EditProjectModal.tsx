'use client';

import React, { useState, useEffect } from 'react';
import { Edit } from 'lucide-react';
import { FormModal, FormInput, FormTextarea, TagsInput, GPSInput, FormField } from '@/components/forms';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Project, ProjectStatus } from '@/types/geophysic';
import { useApi } from '@/hooks/use-api';
import { useCSRFToken } from '@/lib/csrf-client';
import { GPSCoordinates } from '@/components/forms/GPSInput';

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
  const [status, setStatus] = useState<ProjectStatus>(ProjectStatus.ACTIVE);
  const [gpsCoordinates, setGpsCoordinates] = useState<GPSCoordinates | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const { execute, loading } = useApi();
  const { csrfToken } = useCSRFToken();

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
          if (coords.latitude && coords.longitude) {
            setGpsCoordinates({ latitude: coords.latitude, longitude: coords.longitude });
          } else if (coords.lat && coords.lng) {
            setGpsCoordinates({ latitude: coords.lat, longitude: coords.lng });
          }
        } catch {
          // Try comma-separated string
          if (typeof project.gpsCoordinates === 'string' && project.gpsCoordinates.includes(',')) {
            const [lat, lng] = project.gpsCoordinates.split(',').map(s => parseFloat(s.trim()));
            if (!isNaN(lat) && !isNaN(lng)) {
              setGpsCoordinates({ latitude: lat, longitude: lng });
            }
          }
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

  const handleSubmit = async () => {
    if (!project || !name.trim()) return;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (csrfToken) {
      headers['x-csrf-token'] = csrfToken;
    }

    await execute(
      () =>
        fetch(`/api/projects/${project.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim() || null,
            siteLocation: siteLocation.trim() || null,
            gpsCoordinates,
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
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Modifier le Projet"
      description="Modifiez les informations du projet. Tous les champs marqués d'un * sont obligatoires."
      icon={<Edit className="w-5 h-5" />}
      onSubmit={handleSubmit}
      loading={loading}
      disabled={!name.trim()}
      submitLabel={loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
      maxWidth="2xl"
    >
      <FormInput
        label="Nom du projet"
        name="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ex: Site Montagne - Zone A"
        required
      />

      <FormTextarea
        label="Description"
        name="description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Décrivez le projet, ses objectifs et son contexte..."
        rows={4}
      />

      <FormField label="Statut" name="status">
        <Select value={status} onValueChange={(value) => setStatus(value as ProjectStatus)}>
          <SelectTrigger id="status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ProjectStatus.ACTIVE}>Actif</SelectItem>
            <SelectItem value={ProjectStatus.COMPLETED}>Terminé</SelectItem>
            <SelectItem value={ProjectStatus.ARCHIVED}>Archivé</SelectItem>
          </SelectContent>
        </Select>
      </FormField>

      <FormInput
        label="Localisation du site"
        name="siteLocation"
        value={siteLocation}
        onChange={(e) => setSiteLocation(e.target.value)}
        placeholder="Ex: Massif Central, France"
      />

      <GPSInput
        name="gpsCoordinates"
        value={gpsCoordinates}
        onChange={setGpsCoordinates}
      />

      <TagsInput
        name="tags"
        value={tags}
        onChange={setTags}
        maxTags={20}
        placeholder="Ajouter un tag (Entrée pour valider)"
      />
    </FormModal>
  );
}

