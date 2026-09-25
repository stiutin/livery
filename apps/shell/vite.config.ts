import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
    alias: {
      'theme-tenant-alpha': resolve(__dirname, '../../themes/theme-tenant-alpha/src/index.ts'),
      'theme-tenant-beta': resolve(__dirname, '../../themes/theme-tenant-beta/src/index.ts'),
    },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 5173,
  },
})
