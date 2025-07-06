import { defineConfig } from 'vite'
import webExtension from 'vite-plugin-web-extension'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      jsxImportSource: 'preact',
      jsxRuntime: 'automatic',
    }),
    webExtension({
      manifest: './src/manifest.json',
      watchFilePaths: ['src/**/*'],
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        popup: 'src/popup/index.html',
        options: 'src/options/index.html',
        content: 'src/content/index.ts',
        background: 'src/background/index.ts',
        widget: 'src/widget/index.ts',
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
    },
  },
}) 