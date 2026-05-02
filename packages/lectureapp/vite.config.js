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
      outDir: 'build',
      target: 'es2022'
    },
    resolve: {
      alias: {
        '@fails-components/avcomponents': path.resolve(
          dirname,
          '../avcomponents/'
        ),
        '@fails-components/avcore': path.resolve(dirname, '../avcore/'),
        '@fails-components/avkeystore': path.resolve(dirname, '../avkeystore/'),
        '@fails-components/avreactwidgets': path.resolve(
          dirname,
          '../avreactwidgets/'
        ),
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
      wasm(),
      topLevelAwait(),
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          sourcemap: true,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm}']
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
      allowedHosts: ['.ngrok.app'],
      watch: {
        ignored: [
          '!**/node_modules/@fails-components/avcomponents/**',
          '!**/node_modules/@fails-components/avcore/**',
          '!**/node_modules/@fails-components/avkeystore/**',
          '!**/node_modules/@fails-components/avreactwidgets/**',
          '!**/node_modules/@fails-components/data/**',
          '!**/node_modules/@fails-components/drawobjects/**'
        ]
      }
    },
    base: process?.env?.PUBLIC_URL
      ? process.env.PUBLIC_URL
      : '/static/lecture/',
    optimizeDeps: {
      exclude: [
        '@fails-components/avcomponents',
        '@fails-components/avcore',
        '@fails-components/avkeystore',
        '@fails-components/avreactwidgets',
        '@fails-components/data',
        '@fails-components/drawobjects'
      ],
      include: ['pdfjs-dist', 'libav.js']
    },
    envPrefix: ENV_PREFIX
  }
})
