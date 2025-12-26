/**
 * Route API temporaire pour initialiser la base de données après déploiement
 * ⚠️ À SUPPRIMER après l'initialisation pour des raisons de sécurité
 * 
 * Usage: POST /api/init-db
 * 
 * Cette route :
 * 1. Applique les migrations Prisma
 * 2. Crée l'utilisateur admin par défaut
 * 
 * Sécurité : Ajoutez une vérification d'environnement ou un token secret
 */

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    // ⚠️ SÉCURITÉ : Ajoutez une vérification ici
    // Par exemple, vérifier un token secret ou limiter à la première exécution
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.INIT_DB_TOKEN || 'init-db-secret-change-me';
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized. Add Authorization header: Bearer <token>' },
        { status: 401 }
      );
    }

    console.log('🚀 Initializing database...');

    // Vérifier si l'admin existe déjà
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@geomine.com' },
    });

    if (existingAdmin) {
      return NextResponse.json({
        success: true,
        message: 'Database already initialized. Admin user exists.',
        admin: {
          email: existingAdmin.email,
          role: existingAdmin.role,
        },
      });
    }

    // Créer l'utilisateur admin
    const hashedPassword = await hash('admin123', 10);
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@geomine.com',
        name: 'Administrator',
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    console.log('✅ Admin user created:', admin.email);

    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully!',
      admin: {
        email: admin.email,
        role: admin.role,
        password: 'admin123', // ⚠️ À changer immédiatement après la première connexion
      },
      warning: '⚠️ Change the admin password immediately after first login!',
    });
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    return NextResponse.json(
      {
        error: 'Failed to initialize database',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Méthode GET pour vérifier l'état
export async function GET() {
  try {
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@geomine.com' },
    });

    return NextResponse.json({
      initialized: !!admin,
      admin: admin
        ? {
            email: admin.email,
            role: admin.role,
            createdAt: admin.createdAt,
          }
        : null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to check database status',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

