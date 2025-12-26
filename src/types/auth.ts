import { UserRole } from '@/types/geophysic';

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  role: UserRole;
}

export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  role: UserRole;
}

export interface PermissionResult {
  allowed: boolean;
  reason?: string;
}

