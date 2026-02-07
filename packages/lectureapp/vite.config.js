import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import eslint from 'vite-plugin-eslint'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { fileURLToPath } from 'url'
import process from 'node:process'
// import { visualizer } from 'rollup-plugin-visualizer'

const ENV_PREFIX = 'REACT_APP_'

export default defineConfig(() => {
  const dirname = path.dirname(fileURLToPath(import.meta.url))
  return {
    build: {
      outDir: 'build'
    },
    plugins: [
      react(),
      eslint({
        overrideConfigFile: path.resolve(dirname, '../../eslint.config.js'),
        cwd: path.resolve(dirname, '../../'),
        // Disable caching while you are debugging config issues
        cache: false,
        include: ['src/**/*.js', 'src/**/*.jsx']
      }),
      wasm(),
      topLevelAwait(),
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          sourcemap: true,
          globPatterns: ['**/*.{js,css,html,ico,png,svg}']
        }
      }) /* ,
      visualizer({
        open: true, // Automatically opens the report in your browser after build
        filename: 'bundle-stats-lectureapp.html',
        gzipSize: true,
        brotliSize: true
      }) */
    ],
    worker: {
      format: 'module'
    },
    server: {
      port: 3000,
      hmr: {
        protocol: 'ws',
        port: 3000,
        host: 'localhost'
      },
      allowedHosts: ['.ngrok.app']
    },
    base: process?.env?.PUBLIC_URL
      ? process.env.PUBLIC_URL
      : '/static/lecture/',
    optimizeDeps: {
      include: ['pdfjs-dist']
    },
    envPrefix: ENV_PREFIX
  }
})
