'use client';

import React from 'react';
import { Plus, Upload, FileText, BarChart3, Zap, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'ghost';
}

export interface QuickActionsProps {
  actions: QuickAction[];
  variant?: 'buttons' | 'dropdown';
  className?: string;
}

export function QuickActions({ actions, variant = 'buttons', className }: QuickActionsProps) {
  const router = useRouter();

  if (actions.length === 0) return null;

  if (variant === 'dropdown') {
    const primaryAction = actions[0];
    const otherActions = actions.slice(1);

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className={className}>
            {primaryAction.icon}
            {primaryAction.label}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions rapides</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {otherActions.map((action) => (
            <DropdownMenuItem key={action.id} onClick={action.onClick}>
              {action.icon}
              <span className="ml-2">{action.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {actions.map((action) => (
        <Button
          key={action.id}
          variant={action.variant || 'default'}
          onClick={action.onClick}
          className="gap-2"
        >
          {action.icon}
          {action.label}
        </Button>
      ))}
    </div>
  );
}

/**
 * Hook to get quick actions based on current context
 */
export function useQuickActions(context: {
  page?: string;
  projectId?: string;
  campaignId?: string;
  surveyLineId?: string;
  datasetId?: string;
}): QuickAction[] {
  const router = useRouter();
  const actions: QuickAction[] = [];

  switch (context.page) {
    case 'projects':
      actions.push(
        {
          id: 'create-project',
          label: 'Nouveau Projet',
          icon: <Plus className="w-4 h-4" />,
          onClick: () => {
            window.dispatchEvent(new CustomEvent('open-create-project-modal'));
          },
        },
        {
          id: 'import-data',
          label: 'Importer',
          icon: <Upload className="w-4 h-4" />,
          onClick: () => router.push('/import'),
          variant: 'outline',
        }
      );
      break;

    case 'project-detail':
      if (context.projectId) {
        actions.push(
          {
            id: 'create-campaign',
            label: 'Nouvelle Campagne',
            icon: <Plus className="w-4 h-4" />,
            onClick: () => {
              window.dispatchEvent(
                new CustomEvent('open-create-campaign-modal', { detail: { projectId: context.projectId } })
              );
            },
          },
          {
            id: 'import-data',
            label: 'Importer Données',
            icon: <Upload className="w-4 h-4" />,
            onClick: () => router.push(`/import?projectId=${context.projectId}`),
            variant: 'outline',
          },
          {
            id: 'generate-report',
            label: 'Générer Rapport',
            icon: <FileText className="w-4 h-4" />,
            onClick: () => router.push(`/reports?projectId=${context.projectId}`),
            variant: 'outline',
          }
        );
      }
      break;

    case 'datasets':
      actions.push(
        {
          id: 'create-dataset',
          label: 'Nouveau Dataset',
          icon: <Plus className="w-4 h-4" />,
          onClick: () => {
            window.dispatchEvent(new CustomEvent('open-create-dataset-modal'));
          },
        },
        {
          id: 'import-data',
          label: 'Importer',
          icon: <Upload className="w-4 h-4" />,
          onClick: () => router.push('/import'),
          variant: 'outline',
        }
      );
      break;

    case 'dataset-detail':
      if (context.datasetId) {
        actions.push(
          {
            id: 'analyze',
            label: 'Analyser',
            icon: <BarChart3 className="w-4 h-4" />,
            onClick: () => router.push(`/statistics?dataset=${context.datasetId}`),
          },
          {
            id: 'run-inversion',
            label: 'Lancer Inversion',
            icon: <Zap className="w-4 h-4" />,
            onClick: () => router.push(`/inversion?dataset=${context.datasetId}`),
            variant: 'outline',
          },
          {
            id: 'visualize-3d',
            label: 'Visualiser 3D',
            icon: <Map className="w-4 h-4" />,
            onClick: () => router.push(`/visualization-3d?dataset=${context.datasetId}`),
            variant: 'outline',
          }
        );
      }
      break;

    default:
      break;
  }

  return actions;
}

