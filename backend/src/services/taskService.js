import mongoose from 'mongoose'
import { Task } from '../models/Task.js'

export function listTasks(ownerId, { status } = {}) {
    const filter = { ownerId };
    if (status) filter.status = status;
    return Task.find(filter)
}

export function getTaskById(ownerId, taskId) {
  return Task.findOne({ _id: taskId, ownerId });
}

export function createTask(ownerId, taskData) {
  const task = new Task({ ...taskData, ownerId });
  return task.save();
}

export async function updateTask(ownerId, taskId, taskData) {
  const task = await Task.findOneAndUpdate({ _id: taskId, ownerId }, taskData, {
    new: true,
  });
  if (!task) {
    throw new Error("Task not found");
  }
  return task;
}

export async function deleteTask(ownerId, taskId) {
  const task = await Task.findOneAndDelete({ _id: taskId, ownerId });
  if (!task) {
    throw new Error("Task not found");
  }
  return task;
}   