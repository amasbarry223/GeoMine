/**
 * Accessibility utilities and helpers
 */

/**
 * Check if element is focusable
 */
export function isFocusable(element: HTMLElement): boolean {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  return element.matches(focusableSelectors);
}

/**
 * Trap focus within a container (for modals)
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableElements = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleTab = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  };

  container.addEventListener('keydown', handleTab);

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleTab);
  };
}

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Get accessible label for form field
 */
export function getAccessibleLabel(element: HTMLElement): string | null {
  // Check aria-label
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) return ariaLabel;

  // Check aria-labelledby
  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy) {
    const labelElement = document.getElementById(labelledBy);
    if (labelElement) return labelElement.textContent;
  }

  // Check associated label
  const id = element.getAttribute('id');
  if (id) {
    const label = document.querySelector(`label[for="${id}"]`);
    if (label) return label.textContent;
  }

  // Check parent label
  const parentLabel = element.closest('label');
  if (parentLabel) return parentLabel.textContent;

  return null;
}

/**
 * Validate color contrast (WCAG AA)
 */
export function checkColorContrast(foreground: string, background: string): {
  ratio: number;
  passesAA: boolean;
  passesAAA: boolean;
} {
  // Simplified contrast calculation
  // In production, use a library like `color-contrast-checker`
  const getLuminance = (color: string): number => {
    // Simplified luminance calculation
    // Full implementation would parse RGB and calculate properly
    return 0.5; // Placeholder
  };

  const fgLum = getLuminance(foreground);
  const bgLum = getLuminance(background);

  const lighter = Math.max(fgLum, bgLum);
  const darker = Math.min(fgLum, bgLum);
  const ratio = (lighter + 0.05) / (darker + 0.05);

  return {
    ratio,
    passesAA: ratio >= 4.5, // WCAG AA for normal text
    passesAAA: ratio >= 7, // WCAG AAA for normal text
  };
}

/**
 * Keyboard navigation helpers
 */
export const KeyboardKeys = {
  Enter: 'Enter',
  Escape: 'Escape',
  Tab: 'Tab',
  ArrowUp: 'ArrowUp',
  ArrowDown: 'ArrowDown',
  ArrowLeft: 'ArrowLeft',
  ArrowRight: 'ArrowRight',
  Home: 'Home',
  End: 'End',
  Space: ' ',
} as const;

/**
 * Handle keyboard navigation for list items
 */
export function handleListKeyboardNavigation(
  event: React.KeyboardEvent,
  currentIndex: number,
  totalItems: number,
  onSelect: (index: number) => void
): void {
  switch (event.key) {
    case KeyboardKeys.ArrowDown:
      event.preventDefault();
      onSelect(Math.min(currentIndex + 1, totalItems - 1));
      break;

    case KeyboardKeys.ArrowUp:
      event.preventDefault();
      onSelect(Math.max(currentIndex - 1, 0));
      break;

    case KeyboardKeys.Home:
      event.preventDefault();
      onSelect(0);
      break;

    case KeyboardKeys.End:
      event.preventDefault();
      onSelect(totalItems - 1);
      break;

    case KeyboardKeys.Enter:
    case KeyboardKeys.Space:
      event.preventDefault();
      onSelect(currentIndex);
      break;
  }
}


