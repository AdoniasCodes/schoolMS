import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Local-only dev server configuration
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'src')
    }
  },
  server: {
    port: 5173,
    host: true,
    strictPort: true
    // No tunnel/HMR overrides; Vite will use ws on localhost
  }
})
