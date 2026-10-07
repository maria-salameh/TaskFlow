// Bonus B1 : priorité, filtres et compteur.
// Critères d'acceptation :
//  - priority facultative (low|medium|high), medium par défaut, toute autre valeur => 400
//  - GET /api/tasks accepte status, priority, dueFrom, dueTo, hasDueDate, q, sort ;
//    sans paramètre la réponse est identique au contrat de base
//  - GET /api/tasks/count renvoie total, byStatus, byPriority avec les mêmes filtres
//  - un paramètre invalide => 400 ; les filtres ne sortent jamais du compte connecté
import { app, createAccount, request, useTestDb } from './helpers.js';

useTestDb();

async function seed(auth) {
  const tasks = [
    { title: 'Rapport urgent', status: 'todo', priority: 'high', dueDate: '2026-10-01' },
    { title: 'Relire le rapport', status: 'doing', priority: 'medium', dueDate: '2026-10-10' },
    { title: 'Ranger le bureau', status: 'done', priority: 'low', dueDate: null },
    { title: 'Swagger', status: 'todo', dueDate: '2026-10-20' }, // priorité par défaut
  ];
  for (const task of tasks) {
    await request(app).post('/api/tasks').set('Authorization', auth).send(task);
  }
}

const titles = (response) => response.body.items.map((t) => t.title).sort();

describe('Priorité', () => {
  test('medium par défaut', async () => {
    const alice = await createAccount();
    const response = await request(app)
      .post('/api/tasks')
      .set('Authorization', alice.auth)
      .send({ title: 'T', status: 'todo' });
    expect(response.body.priority).toBe('medium');
  });

  test('valeur hors énumération refusée en POST et PATCH', async () => {
    const alice = await createAccount();
    const post = await request(app)
      .post('/api/tasks')
      .set('Authorization', alice.auth)
      .send({ title: 'T', status: 'todo', priority: 'urgent' });
    expect(post.status).toBe(400);

    const { body: task } = await request(app)
      .post('/api/tasks')
      .set('Authorization', alice.auth)
      .send({ title: 'T', status: 'todo' });
    const patch = await request(app)
      .patch(`/api/tasks/${task.id}`)
      .set('Authorization', alice.auth)
      .send({ priority: 'URGENT' });
    expect(patch.status).toBe(400);
  });
});

describe('Filtres de GET /api/tasks', () => {
  let alice;
  beforeEach(async () => {
    alice = await createAccount();
    await seed(alice.auth);
  });

  const get = (query) => request(app).get('/api/tasks').query(query).set('Authorization', alice.auth);

  test('sans filtre : toutes les tâches', async () => {
    expect((await get({})).body.items).toHaveLength(4);
  });

  test('par statut (plusieurs valeurs)', async () => {
    expect(titles(await get({ status: 'todo,doing' }))).toEqual([
      'Rapport urgent',
      'Relire le rapport',
      'Swagger',
    ]);
  });

  test('par priorité', async () => {
    expect(titles(await get({ priority: 'medium' }))).toEqual(['Relire le rapport', 'Swagger']);
  });

  test("par période d'échéance (bornes incluses)", async () => {
    expect(titles(await get({ dueFrom: '2026-10-01', dueTo: '2026-10-10' }))).toEqual([
      'Rapport urgent',
      'Relire le rapport',
    ]);
  });

  test('en retard = échéance passée et pas terminée', async () => {
    expect(titles(await get({ dueTo: '2026-10-07', status: 'todo,doing' }))).toEqual(['Rapport urgent']);
  });

  test('sans échéance', async () => {
    expect(titles(await get({ hasDueDate: 'false' }))).toEqual(['Ranger le bureau']);
  });

  test('recherche dans le titre, insensible à la casse', async () => {
    expect(titles(await get({ q: 'RAPPORT' }))).toEqual(['Rapport urgent', 'Relire le rapport']);
  });

  test('la recherche traite les caractères spéciaux comme du texte', async () => {
    expect((await get({ q: '.*' })).body.items).toHaveLength(0);
  });

  test('tri par échéance : la plus proche d’abord, sans échéance à la fin', async () => {
    const response = await get({ sort: 'dueDate' });
    expect(response.body.items.map((t) => t.dueDate)).toEqual([
      '2026-10-01',
      '2026-10-10',
      '2026-10-20',
      null,
    ]);
  });

  test('tri par priorité : high, medium, low', async () => {
    const response = await get({ sort: 'priority' });
    expect(response.body.items.map((t) => t.priority)).toEqual(['high', 'medium', 'medium', 'low']);
  });

  test.each([
    [{ status: 'archived' }],
    [{ priority: 'urgent' }],
    [{ dueFrom: '2026-02-30' }],
    [{ dueFrom: '2026-10-10', dueTo: '2026-10-01' }],
    [{ hasDueDate: 'oui' }],
    [{ sort: 'title' }],
    [{ ownerId: 'x' }],
  ])('paramètre invalide %o => 400', async (query) => {
    const response = await get(query);
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_INPUT');
  });

  test("les filtres ne renvoient jamais les tâches d'un autre compte", async () => {
    const bob = await createAccount('bob@example.test');
    const response = await request(app)
      .get('/api/tasks')
      .query({ q: 'rapport' })
      .set('Authorization', bob.auth);
    expect(response.body).toEqual({ items: [] });
  });
});

describe('GET /api/tasks/count', () => {
  test('compteurs globaux et filtrés', async () => {
    const alice = await createAccount();
    await seed(alice.auth);

    const all = await request(app).get('/api/tasks/count').set('Authorization', alice.auth);
    expect(all.status).toBe(200);
    expect(all.body).toEqual({
      total: 4,
      byStatus: { todo: 2, doing: 1, done: 1 },
      byPriority: { low: 1, medium: 2, high: 1 },
    });

    const filtered = await request(app)
      .get('/api/tasks/count')
      .query({ status: 'todo' })
      .set('Authorization', alice.auth);
    expect(filtered.body.total).toBe(2);
  });

  test('compte vide et isolation', async () => {
    const alice = await createAccount();
    await seed(alice.auth);
    const bob = await createAccount('bob@example.test');
    const response = await request(app).get('/api/tasks/count').set('Authorization', bob.auth);
    expect(response.body.total).toBe(0);
  });

  test('401 sans jeton', async () => {
    expect((await request(app).get('/api/tasks/count')).status).toBe(401);
  });
});
