// Erreur applicative portant un code HTTP et un code métier du contrat API
// (INVALID_INPUT, UNAUTHORIZED, NOT_FOUND, EMAIL_ALREADY_USED).
export class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const invalidInput = (message) => new HttpError(400, 'INVALID_INPUT', message);
export const notFound = (message = 'Ressource introuvable') => new HttpError(404, 'NOT_FOUND', message);
