import { StrictMode } from 'react';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './providers/AuthProvider';
import { ThemeProvider } from './providers/ThemeProvider';
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
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <AppShell />
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </React.StrictMode>
  );
  container._rootInitialized = true;
}
