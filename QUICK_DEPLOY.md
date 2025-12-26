# 🚀 Déploiement Rapide sur Vercel

## Checklist de Déploiement

### ✅ Étape 1 : Préparer la Base de Données PostgreSQL

**Option Gratuite Recommandée : Supabase**

1. Créez un compte sur https://supabase.com
2. Créez un nouveau projet
3. Allez dans **Settings > Database**
4. Copiez la **Connection string** (URI mode)
   - Format: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

### ✅ Étape 2 : Mettre à Jour Prisma

Modifiez `prisma/schema.prisma` :

```prisma
datasource db {
  provider = "postgresql"  // Changez de "sqlite" à "postgresql"
  url      = env("DATABASE_URL")
}
```

### ✅ Étape 3 : Configurer Localement

1. Créez `.env.local` :
```env
DATABASE_URL="postgresql://postgres:password@host:5432/postgres"
NEXTAUTH_SECRET="générez-un-secret-avec-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

2. Générez le client Prisma :
```bash
npm run db:generate
```

3. Appliquez le schéma :
```bash
npx prisma db push
```

4. Initialisez l'admin :
```bash
npm run db:init
```

### ✅ Étape 4 : Déployer sur Vercel

#### Via GitHub (Recommandé)

1. **Poussez votre code sur GitHub**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push
   ```

2. **Connectez à Vercel**
   - Allez sur https://vercel.com/new
   - Importez votre repository GitHub
   - Framework: **Next.js** (détecté automatiquement)

3. **Configurez les Variables d'Environnement**
   
   Dans Vercel Dashboard > Settings > Environment Variables, ajoutez :
   
   - **DATABASE_URL**
     - Value: Votre chaîne de connexion PostgreSQL
     - Environment: Production, Preview, Development
   
   - **NEXTAUTH_SECRET**
     - Value: Générez avec `openssl rand -base64 32`
     - Environment: Production, Preview, Development
   
   - **NEXTAUTH_URL**
     - Value: `https://votre-app.vercel.app` (sera mis à jour automatiquement)
     - Environment: Production

4. **Déployez**
   - Cliquez sur "Deploy"
   - Attendez la fin du build (2-5 minutes)

### ✅ Étape 5 : Initialiser la Base de Données en Production

Après le déploiement, initialisez la base de données :

**Option A : Via Vercel CLI**
```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Lier le projet
vercel link

# Télécharger les variables d'environnement
vercel env pull .env.local

# Appliquer les migrations
npx prisma migrate deploy

# Initialiser l'admin
npm run db:init
```

**Option B : Via Script de Build Automatique**

Le script `vercel-build` dans `package.json` s'exécute automatiquement et :
- Génère le client Prisma
- Applique les migrations
- Build l'application

### ✅ Étape 6 : Vérifier

1. Visitez votre URL : `https://votre-app.vercel.app`
2. Connectez-vous avec : `admin@geomine.com / admin123`
3. Testez les fonctionnalités principales

## 🔧 Commandes Utiles

```bash
# Générer le client Prisma
npm run db:generate

# Appliquer le schéma (développement)
npm run db:push

# Créer une migration
npx prisma migrate dev --name nom_migration

# Appliquer les migrations (production)
npx prisma migrate deploy

# Initialiser la base de données
npm run db:init

# Voir les logs Vercel
vercel logs
```

## ⚠️ Problèmes Courants

### Erreur : "Prisma Client not generated"
```bash
npm run db:generate
```

### Erreur : "Database connection failed"
- Vérifiez que `DATABASE_URL` est correct dans Vercel
- Vérifiez que la base de données PostgreSQL est accessible
- Vérifiez les paramètres de firewall

### Erreur : "NEXTAUTH_SECRET is not set"
- Ajoutez `NEXTAUTH_SECRET` dans Vercel Dashboard
- Régénérez un nouveau secret

## 📝 Notes Importantes

1. **SQLite ne fonctionne PAS sur Vercel** - Utilisez PostgreSQL
2. Les fichiers `.env` ne sont PAS commités (c'est normal)
3. Configurez les variables dans Vercel Dashboard
4. `NEXTAUTH_URL` doit correspondre à votre URL de production

## 🎉 C'est Prêt !

Votre application est maintenant déployée sur Vercel !

