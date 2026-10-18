import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { registerServiceWorker } from './pwa';
import './index.css';

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void registerServiceWorker(import.meta.env.PROD, navigator);
  });
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
