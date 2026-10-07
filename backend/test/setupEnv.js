// Exécuté avant chaque fichier de test, avant tout import de l'application.
// Les tests utilisent une base dédiée (MONGODB_URI_TEST) et un secret JWT de test.
import 'dotenv/config';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'jwt-secret-de-test-uniquement';
process.env.MONGODB_URI_TEST ??= 'mongodb://127.0.0.1:27017/taskflow_test';
