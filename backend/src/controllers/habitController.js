import * as habitService from '../services/habitService.js';

// Même contrat que /api/tasks : { items } pour la liste, 201 / 200 / 204.

export async function getAllHabits(request, response) {
  const habits = await habitService.listHabits(request.userId);
  return response.status(200).json({ items: habits });
}

export async function getHabit(request, response) {
  const habit = await habitService.getHabit(request.userId, request.params.id);
  return response.status(200).json(habit);
}

export async function createHabit(request, response) {
  const habit = await habitService.createHabit(request.userId, request.body);
  return response.status(201).json(habit);
}

export async function updateHabit(request, response) {
  const habit = await habitService.updateHabit(request.userId, request.params.id, request.body);
  return response.status(200).json(habit);
}

export async function deleteHabit(request, response) {
  await habitService.deleteHabit(request.userId, request.params.id);
  return response.status(204).end();
}

export async function markDone(request, response) {
  const { log, created } = await habitService.markDone(
    request.userId,
    request.params.id,
    request.params.date,
  );
  return response.status(created ? 201 : 200).json(log);
}

export async function unmarkDone(request, response) {
  await habitService.unmarkDone(request.userId, request.params.id, request.params.date);
  return response.status(204).end();
}

export async function getHabitLogs(request, response) {
  const logs = await habitService.listHabitLogs(request.userId, request.params.id, request.query);
  return response.status(200).json({ items: logs });
}

export async function getAllLogs(request, response) {
  const logs = await habitService.listAllLogs(request.userId, request.query);
  return response.status(200).json({ items: logs });
}
