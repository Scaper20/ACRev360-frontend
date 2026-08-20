import { configureAuthStorage } from '@acrev360/api';
import { ToastProvider } from '@acrev360/ui';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { AuthProvider } from './auth/AuthContext';

// Must run before any api call — swaps the shared authStore's refresh-token
// backing store from its sessionStorage default to localStorage. See
// AuthContext.tsx's comment for why: an installed PWA can be backgrounded/
// killed well before a same-tab reload would ever happen.
configureAuthStorage(localStorage);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Offline support degrades to "doesn't survive a reload" rather than
      // failing the app outright — not worth surfacing to the agent.
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ToastProvider>
  </StrictMode>,
);
