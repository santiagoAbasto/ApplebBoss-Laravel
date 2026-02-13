import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    laravel({
      input: ['resources/js/app.jsx'],
      refresh: true,
    }),
    react(),
  ],

  server: {
    host: '0.0.0.0',      // Docker escucha en todos
    port: 5173,
    hmr: {
      host: 'localhost', // 👈 CLAVE: lo que ve el navegador
    },
  },
});
