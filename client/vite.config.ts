import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { copyFileSync, existsSync } from 'fs'

export default defineConfig({
  plugins: [
    react(),
    {
      // Admin panel ni build keyin saqlab qolish
      name: 'copy-admin',
      closeBundle() {
        const src  = path.resolve(__dirname, '../public_static/admin.html')
        const dest = path.resolve(__dirname, '../public/admin.html')
        if (existsSync(src)) copyFileSync(src, dest)
      }
    }
  ],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  build: {
    outDir: '../public',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: { vendor: ['react', 'react-dom', 'react-router-dom'] }
      }
    }
  },
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:3000' }
  }
})
