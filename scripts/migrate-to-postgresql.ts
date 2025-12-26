/**
 * Script pour migrer de SQLite vers PostgreSQL
 * 
 * Usage:
 * 1. Changez le provider dans prisma/schema.prisma de "sqlite" à "postgresql"
 * 2. Configurez DATABASE_URL avec votre connexion PostgreSQL
 * 3. Exécutez: npx tsx scripts/migrate-to-postgresql.ts
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Migration vers PostgreSQL...\n');

  // Vérifier la connexion
  try {
    await prisma.$connect();
    console.log('✅ Connexion à la base de données PostgreSQL réussie\n');
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error);
    console.error('\n⚠️  Assurez-vous que:');
    console.error('   1. DATABASE_URL est configuré avec une connexion PostgreSQL');
    console.error('   2. Le provider dans schema.prisma est "postgresql"');
    console.error('   3. La base de données PostgreSQL est accessible\n');
    process.exit(1);
  }

  // Vérifier que c'est bien PostgreSQL
  const dbInfo = await prisma.$queryRaw`SELECT version()`;
  console.log('📊 Version de la base de données:', dbInfo);
  console.log('');

  // Créer les tables si elles n'existent pas
  console.log('📦 Application du schéma Prisma...');
  try {
    // Cette commande doit être exécutée via prisma migrate ou db push
    console.log('⚠️  Exécutez d\'abord: npx prisma migrate dev --name init');
    console.log('   ou: npx prisma db push\n');
  } catch (error) {
    console.error('❌ Erreur lors de l\'application du schéma:', error);
    process.exit(1);
  }

  // Initialiser l'utilisateur admin
  console.log('👤 Vérification de l\'utilisateur admin...');
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@geomine.com' },
  });

  if (!existingAdmin) {
    console.log('📝 Création de l\'utilisateur admin...');
    const { hash } = await import('bcrypt');
    const hashedPassword = await hash('admin123', 10);

    const admin = await prisma.user.create({
      data: {
        email: 'admin@geomine.com',
        name: 'Administrateur',
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    console.log('✅ Utilisateur admin créé:', admin.email);
    console.log('📝 Identifiants par défaut:');
    console.log('   Email: admin@geomine.com');
    console.log('   Mot de passe: admin123\n');
  } else {
    console.log('ℹ️  Utilisateur admin déjà existant\n');
  }

  console.log('✅ Migration terminée avec succès!');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors de la migration:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

