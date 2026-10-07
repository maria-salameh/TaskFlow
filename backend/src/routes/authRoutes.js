import { Router } from 'express';
import * as authController from '../controllers/authController.js';

// Routes publiques (pas de JWT)
export const authRouter = Router();

authRouter.post('/register', authController.register);
authRouter.post('/login', authController.login);
