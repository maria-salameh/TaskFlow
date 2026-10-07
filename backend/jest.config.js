// Jest en mode ES modules (le backend utilise "type": "module").
// Lancer avec : npm test (voir package.json : NODE_OPTIONS=--experimental-vm-modules)
export default {
  testEnvironment: 'node',
  transform: {},
  setupFiles: ['<rootDir>/test/setupEnv.js'],
  testMatch: ['<rootDir>/test/**/*.test.js'],
  testTimeout: 20000,
  collectCoverageFrom: ['src/**/*.js', '!src/server.js', '!src/docs/**'],
};
