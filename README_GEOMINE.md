# GeoMine RC-Insight - Plateforme d'Analyse Géophysique

## 📋 Vue d'ensemble

GeoMine RC-Insight est une plateforme web professionnelle pour l'analyse et l'interprétation des données de résistivité et chargeabilité (RC) pour l'exploration minière. Elle permet aux géophysiciens de transformer des données brutes en modèles 2D/3D interprétables en quelques clics.

## 🚀 Statut du Développement

### ✅ Fonctionnalités Implémentées (MVP Complet)

#### 1. Architecture et Structure du Projet
- ✅ Schéma de base de données complet avec Prisma ORM (SQLite)
- ✅ Types TypeScript pour tous les domaines métier
- ✅ Structure modulaire du projet
- ✅ Store Zustand pour la gestion de l'état global
- ✅ Thème sombre professionnel pour réduire la fatigue visuelle

#### 2. Interface Utilisateur Principale
- ✅ Layout avec sidebar navigation
- ✅ Header avec recherche et actions
- ✅ Tableau de bord avec statistiques
- ✅ Liste des projets avec filtres
- ✅ Design responsive (desktop, tablette, mobile)
- ✅ Thème clair/sombre avec next-themes

#### 3. Gestion des Projets
- ✅ API REST pour CRUD complet
  - `GET /api/projects` - Liste des projets avec filtres
  - `POST /api/projects` - Création de projet
  - `GET /api/projects/[id]` - Détails du projet
  - `PUT /api/projects/[id]` - Mise à jour du projet
  - `DELETE /api/projects/[id]` - Suppression du projet
- ✅ Modèle de données avec relations (projets → campagnes → lignes → datasets)
- ✅ Statuts de projet (Actif, Terminé, Archivé)
- ✅ Système de tags pour la classification
- ✅ Métadonnées GPS et localisation

#### 4. Module d'Import de Données
- ✅ Parser CSV intelligent avec détection automatique de délimiteur
- ✅ Parser RES2DINV (.dat)
- ✅ Parser AGI SuperSting
- ✅ Validation des données importées
- ✅ Détection des valeurs aberrantes (outliers)
- ✅ Rapport de qualité des données (statistiques descriptives)
- ✅ Gestion des erreurs avec rapport détaillé
- ✅ Support pour séparateurs décimaux (.,)
- ✅ API d'import: `POST /api/datasets/import`

#### 5. Visualisation 2D Interactive
- ✅ Composant PseudoSection avec Recharts + Canvas (remplacement de Plotly.js pour meilleure compatibilité SSR)
- ✅ Affichage heatmap des données géophysiques
- ✅ Échelles de couleur multiples (Viridis, Plasma, Jet, etc.)
- ✅ Contrôles interactifs:
  - Zoom/pan
  - Grille
  - Contours configurables
  - Opacité ajustable
  - Réinitialisation de la vue
- ✅ Affichage des informations au clic sur un point
- ✅ Export PNG haute résolution
- ✅ Affichage des valeurs d'électrodes (A, B, M, N)

#### 6. Pré-traitement Avancé ✅
- ✅ Filtrage du bruit:
  - Filtre médian
  - Moyennage mobile
  - Filtre Savitzky-Golay
- ✅ Détection d'outliers:
  - Méthode IQR (Interquartile Range)
  - Méthode Z-Score
  - Méthode Modified Z-Score
  - Méthode Percentile
- ✅ Correction topographique:
  - Correction simple
  - Correction interpolée
  - Correction pondérée
  - Support pour données d'élévation (MNT)
- ✅ Normalisation:
  - Min-Max [0,1]
  - Z-Score
  - Logarithmique
- ✅ Pipeline de pré-traitement complet avec historique des opérations
- ✅ Métriques de qualité (changement de moyenne, écart-type)
- ✅ Page UI complète: `/preprocessing`

#### 7. Moteur d'Inversion Géophysique ✅
- ✅ Algorithme Least-Squares 2D avec régularisation de Tikhonov
- ✅ Paramètres configurables:
  - Nombre d'itérations maximum
  - Seuil de convergence
  - Facteur de régularisation
  - Facteur de lissage
  - Facteur d'amortissement
  - Contraintes (min/max résistivité, modèle de référence)
- ✅ Indicateurs de qualité:
  - RMS error final
  - Historique de convergence
  - Profondeur d'investigation
  - Sensibilité du modèle
  - Temps de calcul
- ✅ Sauvegarde automatique des modèles inversés
- ✅ API: `POST /api/inversion/run`
- ✅ Page UI complète: `/inversion`
- ⚠️ Inversion 3D: Structure présente (en développement)
- ⚠️ Inversion conjointe: Structure présente (en développement)

#### 8. Visualisation 3D Volumétrique ✅
- ✅ Rendu volumétrique avec Three.js et React Three Fiber
- ✅ Contrôles interactifs:
  - Rotation, zoom, pan
  - Opacité ajustable
  - Seuil de visualisation
  - Échelles de couleur configurables
  - Grille
  - Contours
- ✅ Composants: `VolumeVisualization.tsx`, `VolumeCanvas.tsx`
- ✅ Page UI complète: `/visualization-3d`
- ⚠️ Superposition avec modèles d'élévation (DEM): À venir

#### 9. Analyse Statistique ✅
- ✅ Statistiques descriptives complètes:
  - Moyenne, médiane, écart-type
  - Min, max, quartiles (Q25, Q75)
  - Skewness (asymétrie)
  - Kurtosis (aplatissement)
  - Statistiques régionales par zone
- ✅ Détection automatique des anomalies:
  - Méthode Z-Score
  - Méthode IQR
  - Méthode LOF (Local Outlier Factor)
  - Méthode Isolation Forest
  - Calcul de confiance et significativité
- ✅ Corrélations:
  - Corrélation de Pearson
  - Auto-corrélation
- ✅ Distributions:
  - Histogrammes
  - PDF (Probability Density Function)
  - CDF (Cumulative Distribution Function)
  - Fit de distribution normale
- ✅ Analyse spatiale:
  - Clustering spatial
  - Calcul de gradient
  - Simplification de géométries
- ✅ Page UI complète: `/statistics`
- ⚠️ Estimation des ressources: À venir

#### 10. Rapports et Exports ✅
- ✅ Génération automatique de rapports PDF avec jsPDF
- ✅ Templates personnalisables:
  - Rapport complet
  - Rapport d'inversion
  - Rapport statistique
  - Rapport d'anomalies
  - Rapport exécutif
- ✅ Sections de rapport:
  - Page de couverture
  - Table des matières
  - Sections texte, tableaux, graphiques, images
  - Numérotation des pages
- ✅ Export données brutes et modèles:
  - CSV (`exportAsCSV`)
  - Fonction de téléchargement (`downloadFile`)
- ✅ Page UI complète: `/reports`
- ✅ API: `POST /api/reports/generate`
- ⚠️ Export Excel, HDF5: À venir
- ⚠️ Export visualisations (SVG, OBJ, STL): À venir
- ⚠️ Partage sécurisé avec liens temporaires: À venir

#### 11. Intégration SIG ✅
- ✅ Import de couches SIG:
  - Parsing GeoJSON (`parseGeoJSON`)
  - Validation GeoJSON (`validateGeoJSON`)
  - Support FeatureCollection, Feature, Geometry types
- ✅ Géoréférencement automatique:
  - Conversion de coordonnées (`georeferenceCoordinates`)
  - Calcul de bounding box (`calculateBoundingBox`)
  - Calcul de centroïde (`calculateCentroid`)
- ✅ Opérations géométriques:
  - Calcul d'aire (`calculateArea`)
  - Calcul de longueur (`calculateLength`)
  - Point in polygon (`isPointInPolygon`)
  - Buffer (`createBuffer`)
  - Simplification (`simplifyGeometry`)
- ✅ Page UI complète: `/gis`
- ⚠️ Import Shapefile, KML: À venir
- ⚠️ Superposition avec géologie, forages: À venir
- ⚠️ Export vers formats SIG standards (GeoTIFF, DXF): À venir

### 📦 Stack Technique

**Frontend:**
- Next.js 15 avec App Router
- TypeScript 5
- Tailwind CSS 4
- shadcn/ui (composants UI)
- Zustand (gestion d'état)
- TanStack Query (gestion des requêtes serveur)
- Recharts + Canvas (visualisation 2D - remplacement de Plotly.js)
- Three.js + React Three Fiber (visualisation 3D)
- jsPDF (génération de rapports PDF)
- next-themes (thème clair/sombre)

**Backend:**
- Next.js API Routes
- Prisma ORM avec SQLite
- z-ai-web-dev-sdk (capacités IA)

**Base de données:**
- SQLite (facile à migrer vers PostgreSQL)
- Schéma complet avec relations

### 📁 Structure du Projet

```
src/
├── app/
│   ├── api/
│   │   ├── projects/
│   │   │   ├── route.ts          # Liste et création de projets
│   │   │   └── [id]/route.ts     # Détails, mise à jour, suppression
│   │   └── datasets/
│   │       └── import/
│   │           └── route.ts      # Import de fichiers
│   ├── layout.tsx               # Layout principal
│   ├── page.tsx                 # Page d'accueil
│   └── globals.css              # Styles globaux
├── components/
│   ├── providers/
│   │   └── theme-provider.tsx   # Provider de thème
│   ├── geophysic/
│   │   └── visualization/
│   │       ├── PseudoSectionRecharts.tsx # Composant visualisation 2D
│   │       ├── VolumeVisualization.tsx   # Composant visualisation 3D
│   │       └── VolumeCanvas.tsx          # Canvas 3D
│   └── ui/                      # Composants shadcn/ui
├── lib/
│   ├── db.ts                    # Client Prisma
│   ├── api-error-handler.ts     # Gestion centralisée des erreurs
│   └── geophysic/
│       ├── dataParser.ts        # Parsers de fichiers
│       ├── preprocessing.ts      # Pré-traitement avancé
│       ├── inversion.ts          # Moteur d'inversion
│       ├── statistics.ts         # Analyse statistique
│       ├── gis.ts                # Opérations SIG
│       └── reports.ts            # Génération de rapports
├── store/
│   └── useAppStore.ts          # Store Zustand
├── types/
│   └── geophysic.ts           # Types TypeScript
└── hooks/                      # Custom hooks
```

## 🔮 Fonctionnalités à Implémenter (Futur)

### Priorité Haute

#### 11. Authentification et Sécurité (En cours)
- ⚠️ Structure NextAuth.js présente mais incomplète
- ⏳ Rôles: Admin, Chef de projet, Géophysicien, Lecteur
- ⏳ Permissions granulaires par projet
- ⏳ Audit trail complet
- ⏳ Protection CSRF, XSS renforcée
- ⏳ Rate limiting sur API

### Priorité Moyenne

#### 12. Améliorations Inversion
- ⏳ Inversion 3D complète (structure présente, à finaliser)
- ⏳ Inversion conjointe complète (structure présente, à finaliser)
- ⏳ Calcul parallélisé pour performance
- ⏳ Optimisation des algorithmes pour grandes données

#### 13. Améliorations Visualisation 3D
- ⏳ Coupes XY, XZ, YZ interactives
- ⏳ Isosurfaces configurables
- ⏳ Superposition avec modèles d'élévation (DEM)

#### 14. Améliorations Statistiques
- ⏳ Calcul de volumes et estimation des ressources
- ⏳ Comparaison multi-profils et évolution temporelle
- ⏳ Seuils adaptatifs pour détection d'anomalies

#### 15. Améliorations Rapports
- ⏳ Export Excel, HDF5
- ⏳ Export visualisations (SVG, OBJ, STL)
- ⏳ Partage sécurisé avec liens temporaires
- ⏳ Templates personnalisables par utilisateur

### Priorité Basse

#### 16. Améliorations SIG
- ⏳ Import Shapefile, KML
- ⏳ Superposition avec géologie, forages, échantillonnage
- ⏳ Export vers formats SIG standards (GeoTIFF, DXF)

#### 17. Tests et Optimisation
- ⏳ Tests unitaires (> 80% couverture)
- ⏳ Tests d'intégration pour pipelines critiques
- ⏳ Optimisation des performances
- ⏳ Documentation API (Swagger/OpenAPI)
- ⏳ Profiling et optimisation des algorithmes critiques

## 🎯 Objectifs de Performance

- ⏳ Inversion géophysique: < 30s pour 200 points
- ⏳ Rendu 3D: 60 FPS pour modèles jusqu'à 1M de cellules
- ⏳ Import: < 5s pour 10 Mo de CSV
- ⏳ Temps de réponse API: < 200ms (95e percentile)
- ⏳ Support concurrent: 50+ utilisateurs simultanés

## 📝 Guide de Démarrage Rapide

### 1. Installation des Dépendances

```bash
bun install
```

### 2. Configuration de la Base de Données

```bash
# Créer et appliquer le schéma
bun run db:push
```

### 3. Lancement du Serveur de Développement

```bash
bun run dev
```

L'application sera accessible sur http://localhost:3000

### 4. Lint

```bash
bun run lint
```

## 🔄 Workflow Utilisateur Typique

1. **Créer un Projet**
   - Navigation → Projets → Nouveau Projet
   - Remplir les métadonnées (nom, localisation, GPS, tags)

2. **Importer des Données**
   - Créer une campagne
   - Créer une ligne de sondage
   - Importer un fichier (CSV, RES2DINV, etc.)
   - Vérifier le rapport de qualité

3. **Visualiser les Données**
   - Sélectionner le jeu de données
   - Visualiser la pseudo-section 2D
   - Ajuster les contrôles (échelle, grille, contours)
   - Identifier les zones d'intérêt

4. **Appliquer le Pré-traitement**
   - Filtrer le bruit (médian, moyenne mobile, Savitzky-Golay)
   - Corriger la topographie
   - Supprimer les outliers (IQR, Z-Score, Percentile)
   - Normaliser les données

5. **Lancer l'Inversion**
   - Configurer les paramètres d'inversion
   - Lancer le calcul
   - Surveiller la progression
   - Analyser les résultats

6. **Visualiser en 3D**
   - Visualiser le modèle volumétrique
   - Ajuster l'opacité et les seuils
   - Explorer les couches

7. **Analyser les Résultats**
   - Calculer les statistiques descriptives
   - Détecter les anomalies
   - Analyser les corrélations
   - Visualiser les distributions

8. **Générer un Rapport**
   - Sélectionner un template
   - Inclure les modèles et analyses
   - Générer le PDF
   - Télécharger ou partager

## 🎨 Conception et Ergonomie

### Design System
- **Palette de couleurs**: Thème sombre professionnel avec tons ambrés pour le contraste
- **Typographie**: Inter pour le texte principal, JetBrains Mono pour les données
- **Composants**: shadcn/ui avec personnalisation
- **Responsive**: Mobile-first avec breakpoints adaptatifs

### Principes UX
- Interface de type logiciel scientifique
- Raccourcis clavier pour actions fréquentes
- Tooltips contextuels et aide en ligne
- Feedback utilisateur (loaders, notifications)
- Chargeurs avec progression pour tâches longues

## 📊 Modèle de Données

### Hiérarchie
```
Projet
  └── Campagne
      └── Ligne de Sondage
          └── Jeu de Données (Dataset)
              ├── Données Brutes
              ├── Données Prétraitées
              └── Modèles d'Inversion
                  └── Annotations
```

### Entités Principales
- **User**: Utilisateurs avec rôles et permissions
- **Project**: Projet d'exploration avec métadonnées
- **Campaign**: Campagne de terrain
- **SurveyLine**: Ligne de sondage avec configuration
- **Dataset**: Jeu de données (résistivité ou chargeabilité)
- **PreprocessedData**: Données après pré-traitement
- **InversionModel**: Modèle résultant de l'inversion
- **Annotation**: Annotations sur les modèles
- **GISLayer**: Couches SIG pour superposition
- **Report**: Rapports générés
- **AuditLog**: Journal d'audit

## 🔐 Sécurité

- Validation stricte des inputs (client et serveur)
- Protection CSRF, XSS, SQL injection
- Rate limiting sur API (à implémenter)
- Chiffrement des données sensibles (à implémenter)
- Secrets en variables d'environnement

## 📚 Normes et Standards

- Respect des conventions géophysiques (unités, échelles)
- Compatibilité avec logiciels standards (Oasis Montaj, Surfer)
- Export formats industriels (DXF, Leapfrog, Micromine) (à implémenter)

## 🤝 Contribution

Ce projet suit les principes de développement itératif avec démos fonctionnelles à chaque étape majeure.

## 📄 Licence

Propriétaire - GeoMine RC-Insight

---

**Version Actuelle**: 1.0.0-beta
**Dernière Mise à Jour**: 2024
**Statut du Projet**: MVP Complet - Prêt pour tests utilisateurs

---

## 📋 Notes de Version 1.0.0-beta

### Changements majeurs depuis l'alpha:
- ✅ Pré-traitement avancé complètement implémenté
- ✅ Moteur d'inversion 2D opérationnel
- ✅ Visualisation 3D volumétrique fonctionnelle
- ✅ Analyse statistique complète avec 4 méthodes de détection d'anomalies
- ✅ Génération de rapports PDF avec templates
- ✅ Module SIG avec opérations géométriques
- ✅ Remplacement de Plotly.js par Recharts pour meilleure compatibilité SSR
- ⚠️ Authentification: Structure de base présente, rôles et permissions à compléter
