'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { FormModal, FormInput, FormTextarea, TagsInput, GPSInput } from '@/components/forms';
import { useApi } from '@/hooks/use-api';
import { useCSRFToken } from '@/lib/csrf-client';
import { GPSCoordinates } from '@/components/forms/GPSInput';

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateProjectModal({ open, onOpenChange, onSuccess }: CreateProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [siteLocation, setSiteLocation] = useState('');
  const [gpsCoordinates, setGpsCoordinates] = useState<GPSCoordinates | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const { execute, loading } = useApi();
  const { csrfToken } = useCSRFToken();

  const handleSubmit = async () => {
    if (!name.trim()) {
      return;
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (csrfToken) {
      headers['x-csrf-token'] = csrfToken;
    }

    await execute(
      () =>
        fetch('/api/projects', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim() || null,
            siteLocation: siteLocation.trim() || null,
            gpsCoordinates,
            tags: tags.length > 0 ? tags : null,
          }),
        }),
      {
        successMessage: 'Projet créé avec succès',
        onSuccess: () => {
          // Reset form
          setName('');
          setDescription('');
          setSiteLocation('');
          setGpsCoordinates(null);
          setTags([]);
          onOpenChange(false);
          if (onSuccess) onSuccess();
        },
      }
    );
  };

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Nouveau Projet"
      description="Créez un nouveau projet d'exploration géophysique. Tous les champs marqués d'un * sont obligatoires."
      icon={<Plus className="w-5 h-5" />}
      onSubmit={handleSubmit}
      loading={loading}
      disabled={!name.trim()}
      submitLabel={loading ? 'Création...' : 'Créer le projet'}
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

