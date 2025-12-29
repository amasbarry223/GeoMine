import { describe, it, expect } from 'vitest';
import { parseGeochemistryCSV } from '@/lib/geochemistry/parser';

describe('geochemistry parser', () => {
  describe('parseGeochemistryCSV', () => {
    it('should parse valid geochemistry CSV', async () => {
      const csvContent = 'SampleID,HoleID,X,Y,Z,Depth_cm\nS001,H001,100.5,200.5,50.0,25.0';
      const file = new File([csvContent], 'samples.csv', { type: 'text/csv' });

      const result = await parseGeochemistryCSV(file, {
        hasHeader: true,
        delimiter: ',',
      });

      expect(result.samples.length).toBeGreaterThan(0);
      expect(result.samples[0].sampleID).toBe('S001');
    });

    it('should handle missing sampleID', async () => {
      const csvContent = 'HoleID,X,Y\nH001,100.5,200.5';
      const file = new File([csvContent], 'samples.csv', { type: 'text/csv' });

      const result = await parseGeochemistryCSV(file, {
        hasHeader: true,
        delimiter: ',',
      });

      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should map column names correctly', async () => {
      const csvContent = 'sample_id,hole_id,depth\nS001,H001,25.0';
      const file = new File([csvContent], 'samples.csv', { type: 'text/csv' });

      const result = await parseGeochemistryCSV(file, {
        hasHeader: true,
        delimiter: ',',
      });

      expect(result.samples[0].sampleID).toBe('S001');
      expect(result.samples[0].holeID).toBe('H001');
    });
  });
});


