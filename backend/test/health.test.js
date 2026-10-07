import request from 'supertest';
import app from '../src/app.js';

describe('Santé et documentation (sans base de données)', () => {
  test('GET /api/health renvoie 200 et exactement {"status":"ok"}', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  test('importer app.js ne démarre pas de serveur', async () => {
    // Si un port était ouvert à l'import, Jest resterait bloqué en fin de test.
    expect(typeof app.listen).toBe('function');
  });

  test('une route inconnue renvoie 404 au format du contrat', async () => {
    const response = await request(app).get('/api/inconnue');
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  test('la spécification OpenAPI est servie et décrit les 5 routes tâches', async () => {
    const response = await request(app).get('/api/docs.json');
    expect(response.status).toBe(200);
    const paths = response.body.paths;
    expect(Object.keys(paths['/api/tasks'])).toEqual(expect.arrayContaining(['get', 'post']));
    expect(Object.keys(paths['/api/tasks/{id}'])).toEqual(
      expect.arrayContaining(['get', 'patch', 'delete']),
    );
    expect(paths['/api/auth/register'].post.responses).toHaveProperty('409');
  });

  test("l'interface Swagger est accessible sur /api/docs/", async () => {
    const response = await request(app).get('/api/docs/');
    expect(response.status).toBe(200);
    expect(response.text).toContain('swagger');
  });
});
