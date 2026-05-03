import js from '@eslint/js'
import promise from 'eslint-plugin-promise'
import babelParser from '@babel/eslint-parser'
import tseslint from 'typescript-eslint'
import importplug from 'eslint-plugin-import'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import globals from 'globals'
import react from 'eslint-plugin-react'

export default [
  js.configs.recommended,
  {
    ignores: [
      '**/build/**',
      '**/dist/**',
      '**/node_modules/**',
      '**/.snapshots/**',
      '**/*.min.js',
      '**/.docusaurus/**'
    ]
  },
  {
    plugins: {
      promise,
      import: importplug,
      react
    },
    files: ['**/*.js', '**/*.jsx', '*.js'],
    languageOptions: {
      parser: babelParser,
      ecmaVersion: 2021,
      parserOptions: {
        babelOptions: {
          presets: ['@babel/preset-react']
        },
        ecmaFeatures: {
          legacyDecorators: true,
          jsx: true
        },
        requireConfigFile: false
      }
    },
    settings: {
      react: {
        version: '17.0'
      }
    },
    rules: {
      ...react.configs.recommended.rules,
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',
      'react/prop-types': 0,
      'space-before-function-paren': 0,
      'import/export': 0,
      'promise/catch-or-return': 'error',
      'no-useless-return': 1,
      'no-constant-condition': 1,
      'dot-notation': 1,
      camelcase: 1,
      'no-unused-vars': [
        'error',
        {
          args: 'none',
          caughtErrors: 'none'
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
      import: importplug,
      react
    },
    settings: {
      react: {
        version: '17.0'
      }
    },
    rules: {
      ...react.configs.recommended.rules,
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',
      'react/prop-types': 0,
      ...tseslint.configs.recommended.rules,
      'import/extensions': ['error', 'always', { js: 'always', ts: 'always' }],
      'no-unused-vars': [
        'error',
        {
          args: 'none',
          caughtErrors: 'none'
        }
      ],
      camelcase: 1,
      'no-constant-condition': 1,
      'dot-notation': 1,
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
    files: ['docs/**/*.tsx'],
    languageOptions: {
      globals: {
        require: 'readonly'
      }
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
  },
  eslintPluginPrettierRecommended
]
