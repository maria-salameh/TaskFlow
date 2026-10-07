import { invalidInput } from '../utils/httpError.js';
import { assertPlainObject } from './common.js';

// Volontairement simple : une partie locale, un @, un domaine avec un point.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email) {
  if (typeof email !== 'string') throw invalidInput("L'email est obligatoire");
  // Comparaison et stockage insensibles à la casse (contrat 4.3)
  const normalized = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(normalized) || normalized.length > 254) {
    throw invalidInput("L'email n'est pas valide");
  }
  return normalized;
}

// Inscription : email valide + mot de passe d'au moins 8 caractères.
// bcrypt ne prend en compte que les 72 premiers octets : on refuse au-delà.
export function validateRegister(body) {
  assertPlainObject(body);
  const email = normalizeEmail(body.email);
  const { password } = body;
  if (typeof password !== 'string' || password.length < 8) {
    throw invalidInput('Le mot de passe doit contenir au moins 8 caractères');
  }
  if (Buffer.byteLength(password, 'utf8') > 72) {
    throw invalidInput('Le mot de passe ne doit pas dépasser 72 octets');
  }
  return { email, password };
}

// Connexion : on vérifie seulement la forme du corps (400).
// Un mauvais couple email/mot de passe donnera 401 dans le service.
export function validateLogin(body) {
  assertPlainObject(body);
  const { email, password } = body;
  if (typeof email !== 'string' || email.trim() === '' || typeof password !== 'string' || password === '') {
    throw invalidInput('Email et mot de passe sont obligatoires');
  }
  return { email: email.trim().toLowerCase(), password };
}

export function validateEmailUpdate(body) {
  assertPlainObject(body);
  const keys = Object.keys(body);
  if (keys.length !== 1 || keys[0] !== 'email') {
    throw invalidInput('Seul le champ email peut être modifié');
  }
  return { email: normalizeEmail(body.email) };
}
