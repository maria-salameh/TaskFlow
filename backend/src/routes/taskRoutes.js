import { Router } from "express";
import * as taskController from "../controllers/taskController.js";
import { requireAuth } from "../middlewares/requierAuth.js";

export const taskRouter = Router();
taskRouter.use(requireAuth);

taskRouter.get("/", taskController.getAllTasks);
taskRouter.post("/", taskController.createTask);
taskRouter.get("/:id", taskController.getTask);
taskRouter.patch("/:id", taskController.updateTask);
taskRouter.delete("/:id", taskController.deleteTask);
