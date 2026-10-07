import mongoose from 'mongoose';

export async function connectDb(uri) {
  // Échoue en 5 s au lieu de 30 s si MongoDB n'est pas démarré
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
}

export async function disconnectDb() {
  await mongoose.disconnect();
}
