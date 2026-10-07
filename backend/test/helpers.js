import mongoose from 'mongoose';
import request from 'supertest';
import app from '../src/app.js';

export { app, request };

// Connexion à la base de test, avec un garde-fou : on refuse de vider
// une base dont le nom ne finit pas par _test (protège la base de développement).
export async function connectTestDb() {
  const uri = process.env.MONGODB_URI_TEST;
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  const dbName = mongoose.connection.db.databaseName;
  if (!dbName.endsWith('_test')) {
    await mongoose.disconnect();
    throw new Error(`Base "${dbName}" refusée : le nom de la base de test doit finir par _test`);
  }
  // Crée les index (unicité de l'email, d'une réalisation par jour...)
  await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
}

// Fixtures déterministes : chaque test part d'une base vide
export async function clearTestDb() {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
}

export async function disconnectTestDb() {
  await clearTestDb();
  await mongoose.disconnect();
}

// Crée un compte et renvoie { token, user, auth } où auth est l'en-tête prêt à l'emploi
export async function createAccount(email = 'alice@example.test', password = 'MotDePasse123!') {
  const response = await request(app).post('/api/auth/register').send({ email, password });
  if (response.status !== 201) {
    throw new Error(`Inscription impossible (${response.status}) : ${JSON.stringify(response.body)}`);
  }
  return { ...response.body, auth: `Bearer ${response.body.token}` };
}

export function useTestDb() {
  beforeAll(connectTestDb);
  beforeEach(clearTestDb);
  afterAll(disconnectTestDb);
}

export const VALID_ABSENT_ID = '507f1f77bcf86cd799439011';
