import { defineConfig, devices } from '@playwright/test';

// Tests end-to-end : Playwright démarre la vraie API et le vrai front sur des ports
// dédiés (3100 et 5174) avec une base MongoDB dédiée (taskflow_e2e, vidée au début).
// Prérequis : MongoDB démarré + navigateur installé une fois avec
//   npx playwright install chromium
const API_PORT = 3100;
const WEB_PORT = 5174;
const e2eDbUri = process.env.MONGODB_URI_E2E ?? 'mongodb://127.0.0.1:27017/taskflow_e2e';

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.js',
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: 'retain-on-failure',
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Facultatif : utiliser un Chromium déjà installé ailleurs
        launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH
          ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
          : {},
      },
    },
  ],
  webServer: [
    {
      command: 'node backend/src/server.js',
      url: `http://localhost:${API_PORT}/api/health`,
      reuseExistingServer: false,
      timeout: 30_000,
      env: {
        PORT: String(API_PORT),
        MONGODB_URI: e2eDbUri,
        JWT_SECRET: 'jwt-secret-e2e-uniquement',
        CORS_ORIGIN: `http://localhost:${WEB_PORT}`,
      },
    },
    {
      command: `npm run dev --workspace frontend -- --port ${WEB_PORT} --strictPort`,
      url: `http://localhost:${WEB_PORT}`,
      reuseExistingServer: false,
      timeout: 60_000,
      env: { API_PROXY_TARGET: `http://localhost:${API_PORT}` },
    },
  ],
});
