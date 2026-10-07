import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, host: true },
  // The bundled 1000-question bank (~400 kB) is intentionally part of the main chunk.
  build: { chunkSizeWarningLimit: 1000 },
})
