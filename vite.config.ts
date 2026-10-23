import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages builds live under /Jovro/; local dev + previews run at the root.
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'production' ? '/Jovro/' : '/',
  server: {
    host: true,
    port: 5173,
    // Arena preview serves the app through a proxied host name.
    allowedHosts: true,
    strictPort: false,
  },
  preview: {
    host: true,
    allowedHosts: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    testTimeout: 20000,
    include: ['src/test/**/*.test.tsx'],
  },
}))
