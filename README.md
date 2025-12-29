# GeoMine RC-Insight - Plateforme d'Analyse Géophysique et Géochimique

## 📋 Vue d'ensemble

GeoMine RC-Insight est une plateforme web professionnelle pour l'analyse et l'interprétation des données de résistivité et chargeabilité (RC) ainsi que des données géochimiques pour l'exploration minière. Elle permet aux géophysiciens et géochimistes de transformer des données brutes en modèles 2D/3D interprétables et en analyses géochimiques complètes en quelques clics.

## ✨ Fonctionnalités Principales

### 🎯 Gestion de Projets
- Création et gestion de projets d'exploration géophysique
- Organisation hiérarchique : Projets → Campagnes → Lignes de sondage → Jeux de données
- Métadonnées GPS et localisation
- Système de tags et statuts (Actif, Terminé, Archivé)

### 📥 Import de Données
- Parser CSV intelligent avec détection automatique de délimiteur
- Support RES2DINV (.dat) et AGI SuperSting
- **Extraction automatique d'archives ZIP** - Détection et extraction automatique des fichiers supportés
- Validation et détection des valeurs aberrantes
- Rapport de qualité des données
- Import de données de forage (Acore, RAB, Auger, RC, Diamond)

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

### 🧪 Module Géochimie
- Gestion des échantillons géochimiques
- Import de données CSV/Excel avec mapping automatique
- Gestion des analyses (assays) par élément
- Statistiques descriptives par élément
- Détection de valeurs sous limite de détection
- Filtrage et recherche avancée
- Métadonnées complètes (lithologie, altération, coordonnées)
- Page d'analyse géochimique avancée

### 🛠️ Module Drilling (Forages)
- **Gestion des campagnes** - Organisation par type de forage et période
- **Support multi-types** - Acore, RAB, Auger, RC, Diamond drilling
- **Gestion des trous** - CRUD complet avec métadonnées (coordonnées, profondeur, azimut, inclinaison)
- **Import CSV/Excel** - Mapping automatique, support de formats variés
- **Analyses géochimiques** - Par intervalle de profondeur, multi-éléments
- **Données géologiques** - Lithologie détaillée par intervalle
- **Structures géologiques** - Failles, veines, minéralisation, contacts
- **Levés topographiques** - Données de survey (déviation, profondeur réelle)
- **Visualisation** - Profils de forage, sections géologiques, logs
- **Relations** - Liens avec campagnes, projets, et échantillons géochimiques
- **Recherche avancée** - Filtres par type, profondeur, géologie, analyses

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

# Tests
bun run test            # Exécuter les tests
bun run test:ui         # Interface de test interactive
bun run test:coverage   # Tests avec couverture de code
bun run test:watch      # Tests en mode watch

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
- **Plotly.js** - Visualisation scientifique avancée (react-plotly.js)
- **jsPDF** - Génération de rapports PDF
- **adm-zip** - Extraction d'archives ZIP
- **@turf/turf** - Calculs géospatiaux
- **xlsx** - Parsing de fichiers Excel

### Backend
- **Next.js API Routes** - API REST
- **Prisma ORM** - ORM TypeScript
- **NextAuth.js** - Authentification
- **SQLite** - Base de données (facilement migrable vers PostgreSQL)
- **Winston** - Logging structuré
- **Sentry** - Monitoring et tracking d'erreurs (optionnel)

### Tests et Qualité
- **Vitest** - Framework de tests unitaires et d'intégration
- **React Testing Library** - Tests de composants React
- **ESLint** - Linter pour qualité du code
- **TypeScript** - Typage statique pour sécurité du code

### Infrastructure
- **GitHub Actions** - CI/CD automatisé
- **Zod** - Validation de schémas runtime
- **CSRF Protection** - Protection contre les attaques CSRF
- **Rate Limiting** - Limitation de débit pour les API

## 🧮 Algorithmes et Bibliothèques Recommandés

### Algorithmes Actuellement Implémentés

#### Traitement de Données
- **Least-Squares Inversion** - Inversion 2D avec régularisation Tikhonov
- **Savitzky-Golay Filter** - Filtrage polynomial pour lissage
- **Median Filter** - Filtrage médian pour réduction du bruit
- **Moving Average** - Moyennage mobile
- **IQR (Interquartile Range)** - Détection d'outliers
- **Z-Score** - Détection statistique d'anomalies
- **Modified Z-Score** - Version robuste du Z-Score
- **Percentile-based Detection** - Détection par percentiles

#### Statistiques
- Statistiques descriptives (moyenne, médiane, écart-type, quartiles)
- Calcul de skewness et kurtosis
- Corrélations (Pearson)
- Distributions et histogrammes

### Bibliothèques Recommandées pour Amélioration

#### Calculs Numériques et Matriciels

**ml-matrix** - Calculs matriciels optimisés
```bash
npm install ml-matrix
```
- **Usage** : Opérations matricielles pour inversion géophysique
- **Avantages** : Performances optimisées, opérations vectorielles
- **Cas d'usage** : Inversion 2D/3D, calculs de matrices Jacobiennes, résolution de systèmes linéaires

**numeric.js** - Calculs numériques scientifiques
```bash
npm install numeric
```
- **Usage** : Interpolation, optimisation, résolution de systèmes linéaires
- **Avantages** : Optimisé pour calculs scientifiques, très complet
- **Cas d'usage** : Interpolation spatiale, optimisation de paramètres

**simple-statistics** - Statistiques avancées
```bash
npm install simple-statistics
```
- **Usage** : Statistiques descriptives et inférentielles
- **Avantages** : Légère, complète, bien maintenue
- **Cas d'usage** : Remplace/améliore les calculs statistiques actuels

#### Traitement de Fichiers

**papaparse** - Parser CSV robuste
```bash
npm install papaparse
```
- **Usage** : Parsing CSV avec streaming et détection automatique
- **Avantages** : Gestion d'erreurs, streaming, très performant
- **Cas d'usage** : Remplacement du parser CSV actuel pour meilleures performances

**fast-csv** - Traitement CSV haute performance
```bash
npm install fast-csv
```
- **Usage** : Export/import CSV avec streaming
- **Avantages** : Très rapide, support streaming
- **Cas d'usage** : Traitement de gros fichiers CSV

**node-stream-zip** - Extraction ZIP streaming
```bash
npm install node-stream-zip
```
- **Usage** : Extraction ZIP pour gros fichiers (alternative à adm-zip)
- **Avantages** : Moins de mémoire, plus rapide pour gros ZIP
- **Cas d'usage** : Remplacement d'adm-zip pour archives volumineuses

#### Visualisation Géospatiale

**deck.gl** - Visualisation géospatiale WebGL
```bash
npm install @deck.gl/core @deck.gl/layers @deck.gl/react
```
- **Usage** : Visualisation de données géophysiques sur cartes
- **Avantages** : Performances WebGL, support de grandes datasets
- **Cas d'usage** : Visualisation interactive de données sur cartes géographiques

**d3-geo** - Projections géographiques
```bash
npm install d3-geo
```
- **Usage** : Projections cartographiques précises
- **Avantages** : Standard de l'industrie, très précis
- **Cas d'usage** : Projections de coordonnées GPS, visualisation cartographique

#### Performance et Optimisation

**lru-cache** - Cache LRU performant
```bash
npm install lru-cache
```
- **Usage** : Cache avec éviction least-recently-used
- **Avantages** : Performance, contrôle de la mémoire
- **Cas d'usage** : Cache des résultats de calculs coûteux (inversion, statistiques)

**comlink** - Web Workers simplifiés
```bash
npm install comlink
```
- **Usage** : Facilite l'utilisation de Web Workers
- **Avantages** : API simple, calculs parallèles côté client
- **Cas d'usage** : Traitement de gros datasets sans bloquer l'UI

**p-queue** - Gestion de queues asynchrones
```bash
npm install p-queue
```
- **Usage** : Traitement asynchrone contrôlé
- **Avantages** : Limite de concurrence, priorités
- **Cas d'usage** : Traitement de multiples fichiers en parallèle avec contrôle

**flatbush** - Index spatial ultra-rapide
```bash
npm install flatbush
```
- **Usage** : Index spatial pour requêtes géographiques
- **Avantages** : Très performant pour requêtes spatiales
- **Cas d'usage** : Recherche spatiale rapide, clustering géographique

### Algorithmes Recommandés à Implémenter

#### Inversion Géophysique Avancée

**Levenberg-Marquardt Algorithm**
- **Description** : Algorithme d'optimisation non-linéaire, plus robuste que Least-Squares
- **Avantages** : Meilleure convergence, gestion des problèmes mal conditionnés
- **Implémentation** : Peut utiliser `numeric.js` pour les calculs matriciels
- **Cas d'usage** : Amélioration de l'inversion 2D/3D actuelle

**Occam's Inversion**
- **Description** : Inversion avec régularisation adaptative
- **Avantages** : Modèles plus lisses, meilleure interprétation géologique
- **Cas d'usage** : Alternative à Tikhonov pour certains types de données

**Gauss-Newton Method**
- **Description** : Pour inversion 3D non-linéaire
- **Avantages** : Convergence rapide pour problèmes bien conditionnés
- **Cas d'usage** : Inversion 3D de grandes datasets

**Conjugate Gradient**
- **Description** : Pour systèmes de grande taille
- **Avantages** : Efficace en mémoire, bon pour matrices creuses
- **Cas d'usage** : Inversion 3D avec millions de cellules

#### Interpolation Spatiale

**Kriging (Ordinary/Universal)**
- **Description** : Interpolation géostatistique optimale
- **Avantages** : Prend en compte la corrélation spatiale, estimation de variance
- **Cas d'usage** : Interpolation de données géophysiques pour grilles régulières
- **Bibliothèque** : Implémentation custom avec `ml-matrix` ou `numeric.js`

**IDW (Inverse Distance Weighting)**
- **Description** : Interpolation pondérée par distance
- **Avantages** : Simple, rapide, bon pour données denses
- **Cas d'usage** : Interpolation rapide de valeurs ponctuelles

**Spline Interpolation**
- **Description** : Interpolation lisse pour surfaces
- **Avantages** : Surfaces continues et lisses
- **Cas d'usage** : Génération de surfaces topographiques, modèles 2D lisses

#### Traitement d'Image et Détection

**Gradient Spatial**
- **Description** : Calcul de gradients pour détection de structures
- **Avantages** : Détection de limites géologiques
- **Cas d'usage** : Identification automatique de structures dans modèles inversés

**Laplacian Operator**
- **Description** : Détection de contours et changements brusques
- **Avantages** : Détection de discontinuités
- **Cas d'usage** : Détection de failles, contacts géologiques

**Edge Detection (Sobel, Canny)**
- **Description** : Détection de bords dans images 2D
- **Avantages** : Identification précise des limites
- **Cas d'usage** : Détection automatique de structures géologiques

#### Filtrage Avancé

**Wiener Filter**
- **Description** : Filtrage adaptatif optimal
- **Avantages** : Réduction du bruit tout en préservant les signaux
- **Cas d'usage** : Amélioration de la qualité des données avant inversion

**Kalman Filter**
- **Description** : Filtrage temporel/spatial récursif
- **Avantages** : Estimation optimale avec incertitude
- **Cas d'usage** : Filtrage de séries temporelles, fusion de données

**Wavelet Transform**
- **Description** : Analyse multi-résolution
- **Avantages** : Analyse à différentes échelles
- **Cas d'usage** : Décomposition de signaux, compression de données

#### Machine Learning (Optionnel)

**ml.js** - Suite complète ML
```bash
npm install ml-matrix ml-regression ml-clustering
```
- **Usage** : Classification, clustering, régression
- **Avantages** : Pure JS, pas de dépendances natives
- **Cas d'usage** : Détection automatique d'anomalies, classification de structures

**@tensorflow/tfjs** - Deep Learning
```bash
npm install @tensorflow/tfjs
```
- **Usage** : Deep learning pour détection de patterns
- **Avantages** : GPU support, modèles pré-entraînés
- **Cas d'usage** : Détection automatique d'anomalies complexes, classification

### Géochimie

#### Bibliothèques Recommandées pour Géochimie

Les bibliothèques suivantes sont particulièrement utiles pour le traitement des données géochimiques :

- **xlsx** (déjà installé) - Parsing de fichiers Excel pour données géochimiques (voir section "Traitement de Fichiers")
- **papaparse** - Parsing CSV robuste pour échantillons géochimiques (voir section "Traitement de Fichiers")
- **simple-statistics** - Statistiques descriptives par élément (voir section "Calculs Numériques et Matriciels")
- **d3-array** - Utilitaires statistiques avancés
```bash
npm install d3-array
```
  - **Usage** : Fonctions statistiques avancées
  - **Avantages** : Partie de l'écosystème D3, bien testé
  - **Cas d'usage** : Calculs statistiques, transformations de données

#### Algorithmes Recommandés pour Géochimie

**Interpolation Spatiale pour Cartes Géochimiques**

*Note : Les algorithmes d'interpolation spatiale (Kriging, IDW) sont détaillés dans la section "Interpolation Spatiale" ci-dessus. Ici, nous nous concentrons sur leurs applications spécifiques à la géochimie.*

- **Kriging** : Interpolation géostatistique optimale pour concentrations
- **IDW (Inverse Distance Weighting)** : Interpolation rapide pour cartes
- **RBF (Radial Basis Functions)** : Interpolation lisse pour surfaces
- **Cas d'usage** : Génération de cartes de concentration d'éléments

**Analyse Multivariée**
- **Analyse en Composantes Principales (PCA)** : Réduction de dimensionnalité
- **Analyse en Correspondances (CA)** : Analyse de relations entre éléments
- **Clustering hiérarchique** : Groupement d'échantillons similaires
- **Cas d'usage** : Identification de populations géochimiques, associations d'éléments

**Détection d'Anomalies Géochimiques**
- **Threshold Analysis** : Détection par seuils statistiques
- **Z-Score spatial** : Détection d'anomalies locales
- **C-A (Concentration-Area) Fractal** : Détection d'anomalies multi-échelles
- **Cas d'usage** : Identification de cibles d'exploration, anomalies pathfinders

**Normalisation et Transformation**
- **Log transformation** : Normalisation de distributions log-normales
- **Box-Cox transformation** : Transformation optimale pour normalité
- **Closure problem handling** : Gestion des données de composition
- **Cas d'usage** : Préparation des données pour analyses statistiques

**Ratios et Indices Géochimiques**
- **Element ratios** : Calcul de ratios d'éléments (ex: Cu/Au, Pb/Zn)
- **Alteration indices** : Indices d'altération (CIA, PIA, etc.)
- **Pathfinder ratios** : Ratios indicateurs de minéralisation
- **Cas d'usage** : Interprétation géochimique, identification de signatures

**Géostatistique**
- **Variogram analysis** : Analyse de la structure spatiale
- **Kriging avec dérive** : Interpolation avec tendance
- **Co-kriging** : Interpolation multi-éléments
- **Cas d'usage** : Modélisation spatiale de concentrations, estimation de ressources

#### Plan d'Implémentation Géochimie

**Phase 1 : Fondamentaux (Priorité Haute)**
1. Statistiques par élément (moyenne, médiane, quartiles, skewness, kurtosis)
2. Interpolation spatiale basique (IDW)
3. Cartes de concentration (heatmaps, contours)
4. Ratios et indices de base

**Phase 2 : Analyses Avancées (Priorité Moyenne)**
1. Kriging géostatistique (variogram, kriging ordinaire)
2. Analyse multivariée (PCA, clustering)
3. Détection d'anomalies (threshold, Z-score spatial)
4. Diagrammes spécialisés (ternaires, spider diagrams)

**Phase 3 : Fonctionnalités Expertes (Priorité Basse)**
1. Géostatistique avancée (co-kriging, simulation)
2. Machine Learning (classification, prédiction)
3. Intégration géophysique-géochimique

## ⚡ Optimisation et Performance

### Évaluation des Besoins de Performance

#### Problématiques Identifiées

1. **Traitement de gros fichiers**
   - Fichiers CSV de plusieurs centaines de MB
   - Archives ZIP avec de nombreux fichiers
   - Datasets avec millions de points de données

2. **Calculs intensifs**
   - Inversion 2D/3D (matrices de grande taille)
   - Statistiques sur grandes datasets
   - Interpolation spatiale

3. **Visualisation de grandes quantités de données**
   - Pseudo-sections avec milliers de points
   - Visualisation 3D volumétrique
   - Cartes avec nombreuses couches

### Solutions Recommandées

#### 1. Streaming et Traitement par Chunks

**Algorithme de Fenêtre Glissante**
- Traitement de fichiers ligne par ligne
- Pas de chargement complet en mémoire
- Utilise `fast-csv` pour streaming CSV

**Chunk Processing**
- Division des datasets en blocs
- Traitement séquentiel ou parallèle
- Utilise `p-queue` pour contrôle de concurrence

**Lazy Evaluation**
- Calculs à la demande
- Cache des résultats intermédiaires
- Évite les calculs redondants

#### 2. Calculs Parallèles

**Web Workers**
- Calculs en arrière-plan
- Ne bloque pas l'interface utilisateur
- Utilise `comlink` pour API simplifiée

**Cas d'usage :**
- Inversion géophysique longue
- Statistiques sur gros datasets
- Parsing de fichiers volumineux

#### 3. Caching Intelligent

**LRU Cache**
- Cache des résultats de calculs coûteux
- Éviction automatique des données anciennes
- Utilise `lru-cache` ou `quick-lru`

**Memoization**
- Cache de fonctions pures
- Réduction des recalculs
- Implémentation custom ou bibliothèque

**IndexedDB (côté client)**
- Stockage de datasets volumineux
- Accès asynchrone
- Persistance entre sessions

#### 4. Compression et Optimisation

**LZ4 Compression**
- Compression rapide pour données temporaires
- Réduction de l'utilisation mémoire
- Bibliothèque : `lz4js` ou `lz4`

**Optimisation des Structures de Données**
- Utilisation de `flatbush` pour index spatial
- Structures de données immutables avec `immutable.js`
- TypedArrays pour calculs numériques

#### 5. Optimisation des Requêtes

**Spatial Indexing**
- **R-tree** : Index spatial pour requêtes géographiques
- **Quadtree** : Partitionnement spatial 2D
- **Octree** : Partitionnement spatial 3D
- Utilise `flatbush` pour implémentation rapide

**Pagination Intelligente**
- Chargement progressif des données
- Virtual scrolling pour grandes listes
- Lazy loading des composants

### Métriques de Performance Cibles

- **Temps de parsing CSV** : < 1s pour 100K lignes
- **Temps d'inversion 2D** : < 5s pour 1000 points
- **Temps de visualisation** : < 100ms pour rendu initial
- **Mémoire utilisée** : < 500MB pour datasets standards
- **Temps de chargement page** : < 2s (First Contentful Paint)

### Stratégies d'Implémentation

#### Étape 1 : Optimisation Basique
1. Implémenter `lru-cache` pour résultats de calculs
2. Ajouter pagination aux listes de datasets
3. Optimiser les requêtes Prisma avec `select` au lieu de `include`

#### Étape 2 : Streaming
1. Remplacer parser CSV par `papaparse` avec streaming
2. Implémenter traitement par chunks pour gros fichiers
3. Utiliser `node-stream-zip` pour archives volumineuses

#### Étape 3 : Calculs Parallèles
1. Implémenter Web Workers avec `comlink`
2. Déplacer inversion géophysique dans Worker
3. Paralléliser traitement de fichiers multiples

#### Étape 4 : Index Spatial
1. Implémenter `flatbush` pour index spatial
2. Optimiser requêtes géographiques
3. Améliorer clustering spatial

## 📋 Plan d'Implémentation Détaillé

Ce plan détaille les étapes concrètes pour améliorer les performances et ajouter de nouvelles fonctionnalités à la plateforme. Il est organisé en trois phases progressives, de la priorité haute à la priorité basse.

### Phase 1 : Amélioration Immédiate (Semaine 1-2)

#### Objectifs
- Améliorer les performances de base
- Optimiser le parsing et traitement de fichiers
- Ajouter caching intelligent

#### Tâches

**1.1 Installation des bibliothèques prioritaires**
```bash
npm install ml-matrix simple-statistics papaparse lru-cache
```

**1.2 Remplacement du parser CSV**
- Remplacer parser actuel par `papaparse`
- Implémenter streaming pour gros fichiers
- Améliorer gestion d'erreurs

**1.3 Optimisation des calculs matriciels**
- Remplacer calculs manuels par `ml-matrix`
- Optimiser inversion 2D avec opérations vectorielles
- Réduire temps de calcul de 30-50%

**1.4 Implémentation du cache LRU**
- Cache des résultats de statistiques
- Cache des modèles inversés
- Cache des données parsées

**1.5 Amélioration des statistiques**
- Utiliser `simple-statistics` pour calculs robustes
- Ajouter statistiques avancées manquantes
- Optimiser performances

**1.6 Support Excel pour géochimie**
- Utiliser `xlsx` pour parsing Excel
- Support multi-feuilles
- Mapping automatique de colonnes

**1.7 Statistiques géochimiques**
- Statistiques par élément avec `simple-statistics`
- Détection de valeurs sous limite de détection
- Calculs de ratios et indices de base

### Phase 2 : Algorithmes Avancés (Semaine 3-4)

#### Objectifs
- Implémenter algorithmes d'inversion améliorés
- Ajouter interpolation spatiale
- Optimiser requêtes spatiales

#### Tâches

**2.1 Implémentation Levenberg-Marquardt**
- Utiliser `ml-matrix` et `numeric.js`
- Remplacer ou compléter Least-Squares
- Améliorer convergence et robustesse

**2.2 Implémentation Kriging**
- Interpolation géostatistique
- Utiliser `ml-matrix` pour calculs
- Interface utilisateur pour paramètres

**2.3 Index spatial avec flatbush**
- Implémenter index spatial
- Optimiser requêtes géographiques
- Améliorer clustering spatial

**2.4 Streaming processing**
- Traitement par chunks
- Utiliser `fast-csv` et `node-stream-zip`
- Support fichiers > 100MB

**2.5 Interpolation spatiale géochimique**
- Implémentation IDW pour cartes
- Génération de grilles régulières
- Visualisation avec deck.gl

**2.6 Cartes géochimiques**
- Heatmaps par élément
- Contours de concentration
- Symboles proportionnels

### Phase 3 : Fonctionnalités Avancées (Semaine 5-6)

#### Objectifs
- Visualisation géospatiale avancée
- Calculs parallèles
- Machine learning optionnel

#### Tâches

**3.1 Visualisation avec deck.gl**
- Intégration deck.gl pour cartes
- Visualisation interactive de données
- Support de grandes quantités de points

**3.2 Web Workers avec comlink**
- Déplacer inversion dans Worker
- Traitement asynchrone des fichiers
- Interface non-bloquante

**3.3 Machine Learning (optionnel)**
- Détection automatique d'anomalies
- Classification de structures
- Utiliser `ml.js` ou `@tensorflow/tfjs`

**3.4 Optimisations finales**
- Compression LZ4 pour données temporaires
- IndexedDB pour stockage client
- Optimisation bundle size

**3.5 Analyse multivariée géochimique**
- PCA avec `ml.js`
- Clustering hiérarchique
- Diagrammes spécialisés (ternaires, spider)

**3.6 Kriging géostatistique**
- Variogram analysis
- Kriging ordinaire et avec dérive
- Co-kriging multi-éléments
- Validation croisée

### Critères de Succès

**Performance**
- ⚡ Réduction de 50% du temps d'inversion
- ⚡ Réduction de 70% du temps de parsing
- ⚡ Amélioration de 40% du temps de chargement

**Fonctionnalités**
- ✅ Support fichiers jusqu'à 500MB
- ✅ Inversion 3D fonctionnelle
- ✅ Interpolation spatiale disponible
- ✅ Import géochimique CSV/Excel
- ✅ Statistiques géochimiques par élément
- ✅ Cartes de concentration interactives

**Expérience Utilisateur**
- ✅ Interface non-bloquante
- ✅ Feedback visuel pendant calculs
- ✅ Gestion d'erreurs améliorée

## 📁 Structure du Projet

```
src/
├── app/
│   ├── api/              # Routes API REST
│   │   ├── datasets/     # API datasets géophysiques
│   │   ├── geochemistry/ # API géochimie
│   │   ├── drilling/     # API forages
│   │   ├── projects/     # API projets
│   │   ├── inversion/    # API inversion
│   │   ├── gis/          # API SIG
│   │   ├── reports/      # API rapports
│   │   └── auth/         # API authentification
│   ├── datasets/         # Page import de données
│   ├── preprocessing/    # Page pré-traitement
│   ├── inversion/        # Page inversion
│   ├── visualization-2d/ # Page visualisation 2D
│   ├── visualization-3d/ # Page visualisation 3D
│   ├── statistics/       # Page statistiques
│   ├── gis/             # Page SIG
│   ├── reports/         # Page rapports
│   ├── geochemistry/    # Pages géochimie
│   │   ├── samples/     # Gestion échantillons
│   │   └── analysis/    # Analyse géochimique
│   ├── drilling/        # Pages forages
│   │   └── holes/       # Gestion trous de forage
│   └── settings/        # Page paramètres
├── components/
│   ├── geophysic/       # Composants géophysiques
│   ├── geochemistry/    # Composants géochimie
│   ├── modals/          # Modales
│   └── ui/              # Composants shadcn/ui
├── lib/
│   ├── geophysic/       # Bibliothèques métier géophysique
│   │   ├── dataParser.ts
│   │   ├── preprocessing.ts
│   │   ├── inversion.ts
│   │   ├── statistics.ts
│   │   ├── gis.ts
│   │   └── reports.ts
│   └── geochemistry/    # Bibliothèques métier géochimie
│       └── parser.ts
└── types/               # Types TypeScript
```

## 🔄 Workflow Utilisateur

### Workflow Géophysique
1. **Créer un Projet** → Remplir les métadonnées (nom, localisation, GPS)
2. **Importer des Données** → CSV, RES2DINV, AGI SuperSting, ou **ZIP (extraction automatique)**
3. **Visualiser** → Pseudo-section 2D interactive
4. **Pré-traiter** → Filtrer le bruit, corriger la topographie
5. **Inverser** → Générer un modèle 2D/3D
6. **Analyser** → Statistiques et détection d'anomalies
7. **Rapporter** → Générer un PDF professionnel

### Workflow Géochimique
1. **Créer une Campagne Géochimique** → Définir les paramètres de la campagne
2. **Importer des Échantillons** → CSV ou Excel avec mapping automatique
3. **Ajouter les Analyses** → Entrer les concentrations par élément
4. **Analyser** → Statistiques par élément, détection d'anomalies
5. **Visualiser** → Cartes de concentration, diagrammes spécialisés
6. **Rapporter** → Générer un rapport géochimique

### Workflow Drilling (Forages)
1. **Créer une Campagne de Forage** → Définir le type de forage (Acore, RAB, RC, Diamond, etc.)
2. **Créer des Trous de Forage** → Enregistrer les métadonnées (coordonnées, profondeur, etc.)
3. **Importer les Données** → CSV/Excel avec données de forage
4. **Ajouter les Analyses** → Analyses géochimiques par intervalle
5. **Enregistrer la Géologie** → Lithologie, structures, minéralisation
6. **Visualiser** → Profils de forage, sections géologiques
7. **Rapporter** → Générer un rapport de forage

### Workflow Intégré
1. **Créer un Projet Multi-Disciplinaire** → Géophysique + Géochimie + Drilling
2. **Importer les Données** → Tous types de données dans un projet unifié
3. **Analyser et Corréler** → Corrélations entre données géophysiques, géochimiques et de forage
4. **Visualiser** → Visualisations intégrées multi-sources
5. **Interpréter** → Modèles géologiques complets
6. **Rapporter** → Rapports intégrés professionnels

## 🔐 Authentification

L'application utilise NextAuth.js pour l'authentification. Un utilisateur admin est créé lors de l'initialisation de la base de données.

Par défaut :
- Email : `admin@geomine.com`
- Mot de passe : `admin123` (à changer en production !)

## 🧪 Tests

Le projet utilise **Vitest** pour les tests unitaires et d'intégration.

### Structure des Tests

```
src/__tests__/
├── setup.ts                    # Configuration des tests
├── lib/
│   ├── geophysic/
│   │   └── dataParser.test.ts  # Tests parsers géophysiques
│   ├── geochemistry/
│   │   └── parser.test.ts      # Tests parsers géochimiques
│   ├── drilling/
│   │   └── parser.test.ts      # Tests parsers forages
│   └── api-error-handler.test.ts
├── api/
│   └── projects.test.ts        # Tests API projets
└── accessibility.test.tsx      # Tests d'accessibilité
```

### Exécuter les Tests

```bash
# Tous les tests
bun run test

# Interface interactive
bun run test:ui

# Avec couverture de code
bun run test:coverage

# Mode watch (développement)
bun run test:watch
```

### Couverture de Code

Le projet vise une couverture minimale de **70%** pour :
- Lignes de code
- Fonctions
- Branches
- Statements

### Tests Disponibles

- ✅ Tests unitaires des parsers (géophysique, géochimie, drilling)
- ✅ Tests d'intégration API
- ✅ Tests de gestion d'erreurs
- ✅ Tests d'accessibilité
- ⏳ Tests E2E (à venir)
- ⏳ Tests de performance (à venir)

## 🔒 Sécurité

### Authentification et Autorisation

- **NextAuth.js** - Authentification sécurisée
- **Protection CSRF** - Tokens CSRF pour toutes les mutations
- **Validation Zod** - Validation stricte des entrées API
- **Permissions granulaires** - Système de permissions par rôle

### Headers de Sécurité

L'application configure automatiquement :
- **Content-Security-Policy (CSP)** - Protection XSS
- **Strict-Transport-Security (HSTS)** - HTTPS forcé
- **X-Frame-Options** - Protection clickjacking
- **X-Content-Type-Options** - Protection MIME sniffing

### Rate Limiting

- Limitation de débit sur les routes API critiques
- Protection contre les attaques DDoS
- Gestion des abus avec Redis (optionnel)

## 📊 Monitoring et Logging

### Système de Logging

Le projet utilise **Winston** pour un logging structuré :

```typescript
import { logInfo, logError, logWarn } from '@/lib/logger';

// Logging d'informations
logInfo('User action', { userId, action: 'import' });

// Logging d'erreurs
logError('Import failed', error, { fileName, userId });

// Logging de warnings
logWarn('Large file detected', { fileName, size });
```

### Monitoring

- **Sentry** (optionnel) - Tracking d'erreurs en production
- **Performance monitoring** - Suivi des temps de réponse
- **Database query logging** - Monitoring des requêtes Prisma

## 🏗️ Architecture

### Structure Modulaire

Le projet suit une architecture modulaire claire :

```
┌─────────────────────────────────────────┐
│         Frontend (Next.js 15)          │
│  ┌──────────┐  ┌──────────┐           │
│  │  Pages   │  │Components│           │
│  └──────────┘  └──────────┘           │
│         │              │              │
│         └──────┬────────┘              │
│                ▼                       │
│         ┌──────────┐                   │
│         │   API    │                   │
│         │  Routes  │                   │
│         └──────────┘                   │
└────────────────┬───────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│      Business Logic Layer               │
│  ┌──────────┐  ┌──────────┐            │
│  │Geophysic │  │Geochem   │            │
│  │  Libs    │  │  Libs    │            │
│  └──────────┘  └──────────┘            │
└────────────────┬───────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│      Data Access Layer (Prisma)         │
│         ┌────────────────┐              │
│         │   Database     │              │
│         │  (SQLite/PG)   │              │
│         └────────────────┘              │
└─────────────────────────────────────────┘
```

### Flux de Données

1. **Requête utilisateur** → Page React
2. **Action utilisateur** → Hook React Query
3. **Appel API** → Next.js API Route
4. **Validation** → Zod schemas
5. **Business Logic** → Libs métier (geophysic/geochemistry)
6. **Data Access** → Prisma ORM
7. **Base de données** → SQLite/PostgreSQL
8. **Réponse** → JSON → React Query → UI

## 🔌 API Routes Disponibles

### Géophysique

#### Datasets
- `GET /api/datasets` - Liste des datasets avec filtres et pagination
- `POST /api/datasets/import` - Import de données géophysiques (CSV, RES2DINV, AGI SuperSting, ZIP)
- `POST /api/datasets/import-streaming` - Import streaming pour gros fichiers (>10MB)
- `GET /api/datasets/[id]` - Détails d'un dataset

#### Inversion
- `POST /api/inversion/run` - Exécuter une inversion géophysique 2D/3D

### Géochimie

#### Échantillons (Samples)
- `GET /api/geochemistry/samples` - Liste des échantillons avec filtres
- `POST /api/geochemistry/samples` - Créer un échantillon
- `POST /api/geochemistry/samples/import` - Import d'échantillons (CSV/Excel)
- `GET /api/geochemistry/samples/[id]` - Détails d'un échantillon
- `PUT /api/geochemistry/samples/[id]` - Mettre à jour un échantillon
- `DELETE /api/geochemistry/samples/[id]` - Supprimer un échantillon

#### Analyses (Assays)
- `GET /api/geochemistry/assays` - Liste des analyses avec filtres
- `POST /api/geochemistry/assays` - Créer une analyse
- `GET /api/geochemistry/assays/[id]` - Détails d'une analyse
- `PUT /api/geochemistry/assays/[id]` - Mettre à jour une analyse
- `DELETE /api/geochemistry/assays/[id]` - Supprimer une analyse

#### Statistiques
- `GET /api/geochemistry/statistics` - Statistiques par élément (moyenne, médiane, quartiles, etc.)

### Drilling (Forages)

#### Trous de Forage (Holes)
- `GET /api/drilling/holes` - Liste des trous de forage avec filtres
- `POST /api/drilling/holes` - Créer un trou de forage
- `POST /api/drilling/holes/import` - Import de données de forage (CSV/Excel)
- `GET /api/drilling/holes/[id]` - Détails d'un forage
- `PUT /api/drilling/holes/[id]` - Mettre à jour un forage
- `DELETE /api/drilling/holes/[id]` - Supprimer un forage

#### Données par Forage
- `GET /api/drilling/holes/[id]/assays` - Analyses géochimiques d'un forage
- `GET /api/drilling/holes/[id]/geology` - Données géologiques d'un forage
- `GET /api/drilling/holes/[id]/structures` - Structures géologiques d'un forage
- `GET /api/drilling/holes/[id]/survey` - Levés topographiques d'un forage

### Projets et Campagnes

#### Projets
- `GET /api/projects` - Liste des projets avec filtres et pagination
- `POST /api/projects` - Créer un projet
- `GET /api/projects/[id]` - Détails d'un projet
- `PUT /api/projects/[id]` - Mettre à jour un projet
- `DELETE /api/projects/[id]` - Supprimer un projet

### Rapports

#### Génération et Gestion
- `POST /api/reports/generate` - Générer un nouveau rapport
- `GET /api/reports/[id]` - Détails d'un rapport
- `DELETE /api/reports/[id]` - Supprimer un rapport

### SIG (Système d'Information Géographique)

#### Couches GIS
- `GET /api/gis/layers` - Liste des couches GIS
- `POST /api/gis/layers` - Créer une couche GIS (GeoJSON, KML, Shapefile)

### Authentification

#### NextAuth
- `GET /api/auth/[...nextauth]` - Routes NextAuth (signin, signout, session, callback)

#### Gestion de Mot de Passe
- `POST /api/auth/change-password` - Changer le mot de passe utilisateur
- `POST /api/auth/reset-admin` - Réinitialiser le mot de passe admin (développement uniquement)

### Sécurité

#### CSRF Protection
- `GET /api/csrf-token` - Obtenir un token CSRF pour les mutations

### Utilitaires

#### Initialisation
- `POST /api/init-db` - Initialiser la base de données (développement/déploiement)
- `GET /api` - Health check de l'API

### Jobs et Tâches Asynchrones

#### Gestion des Jobs
- `GET /api/jobs/[id]` - Statut d'un job (import, traitement, etc.)
- `DELETE /api/jobs/[id]` - Annuler un job

### Format des Réponses API

Toutes les routes API retournent un format standardisé :

```typescript
// Succès
{
  "success": true,
  "data": { /* données */ },
  "message": "Message optionnel"
}

// Erreur
{
  "success": false,
  "error": "Message d'erreur",
  "details": { /* détails optionnels */ }
}
```

### Authentification Requise

La plupart des routes API nécessitent une authentification via NextAuth.js. Les tokens CSRF sont requis pour toutes les mutations (POST, PUT, DELETE).

### Pagination

Les routes de liste supportent la pagination :
- `page` - Numéro de page (défaut: 1)
- `pageSize` - Taille de page (défaut: 20, max: 100)

### Filtrage et Recherche

Les routes de liste supportent :
- `search` - Recherche textuelle
- Filtres spécifiques selon le type de ressource
- Tri et ordre de tri

## 📚 Documentation

- [Guide de Déploiement](./DEPLOYMENT.md) - Déploiement sur Vercel
- [Guide de Déploiement Rapide](./QUICK_DEPLOY.md) - Déploiement rapide
- [Analyse des Fonctionnalités](./ANALYSE_FONCTIONNALITES.md) - Documentation détaillée
- [Rapport d'Audit](./AUDIT_REPORT.md) - Audit de sécurité
- [Analyse du README](./README_ANALYSIS.md) - Analyse complète et éléments manquants
- [Améliorations Implémentées](./README_IMPROVEMENTS.md) - Liste des améliorations

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

Les contributions sont les bienvenues ! Voici comment contribuer :

### Processus de Contribution

1. **Fork le projet** et créer une branche pour votre fonctionnalité
   ```bash
   git checkout -b feature/ma-fonctionnalite
   ```

2. **Développer** en suivant les conventions du projet
   - Utiliser TypeScript strict
   - Respecter les patterns existants
   - Ajouter des tests pour les nouvelles fonctionnalités
   - Documenter le code

3. **Tester** votre code
   ```bash
   bun run test
   bun run lint
   bun run build
   ```

4. **Commit** avec des messages clairs
   ```bash
   git commit -m "feat: ajout fonctionnalité X"
   ```

5. **Push** et ouvrir une Pull Request

### Conventions de Code

- **TypeScript strict** - Tous les fichiers doivent être typés
- **ESLint** - Respecter les règles de linting
- **Nommage** - camelCase pour variables, PascalCase pour composants
- **Tests** - Minimum 70% de couverture pour nouvelles fonctionnalités
- **Documentation** - Commenter les fonctions complexes

### Format des Commits

Utiliser le format [Conventional Commits](https://www.conventionalcommits.org/) :

- `feat:` - Nouvelle fonctionnalité
- `fix:` - Correction de bug
- `docs:` - Documentation
- `style:` - Formatage
- `refactor:` - Refactoring
- `test:` - Tests
- `chore:` - Maintenance

### Checklist avant PR

- [ ] Code testé et fonctionnel
- [ ] Tests passent (`bun run test`)
- [ ] Linter passe (`bun run lint`)
- [ ] Build réussit (`bun run build`)
- [ ] Documentation mise à jour
- [ ] Pas de breaking changes (ou documentés)

## 🐛 Dépannage (Troubleshooting)

### Problèmes Courants

#### Erreur de base de données
```bash
# Régénérer le client Prisma
bun run db:generate

# Réinitialiser la base de données
bun run db:push
bun run db:init
```

#### Erreurs de build
```bash
# Nettoyer et réinstaller
rm -rf node_modules .next
bun install
bun run build
```

#### Problèmes d'authentification
```bash
# Réinitialiser le mot de passe admin
bun run db:fix-admin
```

#### Erreurs de parsing
- Vérifier le format des fichiers (CSV, Excel)
- Vérifier les délimiteurs et encodages
- Consulter les logs dans la console

### Logs et Debugging

Les logs sont disponibles dans :
- **Console** (développement) - Logs structurés avec Winston
- **Fichiers** (production) - Logs dans `logs/` directory
- **Sentry** (si configuré) - Erreurs en production

### Support

Pour obtenir de l'aide :
1. Consulter la [documentation](./ANALYSE_FONCTIONNALITES.md)
2. Vérifier les [issues existantes](https://github.com/amasbarry223/GeoMine/issues)
3. Ouvrir une [nouvelle issue](https://github.com/amasbarry223/GeoMine/issues/new) avec :
   - Description du problème
   - Steps to reproduce
   - Logs d'erreur
   - Version et environnement

## 📄 Licence

Propriétaire - GeoMine RC-Insight

## 📞 Support

Pour toute question ou problème, veuillez ouvrir une [issue](https://github.com/amasbarry223/GeoMine/issues).

---

## 📈 Roadmap

### Version Actuelle : 1.0.0-beta

**Statut** : MVP Complet - Prêt pour tests utilisateurs

### Prochaines Versions

#### v1.1.0 - Améliorations Performance (Q1 2024)
- [ ] Implémentation ml-matrix pour calculs optimisés
- [ ] Streaming processing pour gros fichiers
- [ ] Cache LRU pour résultats de calculs
- [ ] Web Workers pour inversion parallèle

#### v1.2.0 - Algorithmes Avancés (Q2 2024)
- [ ] Levenberg-Marquardt pour inversion améliorée
- [ ] Kriging pour interpolation spatiale
- [ ] Index spatial (flatbush) pour requêtes rapides
- [ ] Cartes géochimiques interactives

#### v1.3.0 - Fonctionnalités Expertes (Q3 2024)
- [ ] Analyse multivariée géochimique (PCA, clustering)
- [ ] Visualisation géospatiale avec deck.gl
- [ ] Machine Learning pour détection d'anomalies
- [ ] Intégration géophysique-géochimique-drilling

#### v2.0.0 - Plateforme Complète (Q4 2024)
- [ ] Interface collaborative multi-utilisateurs
- [ ] Export/Import de projets complets
- [ ] API publique documentée (OpenAPI)
- [ ] Plugins et extensions

## 📊 Métriques du Projet

- **Lignes de code** : ~15,000+
- **Modules implémentés** : 13+
- **Tests** : 5+ suites de tests
- **Couverture de code** : 70%+ (objectif)
- **API Routes** : 30+
- **Pages UI** : 15+
- **Composants** : 50+

## 🎯 Statut par Module

| Module | Statut | Couverture Tests | Documentation |
|--------|--------|------------------|---------------|
| Géophysique | ✅ Complet | ✅ 70%+ | ✅ Complète |
| Géochimie | ✅ Complet | ✅ 70%+ | ✅ Complète |
| Drilling | ✅ Complet | ✅ 70%+ | ✅ Complète |
| Visualisation 2D | ✅ Complet | ⏳ En cours | ✅ Complète |
| Visualisation 3D | ✅ Complet | ⏳ En cours | ✅ Complète |
| Inversion | ✅ Complet | ⏳ En cours | ✅ Complète |
| Statistiques | ✅ Complet | ✅ 70%+ | ✅ Complète |
| Rapports | ✅ Complet | ⏳ En cours | ✅ Complète |
| SIG | ✅ Complet | ⏳ En cours | ✅ Complète |
| Authentification | ✅ Complet | ⏳ En cours | ✅ Complète |

---

**Version** : 1.0.0-beta  
**Statut** : MVP Complet - Prêt pour tests utilisateurs  
**Dernière Mise à Jour** : Décembre 2024  
**Maintenu par** : Équipe GeoMine
