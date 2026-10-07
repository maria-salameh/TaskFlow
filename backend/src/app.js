import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/env.js';
import { openApiSpec } from './docs/openapi.js';
import { authRouter } from './routes/authRoutes.js';
import { taskRouter } from './routes/taskRoutes.js';
import { userRouter } from './routes/userRoutes.js';
import { habitLogRouter, habitRouter } from './routes/habitRoutes.js';
import { statsRouter } from './routes/statsRoutes.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';

// Création de l'application sans ouverture de port (voir server.js) :
// les tests Supertest importent ce module directement.
const app = express();

// helmet et cors avant express.json() pour que même une erreur de parsing
// JSON reparte avec les en-têtes CORS (sinon le navigateur masque l'erreur).
app.use(helmet());
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: '100kb' }));

app.get('/', (_request, response) => {
  response.status(200).json({ status: 'API TaskFlow', docs: '/api/docs' });
});
app.get('/api/health', (_request, response) => {
  response.status(200).json({ status: 'ok' });
});

// Documentation OpenAPI : interface Swagger + spécification brute en JSON
app.get('/api/docs.json', (_request, response) => response.json(openApiSpec));
app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(openApiSpec, {
    customSiteTitle: 'TaskFlow API',
    swaggerOptions: { persistAuthorization: true },
  }),
);

app.use('/api/auth', authRouter);
app.use('/api/tasks', taskRouter);
app.use('/api/users', userRouter);
app.use('/api/habits', habitRouter); // Bonus B2
app.use('/api/habit-logs', habitLogRouter); // Bonus B2
app.use('/api/stats', statsRouter); // Bonus B3

app.use(notFoundHandler);
// Toujours en dernier : transforme les erreurs en réponses JSON du contrat
app.use(errorHandler);

export default app;
