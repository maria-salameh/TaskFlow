import { Router } from "express";
import * as taskController from "../controllers/taskController.js";
import { requireAuth } from "../middlewares/requierAuth.js";

export const taskRouter = Router();
taskRouter.use(requireAuth);
taskRouter.get("/", taskController.getAllTasks);

taskRouter.post("/", taskController.createTask);

taskRouter.put("/:id", taskController.updateTask);

taskRouter.delete("/:id", taskController.deleteTask);