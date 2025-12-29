'use client';

import React, { useState, useCallback } from 'react';
import { FolderOpen } from 'lucide-react';
import { WorkflowWizard, WorkflowStep } from './WorkflowWizard';
import { FormModal } from '@/components/modals/FormModal';
import { FormInput, FormTextarea, TagsInput, GPSInput, FormSelect } from '@/components/forms';
import { SelectItem } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProjectSchema } from '@/lib/validators/projects';
import { CreateProjectInput, GPSCoordinates, CampaignType, CreateCampaignInput } from '@/types/geophysic';
import { addCSRFTokenToHeaders } from '@/lib/csrf-client';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';

interface ProjectCreationWorkflowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (projectId: string) => void;
}

// Simple campaign schema for validation
const createCampaignSchema = z.object({
  name: z.string().min(1, 'Le nom de la campagne est requis'),
  description: z.string().optional(),
  campaignType: z.nativeEnum(CampaignType).optional(),
});

export function ProjectCreationWorkflow({ open, onOpenChange, onComplete }: ProjectCreationWorkflowProps) {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [isSubmittingProject, setIsSubmittingProject] = useState(false);
  const [isSubmittingCampaign, setIsSubmittingCampaign] = useState(false);

  const projectForm = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      description: '',
      siteLocation: '',
      gpsCoordinates: null,
      tags: [],
    },
  });

  const campaignForm = useForm<CreateCampaignInput>({
    resolver: zodResolver(createCampaignSchema),
    defaultValues: {
      name: '',
      description: '',
      campaignType: CampaignType.GEOPHYSICS,
      projectId: '',
    },
  });

  const handleGpsChange = (coords: GPSCoordinates | null) => {
    if (coords) {
      projectForm.setValue('gpsCoordinates', { latitude: coords.latitude, longitude: coords.longitude });
    } else {
      projectForm.setValue('gpsCoordinates', null);
    }
  };

  const steps: WorkflowStep[] = [
    {
      id: 'project-info',
      title: 'Informations du Projet',
      description: 'Détails de base du nouveau projet.',
      component: (
        <div className="space-y-4">
          <FormInput
            label="Nom du projet"
            name="name"
            required
            placeholder="Ex: Site Montagne - Zone A"
            {...projectForm.register('name')}
            error={projectForm.formState.errors.name?.message as string}
          />
          <FormTextarea
            label="Description"
            name="description"
            placeholder="Décrivez le projet, ses objectifs et son contexte..."
            rows={3}
            {...projectForm.register('description')}
            error={projectForm.formState.errors.description?.message as string}
          />
          <FormInput
            label="Localisation du site"
            name="siteLocation"
            placeholder="Ex: Massif Central, France"
            {...projectForm.register('siteLocation')}
            error={projectForm.formState.errors.siteLocation?.message as string}
          />
          <GPSInput
            name="gpsCoordinates"
            value={projectForm.watch('gpsCoordinates')}
            onChange={handleGpsChange}
            error={projectForm.formState.errors.gpsCoordinates?.message as string}
          />
          <TagsInput
            name="tags"
            value={projectForm.watch('tags') || []}
            onChange={(newTags) => projectForm.setValue('tags', newTags, { shouldValidate: true })}
            maxTags={20}
            placeholder="Ajouter un tag"
            error={projectForm.formState.errors.tags?.message as string}
          />
        </div>
      ),
      validate: async () => {
        const isValid = await projectForm.trigger();
        return isValid;
      },
      onNext: async () => {
        const isValid = await projectForm.trigger();
        if (!isValid) {
          return;
        }
        setIsSubmittingProject(true);
        try {
          const formData = projectForm.getValues();
          const headers = addCSRFTokenToHeaders({ 'Content-Type': 'application/json' });
          const response = await fetch('/api/projects', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              ...formData,
              gpsCoordinates: formData.gpsCoordinates
                ? `${formData.gpsCoordinates.latitude},${formData.gpsCoordinates.longitude}`
                : null,
            }),
          });
          const result = await response.json();
          if (response.ok && result.success) {
            setProjectId(result.data.id);
            toast({ title: 'Succès', description: 'Projet créé avec succès. Vous pouvez maintenant ajouter une campagne.' });
          } else {
            throw new Error(result.error || 'Échec de la création du projet');
          }
        } catch (error) {
          toast({
            title: 'Erreur',
            description: error instanceof Error ? error.message : 'Échec de la création du projet',
            variant: 'destructive',
          });
          throw error;
        } finally {
          setIsSubmittingProject(false);
        }
      },
    },
    {
      id: 'initial-campaign',
      title: 'Campagne Initiale (Optionnel)',
      description: 'Ajoutez une première campagne à votre projet.',
      component: (
        <div className="space-y-4">
          <FormInput
            label="Nom de la campagne"
            name="campaignName"
            placeholder="Ex: Campagne Résistivité 2023"
            {...campaignForm.register('name')}
            error={campaignForm.formState.errors.name?.message as string}
          />
          <FormTextarea
            label="Description de la campagne"
            name="campaignDescription"
            placeholder="Décrivez les objectifs de cette campagne..."
            rows={3}
            {...campaignForm.register('description')}
            error={campaignForm.formState.errors.description?.message as string}
          />
          <FormSelect
            label="Type de campagne"
            name="campaignType"
            value={campaignForm.watch('campaignType')}
            onValueChange={(value) => campaignForm.setValue('campaignType', value as CampaignType, { shouldValidate: true })}
            error={campaignForm.formState.errors.campaignType?.message as string}
          >
            <SelectItem value={CampaignType.GEOPHYSICS}>Géophysique</SelectItem>
            <SelectItem value={CampaignType.GEOCHEMISTRY}>Géochimie</SelectItem>
            <SelectItem value={CampaignType.DRILLING}>Sondages</SelectItem>
          </FormSelect>
        </div>
      ),
      validate: () => true, // Campaign creation is optional
      onNext: async () => {
        const campaignName = campaignForm.watch('name');
        if (campaignName && campaignName.trim() && projectId) {
          // Only submit if a name is provided
          setIsSubmittingCampaign(true);
          try {
            const formData = campaignForm.getValues();
            const headers = addCSRFTokenToHeaders({ 'Content-Type': 'application/json' });
            const response = await fetch('/api/campaigns', {
              method: 'POST',
              headers,
              body: JSON.stringify({ ...formData, projectId }),
            });
            const result = await response.json();
            if (response.ok && result.success) {
              toast({ title: 'Succès', description: 'Campagne initiale créée avec succès.' });
            } else {
              throw new Error(result.error || 'Échec de la création de la campagne');
            }
          } catch (error) {
            toast({
              title: 'Erreur',
              description: error instanceof Error ? error.message : 'Échec de la création de la campagne',
              variant: 'destructive',
            });
            throw error;
          } finally {
            setIsSubmittingCampaign(false);
          }
        }
      },
    },
  ];

  const handleWorkflowComplete = useCallback(async () => {
    if (projectId) {
      onComplete?.(projectId);
      onOpenChange(false);
      projectForm.reset();
      campaignForm.reset();
      setProjectId(null);
    }
  }, [projectId, onComplete, onOpenChange, projectForm, campaignForm]);

  const handleWorkflowCancel = useCallback(() => {
    onOpenChange(false);
    projectForm.reset();
    campaignForm.reset();
    setProjectId(null);
  }, [onOpenChange, projectForm, campaignForm]);

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Créer un Nouveau Projet"
      description="Suivez les étapes pour configurer votre projet et sa première campagne."
      icon={<FolderOpen className="w-5 h-5" />}
      onSubmit={() => {}} // Handled by WorkflowWizard
      loading={isSubmittingProject || isSubmittingCampaign}
      disabled={false}
      submitLabel="Terminer"
      cancelLabel="Annuler"
      maxWidth="2xl"
      footer={null}
    >
      <WorkflowWizard
        steps={steps}
        onComplete={handleWorkflowComplete}
        onCancel={handleWorkflowCancel}
        title="" // Title handled by FormModal
        description="" // Description handled by FormModal
        saveState={false} // Don't save state for this workflow, as it's short-lived
      />
    </FormModal>
  );
}

