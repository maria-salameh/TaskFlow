import { Router } from 'express';
import * as habitController from '../controllers/habitController.js';
import { requireAuth } from '../middlewares/requierAuth.js';

// Bonus B2 : habit tracker
export const habitRouter = Router();
habitRouter.use(requireAuth);

habitRouter.get('/', habitController.getAllHabits);
habitRouter.post('/', habitController.createHabit);
habitRouter.get('/:id', habitController.getHabit);
habitRouter.patch('/:id', habitController.updateHabit);
habitRouter.delete('/:id', habitController.deleteHabit);

// Réalisations datées
habitRouter.get('/:id/logs', habitController.getHabitLogs);
habitRouter.put('/:id/logs/:date', habitController.markDone);
habitRouter.delete('/:id/logs/:date', habitController.unmarkDone);

export const habitLogRouter = Router();
habitLogRouter.use(requireAuth);
habitLogRouter.get('/', habitController.getAllLogs);
