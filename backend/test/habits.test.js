// Bonus B2 : habit tracker.
// Critères d'acceptation :
//  - Habit { title, frequency: daily|weekly, active } avec le même contrat que /api/tasks
//  - une réalisation = (habitude, date civile) ; unique par jour ; cocher deux fois ne duplique pas
//  - annulation possible ; date impossible ou future refusée ; habitude désactivée non cochable
//  - isolation entre comptes ; supprimer une habitude supprime son historique
import { HabitLog } from '../src/models/HabitLog.js';
import { app, createAccount, request, useTestDb, VALID_ABSENT_ID } from './helpers.js';

useTestDb();

const walk = { title: 'Marcher', frequency: 'daily', active: true };

async function createHabit(auth, body = walk) {
  const response = await request(app).post('/api/habits').set('Authorization', auth).send(body);
  return response.body;
}

describe('CRUD /api/habits', () => {
  test('parcours nominal', async () => {
    const alice = await createAccount();

    const empty = await request(app).get('/api/habits').set('Authorization', alice.auth);
    expect(empty.body).toEqual({ items: [] });

    const created = await request(app).post('/api/habits').set('Authorization', alice.auth).send(walk);
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ ...walk, id: expect.any(String) });

    const detail = await request(app).get(`/api/habits/${created.body.id}`).set('Authorization', alice.auth);
    expect(detail.status).toBe(200);

    // active: false est une valeur valide
    const patched = await request(app)
      .patch(`/api/habits/${created.body.id}`)
      .set('Authorization', alice.auth)
      .send({ active: false });
    expect(patched.status).toBe(200);
    expect(patched.body.active).toBe(false);

    const deleted = await request(app).delete(`/api/habits/${created.body.id}`).set('Authorization', alice.auth);
    expect(deleted.status).toBe(204);
    const gone = await request(app).get(`/api/habits/${created.body.id}`).set('Authorization', alice.auth);
    expect(gone.status).toBe(404);
  });

  test('active vaut true par défaut', async () => {
    const alice = await createAccount();
    const habit = await createHabit(alice.auth, { title: 'Lire', frequency: 'weekly' });
    expect(habit.active).toBe(true);
  });

  test.each([
    ['fréquence hourly', { title: 'Marcher', frequency: 'hourly', active: true }],
    ['active non booléen', { title: 'Marcher', frequency: 'daily', active: 'yes' }],
    ['titre vide', { title: ' ', frequency: 'daily' }],
    ['fréquence manquante', { title: 'Marcher' }],
    ['ownerId fourni', { ...walk, ownerId: VALID_ABSENT_ID }],
  ])('400 : %s', async (_label, body) => {
    const alice = await createAccount();
    const response = await request(app).post('/api/habits').set('Authorization', alice.auth).send(body);
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_INPUT');
  });

  test('PATCH vide => 400, id malformé => 400, absent => 404, sans jeton => 401', async () => {
    const alice = await createAccount();
    const habit = await createHabit(alice.auth);
    expect(
      (await request(app).patch(`/api/habits/${habit.id}`).set('Authorization', alice.auth).send({})).status,
    ).toBe(400);
    expect((await request(app).get('/api/habits/abc').set('Authorization', alice.auth)).status).toBe(400);
    expect(
      (await request(app).get(`/api/habits/${VALID_ABSENT_ID}`).set('Authorization', alice.auth)).status,
    ).toBe(404);
    expect((await request(app).get('/api/habits')).status).toBe(401);
  });
});

describe('Réalisations datées', () => {
  test('cocher (201), recocher le même jour (200, pas de doublon), annuler (204)', async () => {
    const alice = await createAccount();
    const habit = await createHabit(alice.auth);
    const url = `/api/habits/${habit.id}/logs/2026-10-06`;

    const first = await request(app).put(url).set('Authorization', alice.auth);
    expect(first.status).toBe(201);
    expect(first.body).toEqual({ id: expect.any(String), habitId: habit.id, date: '2026-10-06' });

    const second = await request(app).put(url).set('Authorization', alice.auth);
    expect(second.status).toBe(200);
    expect(second.body.id).toBe(first.body.id);
    expect(await HabitLog.countDocuments({ habitId: habit.id })).toBe(1);

    const removed = await request(app).delete(url).set('Authorization', alice.auth);
    expect(removed.status).toBe(204);
    const removedAgain = await request(app).delete(url).set('Authorization', alice.auth);
    expect(removedAgain.status).toBe(404);
  });

  test('historique filtré par période et trié par date', async () => {
    const alice = await createAccount();
    const habit = await createHabit(alice.auth);
    for (const date of ['2026-10-05', '2026-10-01', '2026-10-03']) {
      await request(app).put(`/api/habits/${habit.id}/logs/${date}`).set('Authorization', alice.auth);
    }
    const response = await request(app)
      .get(`/api/habits/${habit.id}/logs`)
      .query({ from: '2026-10-02', to: '2026-10-05' })
      .set('Authorization', alice.auth);
    expect(response.body.items.map((l) => l.date)).toEqual(['2026-10-03', '2026-10-05']);

    const all = await request(app)
      .get('/api/habit-logs')
      .query({ from: '2026-10-01', to: '2026-10-31' })
      .set('Authorization', alice.auth);
    expect(all.body.items).toHaveLength(3);
  });

  test.each([
    ['date impossible', '2026-02-30'],
    ['mauvais format', '06-10-2026'],
    ['date future', '2999-01-01'],
  ])('400 : %s', async (_label, date) => {
    const alice = await createAccount();
    const habit = await createHabit(alice.auth);
    const response = await request(app).put(`/api/habits/${habit.id}/logs/${date}`).set('Authorization', alice.auth);
    expect(response.status).toBe(400);
  });

  test('une habitude désactivée ne peut pas être cochée', async () => {
    const alice = await createAccount();
    const habit = await createHabit(alice.auth, { ...walk, active: false });
    const response = await request(app)
      .put(`/api/habits/${habit.id}/logs/2026-10-06`)
      .set('Authorization', alice.auth);
    expect(response.status).toBe(400);
  });

  test("supprimer l'habitude supprime son historique", async () => {
    const alice = await createAccount();
    const habit = await createHabit(alice.auth);
    await request(app).put(`/api/habits/${habit.id}/logs/2026-10-06`).set('Authorization', alice.auth);
    await request(app).delete(`/api/habits/${habit.id}`).set('Authorization', alice.auth);
    expect(await HabitLog.countDocuments({})).toBe(0);
  });
});

describe('Isolation A/B', () => {
  test("B n'accède ni aux habitudes ni aux réalisations de A", async () => {
    const alice = await createAccount('alice@example.test');
    const bob = await createAccount('bob@example.test');
    const habit = await createHabit(alice.auth);
    await request(app).put(`/api/habits/${habit.id}/logs/2026-10-06`).set('Authorization', alice.auth);

    expect((await request(app).get('/api/habits').set('Authorization', bob.auth)).body).toEqual({ items: [] });
    expect((await request(app).get('/api/habit-logs').set('Authorization', bob.auth)).body).toEqual({ items: [] });

    const attempts = await Promise.all([
      request(app).get(`/api/habits/${habit.id}`).set('Authorization', bob.auth),
      request(app).patch(`/api/habits/${habit.id}`).set('Authorization', bob.auth).send({ active: false }),
      request(app).delete(`/api/habits/${habit.id}`).set('Authorization', bob.auth),
      request(app).get(`/api/habits/${habit.id}/logs`).set('Authorization', bob.auth),
      request(app).put(`/api/habits/${habit.id}/logs/2026-10-07`).set('Authorization', bob.auth),
      request(app).delete(`/api/habits/${habit.id}/logs/2026-10-06`).set('Authorization', bob.auth),
    ]);
    for (const response of attempts) expect(response.status).toBe(404);

    // Rien n'a changé chez A
    const logsA = await request(app).get(`/api/habits/${habit.id}/logs`).set('Authorization', alice.auth);
    expect(logsA.body.items.map((l) => l.date)).toEqual(['2026-10-06']);
  });
});
