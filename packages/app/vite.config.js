import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import eslint from 'vite-plugin-eslint'
import topLevelAwait from 'vite-plugin-top-level-await'
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
    resolve: {
      alias: {
        '@fails-components/data': path.resolve(dirname, '../data/src/data.ts'),
        '@fails-components/drawobjects': path.resolve(
          dirname,
          '../drawobjects/src/drawobjects.ts'
        )
      }
    },
    plugins: [
      react(),
      eslint({
        overrideConfigFile: path.resolve(dirname, '../../eslint.config.js'),
        cwd: path.resolve(dirname, '../../'),
        // Disable caching while you are debugging config issues
        cache: false,
        include: ['src/**/*.js', 'src/**/*.jsx', 'src/**/*.ts', 'src/**/*.tsx']
      }),
      topLevelAwait() /*,
      visualizer({
        open: true, // Automatically opens the report in your browser after build
        filename: 'bundle-stats-app.html',
        gzipSize: true,
        brotliSize: true
      })*/
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
      allowedHosts: ['.ngrok.app'],
      watch: {
        ignored: [
          '!**/node_modules/@fails-components/data/**',
          '!**/node_modules/@fails-components/drawobjects/**'
        ]
      }
    },
    base: process?.env?.PUBLIC_URL ? process.env.PUBLIC_URL : '/static/app/',
    optimizeDeps: {
      exclude: ['@fails-components/data', '@fails-components/drawobjects']
    },
    envPrefix: ENV_PREFIX
  }
})
