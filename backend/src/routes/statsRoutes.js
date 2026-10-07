import { Router } from 'express';
import { requireAuth } from '../middlewares/requierAuth.js';
import * as statsService from '../services/statsService.js';

// Bonus B3 : GET /api/stats/heatmap?from=YYYY-MM-DD&to=YYYY-MM-DD&tz=Europe/Paris
export const statsRouter = Router();
statsRouter.use(requireAuth);

statsRouter.get('/heatmap', async (request, response) => {
  const heatmap = await statsService.getHeatmap(request.userId, request.query);
  response.status(200).json(heatmap);
});
