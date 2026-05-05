import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
// Service Worker (PWA) ni ishga tushirish
const updateSW = registerSW({
    onNeedRefresh() {
        if (confirm("Yangi versiya mavjud! Yangilashni xohlaysizmi?")) {
            updateSW(true);
        }
    },
    onOfflineReady() {
        console.log("Ilova Internetsiz ishlashga tayyor! (Offline Ready)");
    },
});
// Telegram WebApp init
const tg = window.Telegram?.WebApp;
if (tg) {
    tg.ready();
    tg.expand();
    tg.setHeaderColor('#0a0a14');
    tg.setBackgroundColor('#0a0a14');
}
ReactDOM.createRoot(document.getElementById('root')).render(_jsx(React.StrictMode, { children: _jsx(BrowserRouter, { children: _jsx(App, {}) }) }));
// PWA Service Worker ni ro'yxatdan o'tkazish
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then((registration) => {
            console.log('SW registered: ', registration.scope);
        }, (err) => {
            console.log('SW registration failed: ', err);
        });
    });
}
