'use client';

import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center space-x-2 text-sm', className)}>
      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Accueil"
      >
        <Home className="w-4 h-4" />
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isLink = item.href && !isLast;

        return (
          <React.Fragment key={index}>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            {isLink ? (
              <Link
                href={item.href!}
                className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ) : (
              <span className="text-foreground font-medium flex items-center gap-1">
                {item.icon}
                <span>{item.label}</span>
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

/**
 * Hook to generate breadcrumbs based on current route and context
 */
export function useBreadcrumbs(
  projectId?: string,
  projectName?: string,
  campaignId?: string,
  campaignName?: string,
  surveyLineId?: string,
  surveyLineName?: string,
  datasetId?: string,
  datasetName?: string
): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [];

  if (projectId && projectName) {
    items.push({
      label: projectName,
      href: `/projects/${projectId}`,
    });

    if (campaignId && campaignName) {
      items.push({
        label: campaignName,
        href: `/projects/${projectId}/campaigns/${campaignId}`,
      });

      if (surveyLineId && surveyLineName) {
        items.push({
          label: surveyLineName,
          href: `/projects/${projectId}/campaigns/${campaignId}/lines/${surveyLineId}`,
        });

        if (datasetId && datasetName) {
          items.push({
            label: datasetName,
          });
        }
      }
    }
  }

  return items;
}


