import express from 'express';
import cors from 'cors';
import helmet from "helmet";
import { config } from './config/env.js';
import { taskRouter } from './routes/taskRoutes.js';
import { userRouter } from "./routes/userRoutes.js";
import { authRouter } from "./routes/authRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

// helmet et cors avant express.json() pour que même une erreur de parsing
// JSON reparte avec les en-têtes CORS (sinon le navigateur masque l'erreur).
app.use(helmet());
app.use(
  cors({
    origin: config.corsOrigin,
  }),
);
app.use(express.json());

app.get("/", (_request, response) => {
  response.status(200).json({ status: "API - Cours Dev Full stack" });
});
app.get("/api/health", (_request, response) => {
  response.status(200).json({ status: "ok" });
});

app.use("/api/tasks", taskRouter);
app.use("/api/users", userRouter);
app.use("/api/auth", authRouter);

// Toujours en dernier : transforme les erreurs en réponses JSON du contrat
app.use(errorHandler);

export default app;
