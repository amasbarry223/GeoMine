# Documentation API - GeoMine RC-Insight

## Vue d'ensemble

Cette documentation décrit l'API REST de GeoMine RC-Insight pour la gestion des données géophysiques, géochimiques et de sondages.

## Base URL

- **Développement**: `http://localhost:3000/api`
- **Production**: `https://api.geomine.com`

## Authentification

Toutes les routes API (sauf `/api/auth/*`) nécessitent une authentification via NextAuth.

Les requêtes doivent inclure un cookie de session valide ou un token JWT dans le header `Authorization`.

## Format des Réponses

### Succès

```json
{
  "success": true,
  "data": { ... },
  "message": "Message optionnel"
}
```

### Erreur

```json
{
  "success": false,
  "error": "Message d'erreur",
  "details": { ... },
  "code": "ERROR_CODE"
}
```

## Codes de Statut HTTP

- `200` - Succès
- `201` - Créé avec succès
- `400` - Requête invalide
- `401` - Non authentifié
- `403` - Permission refusée
- `404` - Ressource non trouvée
- `429` - Trop de requêtes (rate limit)
- `500` - Erreur serveur

## Endpoints Principaux

### Projets

- `GET /api/projects` - Liste des projets
- `GET /api/projects/{id}` - Détails d'un projet
- `POST /api/projects` - Créer un projet
- `PUT /api/projects/{id}` - Mettre à jour un projet
- `DELETE /api/projects/{id}` - Supprimer un projet

### Géochimie

- `GET /api/geochemistry/samples` - Liste des échantillons
- `POST /api/geochemistry/samples` - Créer un échantillon
- `GET /api/geochemistry/samples/{id}` - Détails d'un échantillon
- `PUT /api/geochemistry/samples/{id}` - Mettre à jour un échantillon
- `DELETE /api/geochemistry/samples/{id}` - Supprimer un échantillon
- `GET /api/geochemistry/statistics` - Statistiques géochimiques

### Sondages

- `GET /api/drilling/holes` - Liste des trous de forage
- `POST /api/drilling/holes` - Créer un trou
- `GET /api/drilling/holes/{id}` - Détails d'un trou
- `GET /api/drilling/holes/{id}/survey` - Données de survey
- `GET /api/drilling/holes/{id}/geology` - Logs géologiques
- `GET /api/drilling/holes/{id}/assays` - Analyses

### Jeux de Données

- `POST /api/datasets/import` - Importer un fichier
- `GET /api/datasets/{id}` - Détails d'un dataset

### Inversion

- `POST /api/inversion/run` - Lancer une inversion

### Rapports

- `GET /api/reports` - Liste des rapports
- `POST /api/reports/generate` - Générer un rapport

## Pagination

La plupart des endpoints de liste supportent la pagination :

- `page` (integer, default: 1) - Numéro de page
- `pageSize` (integer, default: 10-20) - Nombre d'éléments par page

Réponse :

```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  }
}
```

## Rate Limiting

Les requêtes API sont limitées par route :

- `/api/projects` - 10 requêtes/minute
- `/api/datasets/import` - 5 requêtes/minute
- `/api/inversion/run` - 3 requêtes/minute
- Par défaut - 20 requêtes/minute

Les headers de réponse incluent :
- `X-RateLimit-Limit` - Limite totale
- `X-RateLimit-Remaining` - Requêtes restantes
- `X-RateLimit-Reset` - Timestamp de réinitialisation

## Validation

Toutes les requêtes POST/PUT sont validées avec Zod. Les erreurs de validation retournent un code 400 avec les détails dans `details`.

## Documentation OpenAPI

La spécification OpenAPI complète est disponible dans `docs/api/openapi.yaml`.

Pour visualiser la documentation :

1. Installer Swagger UI ou utiliser un outil en ligne
2. Importer le fichier `openapi.yaml`
3. Ou utiliser un outil comme Redoc

## Exemples

### Créer un projet

```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mon Projet",
    "description": "Description du projet",
    "siteLocation": "France"
  }'
```

### Lister les échantillons géochimiques

```bash
curl http://localhost:3000/api/geochemistry/samples?page=1&pageSize=10&campaignId=xxx
```

## Support

Pour toute question sur l'API, contactez support@geomine.com


