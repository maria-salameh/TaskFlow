import { Router } from 'express';
import * as taskController from '../controllers/taskController.js';
import { requireAuth } from '../middlewares/requierAuth.js';

export const taskRouter = Router();
taskRouter.use(requireAuth);

// Les 5 routes obligatoires du contrat
taskRouter.get('/', taskController.getAllTasks);
taskRouter.post('/', taskController.createTask);
// Bonus B1 : déclarée avant /:id pour ne pas être prise pour un identifiant
taskRouter.get('/count', taskController.countTasks);
taskRouter.get('/:id', taskController.getTask);
taskRouter.patch('/:id', taskController.updateTask);
taskRouter.delete('/:id', taskController.deleteTask);
