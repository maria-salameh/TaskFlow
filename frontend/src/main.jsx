import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Polices embarquées dans le projet (aucun appel externe, fonctionne hors ligne)
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource/public-sans/400.css';
import '@fontsource/public-sans/600.css';
import '@fontsource/public-sans/700.css';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
