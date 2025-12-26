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
import { useApi } from '@/hooks/use-api';

interface DeleteReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: { id: string; name: string } | null;
  onSuccess?: () => void;
}

export function DeleteReportModal({
  open,
  onOpenChange,
  report,
  onSuccess,
}: DeleteReportModalProps) {
  const { execute, loading } = useApi();

  const handleDelete = async () => {
    if (!report) return;

    const result = await execute(
      () =>
        fetch(`/api/reports/${report.id}`, {
          method: 'DELETE',
        }),
      {
        successMessage: 'Rapport supprimé avec succès',
        onSuccess: () => {
          onOpenChange(false);
          if (onSuccess) onSuccess();
        },
      }
    );
  };

  if (!report) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <AlertDialogTitle>Supprimer le rapport</AlertDialogTitle>
              <AlertDialogDescription className="mt-1">
                Cette action est irréversible. Le rapport sera définitivement supprimé.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="my-4 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
          <p className="text-sm font-medium text-foreground">Rapport à supprimer :</p>
          <p className="mt-1 text-sm text-muted-foreground">{report.name}</p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Annuler</AlertDialogCancel>
          <AlertDialogAction
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

