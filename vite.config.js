import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
        ws: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err, _req, res) => {
            if (err.code === 'ECONNREFUSED') {
              console.warn(
                '\x1b[33m[vite:proxy]\x1b[0m Backend server not reachable on :4000 — ' +
                'start it with: npm run dev:server'
              );
              // Return a friendly JSON error instead of crashing the request
              if (res && !res.headersSent) {
                res.writeHead(503, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  message: 'Backend server is not running. Start it with: npm run dev:server',
                }));
              }
            }
          });
        },
      },
    },
  },
})

