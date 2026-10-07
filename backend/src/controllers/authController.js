import * as authService from '../services/authService.js';

// POST /api/auth/register -> 201 { user: { id, email }, token }
export async function register(request, response) {
  const result = await authService.register(request.body);
  return response.status(201).json(result);
}

// POST /api/auth/login -> 200 { user: { id, email }, token }
export async function login(request, response) {
  const result = await authService.login(request.body);
  return response.status(200).json(result);
}
