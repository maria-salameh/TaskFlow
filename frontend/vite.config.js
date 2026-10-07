import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// En développement, les appels /api/... du front sont transmis au backend.
// API_PROXY_TARGET permet de changer la cible (utilisé par les tests end-to-end).
const apiTarget = process.env.API_PROXY_TARGET ?? 'http://localhost:3000';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': apiTarget,
    },
  },
  // Tests unitaires et de composants (Vitest + Testing Library)
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    include: ['src/**/*.test.{js,jsx}'],
    css: false,
  },
});
