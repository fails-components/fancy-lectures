import js from '@eslint/js'
import promise from 'eslint-plugin-promise'
import babelParser from '@babel/eslint-parser'
import tseslint from 'typescript-eslint'
import importplug from 'eslint-plugin-import'
// eslint-disable-next-line import/extensions
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import globals from 'globals'

export default [
  js.configs.recommended,
  eslintPluginPrettierRecommended,
  {
    ignores: [
      '**/build/**',
      '**/dist/**',
      '**/node_modules/**',
      '**/.snapshots/**',
      '**/*.min.js'
    ]
  },
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
    files: [
      'packages/**/*.ts',
      'packages/**/*.tsx',
      'daemons/**/*.ts',
      'docs/**/*.tsx'
    ],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {}
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      import: importplug
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      'import/extensions': ['error', 'always', { js: 'always', ts: 'always' }],
      'no-unused-vars': 'off', // Standard-Regel ausschalten
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'none',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true
        }
      ]
    }
  },
  {
    files: [
      'packages/lectureapp/**',
      'packages/app/**',
      'packages/avcore/**',
      'packages/avcomponents/**',
      'packages/avkeystore/**',
      'packages/avreactwidgets/**',
      'docs/**'
    ],
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
      'packages/commonhandler/**',
      'packages/security/**',
      'daemons/**',
      'deploy/migrateassets/**'
    ],
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  },
  {
    files: ['packages/data/**', 'packages/drawobjects/**'],
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
