
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppProvider } from './contexts/AppContext';
import { VoiceControlProvider } from './contexts/VoiceControlContext';
import './services/cueRuntime';
import { seedDatabase } from './services/db';

const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const VITE_DISABLE_SW = process.env.VITE_DISABLE_SW === '1';

// Only register the service worker in production, and only if it's not disabled by the build environment.
if (!isDev && !VITE_DISABLE_SW) {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js', { scope: '/TheOps/' }).then(registration => {
        console.log('SW registered: ', registration);
      }).catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
    });
  }
}

if (isDev) { // Development environment
  seedDatabase(); // Seed in dev mode if DB is empty
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AppProvider>
      <VoiceControlProvider>
        <App />
      </VoiceControlProvider>
    </AppProvider>
  </React.StrictMode>
);