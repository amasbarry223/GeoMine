'use client';

import React from 'react';
import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface HelpTooltipProps {
  content: string;
  link?: {
    label: string;
    href: string;
  };
  className?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export function HelpTooltip({
  content,
  link,
  className,
  side = 'top',
}: HelpTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn('inline-flex items-center text-muted-foreground hover:text-foreground', className)}
            aria-label="Aide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
          <p className="text-sm">{content}</p>
          {link && (
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline text-xs mt-1 block"
            >
              {link.label} →
            </a>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}


