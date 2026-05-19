import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { copyFileSync, existsSync, mkdirSync } from 'fs'

// PWA statik fayllar: client root → public/ (build output)
const PWA_STATIC = [
  'sw.js',
  'manifest.json',
  'icon.svg',
  'icon-192.png',
  'icon-512.png',
  'apple-touch-icon.png',
  'favicon.ico',
];

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-pwa-and-admin',
      closeBundle() {
        const outDir = path.resolve(__dirname, '../public');
        mkdirSync(outDir, { recursive: true });

        // Admin panel
        const adminSrc = path.resolve(__dirname, '../public_static/admin.html');
        if (existsSync(adminSrc)) {
          copyFileSync(adminSrc, path.join(outDir, 'admin.html'));
          console.log('[vite] admin.html copied');
        }

        // PWA static fayllar (ildiz papkadan public/ ga)
        // Bu fayllar Railway'da public/ papkasida bo'lishi kerak
        // Manbasi: loyiha ildizidagi pwa-static/ yoki public/ (qurilishdan avval)
        const pwaSrc = path.resolve(__dirname, '..', 'pwa-static');
        if (existsSync(pwaSrc)) {
          PWA_STATIC.forEach((file) => {
            const src = path.join(pwaSrc, file);
            if (existsSync(src)) {
              copyFileSync(src, path.join(outDir, file));
              console.log(`[vite] PWA: ${file} copied`);
            }
          });
        }
      },
    },
  ],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  build: {
    outDir: '../public',
    emptyOutDir: true,
    // ─── Eski Android WebView'lar uchun moslik ─────────────────────────
    // ES2015 — Chrome 49+ WebView'larda ham ishlaydi
    target: 'es2015',
    cssTarget: 'chrome61',
    // Memory tejash uchun chunk size limitini oshirish
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // ─── Bundle Splitting ────────────────────────────────────────────
        // JS faylni mantiqiy bo'laklarga ajratish — bu memory bosimini
        // kamaytiradi va parallel yuklash imkonini beradi.
        manualChunks: {
          // React kutubxonalari (kamdan-kam o'zgaradi, agressiv cache)
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // KaTeX (faqat test sahifalarida kerak)
          'katex': ['katex', 'react-katex'],
          // State management
          'zustand': ['zustand'],
          // HTTP
          'axios': ['axios'],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:3000' },
  },
})
