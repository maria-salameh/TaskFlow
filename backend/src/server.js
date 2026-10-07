import app from './app.js';
import { connectDb } from './config/db.js';
import { assertConfig, config } from './config/env.js';

// Point d'entrée : seul ce fichier ouvre un port. Les tests importent app.js
// directement, sans démarrer de serveur.
try {
  assertConfig();
  await connectDb(config.mongoUri);
} catch (error) {
  console.error(`Démarrage impossible : ${error.message}`);
  process.exit(1);
}

app.listen(config.port, () => {
  console.log(`API disponible sur http://localhost:${config.port}`);
  console.log(`Documentation Swagger : http://localhost:${config.port}/api/docs`);
});
