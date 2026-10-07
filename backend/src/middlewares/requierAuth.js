import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { config } from '../config/env.js';
import { unauthorized } from '../utils/httpError.js';

// Vérifie l'en-tête "Authorization: Bearer <JWT>" et place l'id utilisateur dans req.userId.
// Jeton absent, mal formé, falsifié ou expiré => 401 UNAUTHORIZED.
// C'est cette vérification côté serveur qui protège les données, pas l'interface React.
export function requireAuth(req, _res, next) {
  const header = req.header('Authorization') ?? '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(unauthorized('Authentification requise'));
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
    if (!mongoose.isValidObjectId(payload.userId)) {
      return next(unauthorized('Jeton invalide ou expiré'));
    }
    req.userId = payload.userId;
    return next();
  } catch {
    return next(unauthorized('Jeton invalide ou expiré'));
  }
}
