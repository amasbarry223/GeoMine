/**
 * Script pour préparer le build Vercel
 * Copie automatiquement le schéma PostgreSQL si DATABASE_URL pointe vers PostgreSQL
 */

const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const postgresSchemaPath = path.join(__dirname, '..', 'prisma', 'schema.postgresql.prisma');

// Vérifier si DATABASE_URL est défini et pointe vers PostgreSQL
const databaseUrl = process.env.DATABASE_URL || '';

// Si DATABASE_URL contient 'postgres' ou 'postgresql', utiliser le schéma PostgreSQL
if (databaseUrl.includes('postgres') || databaseUrl.includes('postgresql') || process.env.VERCEL) {
  console.log('🔧 Vercel build detected - Using PostgreSQL schema...');
  
  if (fs.existsSync(postgresSchemaPath)) {
    // Copier le schéma PostgreSQL
    const postgresSchema = fs.readFileSync(postgresSchemaPath, 'utf8');
    fs.writeFileSync(schemaPath, postgresSchema);
    console.log('✅ PostgreSQL schema copied successfully');
  } else {
    console.warn('⚠️  PostgreSQL schema not found, keeping current schema');
  }
} else {
  console.log('ℹ️  Local development - Using SQLite schema');
}

