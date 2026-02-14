import js from '@eslint/js'
import promise from 'eslint-plugin-promise'
import babelParser from '@babel/eslint-parser'
import importplug from 'eslint-plugin-import'
// eslint-disable-next-line import/extensions
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import globals from 'globals'

export default [
  js.configs.recommended,
  eslintPluginPrettierRecommended,
  {
    plugins: {
      promise,
      import: importplug
    },
    languageOptions: {
      parser: babelParser,
      ecmaVersion: 2021,
      parserOptions: {
        ecmaFeatures: {
          legacyDecorators: true,
          jsx: true
        },
        requireConfigFile: false
      }
    },
    ignores: [
      'build/*',
      'dist/*',
      'node_modules/*',
      '.snapshots/*',
      '*.min.js'
    ],
    settings: {
      react: {
        version: '16'
      }
    },
    rules: {
      'space-before-function-paren': 0,
      'import/export': 0,
      'promise/catch-or-return': 'error',
      'no-useless-return': 1,
      camelcase: 1,
      'import/extensions': [
        'error',
        'always',
        {
          js: 'always',
          jsx: 'always'
        }
      ]
    }
  },
  {
    files: ['packages/lectureapp/**', 'packages/app/**'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.serviceworker
      }
    }
  },
  {
    files: [
      'packages/config/**',
      'packages/assets/**',
      'packages/security/**',
      'daemons/**'
    ],
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  },
  {
    files: ['packages/data/**'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      }
    }
  },
  {
    files: ['test/*.spec.js'],
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.node
      }
    },
    rules: {
      'no-undef': 0
    }
  }
]
