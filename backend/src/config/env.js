import 'dotenv/config';

// Toute la configuration vient des variables d'environnement (fichier backend/.env
// en local, voir backend/.env.example). Aucun secret n'est écrit dans le code.
export const config = {
  port: Number(process.env.PORT) || 3000,
  mongoUri: process.env.MONGODB_URI,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
};

// Appelé au démarrage du serveur : message clair plutôt qu'un plantage obscur
export function assertConfig() {
  const missing = [];
  if (!config.mongoUri) missing.push('MONGODB_URI');
  if (!config.jwtSecret) missing.push('JWT_SECRET');
  if (missing.length > 0) {
    throw new Error(
      `Variable(s) d'environnement manquante(s) : ${missing.join(', ')}. ` +
        'Copiez backend/.env.example en backend/.env et complétez-le.',
    );
  }
}
