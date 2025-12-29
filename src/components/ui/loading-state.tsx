'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface LoadingStateProps {
  message?: string;
  variant?: 'spinner' | 'skeleton' | 'progress';
  progress?: number;
  className?: string;
}

export function LoadingState({
  message = 'Chargement...',
  variant = 'spinner',
  progress,
  className,
}: LoadingStateProps) {
  if (variant === 'skeleton') {
    return (
      <div className={cn('space-y-4', className)}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (variant === 'progress' && progress !== undefined) {
    return (
      <Card className={cn('flex items-center justify-center p-12', className)}>
        <CardContent className="text-center space-y-4 w-full max-w-md">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <div className="space-y-2">
            <p className="text-sm font-medium">{message}</p>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{Math.round(progress)}%</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('flex items-center justify-center p-12', className)}>
      <CardContent className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}

export interface ErrorStateProps {
  message: string;
  className?: string;
}

export function ErrorState({ message, className }: ErrorStateProps) {
  return (
    <Card className={cn('flex items-center justify-center p-12', className)}>
      <CardContent className="text-center">
        <p className="text-destructive">{message}</p>
      </CardContent>
    </Card>
  );
}

