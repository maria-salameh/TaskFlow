import { Router } from "express";
import * as taskController from "../controllers/taskController.js";

export const taskRouter = Router();

taskRouter.get("/", taskController.getAllTasks);

taskRouter.post("/", taskController.createTask);

taskRouter.put("/:id", taskController.updateTask);

taskRouter.delete("/:id", taskController.deleteTask);