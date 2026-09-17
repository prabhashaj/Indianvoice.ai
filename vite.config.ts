import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { TanStackStartVite } from '@tanstack/react-start/plugin/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    tsconfigPaths(),
    TanStackStartVite({
      server: { entry: "server" }
    }),
    react(),
  ],
  server: {
    host: '::',
    port: 8080,
  },
})
