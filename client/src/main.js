import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';
// ─── CSS viewport fix: real vh (iOS Safari va boshqa mobil brauzerlar) ─────
function setVh() {
    try {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
    catch { }
}
setVh();
window.addEventListener('resize', setVh, { passive: true });
// ─── Service Worker yangilash strategiyasi ────────────────────────────────
// Yangi versiya kelganda eski cache'ni darrov tozalash
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener?.('controllerchange', () => {
        if (window.__fikra_reloading__)
            return;
        window.__fikra_reloading__ = true;
        setTimeout(() => window.location.reload(), 200);
    });
}
// ─── Unhandled rejection log ──────────────────────────────────────────────
window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
});
import { GoogleOAuthProvider } from '@react-oauth/google';
// Production'da StrictMode'ni olib tashlash
const Root = (_jsx(GoogleOAuthProvider, { clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy', children: _jsx(BrowserRouter, { children: _jsx(ErrorBoundary, { children: _jsx(App, {}) }) }) }));
ReactDOM.createRoot(document.getElementById('root')).render(import.meta.env.DEV
    ? _jsx(React.StrictMode, { children: Root })
    : Root);
