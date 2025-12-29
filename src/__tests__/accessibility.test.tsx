import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { isFocusable, announceToScreenReader } from '@/lib/accessibility';

expect.extend(toHaveNoViolations);

describe('Accessibility', () => {
  describe('isFocusable', () => {
    it('should identify focusable elements', () => {
      const button = document.createElement('button');
      expect(isFocusable(button)).toBe(true);

      const link = document.createElement('a');
      link.setAttribute('href', '#');
      expect(isFocusable(link)).toBe(true);

      const div = document.createElement('div');
      expect(isFocusable(div)).toBe(false);
    });

    it('should identify elements with tabindex', () => {
      const div = document.createElement('div');
      div.setAttribute('tabindex', '0');
      expect(isFocusable(div)).toBe(true);

      const divNegative = document.createElement('div');
      divNegative.setAttribute('tabindex', '-1');
      expect(isFocusable(divNegative)).toBe(false);
    });
  });

  describe('announceToScreenReader', () => {
    it('should create announcement element', () => {
      announceToScreenReader('Test message');
      const announcement = document.querySelector('[role="status"]');
      expect(announcement).toBeTruthy();
      expect(announcement?.textContent).toBe('Test message');
    });
  });
});


