import { defineConfig } from 'vite'

export default defineConfig({
  // For custom domain deployment
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})