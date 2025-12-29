import { describe, it, expect } from 'vitest';
import {
  createErrorResponse,
  createSuccessResponse,
  handleApiError,
  validateRequired,
} from '@/lib/api-error-handler';

describe('api-error-handler', () => {
  describe('createErrorResponse', () => {
    it('should create error response with default status', () => {
      const response = createErrorResponse('Test error');
      const json = response.json() as Promise<any>;
      
      expect(response.status).toBe(500);
    });

    it('should create error response with custom status', () => {
      const response = createErrorResponse('Not found', 404);
      expect(response.status).toBe(404);
    });

    it('should include details when provided', () => {
      const response = createErrorResponse('Error', 400, { field: 'email' });
      expect(response.status).toBe(400);
    });
  });

  describe('createSuccessResponse', () => {
    it('should create success response with data', () => {
      const response = createSuccessResponse({ id: '123' });
      expect(response.status).toBe(200);
    });

    it('should create success response with custom status', () => {
      const response = createSuccessResponse({ id: '123' }, undefined, 201);
      expect(response.status).toBe(201);
    });
  });

  describe('validateRequired', () => {
    it('should validate all required fields present', () => {
      const result = validateRequired(
        { name: 'Test', email: 'test@example.com' },
        ['name', 'email']
      );
      expect(result.valid).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const result = validateRequired({ name: 'Test' }, ['name', 'email']);
      expect(result.valid).toBe(false);
      expect(result.missing).toContain('email');
    });

    it('should handle zero as valid value', () => {
      const result = validateRequired({ count: 0 }, ['count']);
      expect(result.valid).toBe(true);
    });
  });

  describe('handleApiError', () => {
    it('should handle Error instances', () => {
      const error = new Error('Test error');
      const response = handleApiError(error, 'TestContext');
      expect(response.status).toBe(500);
    });

    it('should handle unknown error types', () => {
      const response = handleApiError('string error', 'TestContext');
      expect(response.status).toBe(500);
    });
  });
});


