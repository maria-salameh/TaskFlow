// Spécification OpenAPI 3 de l'API TaskFlow, servie sur /api/docs (interface Swagger)
// et /api/docs.json (fichier brut). Elle décrit uniquement les routes réellement
// implémentées dans src/routes. Toute nouvelle route doit être ajoutée ici.

const errorExample = (code, message) => ({ value: { error: { code, message } } });

const errorResponse = (description, examples) => ({
  description,
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, examples } },
});

const responses = {
  BadRequest: errorResponse('Corps, paramètre ou identifiant invalide', {
    invalid: errorExample('INVALID_INPUT', 'Le statut doit être todo, doing ou done'),
  }),
  Unauthorized: errorResponse('Jeton absent, invalide ou expiré', {
    unauthorized: errorExample('UNAUTHORIZED', 'Authentification requise'),
  }),
  NotFound: errorResponse("Objet absent ou appartenant à un autre compte", {
    notFound: errorExample('NOT_FOUND', 'Tâche introuvable'),
  }),
  Conflict: errorResponse('Email déjà utilisé', {
    conflict: errorExample('EMAIL_ALREADY_USED', 'Cette adresse email est déjà utilisée'),
  }),
};

const idParam = (description) => ({
  name: 'id',
  in: 'path',
  required: true,
  description,
  schema: { type: 'string', pattern: '^[a-f0-9]{24}$' },
  example: '507f1f77bcf86cd799439011',
});

const dateParam = {
  name: 'date',
  in: 'path',
  required: true,
  description: 'Date civile de la réalisation (YYYY-MM-DD), pas dans le futur',
  schema: { type: 'string', format: 'date' },
  example: '2026-10-07',
};

const json = (schema, example) => ({
  content: { 'application/json': { schema, ...(example ? { example } : {}) } },
});

const taskExample = {
  id: '507f1f77bcf86cd799439011',
  title: 'Préparer la démo',
  status: 'todo',
  description: 'Plan et données',
  dueDate: '2026-10-05',
  priority: 'high',
  completedAt: null,
  ownerId: '6650f1f77bcf86cd79943900',
  createdAt: '2026-10-01T09:00:00.000Z',
  updatedAt: '2026-10-01T09:00:00.000Z',
};

const habitExample = {
  id: '507f191e810c19729de860ea',
  title: 'Marcher',
  frequency: 'daily',
  active: true,
  ownerId: '6650f1f77bcf86cd79943900',
  createdAt: '2026-10-01T09:00:00.000Z',
  updatedAt: '2026-10-01T09:00:00.000Z',
};

const authExample = {
  user: { id: '6650f1f77bcf86cd79943900', email: 'alice@example.test' },
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.<payload>.<signature>',
};

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'TaskFlow API',
    version: '1.0.0',
    description:
      "API REST du projet TaskFlow (Full Stack JS). Toutes les routes métier exigent l'en-tête " +
      '`Authorization: Bearer <JWT>` : obtenez un jeton avec /api/auth/register ou /api/auth/login, ' +
      'puis cliquez sur **Authorize** et collez le jeton (sans le mot « Bearer »).\n\n' +
      'Toutes les erreurs ont la forme `{"error":{"code":"...","message":"..."}}`. ' +
      "Un objet appartenant à un autre compte renvoie 404, comme un objet absent.",
  },
  servers: [{ url: '/', description: 'Serveur courant' }],
  tags: [
    { name: 'Santé' },
    { name: 'Authentification', description: 'Routes publiques' },
    { name: 'Tâches', description: 'Contrat obligatoire + bonus B1 (priorité, filtres, compteur)' },
    { name: 'Habitudes', description: 'Bonus B2 : habit tracker' },
    { name: 'Statistiques', description: 'Bonus B3 : heatmap' },
    { name: 'Compte' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    responses,
    schemas: {
      Error: {
        type: 'object',
        required: ['error'],
        properties: {
          error: {
            type: 'object',
            required: ['code', 'message'],
            properties: {
              code: {
                type: 'string',
                enum: ['INVALID_INPUT', 'UNAUTHORIZED', 'NOT_FOUND', 'EMAIL_ALREADY_USED', 'INTERNAL_ERROR'],
              },
              message: { type: 'string' },
            },
          },
        },
      },
      Credentials: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', description: 'Insensible à la casse' },
          password: { type: 'string', minLength: 8, description: 'Au moins 8 caractères' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: { id: { type: 'string' }, email: { type: 'string' } },
          },
          token: { type: 'string', description: 'JWT signé (HS256)' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Task: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string', minLength: 1, maxLength: 120 },
          status: { type: 'string', enum: ['todo', 'doing', 'done'] },
          description: { type: 'string', maxLength: 1000 },
          dueDate: { type: 'string', format: 'date', nullable: true },
          priority: { type: 'string', enum: ['low', 'medium', 'high'] },
          completedAt: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            description: 'Renseigné par le serveur au passage à done (lecture seule)',
          },
          ownerId: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      TaskCreate: {
        type: 'object',
        required: ['title', 'status'],
        additionalProperties: false,
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 120, description: 'Après trim' },
          status: { type: 'string', enum: ['todo', 'doing', 'done'] },
          description: { type: 'string', maxLength: 1000 },
          dueDate: { type: 'string', format: 'date', nullable: true },
          priority: { type: 'string', enum: ['low', 'medium', 'high'], default: 'medium' },
        },
      },
      TaskUpdate: {
        type: 'object',
        minProperties: 1,
        additionalProperties: false,
        description: 'PATCH partiel et non vide ; id, ownerId et completedAt sont refusés',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 120 },
          status: { type: 'string', enum: ['todo', 'doing', 'done'] },
          description: { type: 'string', maxLength: 1000 },
          dueDate: { type: 'string', format: 'date', nullable: true },
          priority: { type: 'string', enum: ['low', 'medium', 'high'] },
        },
      },
      TaskCount: {
        type: 'object',
        properties: {
          total: { type: 'integer' },
          byStatus: {
            type: 'object',
            properties: { todo: { type: 'integer' }, doing: { type: 'integer' }, done: { type: 'integer' } },
          },
          byPriority: {
            type: 'object',
            properties: { low: { type: 'integer' }, medium: { type: 'integer' }, high: { type: 'integer' } },
          },
        },
      },
      Habit: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          frequency: { type: 'string', enum: ['daily', 'weekly'] },
          active: { type: 'boolean' },
          ownerId: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      HabitCreate: {
        type: 'object',
        required: ['title', 'frequency'],
        additionalProperties: false,
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 120 },
          frequency: { type: 'string', enum: ['daily', 'weekly'] },
          active: { type: 'boolean', default: true },
        },
      },
      HabitUpdate: {
        type: 'object',
        minProperties: 1,
        additionalProperties: false,
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 120 },
          frequency: { type: 'string', enum: ['daily', 'weekly'] },
          active: { type: 'boolean' },
        },
      },
      HabitLog: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          habitId: { type: 'string' },
          date: { type: 'string', format: 'date' },
        },
      },
      Heatmap: {
        type: 'object',
        properties: {
          from: { type: 'string', format: 'date' },
          to: { type: 'string', format: 'date' },
          timezone: { type: 'string' },
          total: { type: 'integer' },
          max: { type: 'integer', description: 'Plus grande valeur journalière (pour la légende)' },
          days: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                date: { type: 'string', format: 'date' },
                tasks: { type: 'integer', description: 'Tâches terminées ce jour' },
                habits: { type: 'integer', description: "Réalisations d'habitudes ce jour" },
                count: { type: 'integer' },
              },
            },
          },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/api/health': {
      get: {
        tags: ['Santé'],
        summary: 'Vérifier que l’API répond',
        security: [],
        responses: {
          200: { description: 'API disponible', ...json({ type: 'object' }, { status: 'ok' }) },
        },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Authentification'],
        summary: 'Créer un compte',
        security: [],
        requestBody: {
          required: true,
          ...json({ $ref: '#/components/schemas/Credentials' }, {
            email: 'alice@example.test',
            password: 'MotDePasse123!',
          }),
        },
        responses: {
          201: { description: 'Compte créé, JWT renvoyé', ...json({ $ref: '#/components/schemas/AuthResponse' }, authExample) },
          400: { $ref: '#/components/responses/BadRequest' },
          409: { $ref: '#/components/responses/Conflict' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Authentification'],
        summary: 'Se connecter',
        security: [],
        requestBody: {
          required: true,
          ...json({ $ref: '#/components/schemas/Credentials' }, {
            email: 'alice@example.test',
            password: 'MotDePasse123!',
          }),
        },
        responses: {
          200: { description: 'Connexion réussie', ...json({ $ref: '#/components/schemas/AuthResponse' }, authExample) },
          400: { $ref: '#/components/responses/BadRequest' },
          401: errorResponse('Mauvais email ou mot de passe (sans préciser lequel)', {
            unauthorized: errorExample('UNAUTHORIZED', 'Email ou mot de passe incorrect'),
          }),
        },
      },
    },
    '/api/tasks': {
      get: {
        tags: ['Tâches'],
        summary: 'Lister mes tâches (filtres facultatifs, bonus B1)',
        parameters: [
          { name: 'status', in: 'query', description: 'Liste séparée par des virgules', schema: { type: 'string' }, example: 'todo,doing' },
          { name: 'priority', in: 'query', description: 'low, medium, high (séparés par des virgules)', schema: { type: 'string' }, example: 'high' },
          { name: 'dueFrom', in: 'query', description: 'Échéance minimale incluse', schema: { type: 'string', format: 'date' } },
          { name: 'dueTo', in: 'query', description: 'Échéance maximale incluse', schema: { type: 'string', format: 'date' } },
          { name: 'hasDueDate', in: 'query', schema: { type: 'string', enum: ['true', 'false'] } },
          { name: 'q', in: 'query', description: 'Recherche dans le titre', schema: { type: 'string' } },
          { name: 'sort', in: 'query', schema: { type: 'string', enum: ['createdAt', 'dueDate', 'priority'], default: 'createdAt' } },
        ],
        responses: {
          200: {
            description: 'Liste (vide : {"items":[]})',
            ...json(
              { type: 'object', properties: { items: { type: 'array', items: { $ref: '#/components/schemas/Task' } } } },
              { items: [taskExample] },
            ),
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        tags: ['Tâches'],
        summary: 'Créer une tâche',
        requestBody: {
          required: true,
          ...json({ $ref: '#/components/schemas/TaskCreate' }, {
            title: 'Préparer la démo',
            status: 'todo',
            description: 'Plan et données',
            dueDate: '2026-10-05',
          }),
        },
        responses: {
          201: { description: 'Tâche créée', ...json({ $ref: '#/components/schemas/Task' }, taskExample) },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/tasks/count': {
      get: {
        tags: ['Tâches'],
        summary: 'Compteur de tâches (bonus B1)',
        description: 'Accepte les mêmes filtres que GET /api/tasks.',
        responses: {
          200: {
            description: 'Compteurs',
            ...json({ $ref: '#/components/schemas/TaskCount' }, {
              total: 5,
              byStatus: { todo: 2, doing: 1, done: 2 },
              byPriority: { low: 1, medium: 3, high: 1 },
            }),
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/tasks/{id}': {
      parameters: [idParam('Identifiant de la tâche')],
      get: {
        tags: ['Tâches'],
        summary: 'Consulter une tâche',
        responses: {
          200: { description: 'Tâche', ...json({ $ref: '#/components/schemas/Task' }, taskExample) },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      patch: {
        tags: ['Tâches'],
        summary: 'Modifier partiellement une tâche',
        requestBody: { required: true, ...json({ $ref: '#/components/schemas/TaskUpdate' }, { status: 'done' }) },
        responses: {
          200: {
            description: 'Tâche modifiée',
            ...json({ $ref: '#/components/schemas/Task' }, { ...taskExample, status: 'done', completedAt: '2026-10-07T10:00:00.000Z' }),
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Tâches'],
        summary: 'Supprimer une tâche',
        responses: {
          204: { description: 'Supprimée, aucun corps' },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/habits': {
      get: {
        tags: ['Habitudes'],
        summary: 'Lister mes habitudes',
        responses: {
          200: {
            description: 'Liste',
            ...json(
              { type: 'object', properties: { items: { type: 'array', items: { $ref: '#/components/schemas/Habit' } } } },
              { items: [habitExample] },
            ),
          },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        tags: ['Habitudes'],
        summary: 'Créer une habitude',
        requestBody: {
          required: true,
          ...json({ $ref: '#/components/schemas/HabitCreate' }, { title: 'Marcher', frequency: 'daily', active: true }),
        },
        responses: {
          201: { description: 'Habitude créée', ...json({ $ref: '#/components/schemas/Habit' }, habitExample) },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/habits/{id}': {
      parameters: [idParam("Identifiant de l'habitude")],
      get: {
        tags: ['Habitudes'],
        summary: 'Consulter une habitude',
        responses: {
          200: { description: 'Habitude', ...json({ $ref: '#/components/schemas/Habit' }, habitExample) },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      patch: {
        tags: ['Habitudes'],
        summary: 'Modifier une habitude (ex. la désactiver)',
        requestBody: { required: true, ...json({ $ref: '#/components/schemas/HabitUpdate' }, { active: false }) },
        responses: {
          200: { description: 'Habitude modifiée', ...json({ $ref: '#/components/schemas/Habit' }, { ...habitExample, active: false }) },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Habitudes'],
        summary: 'Supprimer une habitude et son historique',
        responses: {
          204: { description: 'Supprimée, aucun corps' },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/habits/{id}/logs': {
      parameters: [idParam("Identifiant de l'habitude")],
      get: {
        tags: ['Habitudes'],
        summary: "Historique des réalisations d'une habitude",
        parameters: [
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: {
          200: {
            description: 'Réalisations triées par date',
            ...json(
              { type: 'object', properties: { items: { type: 'array', items: { $ref: '#/components/schemas/HabitLog' } } } },
              { items: [{ id: '66a1f1f77bcf86cd79943911', habitId: habitExample.id, date: '2026-10-07' }] },
            ),
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/habits/{id}/logs/{date}': {
      parameters: [idParam("Identifiant de l'habitude"), dateParam],
      put: {
        tags: ['Habitudes'],
        summary: 'Marquer l’habitude comme réalisée ce jour (idempotent)',
        description: 'Une seule réalisation par habitude et par jour. Refusé (400) si l’habitude est désactivée.',
        responses: {
          201: {
            description: 'Réalisation créée',
            ...json({ $ref: '#/components/schemas/HabitLog' }, { id: '66a1f1f77bcf86cd79943911', habitId: habitExample.id, date: '2026-10-07' }),
          },
          200: { description: 'Déjà réalisée ce jour : rien de créé', ...json({ $ref: '#/components/schemas/HabitLog' }) },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Habitudes'],
        summary: 'Annuler la réalisation de ce jour',
        responses: {
          204: { description: 'Annulée, aucun corps' },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/habit-logs': {
      get: {
        tags: ['Habitudes'],
        summary: 'Toutes mes réalisations sur une période',
        parameters: [
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date' }, example: '2026-10-01' },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date' }, example: '2026-10-07' },
        ],
        responses: {
          200: {
            description: 'Réalisations',
            ...json({ type: 'object', properties: { items: { type: 'array', items: { $ref: '#/components/schemas/HabitLog' } } } }),
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/stats/heatmap': {
      get: {
        tags: ['Statistiques'],
        summary: 'Activité par jour pour la heatmap (bonus B3)',
        description:
          'Compte par jour les tâches terminées (selon completedAt, converti dans le fuseau tz) et les réalisations ' +
          "d'habitudes. Tous les jours de la période sont présents, y compris à zéro. Période max : 400 jours.",
        parameters: [
          { name: 'from', in: 'query', description: 'Par défaut : to - 370 jours', schema: { type: 'string', format: 'date' } },
          { name: 'to', in: 'query', description: "Par défaut : aujourd'hui dans le fuseau tz", schema: { type: 'string', format: 'date' } },
          { name: 'tz', in: 'query', description: 'Fuseau IANA, UTC par défaut', schema: { type: 'string' }, example: 'Europe/Paris' },
        ],
        responses: {
          200: {
            description: 'Agrégation journalière',
            ...json({ $ref: '#/components/schemas/Heatmap' }, {
              from: '2026-10-05',
              to: '2026-10-07',
              timezone: 'Europe/Paris',
              total: 3,
              max: 2,
              days: [
                { date: '2026-10-05', tasks: 0, habits: 0, count: 0 },
                { date: '2026-10-06', tasks: 1, habits: 0, count: 1 },
                { date: '2026-10-07', tasks: 1, habits: 1, count: 2 },
              ],
            }),
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/users/me': {
      get: {
        tags: ['Compte'],
        summary: 'Mon profil',
        responses: {
          200: { description: 'Profil (jamais le hash)', ...json({ $ref: '#/components/schemas/User' }) },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
      patch: {
        tags: ['Compte'],
        summary: 'Modifier mon email',
        requestBody: { required: true, ...json({ type: 'object', required: ['email'], properties: { email: { type: 'string' } } }, { email: 'alice2@example.test' }) },
        responses: {
          200: { description: 'Profil modifié', ...json({ $ref: '#/components/schemas/User' }) },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          409: { $ref: '#/components/responses/Conflict' },
        },
      },
      delete: {
        tags: ['Compte'],
        summary: 'Supprimer mon compte et toutes mes données',
        responses: {
          204: { description: 'Compte supprimé' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
  },
};
