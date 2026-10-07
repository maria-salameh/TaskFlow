// Erreur applicative portant un code HTTP et un code métier du contrat API
// (INVALID_INPUT, UNAUTHORIZED, NOT_FOUND, EMAIL_ALREADY_USED).
// Le middleware errorHandler la transforme en { "error": { code, message } }.
export class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const invalidInput = (message) => new HttpError(400, 'INVALID_INPUT', message);
export const unauthorized = (message = 'Authentification requise') =>
  new HttpError(401, 'UNAUTHORIZED', message);
export const notFound = (message = 'Ressource introuvable') => new HttpError(404, 'NOT_FOUND', message);
export const emailAlreadyUsed = () =>
  new HttpError(409, 'EMAIL_ALREADY_USED', 'Cette adresse email est déjà utilisée');
