# Guide de Déploiement sur Vercel - GeoMine RC-Insight

## Prérequis

1. Un compte Vercel (gratuit) : https://vercel.com
2. Une base de données PostgreSQL (recommandé) :
   - **Option 1 (Gratuit)** : Vercel Postgres (intégré)
   - **Option 2 (Gratuit)** : Supabase (https://supabase.com)
   - **Option 3 (Gratuit)** : Neon (https://neon.tech)
   - **Option 4 (Payant)** : Railway, Render, ou autre

## ⚠️ Important : Migration de SQLite vers PostgreSQL

Ce projet utilise actuellement SQLite en local, mais **SQLite ne fonctionne pas sur Vercel** car il nécessite un système de fichiers persistant. Vous devez migrer vers PostgreSQL.

## Étapes de Déploiement

### 1. Préparer la Base de Données PostgreSQL

#### Option A : Vercel Postgres (Recommandé - Gratuit)

1. Créez un nouveau projet sur Vercel
2. Allez dans l'onglet "Storage"
3. Créez une base de données Postgres
4. Copiez la chaîne de connexion `DATABASE_URL`

#### Option B : Supabase (Gratuit)

1. Créez un compte sur https://supabase.com
2. Créez un nouveau projet
3. Allez dans Settings > Database
4. Copiez la "Connection string" (URI mode)

#### Option C : Neon (Gratuit)

1. Créez un compte sur https://neon.tech
2. Créez un nouveau projet
3. Copiez la chaîne de connexion PostgreSQL

### 2. Mettre à Jour le Schéma Prisma

Modifiez `prisma/schema.prisma` :

```prisma
datasource db {
  provider = "postgresql"  // Changez de "sqlite" à "postgresql"
  url      = env("DATABASE_URL")
}
```

### 3. Créer les Migrations

```bash
# Générer le client Prisma
npm run db:generate

# Créer la migration initiale
npx prisma migrate dev --name init

# Ou pousser le schéma directement (pour développement)
npm run db:push
```

### 4. Préparer les Variables d'Environnement

Créez un fichier `.env.local` avec :

```env
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
NEXTAUTH_SECRET="votre-secret-aleatoire-tres-long-et-securise"
NEXTAUTH_URL="https://votre-app.vercel.app"
```

**Générer NEXTAUTH_SECRET :**
```bash
# Sur Linux/Mac
openssl rand -base64 32

# Sur Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### 5. Déployer sur Vercel

#### Méthode 1 : Via l'Interface Web (Recommandé)

1. **Connecter votre dépôt Git :**
   - Allez sur https://vercel.com/new
   - Importez votre projet depuis GitHub/GitLab/Bitbucket

2. **Configurer le projet :**
   - Framework Preset : **Next.js**
   - Root Directory : `./` (par défaut)
   - Build Command : `npm run build` (par défaut)
   - Output Directory : `.next` (par défaut)
   - Install Command : `npm install` (par défaut)

3. **Ajouter les Variables d'Environnement :**
   - `DATABASE_URL` : Votre chaîne de connexion PostgreSQL
   - `NEXTAUTH_SECRET` : Votre secret généré
   - `NEXTAUTH_URL` : `https://votre-app.vercel.app` (sera mis à jour automatiquement)

4. **Déployer :**
   - Cliquez sur "Deploy"
   - Attendez la fin du build

#### Méthode 2 : Via Vercel CLI

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Déployer
vercel

# Pour la production
vercel --prod
```

### 6. Configurer la Base de Données après Déploiement

Une fois déployé, vous devez initialiser la base de données :

#### Option A : Via Vercel CLI

```bash
# Se connecter à votre projet
vercel link

# Exécuter les migrations
vercel env pull .env.local
npx prisma migrate deploy

# Initialiser les données (créer l'admin)
vercel env pull .env.local
npm run db:init
```

#### Option B : Via Script de Build

Ajoutez dans `package.json` :

```json
"scripts": {
  "postinstall": "prisma generate",
  "vercel-build": "prisma generate && prisma migrate deploy && next build"
}
```

### 7. Initialiser l'Utilisateur Admin

Après le déploiement, vous devez créer l'utilisateur admin. Vous pouvez :

1. **Créer un script d'initialisation** qui s'exécute automatiquement
2. **Utiliser Vercel CLI** pour exécuter le script localement avec les variables de production
3. **Créer une route API temporaire** pour l'initialisation (à supprimer après)

### 8. Vérifier le Déploiement

1. Visitez votre URL Vercel : `https://votre-app.vercel.app`
2. Testez la connexion avec : `admin@geomine.com / admin123`
3. Vérifiez que les fonctionnalités principales fonctionnent

## Configuration Post-Déploiement

### Ajouter un Domaine Personnalisé

1. Allez dans Settings > Domains
2. Ajoutez votre domaine
3. Suivez les instructions DNS

### Configurer les Variables d'Environnement de Production

Dans Vercel Dashboard > Settings > Environment Variables, assurez-vous d'avoir :

- `DATABASE_URL` (Production)
- `NEXTAUTH_SECRET` (Production)
- `NEXTAUTH_URL` (Production) - Mise à jour automatique

## Scripts Utiles

```bash
# Générer le client Prisma
npm run db:generate

# Pousser le schéma (développement)
npm run db:push

# Créer une migration
npx prisma migrate dev --name nom_migration

# Appliquer les migrations (production)
npx prisma migrate deploy

# Initialiser la base de données
npm run db:init

# Voir les logs de production
vercel logs
```

## Dépannage

### Erreur : "Prisma Client not generated"

```bash
npm run db:generate
```

### Erreur : "Database connection failed"

- Vérifiez que `DATABASE_URL` est correct
- Vérifiez que la base de données PostgreSQL est accessible
- Vérifiez les paramètres de firewall de votre base de données

### Erreur : "NEXTAUTH_SECRET is not set"

- Ajoutez `NEXTAUTH_SECRET` dans les variables d'environnement Vercel
- Régénérez un nouveau secret si nécessaire

### Erreur de Build

- Vérifiez les logs de build dans Vercel Dashboard
- Assurez-vous que toutes les dépendances sont dans `package.json`
- Vérifiez que `next.config.ts` est correct

## Notes Importantes

1. **SQLite ne fonctionne PAS sur Vercel** - Vous DEVEZ utiliser PostgreSQL
2. **Les fichiers locaux ne persistent PAS** - Utilisez une base de données externe
3. **Les variables d'environnement** doivent être configurées dans Vercel Dashboard
4. **NEXTAUTH_URL** doit correspondre à votre URL de production

## Support

Pour plus d'aide :
- Documentation Vercel : https://vercel.com/docs
- Documentation Prisma : https://www.prisma.io/docs
- Documentation NextAuth : https://next-auth.js.org

