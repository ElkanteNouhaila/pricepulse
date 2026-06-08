# PricePulse — Smart Price Tracker

Un tracker de prix de produits e-commerce avec simulateur de variation et dashboard React.

---

## Lancer l'application en local (Docker)

### Prérequis
- Docker & Docker Compose installés

### Démarrage en une commande

```bash
docker-compose up --build
```

| Service  | Local URL                | Production URL                           |
|----------|--------------------------|------------------------------------------|
| Frontend | http://localhost:5173    | https://pricepulse-gino.vercel.app/      |
| Backend  | http://localhost:3000    | https://pricepulse-ie5p.onrender.com     |
| Postgres | localhost:5432           | Hosted on Render PostgreSQL              |

> La base de données est initialisée automatiquement au premier démarrage.

### Arrêter l'application

```bash
docker-compose down
```

### Repartir de zéro (reset DB)

```bash
docker-compose down -v
docker-compose up --build
```

---

## Exécuter les tests

### Tests unitaires (validation, logique métier)

```bash
cd backend
npm install
npm test
```

### Tests d'intégration (endpoints API + comportement DB mocké)

```bash
cd backend
npm run test:integration
```

### Tous les tests back

```bash
cd backend
npm run test:all
```

### Tests E2E avec Playwright (nécessite l'app en cours d'exécution)

```bash
# Dans un terminal : lancer l'app
docker-compose up --build

# Dans un autre terminal :
cd frontend
npm install
npx playwright install chromium
npm run test:e2e
```

---

## Choix d'architecture

### Back-End — Node.js / TypeScript / Express / PostgreSQL

**Pourquoi Node.js + TypeScript ?**
Écosystème mature, typage statique pour réduire les bugs runtime, et compatibilité naturelle avec le front React/TS.

**Pourquoi Express ?**
Framework minimaliste qui laisse le contrôle total sur la structure. Adapté à un MVP où la sur-ingénierie serait contre-productive.

**Pourquoi PostgreSQL ?**
Données relationnelles (produits → historique de prix), contraintes d'intégrité (FK, UNIQUE sur l'URL), et robustesse en production. L'index sur `price_history(product_id)` garantit des lectures rapides même avec beaucoup d'entrées d'historique.

**Structure des routes**
```
GET    /products              → liste paginable
POST   /products              → création avec validation stricte
DELETE /products/:id          → suppression avec cascade automatique (FK)
GET    /products/:id/history  → historique trié ASC, limité à 100 points
GET    /health                → healthcheck pour Docker
```

**Simulateur de prix**
`node-cron` lance `simulatePriceUpdate()` toutes les heures (configurable). La fonction applique une variation aléatoire entre -5% et +10% sur chaque produit et insère un point dans `price_history`. En cas d'erreur DB, le job logue et continue sans crasher le serveur.

### Front-End — React / TypeScript / Vite / Tailwind

- `App.tsx` : orchestration globale, polling toutes les 10 secondes
- `Dashboard.tsx` : tableau des produits avec état de sélection
- `ProductRow.tsx` : ligne avec indicateur visuel 📈/📉 (rouge = hausse, vert = baisse)
- `ProductForm.tsx` : formulaire avec gestion loading/erreur
- `PriceChart.tsx` : graphique Recharts de l'historique

Pas de librairie de state management externe (Redux, Zustand) — les hooks natifs (`useState`, `useEffect`) sont suffisants pour ce scope MVP.

### Tests

| Couche | Outil | Ce qui est testé |
|--------|-------|-----------------|
| Unitaire | Jest + ts-jest | `validateUrl`, `validatePrice` — logique pure, 0 dépendance externe |
| Intégration | Jest + Supertest | Chaque endpoint (GET/POST/DELETE/history), cas nominaux et cas d'erreur (DB failure, input invalide, 404, duplicate) |
| E2E | Playwright | Parcours utilisateur complet : ajout produit → apparition dans la liste → suppression |

---

## Si j'avais eu 2 semaines de plus

**Fonctionnel**
- Authentification utilisateur (JWT) pour que chaque compte ait ses propres produits suivis
- Notifications par email/webhook quand un prix passe sous un seuil défini par l'utilisateur
- Vrai scraping via un service dédié avec gestion du rate-limiting et rotation de proxies
- Comparaison de prix entre plusieurs sites pour le même produit

**Technique**
- Remplacer le polling toutes les 10s par du Server-Sent Events ou WebSocket pour des mises à jour temps réel sans surcharge réseau
- Pagination côté front avec TanStack Query pour le cache et le refetch intelligent
- Pipeline CI/CD GitHub Actions (lint → tests → build Docker → deploy sur Railway/Render)
- Séparation du simulateur dans un worker process indépendant (BullMQ + Redis) pour éviter de bloquer le serveur HTTP
- Ajout de métriques (Prometheus) et logs structurés (Winston/Pino) pour l'observabilité
- Tests de charge (k6) pour valider le comportement sous stress

**Infrastructure**
- Déploiement multi-environnement (staging / production) avec variables d'environnement séparées
- Backup automatique PostgreSQL
- CDN pour les assets frontend