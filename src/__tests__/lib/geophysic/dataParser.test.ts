import { describe, it, expect } from 'vitest';
import { parseCSVFile, detectFileFormat } from '@/lib/geophysic/dataParser';

describe('dataParser', () => {
  describe('detectFileFormat', () => {
    it('should detect CSV format', () => {
      expect(detectFileFormat('data.csv')).toBe('CSV');
      expect(detectFileFormat('file.CSV')).toBe('CSV');
    });

    it('should detect RES2DINV format', () => {
      expect(detectFileFormat('data.dat')).toBe('RES2DINV');
      expect(detectFileFormat('file.DAT')).toBe('RES2DINV');
    });

    it('should detect TXT format', () => {
      expect(detectFileFormat('data.txt')).toBe('TXT');
    });

    it('should default to CSV for unknown formats', () => {
      expect(detectFileFormat('data.xyz')).toBe('CSV');
    });
  });

  describe('parseCSVFile', () => {
    it('should parse valid CSV data', async () => {
      const csvContent = 'x,y,value\n1.0,2.0,10.5\n2.0,3.0,20.5';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      const result = await parseCSVFile(file, {
        hasHeader: true,
        delimiter: ',',
      });

      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toMatchObject({
        x: 1.0,
        y: 2.0,
        value: 10.5,
      });
      expect(result.errors).toHaveLength(0);
    });

    it('should handle missing header', async () => {
      const csvContent = '1.0,2.0,10.5\n2.0,3.0,20.5';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      const result = await parseCSVFile(file, {
        hasHeader: false,
        delimiter: ',',
      });

      expect(result.data).toHaveLength(2);
    });

    it('should report errors for invalid data', async () => {
      const csvContent = 'x,y,value\ninvalid,data,here';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      const result = await parseCSVFile(file, {
        hasHeader: true,
        delimiter: ',',
      });

      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle semicolon delimiter', async () => {
      const csvContent = 'x;y;value\n1.0;2.0;10.5';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      const result = await parseCSVFile(file, {
        hasHeader: true,
        delimiter: ';',
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].x).toBe(1.0);
    });
  });
});


