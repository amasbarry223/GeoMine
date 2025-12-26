import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hash, compare } from 'bcrypt';
import { handleApiError, createErrorResponse, createSuccessResponse } from '@/lib/api-error-handler';
import { getUserFromRequest } from '@/lib/get-user-from-request';
import { logAuditEvent } from '@/lib/audit';

// POST /api/auth/change-password - Change user password
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return createErrorResponse('Non authentifié', 401);
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    // Validation
    if (!currentPassword || !newPassword) {
      return createErrorResponse('Le mot de passe actuel et le nouveau mot de passe sont requis', 400);
    }

    if (newPassword.length < 8) {
      return createErrorResponse('Le nouveau mot de passe doit contenir au moins 8 caractères', 400);
    }

    // Get user from database
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser || !dbUser.password) {
      return createErrorResponse('Utilisateur non trouvé ou mot de passe non défini', 404);
    }

    // Verify current password
    const isValidPassword = await compare(currentPassword, dbUser.password);
    if (!isValidPassword) {
      return createErrorResponse('Mot de passe actuel incorrect', 401);
    }

    // Hash new password
    const hashedPassword = await hash(newPassword, 10);

    // Update password
    await db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Log audit event
    await logAuditEvent(
      user.id,
      'USER_UPDATE',
      'USER',
      user.id,
      { action: 'password_change' },
      request
    );

    return createSuccessResponse(
      { success: true },
      'Mot de passe modifié avec succès'
    );
  } catch (error) {
    return handleApiError(error, 'POST /api/auth/change-password');
  }
}

