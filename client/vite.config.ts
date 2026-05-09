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
    rollupOptions: {
      output: {
        manualChunks: { vendor: ['react', 'react-dom', 'react-router-dom'] },
      },
    },
  },
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:3000' },
  },
})
