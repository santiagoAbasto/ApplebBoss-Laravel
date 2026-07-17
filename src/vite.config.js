import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

const containerPort = Number(process.env.VITE_CONTAINER_PORT || 5173);
const hostPort = Number(process.env.VITE_HOST_PORT || containerPort);
const hmrHost = process.env.VITE_HMR_HOST || 'localhost';
const appPort = Number(process.env.APP_HTTP_PORT || 8010);

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
    port: containerPort,
    strictPort: true,
    origin: `http://${hmrHost}:${hostPort}`,
    cors: {
      origin: [
        `http://localhost:${appPort}`,
        `http://127.0.0.1:${appPort}`,
        `http://[::1]:${appPort}`,
      ],
    },
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
    hmr: {
      host: hmrHost, // Lo que ve el navegador fuera de Docker
      clientPort: hostPort,
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
