# ✅ Checklist de Configuration Vercel

Utilisez cette checklist pour vous assurer que tout est configuré correctement avant le déploiement.

## 🔴 AVANT LE DÉPLOIEMENT

### 1. Base de Données PostgreSQL
- [ ] Base de données PostgreSQL créée (Vercel Postgres, Supabase, ou Neon)
- [ ] Chaîne de connexion `DATABASE_URL` copiée et prête

### 2. Variables d'Environnement dans Vercel
- [ ] `DATABASE_URL` configurée avec votre chaîne PostgreSQL
- [ ] `NEXTAUTH_SECRET` généré et configuré
- [ ] `NEXTAUTH_URL` configurée (peut être mise à jour après le premier déploiement)
- [ ] Toutes les variables sont activées pour Production, Preview, et Development

### 3. Vérification du Code
- [ ] Le dépôt GitHub est à jour
- [ ] Le fichier `vercel.json` est présent
- [ ] Le script `vercel-build` est dans `package.json`
- [ ] Le fichier `prisma/schema.postgresql.prisma` existe

## 🟡 PENDANT LE DÉPLOIEMENT

### 4. Configuration du Projet
- [ ] Projet GitHub connecté à Vercel
- [ ] Framework détecté : Next.js
- [ ] Build Command : `npm run vercel-build` (automatique)
- [ ] Variables d'environnement ajoutées AVANT de cliquer sur Deploy

### 5. Build
- [ ] Build démarre sans erreur
- [ ] Script `prepare-vercel-build.js` s'exécute
- [ ] Prisma génère le client avec le schéma PostgreSQL
- [ ] Migrations Prisma s'appliquent
- [ ] Build Next.js réussit

## 🟢 APRÈS LE DÉPLOIEMENT

### 6. Initialisation de la Base de Données
- [ ] Migrations Prisma appliquées (automatique via `vercel-build`)
- [ ] Base de données initialisée avec l'utilisateur admin
  - Option A : Via `/api/init-db` (temporaire)
  - Option B : Via Vercel CLI (`npm run db:init`)

### 7. Vérification
- [ ] Application accessible sur l'URL Vercel
- [ ] Connexion réussie avec `admin@geomine.com` / `admin123`
- [ ] Fonctionnalités principales testées
- [ ] `NEXTAUTH_URL` mise à jour avec l'URL réelle

### 8. Sécurité Post-Déploiement
- [ ] Mot de passe admin changé
- [ ] Route `/api/init-db` supprimée (si utilisée)
- [ ] Variables d'environnement vérifiées dans Vercel Dashboard

## 🐛 En Cas d'Erreur

### Erreur : "Environment variable not found: DATABASE_URL"
- ✅ Vérifiez que `DATABASE_URL` est configurée dans Vercel Dashboard
- ✅ Vérifiez que la variable est activée pour l'environnement (Production/Preview/Development)
- ✅ Redéployez après avoir ajouté la variable

### Erreur : "Prisma schema validation"
- ✅ Vérifiez que `DATABASE_URL` pointe vers PostgreSQL (contient "postgres")
- ✅ Le script `prepare-vercel-build.js` devrait copier automatiquement le schéma PostgreSQL

### Erreur : "Database connection failed"
- ✅ Vérifiez que la chaîne de connexion `DATABASE_URL` est correcte
- ✅ Vérifiez que la base de données PostgreSQL est accessible
- ✅ Vérifiez les paramètres de firewall de votre base de données

## 📝 Notes

- ⚠️ **Ne déployez PAS sans avoir configuré `DATABASE_URL`** - Le build échouera
- ⚠️ **SQLite ne fonctionne PAS sur Vercel** - Vous DEVEZ utiliser PostgreSQL
- ✅ Le script de build détecte automatiquement PostgreSQL et utilise le bon schéma
- ✅ Les migrations Prisma sont appliquées automatiquement lors du build

---

**Besoin d'aide ?** Consultez `DEPLOY_VERCEL.md` pour le guide complet.

