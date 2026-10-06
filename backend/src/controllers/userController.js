import * as userService from '../services/userService.js';

export async function getMe(request, response) {
    return response.status(200).json(await userService.getMe(request.userId));
}

export async function updateMe(request, response) {
    const user = await userService.updateMe(request.userId, request.body);
    return response.status(200).json(user);
}

export async function deleteMe(request, response) {
    const user = await userService.deleteMe(request.userId);
    return response.status(200).json(user);
}   
