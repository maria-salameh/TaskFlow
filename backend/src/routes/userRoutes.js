import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import { requireAuth } from '../middlewares/requierAuth.js';

export const userRouter = Router();
userRouter.use(requireAuth);
// Lire mon profil
userRouter.get('/me', userController.getMe);
// Editer mon profil
userRouter.put('/me', userController.updateMe);
// Supprimer mon profil
userRouter.delete('/me', userController.deleteMe);


