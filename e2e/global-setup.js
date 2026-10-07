import mongoose from 'mongoose';

// Repart d'une base e2e vide à chaque lancement (garde-fou sur le nom de la base)
export default async function globalSetup() {
  const uri = process.env.MONGODB_URI_E2E ?? 'mongodb://127.0.0.1:27017/taskflow_e2e';
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  const dbName = mongoose.connection.db.databaseName;
  if (!dbName.endsWith('_e2e')) {
    await mongoose.disconnect();
    throw new Error(`Base "${dbName}" refusée : le nom de la base e2e doit finir par _e2e`);
  }
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
  await mongoose.disconnect();
}
