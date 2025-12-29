import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hash, compare } from 'bcrypt';

/**
 * Route API pour réinitialiser le mot de passe admin
 * ⚠️ À utiliser uniquement en développement ou avec authentification appropriée
 */
export async function POST(request: NextRequest) {
  try {
    // En production, ajouter une vérification de sécurité ici
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Cette route n\'est pas disponible en production' },
        { status: 403 }
      );
    }

    const email = 'admin@geomine.com';
    const password = 'admin123';

    // Vérifier si l'admin existe
    let admin = await db.user.findUnique({
      where: { email },
    });

    if (!admin) {
      // Créer l'admin s'il n'existe pas
      const hashedPassword = await hash(password, 10);
      admin = await db.user.create({
        data: {
          email,
          name: 'Administrateur',
          password: hashedPassword,
          role: 'ADMIN',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Admin user created',
        email: admin.email,
        password: password,
      });
    }

    // Vérifier le mot de passe actuel
    let passwordValid = false;
    if (admin.password) {
      passwordValid = await compare(password, admin.password);
    }

    if (!passwordValid) {
      // Réinitialiser le mot de passe
      const hashedPassword = await hash(password, 10);
      await db.user.update({
        where: { id: admin.id },
        data: { password: hashedPassword },
      });

      // Vérifier que le nouveau mot de passe fonctionne
      const updatedAdmin = await db.user.findUnique({
        where: { id: admin.id },
      });
      const verifyNew = updatedAdmin?.password 
        ? await compare(password, updatedAdmin.password)
        : false;

      return NextResponse.json({
        success: true,
        message: 'Admin password reset',
        email: admin.email,
        password: password,
        verified: verifyNew,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Admin password is already correct',
      email: admin.email,
      password: password,
    });
  } catch (error) {
    console.error('[RESET-ADMIN] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to reset admin password',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}



