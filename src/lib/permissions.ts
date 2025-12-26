import { UserRole } from '@/types/geophysic';
import { AuthUser, PermissionResult } from '@/types/auth';
import { db } from '@/lib/db';

/**
 * Check if user can create a project
 */
export function canCreateProject(user: AuthUser): PermissionResult {
  // Admin and Project Managers can create projects
  if (user.role === UserRole.ADMIN || user.role === UserRole.PROJECT_MANAGER) {
    return { allowed: true };
  }
  return { allowed: false, reason: 'Seuls les administrateurs et chefs de projet peuvent créer des projets' };
}

/**
 * Check if user can edit a project
 */
export async function canEditProject(
  user: AuthUser,
  projectId: string
): Promise<PermissionResult> {
  // Admin can edit any project
  if (user.role === UserRole.ADMIN) {
    return { allowed: true };
  }

  // Project Manager and Geophysicist can edit if they created it or are assigned
  if (user.role === UserRole.PROJECT_MANAGER || user.role === UserRole.GEOPHYSICIST) {
    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return { allowed: false, reason: 'Projet non trouvé' };
    }

    // Can edit if they created it
    if (project.createdBy === user.id) {
      return { allowed: true };
    }

    return { allowed: false, reason: 'Vous n\'avez pas la permission de modifier ce projet' };
  }

  return { allowed: false, reason: 'Vous n\'avez pas la permission de modifier des projets' };
}

/**
 * Check if user can delete a project
 */
export async function canDeleteProject(
  user: AuthUser,
  projectId: string
): Promise<PermissionResult> {
  // Only Admin can delete projects
  if (user.role === UserRole.ADMIN) {
    return { allowed: true };
  }

  // Project Manager can delete their own projects
  if (user.role === UserRole.PROJECT_MANAGER) {
    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return { allowed: false, reason: 'Projet non trouvé' };
    }

    if (project.createdBy === user.id) {
      return { allowed: true };
    }
  }

  return { allowed: false, reason: 'Seuls les administrateurs peuvent supprimer des projets' };
}

/**
 * Check if user can run inversion
 */
export function canRunInversion(user: AuthUser): PermissionResult {
  // Admin, Project Manager, and Geophysicist can run inversion
  if (
    user.role === UserRole.ADMIN ||
    user.role === UserRole.PROJECT_MANAGER ||
    user.role === UserRole.GEOPHYSICIST
  ) {
    return { allowed: true };
  }
  return { allowed: false, reason: 'Seuls les géophysiciens et chefs de projet peuvent exécuter des inversions' };
}

/**
 * Check if user can generate reports
 */
export function canGenerateReport(user: AuthUser): PermissionResult {
  // All authenticated users except viewers can generate reports
  if (user.role !== UserRole.VIEWER) {
    return { allowed: true };
  }
  return { allowed: false, reason: 'Les lecteurs ne peuvent pas générer de rapports' };
}

/**
 * Check if user can import datasets
 */
export function canImportDataset(user: AuthUser): PermissionResult {
  // Admin, Project Manager, and Geophysicist can import
  if (
    user.role === UserRole.ADMIN ||
    user.role === UserRole.PROJECT_MANAGER ||
    user.role === UserRole.GEOPHYSICIST
  ) {
    return { allowed: true };
  }
  return { allowed: false, reason: 'Seuls les géophysiciens et chefs de projet peuvent importer des données' };
}

/**
 * Check if user can delete datasets
 */
export async function canDeleteDataset(
  user: AuthUser,
  datasetId: string
): Promise<PermissionResult> {
  // Admin can delete any dataset
  if (user.role === UserRole.ADMIN) {
    return { allowed: true };
  }

  // Project Manager and Geophysicist can delete if they have access to the project
  if (user.role === UserRole.PROJECT_MANAGER || user.role === UserRole.GEOPHYSICIST) {
    const dataset = await db.dataset.findUnique({
      where: { id: datasetId },
      include: {
        surveyLine: {
          include: {
            campaign: {
              include: {
                project: true,
              },
            },
          },
        },
      },
    });

    if (!dataset) {
      return { allowed: false, reason: 'Jeu de données non trouvé' };
    }

    // Can delete if they created the project
    if (dataset.surveyLine.campaign.project.createdBy === user.id) {
      return { allowed: true };
    }
  }

  return { allowed: false, reason: 'Vous n\'avez pas la permission de supprimer ce jeu de données' };
}

/**
 * Check if user can view audit logs
 */
export function canViewAuditLogs(user: AuthUser): PermissionResult {
  // Only Admin can view audit logs
  if (user.role === UserRole.ADMIN) {
    return { allowed: true };
  }
  return { allowed: false, reason: 'Seuls les administrateurs peuvent consulter les logs d\'audit' };
}

/**
 * Get user role hierarchy level (higher = more permissions)
 */
export function getRoleLevel(role: UserRole): number {
  switch (role) {
    case UserRole.ADMIN:
      return 4;
    case UserRole.PROJECT_MANAGER:
      return 3;
    case UserRole.GEOPHYSICIST:
      return 2;
    case UserRole.VIEWER:
      return 1;
    default:
      return 0;
  }
}

/**
 * Check if user has minimum required role
 */
export function hasMinimumRole(user: AuthUser, minimumRole: UserRole): boolean {
  return getRoleLevel(user.role) >= getRoleLevel(minimumRole);
}

