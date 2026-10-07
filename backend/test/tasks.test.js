import { app, createAccount, request, useTestDb, VALID_ABSENT_ID } from './helpers.js';

useTestDb();

const demoTask = {
  title: 'Préparer la démo',
  status: 'todo',
  description: 'Plan et données',
  dueDate: '2026-10-05',
};

describe('CRUD /api/tasks — parcours nominal', () => {
  test('liste vide : 200 et exactement {"items":[]}', async () => {
    const alice = await createAccount();
    const response = await request(app).get('/api/tasks').set('Authorization', alice.auth);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ items: [] });
  });

  test('créer, lister, consulter, modifier, supprimer', async () => {
    const alice = await createAccount();

    // POST -> 201, id chaîne, pas de _id
    const created = await request(app).post('/api/tasks').set('Authorization', alice.auth).send(demoTask);
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ ...demoTask, id: expect.any(String) });
    expect(created.body).not.toHaveProperty('_id');
    expect(created.body.ownerId).toBe(alice.user.id);
    const { id } = created.body;

    // GET collection -> 200 { items }
    const list = await request(app).get('/api/tasks').set('Authorization', alice.auth);
    expect(list.status).toBe(200);
    expect(list.body.items).toHaveLength(1);
    expect(list.body.items[0]).toMatchObject({ id, title: demoTask.title });

    // GET objet -> 200
    const detail = await request(app).get(`/api/tasks/${id}`).set('Authorization', alice.auth);
    expect(detail.status).toBe(200);
    expect(detail.body).toMatchObject(demoTask);

    // PATCH partiel -> 200, seuls les champs envoyés changent
    const patched = await request(app)
      .patch(`/api/tasks/${id}`)
      .set('Authorization', alice.auth)
      .send({ status: 'done' });
    expect(patched.status).toBe(200);
    expect(patched.body).toMatchObject({ ...demoTask, id, status: 'done' });

    // DELETE -> 204 sans corps, puis GET -> 404
    const deleted = await request(app).delete(`/api/tasks/${id}`).set('Authorization', alice.auth);
    expect(deleted.status).toBe(204);
    expect(deleted.text).toBe('');
    const afterDelete = await request(app).get(`/api/tasks/${id}`).set('Authorization', alice.auth);
    expect(afterDelete.status).toBe(404);
    expect(afterDelete.body.error.code).toBe('NOT_FOUND');
  });

  test('champs facultatifs : description vide acceptée, dueDate null, titre trimé', async () => {
    const alice = await createAccount();
    const response = await request(app)
      .post('/api/tasks')
      .set('Authorization', alice.auth)
      .send({ title: '  Sans échéance  ', status: 'doing', description: '', dueDate: null });
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ title: 'Sans échéance', description: '', dueDate: null });
  });

  test('PATCH dueDate à null retire l’échéance', async () => {
    const alice = await createAccount();
    const { body } = await request(app).post('/api/tasks').set('Authorization', alice.auth).send(demoTask);
    const response = await request(app)
      .patch(`/api/tasks/${body.id}`)
      .set('Authorization', alice.auth)
      .send({ dueDate: null });
    expect(response.status).toBe(200);
    expect(response.body.dueDate).toBeNull();
  });
});

describe('Validation : 400 INVALID_INPUT', () => {
  test.each([
    ['statut hors énumération', { title: 'Préparer', status: 'archived' }],
    ['titre vide après trim', { title: '   ', status: 'todo' }],
    ['titre de 121 caractères', { title: 'x'.repeat(121), status: 'todo' }],
    ['titre manquant', { status: 'todo' }],
    ['statut manquant', { title: 'Préparer' }],
    ['titre non textuel', { title: 42, status: 'todo' }],
    ['description de 1001 caractères', { title: 'T', status: 'todo', description: 'x'.repeat(1001) }],
    ['date impossible', { title: 'T', status: 'todo', dueDate: '2026-02-30' }],
    ['date au mauvais format', { title: 'T', status: 'todo', dueDate: '05/10/2026' }],
    ['ownerId envoyé par le client', { title: 'T', status: 'todo', ownerId: VALID_ABSENT_ID }],
    ['id envoyé par le client', { title: 'T', status: 'todo', id: VALID_ABSENT_ID }],
    ['champ inconnu', { title: 'T', status: 'todo', color: 'red' }],
  ])('POST refusé : %s', async (_label, body) => {
    const alice = await createAccount();
    const response = await request(app).post('/api/tasks').set('Authorization', alice.auth).send(body);
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_INPUT');
    expect(response.body.error.message.length).toBeGreaterThan(0);
  });

  test.each([
    ['PATCH vide', {}],
    ['PATCH avec ownerId', { ownerId: VALID_ABSENT_ID }],
    ['PATCH avec id', { id: VALID_ABSENT_ID }],
    ['PATCH avec completedAt', { completedAt: '2026-01-01T00:00:00Z' }],
    ['PATCH statut invalide', { status: 'archived' }],
    ['PATCH titre vide', { title: '' }],
  ])('PATCH refusé : %s', async (_label, body) => {
    const alice = await createAccount();
    const { body: task } = await request(app).post('/api/tasks').set('Authorization', alice.auth).send(demoTask);
    const response = await request(app)
      .patch(`/api/tasks/${task.id}`)
      .set('Authorization', alice.auth)
      .send(body);
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_INPUT');

    // La tâche n'a pas été modifiée
    const detail = await request(app).get(`/api/tasks/${task.id}`).set('Authorization', alice.auth);
    expect(detail.body).toMatchObject(demoTask);
  });

  test.each(['get', 'patch', 'delete'])('%s avec un id malformé donne 400', async (method) => {
    const alice = await createAccount();
    const response = await request(app)[method]('/api/tasks/123').set('Authorization', alice.auth).send({ status: 'done' });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_INPUT');
  });

  test.each(['get', 'patch', 'delete'])('%s avec un id valide mais absent donne 404', async (method) => {
    const alice = await createAccount();
    const url = `/api/tasks/${VALID_ABSENT_ID}`;
    const response = await request(app)[method](url).set('Authorization', alice.auth).send({ status: 'done' });
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});

describe('Sans JWT : 401 sur les 5 routes', () => {
  test.each([
    ['get', '/api/tasks'],
    ['post', '/api/tasks'],
    ['get', `/api/tasks/${VALID_ABSENT_ID}`],
    ['patch', `/api/tasks/${VALID_ABSENT_ID}`],
    ['delete', `/api/tasks/${VALID_ABSENT_ID}`],
  ])('%s %s', async (method, url) => {
    const response = await request(app)[method](url).send(demoTask);
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });
});

describe('Isolation entre les comptes A et B', () => {
  test("B ne voit pas, ne lit pas, ne modifie pas et ne supprime pas la tâche de A", async () => {
    const alice = await createAccount('alice@example.test');
    const bob = await createAccount('bob@example.test');
    const { body: taskA } = await request(app).post('/api/tasks').set('Authorization', alice.auth).send(demoTask);

    const listB = await request(app).get('/api/tasks').set('Authorization', bob.auth);
    expect(listB.body).toEqual({ items: [] });

    const getB = await request(app).get(`/api/tasks/${taskA.id}`).set('Authorization', bob.auth);
    const patchB = await request(app)
      .patch(`/api/tasks/${taskA.id}`)
      .set('Authorization', bob.auth)
      .send({ title: 'Piraté' });
    const deleteB = await request(app).delete(`/api/tasks/${taskA.id}`).set('Authorization', bob.auth);
    for (const response of [getB, patchB, deleteB]) {
      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    }

    // La tâche de A est intacte
    const getA = await request(app).get(`/api/tasks/${taskA.id}`).set('Authorization', alice.auth);
    expect(getA.status).toBe(200);
    expect(getA.body.title).toBe(demoTask.title);
  });

  test("ownerId vient du JWT : A ne peut pas créer une tâche au nom de B", async () => {
    const alice = await createAccount('alice@example.test');
    const bob = await createAccount('bob@example.test');
    const response = await request(app)
      .post('/api/tasks')
      .set('Authorization', alice.auth)
      .send({ ...demoTask, ownerId: bob.user.id });
    expect(response.status).toBe(400);
    const listB = await request(app).get('/api/tasks').set('Authorization', bob.auth);
    expect(listB.body.items).toHaveLength(0);
  });
});

describe('completedAt (utilisé par la heatmap)', () => {
  test('renseigné au passage à done, effacé au retour à todo', async () => {
    const alice = await createAccount();
    const { body: task } = await request(app).post('/api/tasks').set('Authorization', alice.auth).send(demoTask);
    expect(task.completedAt).toBeNull();

    const done = await request(app)
      .patch(`/api/tasks/${task.id}`)
      .set('Authorization', alice.auth)
      .send({ status: 'done' });
    expect(new Date(done.body.completedAt).getTime()).not.toBeNaN();

    // Modifier le titre d'une tâche déjà terminée ne change pas completedAt
    const renamed = await request(app)
      .patch(`/api/tasks/${task.id}`)
      .set('Authorization', alice.auth)
      .send({ title: 'Renommée' });
    expect(renamed.body.completedAt).toBe(done.body.completedAt);

    const reopened = await request(app)
      .patch(`/api/tasks/${task.id}`)
      .set('Authorization', alice.auth)
      .send({ status: 'todo' });
    expect(reopened.body.completedAt).toBeNull();
  });

  test('une tâche créée directement en done a un completedAt', async () => {
    const alice = await createAccount();
    const response = await request(app)
      .post('/api/tasks')
      .set('Authorization', alice.auth)
      .send({ title: 'Déjà faite', status: 'done' });
    expect(response.body.completedAt).not.toBeNull();
  });
});
