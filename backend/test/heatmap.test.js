// Bonus B3 : heatmap type GitHub.
// Critères d'acceptation :
//  - un élément par jour de [from, to], y compris les jours à zéro
//  - tasks = tâches passées à done ce jour-là DANS LE FUSEAU de l'utilisateur
//  - habits = réalisations d'habitudes ce jour-là
//  - tz invalide, dates impossibles, période inversée ou > 400 jours => 400
//  - uniquement les données du compte connecté
import { Task } from '../src/models/Task.js';
import { daysBetween, parseHeatmapQuery, toCivilDate } from '../src/services/statsService.js';
import { app, createAccount, request, useTestDb } from './helpers.js';

useTestDb();

describe('Fonctions de calcul (tests unitaires)', () => {
  test("toCivilDate convertit un instant en date locale selon le fuseau", () => {
    const instant = new Date('2026-10-06T23:30:00Z');
    expect(toCivilDate(instant, 'UTC')).toBe('2026-10-06');
    expect(toCivilDate(instant, 'Europe/Paris')).toBe('2026-10-07'); // UTC+2 en octobre
    expect(toCivilDate(instant, 'America/New_York')).toBe('2026-10-06');
    expect(toCivilDate(new Date('2026-10-07T10:30:00Z'), 'Pacific/Kiritimati')).toBe('2026-10-08'); // UTC+14
  });

  test('daysBetween inclut les bornes et traverse les changements d’heure et de mois', () => {
    expect(daysBetween('2026-10-24', '2026-11-02')).toHaveLength(10); // passage à l'heure d'hiver le 25/10
    expect(daysBetween('2028-02-28', '2028-03-01')).toEqual(['2028-02-28', '2028-02-29', '2028-03-01']);
    expect(daysBetween('2026-10-07', '2026-10-07')).toEqual(['2026-10-07']);
  });

  test("valeurs par défaut : aujourd'hui dans le fuseau et 371 jours", () => {
    const now = new Date('2026-10-06T23:30:00Z');
    const { from, to, tz } = parseHeatmapQuery({ tz: 'Europe/Paris' }, now);
    expect(tz).toBe('Europe/Paris');
    expect(to).toBe('2026-10-07');
    expect(daysBetween(from, to)).toHaveLength(371);
  });
});

describe('GET /api/stats/heatmap', () => {
  async function doneTaskAt(auth, completedAt) {
    const { body } = await request(app)
      .post('/api/tasks')
      .set('Authorization', auth)
      .send({ title: `Tâche ${completedAt}`, status: 'done' });
    // On fixe l'instant de complétion pour rendre le test déterministe
    await Task.updateOne({ _id: body.id }, { completedAt: new Date(completedAt) });
    return body;
  }

  test('période sans données : tous les jours présents à zéro', async () => {
    const alice = await createAccount();
    const response = await request(app)
      .get('/api/stats/heatmap')
      .query({ from: '2026-10-01', to: '2026-10-07', tz: 'Europe/Paris' })
      .set('Authorization', alice.auth);
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ from: '2026-10-01', to: '2026-10-07', timezone: 'Europe/Paris', total: 0, max: 0 });
    expect(response.body.days).toHaveLength(7);
    expect(response.body.days.every((d) => d.count === 0)).toBe(true);
  });

  test('agrège tâches terminées et habitudes par jour', async () => {
    const alice = await createAccount();
    await doneTaskAt(alice.auth, '2026-10-05T09:00:00Z');
    await doneTaskAt(alice.auth, '2026-10-05T15:00:00Z');
    const { body: habit } = await request(app)
      .post('/api/habits')
      .set('Authorization', alice.auth)
      .send({ title: 'Marcher', frequency: 'daily' });
    await request(app).put(`/api/habits/${habit.id}/logs/2026-10-05`).set('Authorization', alice.auth);
    await request(app).put(`/api/habits/${habit.id}/logs/2026-10-06`).set('Authorization', alice.auth);

    const response = await request(app)
      .get('/api/stats/heatmap')
      .query({ from: '2026-10-04', to: '2026-10-06', tz: 'UTC' })
      .set('Authorization', alice.auth);
    expect(response.body.days).toEqual([
      { date: '2026-10-04', tasks: 0, habits: 0, count: 0 },
      { date: '2026-10-05', tasks: 2, habits: 1, count: 3 },
      { date: '2026-10-06', tasks: 0, habits: 1, count: 1 },
    ]);
    expect(response.body.total).toBe(4);
    expect(response.body.max).toBe(3);
  });

  test('le fuseau horaire décide du jour (23h30 UTC = lendemain à Paris)', async () => {
    const alice = await createAccount();
    await doneTaskAt(alice.auth, '2026-10-06T23:30:00Z');
    const query = { from: '2026-10-06', to: '2026-10-07' };

    const utc = await request(app).get('/api/stats/heatmap').query({ ...query, tz: 'UTC' }).set('Authorization', alice.auth);
    const paris = await request(app)
      .get('/api/stats/heatmap')
      .query({ ...query, tz: 'Europe/Paris' })
      .set('Authorization', alice.auth);

    expect(utc.body.days.map((d) => d.tasks)).toEqual([1, 0]);
    expect(paris.body.days.map((d) => d.tasks)).toEqual([0, 1]);
  });

  test('une tâche rouverte ne compte plus', async () => {
    const alice = await createAccount();
    const task = await doneTaskAt(alice.auth, '2026-10-05T09:00:00Z');
    await request(app).patch(`/api/tasks/${task.id}`).set('Authorization', alice.auth).send({ status: 'todo' });
    const response = await request(app)
      .get('/api/stats/heatmap')
      .query({ from: '2026-10-05', to: '2026-10-05' })
      .set('Authorization', alice.auth);
    expect(response.body.total).toBe(0);
  });

  test("n'inclut pas l'activité d'un autre compte", async () => {
    const alice = await createAccount('alice@example.test');
    const bob = await createAccount('bob@example.test');
    await doneTaskAt(alice.auth, '2026-10-05T09:00:00Z');
    const response = await request(app)
      .get('/api/stats/heatmap')
      .query({ from: '2026-10-05', to: '2026-10-05' })
      .set('Authorization', bob.auth);
    expect(response.body.total).toBe(0);
  });

  test.each([
    [{ tz: 'Mars/Olympus' }],
    [{ from: '2026-02-30', to: '2026-03-02' }],
    [{ from: '2026-10-07', to: '2026-10-01' }],
    [{ from: '2024-01-01', to: '2026-01-01' }],
    [{ foo: 'bar' }],
  ])('400 pour %o', async (query) => {
    const alice = await createAccount();
    const response = await request(app).get('/api/stats/heatmap').query(query).set('Authorization', alice.auth);
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_INPUT');
  });

  test('401 sans jeton', async () => {
    expect((await request(app).get('/api/stats/heatmap')).status).toBe(401);
  });
});
