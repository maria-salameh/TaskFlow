import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { config } from '../config/env.js';
import { emailAlreadyUsed, unauthorized } from '../utils/httpError.js';
import { validateLogin, validateRegister } from '../validators/authValidator.js';

const BCRYPT_ROUNDS = 10;
// Hash factice : quand l'email n'existe pas, on fait quand même un bcrypt.compare
// pour que le temps de réponse ne révèle pas si le compte existe.
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', BCRYPT_ROUNDS);

export function signToken(user) {
  return jwt.sign({ userId: user._id.toString() }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

function authResponse(user) {
  return { user: { id: user._id.toString(), email: user.email }, token: signToken(user) };
}

export async function register(body) {
  const { email, password } = validateRegister(body);

  if (await User.exists({ email })) {
    throw emailAlreadyUsed();
  }
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  try {
    const user = await User.create({ email, passwordHash });
    return authResponse(user);
  } catch (error) {
    // Deux inscriptions simultanées : l'index unique tranche
    if (error.code === 11000) throw emailAlreadyUsed();
    throw error;
  }
}

export async function login(body) {
  const { email, password } = validateLogin(body);

  const user = await User.findOne({ email }).select('+passwordHash');
  const passwordOk = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);

  // Même message que l'email soit inconnu ou le mot de passe faux
  if (!user || !passwordOk) {
    throw unauthorized('Email ou mot de passe incorrect');
  }
  return authResponse(user);
}
