import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // El sitio público usa 5173; el panel va en 5174 para poder correr los dos
    port: 5174,
    strictPort: true,
  },
})
