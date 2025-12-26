# 🔄 Migration vers PostgreSQL pour Vercel

Ce guide vous aide à migrer de SQLite (développement local) vers PostgreSQL (production Vercel).

## 📋 Étapes de Migration

### 1. Utiliser le Schéma PostgreSQL

Le projet contient déjà un schéma PostgreSQL prêt à l'emploi : `prisma/schema.postgresql.prisma`

Pour l'utiliser :

```bash
# Copier le schéma PostgreSQL
cp prisma/schema.postgresql.prisma prisma/schema.prisma
```

### 2. Configurer la Base de Données

#### Option A : Vercel Postgres (Recommandé)

1. Créez une base de données Postgres dans Vercel Storage
2. Copiez la variable `POSTGRES_URL` depuis Vercel Dashboard
3. Utilisez-la comme `DATABASE_URL` dans vos variables d'environnement

#### Option B : Supabase

1. Créez un projet Supabase
2. Allez dans Settings → Database
3. Copiez la Connection string (URI mode)
4. Utilisez-la comme `DATABASE_URL`

### 3. Générer le Client Prisma

```bash
# Générer le client Prisma pour PostgreSQL
npm run db:generate
```

### 4. Créer les Migrations

```bash
# Créer la migration initiale
npx prisma migrate dev --name init_postgresql

# Ou pousser directement le schéma (pour développement)
npm run db:push
```

### 5. Appliquer les Migrations en Production

Sur Vercel, les migrations sont appliquées automatiquement via le script `vercel-build` :

```json
{
  "scripts": {
    "vercel-build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

## 🔍 Différences SQLite vs PostgreSQL

### Types de Données

- **SQLite** : `String` → **PostgreSQL** : `String` (VARCHAR/TEXT)
- **SQLite** : `Int` → **PostgreSQL** : `Int` (INTEGER)
- **SQLite** : `Float` → **PostgreSQL** : `Float` (DOUBLE PRECISION)
- **SQLite** : `DateTime` → **PostgreSQL** : `DateTime` (TIMESTAMP)

### Fonctionnalités Spécifiques

- **PostgreSQL** supporte les enums natifs (déjà utilisé dans le schéma)
- **PostgreSQL** supporte les relations plus complexes
- **PostgreSQL** supporte les index plus avancés

## ✅ Vérification

Après la migration, vérifiez que :

1. ✅ Le client Prisma est généré : `npm run db:generate`
2. ✅ Les migrations sont créées : `npx prisma migrate dev`
3. ✅ La connexion fonctionne : `npx prisma studio`
4. ✅ Les données sont accessibles via l'application

## 🐛 Dépannage

### Erreur : "relation does not exist"

Les migrations n'ont pas été appliquées. Exécutez :

```bash
npx prisma migrate deploy
```

### Erreur : "connection refused"

Vérifiez que :
- La `DATABASE_URL` est correcte
- La base de données PostgreSQL est accessible
- Les paramètres de firewall autorisent les connexions

### Erreur : "schema does not exist"

Ajoutez `?schema=public` à la fin de votre `DATABASE_URL` :

```
postgresql://user:password@host:5432/database?schema=public
```

## 📝 Notes

- Le schéma PostgreSQL est identique au schéma SQLite (même structure)
- Les migrations Prisma gèrent automatiquement les différences
- Vous pouvez utiliser les deux schémas en parallèle (dev SQLite, prod PostgreSQL)

## 🔄 Retour à SQLite (Développement Local)

Pour revenir à SQLite en local :

```bash
# Restaurer le schéma SQLite
git checkout prisma/schema.prisma

# Régénérer le client
npm run db:generate

# Réinitialiser la base de données
npm run db:reset
```

