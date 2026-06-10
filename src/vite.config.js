import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  cacheDir: '/tmp/vite-cache',

  plugins: [
    laravel({
      input: ['resources/js/app.jsx'],
      refresh: true,
    }),
    react(),
  ],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./resources/js', import.meta.url)),
    },
  },

  server: {
    host: '0.0.0.0',      // Docker escucha en todos
    port: 5173,
    strictPort: true,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
    hmr: {
      host: 'localhost', // 👈 CLAVE: lo que ve el navegador
      overlay: false,
    },
    watch: {
      usePolling: true,
      interval: 1000,
      ignored: [
        '**/vendor/**',
        '**/node_modules/**',
        '**/storage/**',
        '**/bootstrap/cache/**',
      ],
    },
  },
});
