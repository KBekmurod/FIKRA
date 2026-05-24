import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';
// ─── CSS viewport fix: real vh (iOS Safari va boshqa mobil brauzerlar) ─────
function setVh() {
    try {
        var vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', vh + "px");
    }
    catch (_a) { }
}
setVh();
window.addEventListener('resize', setVh, { passive: true });
// ─── Service Worker yangilash strategiyasi ────────────────────────────────
// Yangi versiya kelganda eski cache'ni darrov tozalash
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener ? .('controllerchange', function () {
        if (window.__fikra_reloading__)
            return;
        window.__fikra_reloading__ = true;
        setTimeout(function () { return window.location.reload(); }, 200);
    })
        :
    ;
}
// ─── Unhandled rejection log ──────────────────────────────────────────────
window.addEventListener('unhandledrejection', function (e) {
    console.error('Unhandled promise rejection:', e.reason);
});
// Production'da StrictMode'ni olib tashlash
var Root = (<BrowserRouter>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </BrowserRouter>);
ReactDOM.createRoot(document.getElementById('root')).render(import.meta.env.DEV
    ? <React.StrictMode>{Root}</React.StrictMode>
    : Root);
