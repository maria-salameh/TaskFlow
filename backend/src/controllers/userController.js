import * as userService from '../services/userService.js';

// Le User est sérialisé via toJSON : { id, email, createdAt } (jamais le hash)

export async function getMe(request, response) {
  const user = await userService.getMe(request.userId);
  return response.status(200).json(user);
}

export async function updateMe(request, response) {
  const user = await userService.updateMe(request.userId, request.body);
  return response.status(200).json(user);
}

export async function deleteMe(request, response) {
  await userService.deleteMe(request.userId);
  return response.status(204).end();
}
