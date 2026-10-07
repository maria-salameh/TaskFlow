import jwt from 'jsonwebtoken';
import { app, createAccount, request, useTestDb, VALID_ABSENT_ID } from './helpers.js';

useTestDb();

const credentials = { email: 'alice@example.test', password: 'MotDePasse123!' };

describe('POST /api/auth/register', () => {
  test('201 avec { user: { id, email }, token } et sans mot de passe ni hash', async () => {
    const response = await request(app).post('/api/auth/register').send(credentials);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      user: { id: expect.any(String), email: 'alice@example.test' },
      token: expect.any(String),
    });
    const text = JSON.stringify(response.body);
    expect(text).not.toMatch(/password|hash/i);

    // Le jeton est un vrai JWT signé contenant l'id de l'utilisateur
    const payload = jwt.verify(response.body.token, process.env.JWT_SECRET);
    expect(payload.userId).toBe(response.body.user.id);
  });

  test("l'email est normalisé : stocké en minuscules et sans espaces", async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: '  Alice@Example.TEST ', password: credentials.password });
    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe('alice@example.test');
  });

  test('409 EMAIL_ALREADY_USED si email déjà utilisé, même avec une autre casse', async () => {
    await createAccount();
    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: 'ALICE@example.test', password: 'AutreMotDePasse1' });
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('EMAIL_ALREADY_USED');
  });

  test.each([
    ['email invalide', { email: 'pas-un-email', password: 'MotDePasse123!' }],
    ['mot de passe trop court', { email: 'bob@example.test', password: 'court' }],
    ['email manquant', { password: 'MotDePasse123!' }],
    ['mot de passe non textuel', { email: 'bob@example.test', password: 12345678 }],
    ['corps tableau', []],
  ])('400 INVALID_INPUT : %s', async (_label, body) => {
    const response = await request(app).post('/api/auth/register').send(body);
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_INPUT');
    expect(response.body.error.message).toEqual(expect.any(String));
  });

  test('400 si le JSON est mal formé', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send('{"email":');
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_INPUT');
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(() => createAccount());

  test('200 avec le même schéma que register', async () => {
    const response = await request(app).post('/api/auth/login').send(credentials);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      user: { id: expect.any(String), email: credentials.email },
      token: expect.any(String),
    });
  });

  test('la connexion est insensible à la casse de l’email', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ALICE@EXAMPLE.TEST', password: credentials.password });
    expect(response.status).toBe(200);
  });

  test('401 avec le même message pour un mauvais mot de passe ou un email inconnu', async () => {
    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: 'MauvaisMotDePasse' });
    const unknownEmail = await request(app)
      .post('/api/auth/login')
      .send({ email: 'inconnu@example.test', password: credentials.password });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.error.code).toBe('UNAUTHORIZED');
    // Ne révèle pas lequel des deux est faux
    expect(wrongPassword.body.error.message).toBe(unknownEmail.body.error.message);
  });

  test('400 si le corps est invalide', async () => {
    const response = await request(app).post('/api/auth/login').send({ email: credentials.email });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_INPUT');
  });
});

describe('Middleware JWT', () => {
  test.each([
    ['absent', undefined],
    ['sans le préfixe Bearer', 'abc'],
    ['malformé', 'Bearer pas.un.jwt'],
    ['signé avec une autre clé', `Bearer ${jwt.sign({ userId: VALID_ABSENT_ID }, 'autre-cle')}`],
    [
      'expiré',
      `Bearer ${jwt.sign({ userId: VALID_ABSENT_ID }, 'jwt-secret-de-test-uniquement', { expiresIn: -10 })}`,
    ],
    ['sans userId valide', `Bearer ${jwt.sign({ userId: 'x' }, 'jwt-secret-de-test-uniquement')}`],
  ])('401 UNAUTHORIZED si le jeton est %s', async (_label, header) => {
    const req = request(app).get('/api/tasks');
    if (header) req.set('Authorization', header);
    const response = await req;
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });
});

describe('/api/users/me', () => {
  test('renvoie le profil sans hash', async () => {
    const alice = await createAccount();
    const response = await request(app).get('/api/users/me').set('Authorization', alice.auth);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: alice.user.id,
      email: 'alice@example.test',
      createdAt: expect.any(String),
    });
  });

  test('PATCH refuse un champ autre que email (ex. passwordHash)', async () => {
    const alice = await createAccount();
    const response = await request(app)
      .patch('/api/users/me')
      .set('Authorization', alice.auth)
      .send({ passwordHash: 'pirate' });
    expect(response.status).toBe(400);
  });

  test("PATCH vers l'email d'un autre compte donne 409", async () => {
    const alice = await createAccount();
    await createAccount('bob@example.test');
    const response = await request(app)
      .patch('/api/users/me')
      .set('Authorization', alice.auth)
      .send({ email: 'BOB@example.test' });
    expect(response.status).toBe(409);
  });

  test('DELETE supprime le compte et ses tâches ; le jeton ne donne plus accès', async () => {
    const alice = await createAccount();
    await request(app)
      .post('/api/tasks')
      .set('Authorization', alice.auth)
      .send({ title: 'T', status: 'todo' });

    const deleted = await request(app).delete('/api/users/me').set('Authorization', alice.auth);
    expect(deleted.status).toBe(204);

    const me = await request(app).get('/api/users/me').set('Authorization', alice.auth);
    expect(me.status).toBe(401);
    const login = await request(app).post('/api/auth/login').send(credentials);
    expect(login.status).toBe(401);
  });
});
