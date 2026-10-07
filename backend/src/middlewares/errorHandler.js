import mongoose from 'mongoose';
import { HttpError } from '../utils/httpError.js';

function sendError(response, status, code, message) {
  return response.status(status).json({ error: { code, message } });
}

// Route inconnue : même format d'erreur que le reste de l'API
export function notFoundHandler(_request, response) {
  return sendError(response, 404, 'NOT_FOUND', 'Route introuvable');
}

// Middleware d'erreur centralisé : toutes les erreurs ressortent au format
// { "error": { "code": "...", "message": "..." } } défini par le contrat API.
// Express 5 transmet automatiquement ici les erreurs des fonctions async.
// Les 4 paramètres sont obligatoires pour qu'Express le reconnaisse comme gestionnaire d'erreurs.
export function errorHandler(error, _request, response, _next) {
  if (error instanceof HttpError) {
    return sendError(response, error.status, error.code, error.message);
  }

  // JSON mal formé ou corps trop gros (erreurs levées par express.json())
  if (error.type === 'entity.parse.failed') {
    return sendError(response, 400, 'INVALID_INPUT', 'Corps JSON invalide');
  }
  if (error.type === 'entity.too.large') {
    return sendError(response, 400, 'INVALID_INPUT', 'Corps de requête trop volumineux');
  }

  // Filet de sécurité si une donnée passe la validation mais pas le schéma Mongoose
  if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
    return sendError(response, 400, 'INVALID_INPUT', 'Données invalides');
  }

  // Erreur inattendue : on la journalise côté serveur sans exposer de détail au client
  console.error(error);
  return sendError(response, 500, 'INTERNAL_ERROR', 'Erreur interne du serveur');
}
