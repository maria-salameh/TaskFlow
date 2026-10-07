import jwt from "jsonwebtoken";
import { config } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";

// Vérifie l'en-tête "Authorization: Bearer <JWT>" et place l'id utilisateur dans req.userId.
// Jeton absent, mal formé, falsifié ou expiré => 401 UNAUTHORIZED.
export function requireAuth(req, _res, next) {
  const header = req.header("Authorization") ?? "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(new HttpError(401, "UNAUTHORIZED", "Authentification requise"));
  }

  try {
    const verified = jwt.verify(token, config.jwtSecret);
    req.userId = verified.userId;
    return next();
  } catch {
    return next(new HttpError(401, "UNAUTHORIZED", "Jeton invalide ou expiré"));
  }
}
