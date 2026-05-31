import { defineConfig } from 'vite'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  plugins: [
    federation({
      name: 'mfe_weather',
      filename: 'remoteEntry.js',
      exposes: {
        './WeatherWidget': './src/main.js',
      },
      shared: [],
    }),
  ],
  build: { target: 'esnext' },
  preview: { port: 3003 },
})
