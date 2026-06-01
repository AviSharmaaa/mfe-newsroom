import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const headlines = env.VITE_HEADLINES_URL ?? 'http://localhost:3001'
  const bookmarks = env.VITE_BOOKMARKS_URL ?? 'http://localhost:3002'
  const weather = env.VITE_WEATHER_URL ?? 'http://localhost:3003'

  const remoteEntry = (base: string) => `${base.replace(/\/$/, '')}/assets/remoteEntry.js`

  return {
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
          mfe_headlines: remoteEntry(headlines),
          mfe_bookmarks: remoteEntry(bookmarks),
          mfe_weather: remoteEntry(weather),
        },
        shared: ['react', 'react-dom'],
      }),
    ],
    build: { target: 'esnext' },
    server: { port: 3000 },
    preview: { port: 3000 },
  }
})
