import * as authService from '../services/authService.js';

export async function register(request, response) {
    const user = await authService.register(request.body);
    return response.status(200).json(user);
}

export async function login(request, response) {
    const user = await authService.login(request.body);
    return response.status(200).json(user);
}
