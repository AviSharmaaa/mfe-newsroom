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
      name: 'mfe_headlines',
      filename: 'remoteEntry.js',
      exposes: {
        './HeadlinesApp': './src/HeadlinesApp.tsx',
      },
      shared: ['react', 'react-dom'],
    }),
  ],
  build: { target: 'esnext' },
  preview: { port: 3001 },
})
