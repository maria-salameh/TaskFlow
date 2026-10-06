import { User } from '../models/User.js';

export async function getMe(userId) {
    return await User.findById(userId)
}

export async function updateMe(userId, userData) {
    const user = await User.findByIdAndUpdate(userId, userData, { new: true });
    if (!user) {
        throw new Error("User not found");
    }
    return user;
}

export async function deleteMe(userId) {
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
        throw new Error("User not found");
    }
    return user;
}