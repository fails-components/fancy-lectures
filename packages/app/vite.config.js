import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import eslint from 'vite-plugin-eslint'
import topLevelAwait from 'vite-plugin-top-level-await'
import path from 'path'
import { fileURLToPath } from 'url'
import process from 'node:process'

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
      topLevelAwait()
    ],
    worker: {
      format: 'module'
    },
    server: {
      port: 1001,
      hmr: {
        protocol: 'ws',
        port: 1001,
        host: 'localhost'
      },
      allowedHosts: ['.ngrok.app']
    },
    base: process?.env?.PUBLIC_URL ? process.env.PUBLIC_URL : '/static/app/',
    optimizeDeps: {},
    envPrefix: ENV_PREFIX
  }
})
