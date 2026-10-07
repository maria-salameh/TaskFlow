import mongoose from 'mongoose';
import { HttpError } from '../utils/httpError.js';

// Middleware d'erreur centralisé : toutes les erreurs ressortent au format
// { "error": { "code": "...", "message": "..." } } défini par le contrat API.
// eslint-disable-next-line no-unused-vars
export function errorHandler(error, _request, response, _next) {
  if (error instanceof HttpError) {
    return response.status(error.status).json({ error: { code: error.code, message: error.message } });
  }

  // JSON mal formé envoyé par le client (levé par express.json())
  if (error.type === 'entity.parse.failed') {
    return response.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Corps JSON invalide' } });
  }

  if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
    return response.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Données invalides' } });
  }

  console.error(error);
  return response.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Erreur interne du serveur' } });
}
