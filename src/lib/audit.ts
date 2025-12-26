import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

export type AuditAction =
  | 'PROJECT_CREATE'
  | 'PROJECT_UPDATE'
  | 'PROJECT_DELETE'
  | 'DATASET_IMPORT'
  | 'DATASET_DELETE'
  | 'INVERSION_RUN'
  | 'REPORT_GENERATE'
  | 'REPORT_DELETE'
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'USER_CREATE'
  | 'USER_UPDATE'
  | 'USER_DELETE';

export type EntityType =
  | 'PROJECT'
  | 'DATASET'
  | 'INVERSION_MODEL'
  | 'REPORT'
  | 'USER'
  | 'CAMPAIGN'
  | 'SURVEY_LINE';

export interface AuditEventDetails {
  [key: string]: any;
}

/**
 * Log an audit event
 */
export async function logAuditEvent(
  userId: string | null,
  action: AuditAction,
  entityType: EntityType,
  entityId: string | null,
  details?: AuditEventDetails,
  request?: NextRequest
): Promise<void> {
  try {
    // Extract IP and User-Agent from request
    const ipAddress = request?.headers.get('x-forwarded-for') ||
                     request?.headers.get('x-real-ip') ||
                     request?.ip ||
                     null;
    
    const userAgent = request?.headers.get('user-agent') || null;

    await db.auditLog.create({
      data: {
        userId: userId || null,
        action,
        entityType,
        entityId: entityId || null,
        details: details ? JSON.stringify(details) : null,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    // Don't throw - audit logging should not break the main flow
    console.error('Error logging audit event:', error);
  }
}

/**
 * Get audit logs with optional filtering
 */
export async function getAuditLogs(options?: {
  userId?: string;
  entityType?: EntityType;
  entityId?: string;
  action?: AuditAction;
  limit?: number;
  offset?: number;
}) {
  const where: any = {};

  if (options?.userId) {
    where.userId = options.userId;
  }

  if (options?.entityType) {
    where.entityType = options.entityType;
  }

  if (options?.entityId) {
    where.entityId = options.entityId;
  }

  if (options?.action) {
    where.action = options.action;
  }

  const logs = await db.auditLog.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: options?.limit || 100,
    skip: options?.offset || 0,
  });

  return logs;
}

