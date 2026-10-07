import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import { requireAuth } from '../middlewares/requierAuth.js';

export const userRouter = Router();
userRouter.use(requireAuth);

userRouter.get('/me', userController.getMe); // Lire mon profil
userRouter.patch('/me', userController.updateMe); // Modifier mon email
userRouter.delete('/me', userController.deleteMe); // Supprimer mon compte et mes données
