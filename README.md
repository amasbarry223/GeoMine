# GeoMine RC-Insight - Plateforme d'Analyse Géophysique

## 📋 Vue d'ensemble

GeoMine RC-Insight est une plateforme web professionnelle pour l'analyse et l'interprétation des données de résistivité et chargeabilité (RC) pour l'exploration minière. Elle permet aux géophysiciens de transformer des données brutes en modèles 2D/3D interprétables en quelques clics.

## ✨ Fonctionnalités Principales

### 🎯 Gestion de Projets
- Création et gestion de projets d'exploration géophysique
- Organisation hiérarchique : Projets → Campagnes → Lignes de sondage → Jeux de données
- Métadonnées GPS et localisation
- Système de tags et statuts (Actif, Terminé, Archivé)

### 📥 Import de Données
- Parser CSV intelligent avec détection automatique de délimiteur
- Support RES2DINV (.dat) et AGI SuperSting
- Validation et détection des valeurs aberrantes
- Rapport de qualité des données

### 📊 Visualisation 2D Interactive
- Pseudo-sections avec heatmap interactif
- Échelles de couleur multiples (Viridis, Plasma, Jet, etc.)
- Contrôles : zoom, pan, grille, contours, opacité
- Export PNG haute résolution
- Affichage des valeurs d'électrodes (A, B, M, N)

### 🔧 Pré-traitement Avancé
- **Filtrage du bruit** : Médian, Moyennage mobile, Savitzky-Golay
- **Détection d'outliers** : IQR, Z-Score, Modified Z-Score, Percentile
- **Correction topographique** : Simple, Interpolée, Pondérée
- **Normalisation** : Min-Max, Z-Score, Logarithmique
- Pipeline complet avec historique des opérations

### 🧮 Moteur d'Inversion Géophysique
- Algorithme Least-Squares 2D avec régularisation de Tikhonov
- Paramètres configurables (itérations, convergence, régularisation)
- Indicateurs de qualité (RMS error, convergence, sensibilité)
- Sauvegarde automatique des modèles inversés

### 🎨 Visualisation 3D Volumétrique
- Rendu volumétrique avec Three.js
- Contrôles interactifs : rotation, zoom, pan, opacité, seuils
- Échelles de couleur configurables
- Grille et contours

### 📈 Analyse Statistique
- Statistiques descriptives complètes
- Détection automatique des anomalies (4 méthodes)
- Corrélations et distributions
- Analyse spatiale (clustering, gradient)

### 📄 Rapports et Exports
- Génération automatique de rapports PDF
- Templates personnalisables (complet, inversion, statistique, anomalies, exécutif)
- Export CSV des données brutes et modèles
- Sections : couverture, table des matières, texte, tableaux, graphiques

### 🗺️ Intégration SIG
- Import de couches GeoJSON
- Géoréférencement automatique
- Opérations géométriques (aire, longueur, buffer, simplification)
- Calcul de bounding box et centroïde

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+ ou Bun
- SQLite (ou PostgreSQL pour la production)

### Installation

```bash
# Cloner le dépôt
git clone https://github.com/amasbarry223/GeoMine.git
cd GeoMine

# Installer les dépendances
bun install
# ou
npm install

# Configurer la base de données
bun run db:push

# Initialiser la base de données avec un utilisateur admin
bun run db:init

# Lancer le serveur de développement
bun run dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

### Scripts Disponibles

```bash
# Développement
bun run dev              # Serveur de développement
bun run build           # Build de production
bun run start           # Serveur de production

# Base de données
bun run db:push         # Appliquer le schéma Prisma
bun run db:generate     # Générer le client Prisma
bun run db:migrate      # Créer une migration
bun run db:init         # Initialiser la DB avec admin
bun run db:studio       # Ouvrir Prisma Studio

# Utilitaires
bun run lint            # Linter le code
```

## 📦 Stack Technique

### Frontend
- **Next.js 15** - Framework React avec App Router
- **TypeScript 5** - Typage statique
- **Tailwind CSS 4** - Framework CSS utilitaire
- **shadcn/ui** - Composants UI accessibles
- **Zustand** - Gestion d'état légère
- **TanStack Query** - Gestion des requêtes serveur
- **Recharts** - Visualisation 2D
- **Three.js + React Three Fiber** - Visualisation 3D
- **jsPDF** - Génération de rapports PDF

### Backend
- **Next.js API Routes** - API REST
- **Prisma ORM** - ORM TypeScript
- **NextAuth.js** - Authentification
- **SQLite** - Base de données (facilement migrable vers PostgreSQL)

## 📁 Structure du Projet

```
src/
├── app/
│   ├── api/              # Routes API REST
│   ├── datasets/         # Page import de données
│   ├── preprocessing/    # Page pré-traitement
│   ├── inversion/        # Page inversion
│   ├── visualization-2d/ # Page visualisation 2D
│   ├── visualization-3d/ # Page visualisation 3D
│   ├── statistics/       # Page statistiques
│   ├── gis/             # Page SIG
│   └── reports/         # Page rapports
├── components/
│   ├── geophysic/       # Composants géophysiques
│   ├── modals/          # Modales
│   └── ui/              # Composants shadcn/ui
├── lib/
│   └── geophysic/       # Bibliothèques métier
│       ├── dataParser.ts
│       ├── preprocessing.ts
│       ├── inversion.ts
│       ├── statistics.ts
│       ├── gis.ts
│       └── reports.ts
└── types/               # Types TypeScript
```

## 🔄 Workflow Utilisateur

1. **Créer un Projet** → Remplir les métadonnées (nom, localisation, GPS)
2. **Importer des Données** → CSV, RES2DINV, ou AGI SuperSting
3. **Visualiser** → Pseudo-section 2D interactive
4. **Pré-traiter** → Filtrer le bruit, corriger la topographie
5. **Inverser** → Générer un modèle 2D/3D
6. **Analyser** → Statistiques et détection d'anomalies
7. **Rapporter** → Générer un PDF professionnel

## 🔐 Authentification

L'application utilise NextAuth.js pour l'authentification. Un utilisateur admin est créé lors de l'initialisation de la base de données.

Par défaut :
- Email : `admin@geomine.com`
- Mot de passe : `admin123` (à changer en production !)

## 📚 Documentation

- [Guide de Déploiement](./DEPLOYMENT.md) - Déploiement sur Vercel
- [Guide de Déploiement Rapide](./QUICK_DEPLOY.md) - Déploiement rapide
- [Analyse des Fonctionnalités](./ANALYSE_FONCTIONNALITES.md) - Documentation détaillée
- [Rapport d'Audit](./AUDIT_REPORT.md) - Audit de sécurité

## 🛠️ Développement

### Configuration de l'environnement

Créer un fichier `.env.local` :

```env
# Base de données
DATABASE_URL="file:./db/custom.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="votre-secret-aleatoire"

# Optionnel : Variables pour production
NODE_ENV="development"
```

### Migration vers PostgreSQL

Le projet supporte facilement PostgreSQL. Modifier `DATABASE_URL` dans `.env.local` :

```env
DATABASE_URL="postgresql://user:password@localhost:5432/geomine"
```

Puis utiliser le schéma PostgreSQL :

```bash
cp prisma/schema.postgresql.prisma prisma/schema.prisma
bun run db:push
```

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## 📄 Licence

Propriétaire - GeoMine RC-Insight

## 📞 Support

Pour toute question ou problème, veuillez ouvrir une [issue](https://github.com/amasbarry223/GeoMine/issues).

---

**Version** : 1.0.0-beta  
**Statut** : MVP Complet - Prêt pour tests utilisateurs  
**Dernière Mise à Jour** : 2024
