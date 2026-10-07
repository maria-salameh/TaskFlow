import { User } from '../models/User.js';
import { Task } from '../models/Task.js';
import { Habit } from '../models/Habit.js';
import { HabitLog } from '../models/HabitLog.js';
import { emailAlreadyUsed, unauthorized } from '../utils/httpError.js';
import { validateEmailUpdate } from '../validators/authValidator.js';

// Le jeton est valide mais le compte a été supprimé entre-temps => 401
async function findUserOrFail(userId) {
  const user = await User.findById(userId);
  if (!user) throw unauthorized('Compte introuvable');
  return user;
}

export function getMe(userId) {
  return findUserOrFail(userId);
}

export async function updateMe(userId, body) {
  const { email } = validateEmailUpdate(body);
  const user = await findUserOrFail(userId);
  if (email !== user.email && (await User.exists({ email }))) {
    throw emailAlreadyUsed();
  }
  user.email = email;
  try {
    return await user.save();
  } catch (error) {
    if (error.code === 11000) throw emailAlreadyUsed();
    throw error;
  }
}

// Supprime le compte et toutes ses données
export async function deleteMe(userId) {
  const user = await findUserOrFail(userId);
  await Promise.all([
    Task.deleteMany({ ownerId: user._id }),
    Habit.deleteMany({ ownerId: user._id }),
    HabitLog.deleteMany({ ownerId: user._id }),
  ]);
  await user.deleteOne();
}
