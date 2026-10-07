# TaskFlow

Application web de **gestion de tâches personnelles** (sujet A du module Full Stack JS, EFREI).
Chaque utilisateur crée un compte, puis gère ses tâches (titre, statut, description, échéance)
sans jamais voir celles des autres.

Bonus réalisés : **B1** priorité, filtres et compteur ; **B2** habit tracker ; **B3** heatmap
type GitHub ; **B4** statistiques (page Dashboard).

| Couche | Technologie |
| --- | --- |
| Interface | React 19 + Vite 7 + React Router 7 (client HTTP : `fetch`) |
| API | Node.js + Express 5 (routes → contrôleurs → services → modèles) |
| Données | MongoDB + Mongoose 9 |
| Authentification | bcryptjs (hash) + JWT signé (HS256), middleware `Bearer` |
| Qualité | ESLint 10, gestion d'erreurs centralisée, configuration par variables d'environnement |
| Tests | Jest + Supertest (API), Vitest + Testing Library (React), Playwright (end-to-end) |
| Documentation | Ce README + Swagger/OpenAPI sur `/api/docs` |

---

## 1. Prérequis

- **Node.js 20 ou plus** et **npm 10 ou plus** (`node -v`, `npm -v`)
- **MongoDB** (version 6 ou plus conseillée) accessible sur `mongodb://127.0.0.1:27017`, par exemple :
  - MongoDB Community Server installé comme service (Windows : cocher « Install as a Service »),
  - ou Docker : `docker run -d --name mongo -p 27017:27017 mongo:7`
- Facultatif : MongoDB Compass pour consulter les données

## 2. Installation

```bash
git clone https://github.com/maria-salameh/TaskFlow.git
cd TaskFlow
npm install                        # à la racine uniquement (workspaces frontend + backend)
cp backend/.env.example backend/.env   # Windows PowerShell : Copy-Item backend/.env.example backend/.env
```

Ouvrez ensuite `backend/.env` et remplacez au moins `JWT_SECRET` par une longue chaîne aléatoire :

| Variable | Rôle | Exemple |
| --- | --- | --- |
| `PORT` | Port de l'API | `3000` |
| `MONGODB_URI` | Base de développement | `mongodb://127.0.0.1:27017/taskflow` |
| `CORS_ORIGIN` | Origine autorisée à appeler l'API | `http://localhost:5173` |
| `JWT_SECRET` | Clé de signature des JWT (**secrète**, jamais committée) | chaîne aléatoire |
| `JWT_EXPIRES_IN` | Durée de validité d'un jeton | `7d` |
| `MONGODB_URI_TEST` | Base des tests (vidée à chaque lancement, nom en `_test`) | `mongodb://127.0.0.1:27017/taskflow_test` |

Le fichier `.env` est ignoré par Git. Si une variable obligatoire manque, l'API refuse de
démarrer avec un message qui indique laquelle.

## 3. Lancement

```bash
npm run dev
```

Démarre l'API (avec rechargement automatique) et le front en parallèle.

| URL | Contenu |
| --- | --- |
| http://localhost:5173 | Application React |
| http://localhost:3000/api/health | Santé de l'API : `{"status":"ok"}` |
| http://localhost:3000/api/docs | Documentation Swagger interactive |
| http://localhost:3000/api/docs.json | Spécification OpenAPI brute |

En développement, le front appelle `/api/...` et **le proxy Vite** transmet à `http://localhost:3000`
(voir `frontend/vite.config.js`). Pour viser une autre API, définir `VITE_API_URL` côté front.

Autres commandes (à la racine) :

| Commande | Effet |
| --- | --- |
| `npm run build` | Construit le front dans `frontend/dist` |
| `npm start` | Démarre uniquement l'API (sans rechargement) |
| `npm run lint` | ESLint sur tout le dépôt |
| `npm test` | Tests API (Jest + Supertest) puis tests React (Vitest) |
| `npm run test:back` / `npm run test:front` | L'une ou l'autre suite |
| `npm run test:e2e` | Tests end-to-end Playwright (voir § 6) |

## 4. Utilisation

1. **Inscription** puis connexion : le serveur renvoie un JWT gardé par le navigateur.
2. **Mes tâches** : formulaire de création (titre obligatoire, statut, priorité, échéance,
   description), liste avec changement de statut, modification, suppression (avec confirmation),
   filtres (statut, priorité, échéance, recherche), tri et compteur.
3. **Calendrier** : les tâches placées sur leur date d'échéance.
4. **Habitudes** : habitudes quotidiennes ou hebdomadaires à cocher, avec série en cours.
5. **Activité** : heatmap des 12 derniers mois (tâches terminées et habitudes réalisées).
6. **Dashboard** : statistiques (taux de complétion global et hebdomadaire, répartition par statut).

Pour tester l'API sans le front : ouvrir `/api/docs`, appeler `POST /api/auth/register`, copier
le `token` reçu, cliquer sur **Authorize**, le coller, puis essayer les routes.

## 5. API

Toutes les routes métier exigent `Authorization: Bearer <JWT>` (sinon **401**). Toutes les
erreurs ont la forme `{"error":{"code":"INVALID_INPUT","message":"Message lisible"}}`.

| Méthode | Route | Succès | Erreurs |
| --- | --- | --- | --- |
| GET | `/api/health` | 200 `{"status":"ok"}` | — |
| POST | `/api/auth/register` | 201 `{user:{id,email},token}` | 400, 409 |
| POST | `/api/auth/login` | 200 `{user:{id,email},token}` | 400, 401 |
| GET | `/api/tasks` | 200 `{items:[...]}` | 400 (filtre invalide), 401 |
| POST | `/api/tasks` | 201 tâche créée | 400, 401 |
| GET | `/api/tasks/:id` | 200 | 400, 401, 404 |
| PATCH | `/api/tasks/:id` | 200 tâche modifiée | 400, 401, 404 |
| DELETE | `/api/tasks/:id` | 204 sans corps | 400, 401, 404 |
| GET | `/api/tasks/count` | 200 `{total,byStatus,byPriority}` (B1) | 400, 401 |
| GET/POST | `/api/habits` | 200 / 201 (B2) | 400, 401 |
| GET/PATCH/DELETE | `/api/habits/:id` | 200 / 200 / 204 (B2) | 400, 401, 404 |
| GET | `/api/habits/:id/logs?from&to` | 200 `{items}` (B2) | 400, 401, 404 |
| PUT / DELETE | `/api/habits/:id/logs/:date` | 201 ou 200 / 204 (B2) | 400, 401, 404 |
| GET | `/api/habit-logs?from&to` | 200 `{items}` (B2) | 400, 401 |
| GET | `/api/stats/heatmap?from&to&tz` | 200 jours agrégés (B3) | 400, 401 |
| GET/PATCH/DELETE | `/api/users/me` | 200 / 200 / 204 | 400, 401, 409 |

Ressource `Task` :

| Champ | Règle |
| --- | --- |
| `title` | obligatoire, chaîne de 1 à 120 caractères après trim |
| `status` | obligatoire, `todo`, `doing` ou `done` |
| `description` | facultatif, 0 à 1000 caractères (chaîne vide acceptée) |
| `dueDate` | facultatif, date civile réelle `YYYY-MM-DD` ou `null` |
| `priority` | facultatif (B1), `low`, `medium` (défaut) ou `high` |
| `id`, `ownerId`, `completedAt`, `createdAt`, `updatedAt` | calculés par le serveur, **refusés** en entrée |

Exemples complets (requêtes et réponses) : voir Swagger.

## 6. Tests

| Suite | Outil | Où | Ce qui est vérifié |
| --- | --- | --- | --- |
| API | Jest + Supertest | `backend/test/` | CRUD nominal, 400/401/404/409, isolation A/B, JWT falsifié ou expiré, bonus B1/B2/B3 |
| Unitaires et composants | Vitest + Testing Library | `frontend/src/**/*.test.js(x)` | utilitaires (dates, filtres, séries, heatmap), client HTTP, `TaskForm`, `TaskList`, connexion/inscription |
| End-to-end | Playwright | `e2e/` | parcours réel dans Chromium : compte → création → filtre → modification → rechargement → suppression, isolation A/B, erreurs, habitude → heatmap |

- Les tests API utilisent **leur propre base** (`MONGODB_URI_TEST`, défaut `taskflow_test`),
  vidée avant chaque test. Ils refusent de tourner sur une base dont le nom ne finit pas par `_test`,
  pour ne jamais effacer les données de développement. MongoDB doit être démarré.
- Les tests end-to-end démarrent eux-mêmes l'API (port 3100) et le front (port 5174) sur la base
  `taskflow_e2e`. Première fois uniquement : `npx playwright install chromium`.
- Contrôle de non-régression : si l'on retire le filtre `ownerId` dans `taskService.js`,
  le test d'isolation A/B échoue.

Dans une chaîne d'intégration continue, l'ordre serait : `npm ci` → `npm run lint` → `npm test`
(avec un service MongoDB) → `npm run build` → `npm run test:e2e`.

## 7. Architecture

```text
frontend/                 React (Vite)
  src/pages/              écrans : Home (tâches), Calendar, Habits, Activity, Dashboard, Login, Register
  src/components/         TaskForm, TaskList, TaskItem, TaskFilters, TaskCounter, HabitCard, Heatmap…
  src/hooks/              useAuth, useTasks, useTaskCounts, useHabits (état + appels API)
  src/services/           api.js (fetch + JWT + erreurs), taskServices, habitServices, authServices
  src/utils/              logique pure testée : dates, filtres, séries d'habitudes, heatmap
backend/                  API Express
  src/app.js              création de l'app (sans écouter de port) : middlewares, routes, Swagger
  src/server.js           seul point d'entrée qui ouvre le port, après connexion à MongoDB
  src/routes/             URL + méthode → contrôleur (+ requireAuth)
  src/controllers/        lit la requête, choisit le code HTTP
  src/services/           règles métier, filtre systématique par ownerId
  src/validators/         validation des corps et des paramètres (400 INVALID_INPUT)
  src/models/             schémas Mongoose : User, Task, Habit, HabitLog
  src/middlewares/        requireAuth (JWT), errorHandler (format d'erreur unique)
  src/docs/openapi.js     spécification OpenAPI servie sur /api/docs
  test/                   tests Jest + Supertest
e2e/                      tests Playwright
```

Trajet d'une requête : `TaskForm` → `useTasks.createTask` → `api.js` (`fetch` + `Bearer`) →
proxy Vite → `requireAuth` (vérifie le JWT, fixe `req.userId`) → `taskController.createTask` →
`taskService.createTask` (validation, `ownerId = req.userId`) → MongoDB → réponse 201 →
la liste est rechargée depuis l'API.

## 8. Choix techniques et sécurité

- **Isolation des comptes côté serveur** : chaque requête MongoDB filtre sur `ownerId` issu du JWT
  vérifié. Un objet d'un autre compte renvoie **404**, comme un objet absent, pour ne pas révéler
  son existence. Masquer un bouton dans React ne protège rien : c'est l'API qui décide.
- **401 ou 404** : 401 = « je ne sais pas qui vous êtes » (jeton absent, invalide, expiré) ;
  404 = « vous êtes identifié mais cet objet n'existe pas pour vous ».
- **Mots de passe** : hachés avec bcrypt (10 tours), jamais renvoyés (`select: false` et
  sérialisation dédiée). Email stocké en minuscules : unicité insensible à la casse.
  Même message d'erreur pour un email inconnu et un mauvais mot de passe.
- **JWT** : signé avec `JWT_SECRET` (variable d'environnement), expiration configurable
  (7 jours par défaut). Stocké dans le `localStorage` du navigateur : simple et survit au
  rechargement, mais lisible par un script injecté (XSS). React échappe le contenu affiché et la
  durée de vie limite l'impact. Un cookie `httpOnly` serait plus robuste (amélioration possible).
- **Validation** : tout est revalidé par le serveur, même si React vérifie déjà les formulaires.
  Champs inconnus, `id` ou `ownerId` envoyés, PATCH vide, dates impossibles (`2026-02-30`) → 400.
- **Dates** : `dueDate` est une date civile stockée telle quelle (`"YYYY-MM-DD"`), donc sans
  décalage de fuseau. Les périodes « aujourd'hui », « en retard » sont calculées dans le navigateur.
- **Persistance** : MongoDB. Une donnée non supprimée reste disponible après redémarrage de l'API.

### Rôle des outils de build

- **Vite** sert le front en développement (modules ES natifs, rechargement instantané, proxy `/api`)
  et produit avec `npm run build` des fichiers optimisés (regroupés et minifiés) dans `frontend/dist`.
- **Babel** transpile le JSX et la syntaxe récente en JavaScript compris par les navigateurs ; ici
  cette transformation est prise en charge par Vite et son plugin React (`@vitejs/plugin-react`),
  sans configuration Babel à écrire.
- **Webpack** est un bundler plus ancien et très configurable, remplacé ici par Vite qui est plus
  rapide et quasiment sans configuration.

## 9. Bonus et critères d'acceptation

**B1 — Priorité et filtres.** Champ `priority` (`low`/`medium`/`high`, `medium` par défaut).
`GET /api/tasks` accepte `status`, `priority`, `dueFrom`, `dueTo`, `hasDueDate`, `q`, `sort` ;
sans paramètre, la réponse reste celle du contrat. `GET /api/tasks/count` renvoie les compteurs.
Paramètre invalide → 400. Tests : `backend/test/taskFilters.test.js`, `frontend/src/utils/taskFilters.test.js`.

**B2 — Habit tracker.** Seconde entité `Habit { title, frequency: daily|weekly, active }` et
événements `HabitLog { habitId, date }`, **uniques par habitude et par jour** (index unique).
Cocher deux fois le même jour ne crée pas de doublon (PUT idempotent : 201 puis 200). Une habitude
désactivée ne peut pas être cochée ; date future ou impossible → 400 ; supprimer une habitude
supprime son historique. Une hebdomadaire est réalisée si au moins un jour de la semaine
(lundi → dimanche) est coché. Série : périodes consécutives réalisées, la période en cours ne casse
pas la série tant qu'elle n'est pas finie. Tests : `backend/test/habits.test.js`, `frontend/src/utils/habits.test.js`.

**B3 — Heatmap.** `GET /api/stats/heatmap?from&to&tz` renvoie un élément par jour (y compris à
zéro) avec `tasks` (tâches passées à `done` ce jour-là, d'après `completedAt` converti dans le
fuseau `tz` du navigateur) et `habits`. Une tâche rouverte ne compte plus. Grille de 53 semaines,
5 niveaux d'intensité relatifs au meilleur jour, légende, filtre Tout / Tâches / Habitudes.
Tests : `backend/test/heatmap.test.js` (dont 23h30 UTC = lendemain à Paris), `frontend/src/utils/heatmap.test.js`.

**B4 — Statistiques.** Page Dashboard : taux de complétion global et hebdomadaire, répartition
par statut ; calcul documenté sur la page.

## 10. Limites connues

- Pas de récupération de mot de passe ni de vérification d'email.
- Pas de limitation du nombre de tentatives de connexion.
- Le JWT n'est pas révocable avant son expiration (pas de liste noire).
- La heatmap compte une tâche au jour de son **dernier** passage à `done` ; les tâches terminées
  avant l'ajout du champ `completedAt` n'y apparaissent pas.
- Tri par échéance ou priorité fait en mémoire après la requête : adapté à une liste personnelle,
  pas à des dizaines de milliers de tâches (il faudrait alors une pagination).
- Pas de déploiement en ligne configuré (modalité à confirmer par l'établissement).
