'use client';

import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Project } from '@/types/geophysic';
import { useApi } from '@/hooks/use-api';

interface DeleteProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onSuccess?: () => void;
}

export function DeleteProjectModal({
  open,
  onOpenChange,
  project,
  onSuccess,
}: DeleteProjectModalProps) {
  const { execute, loading } = useApi();

  const handleDelete = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!project) return;

    const result = await execute(
      () =>
        fetch(`/api/projects/${project.id}`, {
          method: 'DELETE',
        }),
      {
        successMessage: 'Projet supprimé avec succès',
        onSuccess: () => {
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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <AlertDialogTitle>Supprimer le projet</AlertDialogTitle>
              <AlertDialogDescription className="mt-1">
                Cette action est irréversible. Toutes les données associées seront également
                supprimées.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="my-4 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
          <p className="text-sm font-medium text-foreground">Projet à supprimer :</p>
          <p className="mt-1 text-sm text-muted-foreground">{project.name}</p>
          {project.description && (
            <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
              {project.description}
            </p>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? (
              'Suppression...'
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer définitivement
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

