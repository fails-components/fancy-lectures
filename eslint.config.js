import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
import babelParser from '@babel/eslint-parser'
import prettierRecommended from 'eslint-plugin-prettier/recommended'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended
})

const config = [
  {
    ignores: ['**/src/libav.js/**/*.js', 'dist/', 'node_modules/']
  },

  ...compat.extends('eslint-config-standard'),
  ...compat.extends('eslint-config-react-app'),

  {
    files: ['**/*.{js,jsx,mjs,cjs}'],
    languageOptions: {
      parser: babelParser,
      ecmaVersion: 2020,
      sourceType: 'module',
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          babelrc: false,
          configFile: false,
          presets: ['@babel/preset-react']
        },
        ecmaFeatures: {
          legacyDecorators: true,
          jsx: true
        }
      },
      // Equivalent to env: { jest: true }
      globals: {
        jest: 'readonly',
        describe: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        it: 'readonly'
      }
    },
    settings: {
      react: {
        version: '16'
      }
    },
    rules: {
      'space-before-function-paren': 'off',
      'import/export': 'off',
      'promise/catch-or-return': 'error'
    }
  },

  prettierRecommended
]

export default config
