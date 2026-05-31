import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    react(),
    federation({
      name: 'shell',
      remotes: {
        mfe_headlines: 'http://localhost:3001/assets/remoteEntry.js',
        mfe_bookmarks: 'http://localhost:3002/assets/remoteEntry.js',
        mfe_weather: 'http://localhost:3003/assets/remoteEntry.js',
      },
      shared: ['react', 'react-dom'],
    }),
  ],
  build: { target: 'esnext' },
  server: { port: 3000 },
})
