import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

const isSingleFile = process.env.BUILD_MODE === 'singlefile'
// GitHub Pages deployment uses /Amateur-Radio-Propagation-Info/ as base path.
// In dev and standalone builds, '/' / './' are used instead.
const base = isSingleFile ? './' : (process.env.GITHUB_ACTIONS ? '/Amateur-Radio-Propagation-Info/' : '/')

export default defineConfig({
  base,
  plugins: [
    react(),
    ...(isSingleFile ? [viteSingleFile()] : []),
  ],
  build: {
    outDir: isSingleFile ? 'dist-standalone' : 'dist',
    ...(isSingleFile ? {
      assetsInlineLimit: Infinity,
      cssCodeSplit: false,
    } : {}),
  },
})
