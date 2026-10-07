import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

// Configuration ESLint unique pour tout le dépôt (npm run lint à la racine)
export default [
  { ignores: ['**/node_modules/**', '**/dist/**', '**/coverage/**', 'test-results/**', 'playwright-report/**'] },

  js.configs.recommended,

  {
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
      'no-console': 'off',
    },
  },

  // Backend Express (Node, ES modules)
  {
    files: ['backend/**/*.js', '*.config.js', 'e2e/**/*.js'],
    languageOptions: { globals: { ...globals.node } },
  },

  // Tests Jest du backend
  {
    files: ['backend/test/**/*.js'],
    languageOptions: { globals: { ...globals.node, ...globals.jest } },
  },

  // Frontend React
  {
    files: ['frontend/src/**/*.{js,jsx}'],
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // Les composants utilisés uniquement dans le JSX doivent compter comme utilisés
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_', caughtErrors: 'none' }],
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },

  // vite.config.js lit process.env
  {
    files: ['frontend/vite.config.js'],
    languageOptions: { globals: { ...globals.node } },
  },
];
