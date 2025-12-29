import { describe, it, expect } from 'vitest';
import { parseCollarFile, parseSurveyFile } from '@/lib/drilling/parser';

describe('drilling parser', () => {
  describe('parseCollarFile', () => {
    it('should parse valid collar file', async () => {
      const csvContent = 'HoleID,Type,X,Y,Z\nH001,DIAMOND,100.0,200.0,50.0';
      const file = new File([csvContent], 'collar.csv', { type: 'text/csv' });

      const result = await parseCollarFile(file, 'campaign-123', {
        hasHeader: true,
        delimiter: ',',
      });

      expect(result.holes.length).toBeGreaterThan(0);
      expect(result.holes[0].holeID).toBe('H001');
      expect(result.holes[0].collarX).toBe(100.0);
    });

    it('should validate required coordinates', async () => {
      const csvContent = 'HoleID,Type,X\nH001,DIAMOND,100.0';
      const file = new File([csvContent], 'collar.csv', { type: 'text/csv' });

      const result = await parseCollarFile(file, 'campaign-123', {
        hasHeader: true,
        delimiter: ',',
      });

      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('parseSurveyFile', () => {
    it('should parse valid survey file', async () => {
      const csvContent = 'HoleID,Depth,Azimuth,Dip\nH001,10.0,45.0,30.0';
      const file = new File([csvContent], 'survey.csv', { type: 'text/csv' });

      const result = await parseSurveyFile(file, {
        hasHeader: true,
        delimiter: ',',
      });

      expect(result.surveys.length).toBeGreaterThan(0);
      expect(result.surveys[0].depth).toBe(10.0);
    });
  });
});


