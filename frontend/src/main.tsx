import { StrictMode } from 'react';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './providers/ThemeProvider';
import { AuthProvider } from './providers/AuthProvider';
import { AppShell } from './routes/AppShell';
import './styles/base.css';

type RootElement = HTMLElement & { _rootInitialized?: boolean };

const container = document.getElementById('root') as RootElement | null;

if (!container) {
  throw new Error('Root container not found');
}

if (!container._rootInitialized) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
            <AppShell />
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
  container._rootInitialized = true;
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('[App] Service Worker registered successfully:', registration);

        // Unregister all existing service workers to clear cache
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(reg => {
            if (reg !== registration) {
              reg.unregister();
              console.log('[App] Unregistered old service worker');
            }
          });
        });

        // Listen for cache clear messages
        navigator.serviceWorker.addEventListener('message', event => {
          if (event.data && event.data.type === 'CACHE_CLEARED') {
            console.log('[App] Caches cleared by service worker, reloading page');
            window.location.reload();
          }
        });
      })
      .catch(error => {
        console.warn('[App] Service Worker registration failed:', error);
      });
  });
}
