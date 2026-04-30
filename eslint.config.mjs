import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import eslintConfigPrettier from 'eslint-config-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            // 1. React
            ['^react$', '^react/'],

            // 2. Next
            ['^next$', '^next/'],

            // 3. Bibliotecas externas
            ['^@?\\w'],

            // 4. Alias interno (ex: @/...)
            ['^@/'],

            // 5. Imports relativos (parent)
            ['^\\.\\.(?!/?$)', '^\\.\\./?$'],

            // 6. Imports relativos (mesmo nível)
            ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],

            // 7. Estilos
            ['^.+\\.?(css|scss|sass)$'],
          ],
        },
      ],

      'simple-import-sort/exports': 'error',

      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },

  eslintConfigPrettier,

  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'public/models/**/*.js', // External WASM/ML libraries
    'public/wasm/**/*.mjs', // External ONNX Runtime WASM
  ]),
]);

export default eslintConfig;
