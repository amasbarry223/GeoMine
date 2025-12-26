# 🚀 Guide de Déploiement Vercel - GeoMine

Guide étape par étape pour déployer GeoMine sur Vercel.

## 📋 Prérequis

1. ✅ Un compte GitHub avec le projet GeoMine
2. ✅ Un compte Vercel (gratuit) : https://vercel.com/signup
3. ✅ Une base de données PostgreSQL (gratuite) :
   - **Vercel Postgres** (recommandé - intégré)
   - **Supabase** (gratuit) : https://supabase.com
   - **Neon** (gratuit) : https://neon.tech

## 🎯 Étapes de Déploiement

### Étape 1 : Préparer la Base de Données PostgreSQL

#### Option A : Vercel Postgres (Recommandé)

1. Créez un compte sur [Vercel](https://vercel.com)
2. Créez un nouveau projet (n'importe lequel pour l'instant)
3. Allez dans l'onglet **Storage**
4. Cliquez sur **Create Database** → **Postgres**
5. Choisissez un nom et une région (ex: `cdg1` pour Paris)
6. Une fois créé, allez dans **.env.local** et copiez la variable `POSTGRES_URL`
   - Elle ressemble à : `postgres://default:xxx@xxx.postgres.vercel-storage.com:5432/verceldb`

#### Option B : Supabase (Alternative)

1. Créez un compte sur [Supabase](https://supabase.com)
2. Créez un nouveau projet
3. Allez dans **Settings** → **Database**
4. Copiez la **Connection string** (URI mode)
   - Format : `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

#### Option C : Neon (Alternative)

1. Créez un compte sur [Neon](https://neon.tech)
2. Créez un nouveau projet
3. Copiez la chaîne de connexion PostgreSQL

### Étape 2 : Générer NEXTAUTH_SECRET

Générez un secret aléatoire pour NextAuth.js :

**Sur Windows PowerShell :**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**Sur Linux/Mac :**
```bash
openssl rand -base64 32
```

Copiez le résultat, vous en aurez besoin à l'étape 4.

### Étape 3 : Connecter GitHub à Vercel

1. Allez sur [vercel.com/new](https://vercel.com/new)
2. Cliquez sur **Import Git Repository**
3. Connectez votre compte GitHub si nécessaire
4. Sélectionnez le dépôt **amasbarry223/GeoMine**
5. Cliquez sur **Import**

### Étape 4 : Configurer le Projet sur Vercel

#### Configuration du Build

Vercel devrait détecter automatiquement Next.js. Vérifiez que :

- **Framework Preset** : Next.js ✅
- **Root Directory** : `./` (par défaut)
- **Build Command** : `npm run vercel-build` (déjà configuré dans vercel.json)
- **Output Directory** : `.next` (par défaut)
- **Install Command** : `npm install` (par défaut)

#### Variables d'Environnement

⚠️ **IMPORTANT** : Vous DEVEZ configurer ces variables AVANT de cliquer sur Deploy, sinon le build échouera !

Cliquez sur **Environment Variables** et ajoutez :

1. **DATABASE_URL** ⚠️ **OBLIGATOIRE**
   - **Name** : `DATABASE_URL`
   - **Value** : Votre chaîne de connexion PostgreSQL (de l'étape 1)
     - Pour Vercel Postgres : Copiez `POSTGRES_URL` depuis Vercel Storage
     - Pour Supabase : Format `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`
     - Pour Neon : Votre chaîne de connexion complète
   - **Environments** : ✅ Production, ✅ Preview, ✅ Development
   - ⚠️ **Sans cette variable, le build échouera avec l'erreur "Environment variable not found: DATABASE_URL"**

2. **NEXTAUTH_SECRET** ⚠️ **OBLIGATOIRE**
   - **Name** : `NEXTAUTH_SECRET`
   - **Value** : Le secret généré à l'étape 2
   - **Environments** : ✅ Production, ✅ Preview, ✅ Development

3. **NEXTAUTH_URL** ⚠️ **OBLIGATOIRE**
   - **Name** : `NEXTAUTH_URL`
   - **Value** : `https://votre-app.vercel.app` (remplacez par votre URL réelle après le premier déploiement)
   - **Environments** : ✅ Production, ✅ Preview, ✅ Development
   - ⚠️ **Note** : Après le premier déploiement, vous recevrez une URL comme `geomine-xxx.vercel.app`. Mettez à jour `NEXTAUTH_URL` avec cette URL exacte et redéployez.

> 💡 **Astuce** : Le script de build détecte automatiquement PostgreSQL si `DATABASE_URL` contient "postgres" et utilise le bon schéma Prisma.

### Étape 5 : Déployer

1. Cliquez sur **Deploy**
2. Attendez la fin du build (2-5 minutes)
3. Une fois terminé, vous recevrez une URL : `https://geomine-xxx.vercel.app`

### Étape 6 : Initialiser la Base de Données

Après le déploiement, vous devez initialiser la base de données avec le schéma Prisma.

#### Option A : Via Vercel CLI (Recommandé)

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Lier le projet local au projet Vercel
vercel link

# Télécharger les variables d'environnement
vercel env pull .env.local

# Copier le schéma PostgreSQL
cp prisma/schema.postgresql.prisma prisma/schema.prisma

# Générer le client Prisma
npm run db:generate

# Appliquer les migrations
npx prisma migrate deploy

# Initialiser la base de données (créer l'admin)
npm run db:init
```

#### Option B : Via Script Automatique (À créer)

Créez une route API temporaire pour l'initialisation (à supprimer après) :

```typescript
// src/app/api/init/route.ts (TEMPORAIRE - À SUPPRIMER APRÈS)
import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export async function POST() {
  try {
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    execSync('npm run db:init', { stdio: 'inherit' });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
```

Puis visitez : `https://votre-app.vercel.app/api/init` (une seule fois)

### Étape 7 : Vérifier le Déploiement

1. Visitez votre URL Vercel : `https://geomine-xxx.vercel.app`
2. Testez la connexion avec :
   - **Email** : `admin@geomine.com`
   - **Mot de passe** : `admin123`
3. Vérifiez que les fonctionnalités principales fonctionnent

## 🔧 Configuration Post-Déploiement

### Mettre à Jour NEXTAUTH_URL

1. Allez dans **Vercel Dashboard** → **Settings** → **Environment Variables**
2. Trouvez `NEXTAUTH_URL`
3. Mettez à jour avec votre URL réelle : `https://geomine-xxx.vercel.app`
4. Redéployez (ou attendez le prochain déploiement)

### Ajouter un Domaine Personnalisé (Optionnel)

1. Allez dans **Settings** → **Domains**
2. Ajoutez votre domaine (ex: `geomine.votredomaine.com`)
3. Suivez les instructions DNS
4. Mettez à jour `NEXTAUTH_URL` avec le nouveau domaine

## 🐛 Dépannage

### Erreur : "Prisma Client not generated"

Le script `vercel-build` devrait gérer cela automatiquement. Si l'erreur persiste :

1. Vérifiez que `vercel.json` utilise `npm run vercel-build`
2. Vérifiez les logs de build dans Vercel Dashboard

### Erreur : "Database connection failed"

1. Vérifiez que `DATABASE_URL` est correct dans Vercel
2. Vérifiez que la base de données PostgreSQL est accessible
3. Vérifiez les paramètres de firewall de votre base de données
4. Pour Vercel Postgres, assurez-vous que la région correspond

### Erreur : "NEXTAUTH_SECRET is not set"

1. Ajoutez `NEXTAUTH_SECRET` dans les variables d'environnement Vercel
2. Régénérez un nouveau secret si nécessaire
3. Redéployez

### Erreur de Build

1. Vérifiez les logs de build dans Vercel Dashboard
2. Assurez-vous que toutes les dépendances sont dans `package.json`
3. Vérifiez que `next.config.ts` est correct
4. Vérifiez que le schéma Prisma est valide

### La Base de Données est Vide

1. Exécutez les migrations : `npx prisma migrate deploy`
2. Initialisez les données : `npm run db:init`
3. Vérifiez que les migrations ont été appliquées

## 📝 Notes Importantes

1. **SQLite ne fonctionne PAS sur Vercel** - Vous DEVEZ utiliser PostgreSQL
2. **Les fichiers locaux ne persistent PAS** - Utilisez une base de données externe
3. **Les variables d'environnement** doivent être configurées dans Vercel Dashboard
4. **NEXTAUTH_URL** doit correspondre à votre URL de production
5. **Le script `vercel-build`** gère automatiquement les migrations Prisma

## 🔄 Mises à Jour Futures

Pour mettre à jour l'application après des changements :

1. Poussez vos changements sur GitHub
2. Vercel déploiera automatiquement (si activé)
3. Ou déclenchez manuellement un déploiement depuis Vercel Dashboard

## 📚 Ressources

- [Documentation Vercel](https://vercel.com/docs)
- [Documentation Prisma](https://www.prisma.io/docs)
- [Documentation NextAuth](https://next-auth.js.org)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)

## ✅ Checklist de Déploiement

- [ ] Base de données PostgreSQL créée
- [ ] `DATABASE_URL` configurée dans Vercel
- [ ] `NEXTAUTH_SECRET` généré et configuré
- [ ] `NEXTAUTH_URL` configurée (mise à jour après premier déploiement)
- [ ] Projet connecté à GitHub
- [ ] Build réussi sur Vercel
- [ ] Migrations Prisma appliquées
- [ ] Base de données initialisée (admin créé)
- [ ] Connexion testée avec admin@geomine.com
- [ ] Fonctionnalités principales testées

---

**Besoin d'aide ?** Ouvrez une issue sur GitHub ou consultez la documentation complète dans `DEPLOYMENT.md`

