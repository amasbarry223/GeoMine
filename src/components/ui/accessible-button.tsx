'use client';

import React from 'react';
import { Button, ButtonProps } from './button';
import { announceToScreenReader } from '@/lib/accessibility';

/**
 * Accessible Button component with ARIA attributes and screen reader support
 */
export interface AccessibleButtonProps extends ButtonProps {
  ariaLabel?: string;
  announceOnClick?: boolean;
  announceMessage?: string;
}

export function AccessibleButton({
  ariaLabel,
  announceOnClick = false,
  announceMessage,
  children,
  onClick,
  ...props
}: AccessibleButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (announceOnClick && announceMessage) {
      announceToScreenReader(announceMessage);
    }
    onClick?.(e);
  };

  return (
    <Button
      {...props}
      aria-label={ariaLabel}
      onClick={handleClick}
    >
      {children}
    </Button>
  );
}


