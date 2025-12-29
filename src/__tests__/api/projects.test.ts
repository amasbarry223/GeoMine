import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, POST } from '@/app/api/projects/route';
import { NextRequest } from 'next/server';

// Mock database
vi.mock('@/lib/db', () => ({
  db: {
    project: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

// Mock auth
vi.mock('@/lib/get-user-from-request', () => ({
  getUserFromRequest: vi.fn(() => ({
    id: 'user-123',
    email: 'test@example.com',
    role: 'ADMIN',
  })),
}));

vi.mock('@/lib/permissions', () => ({
  canCreateProject: vi.fn(() => ({ allowed: true })),
}));

vi.mock('@/lib/audit', () => ({
  logAuditEvent: vi.fn(),
}));

describe('API /api/projects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('should return paginated projects', async () => {
      const { db } = await import('@/lib/db');
      vi.mocked(db.project.findMany).mockResolvedValue([
        {
          id: '1',
          name: 'Test Project',
          description: 'Test',
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      vi.mocked(db.project.count).mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/projects?page=1&pageSize=10');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.projects).toBeDefined();
    });

    it('should filter by status', async () => {
      const { db } = await import('@/lib/db');
      vi.mocked(db.project.findMany).mockResolvedValue([]);
      vi.mocked(db.project.count).mockResolvedValue(0);

      const request = new NextRequest('http://localhost:3000/api/projects?status=ACTIVE');
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  describe('POST', () => {
    it('should create project with valid data', async () => {
      const { db } = await import('@/lib/db');
      vi.mocked(db.project.create).mockResolvedValue({
        id: 'new-id',
        name: 'New Project',
        description: 'Test',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new NextRequest('http://localhost:3000/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Project',
          description: 'Test',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
    });

    it('should reject project without name', async () => {
      const request = new NextRequest('http://localhost:3000/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          description: 'Test',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });
});


