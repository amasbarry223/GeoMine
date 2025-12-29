'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon?: LucideIcon | React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'ghost';
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <Card className={cn('flex items-center justify-center p-12', className)}>
      <CardContent className="text-center space-y-4">
        {Icon && (
          <div className="flex justify-center">
            {React.isValidElement(Icon) ? (
              Icon
            ) : (
              <Icon className="w-12 h-12 text-muted-foreground" />
            )}
          </div>
        )}
        <div>
          <h3 className="font-semibold text-lg">{title}</h3>
          {description && (
            <p className="text-muted-foreground text-sm mt-1">{description}</p>
          )}
        </div>
        {action && (
          <Button
            variant={action.variant || 'default'}
            onClick={action.onClick}
            className="gap-2"
          >
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}


