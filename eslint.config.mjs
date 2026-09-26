// @ts-check
import eslint from '@eslint/js';
import {defineConfig, globalIgnores} from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** House rules, shared by every project in the portfolio. Formatting itself is Prettier's job. */
const HOUSE_RULES = {
  'arrow-body-style': ['error', 'as-needed'],
  curly: ['error', 'all'],
  'no-console': ['error', {allow: ['warn', 'error']}],
  'simple-import-sort/exports': 'error',
  'simple-import-sort/imports': 'error',
  'unused-imports/no-unused-imports': 'error',
};

/** House rules for TypeScript. */
const HOUSE_TS_RULES = {
  '@typescript-eslint/array-type': ['error', {default: 'array'}],
  '@typescript-eslint/explicit-member-accessibility': [
    'error',
    {accessibility: 'explicit', overrides: {constructors: 'no-public'}},
  ],
  '@typescript-eslint/no-unused-vars': 'off',
  'unused-imports/no-unused-vars': [
    'error',
    {argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_', varsIgnorePattern: '^_'},
  ],
};

export default defineConfig(
  globalIgnores(['**/dist/', 'coverage/', 'playwright-report/', 'test-results/']),
  {
    languageOptions: {globals: globals.browser},
    plugins: {'simple-import-sort': simpleImportSort, 'unused-imports': unusedImports},
    rules: HOUSE_RULES,
  },
  eslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    extends: [tseslint.configs.strictTypeChecked, tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      ...HOUSE_TS_RULES,
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/restrict-template-expressions': ['error', {allowNumber: true}],
    },
  },
  {
    files: ['apps/**/*.tsx', 'packages/**/*.tsx'],
    extends: [reactHooks.configs.flat['recommended-latest'], reactRefresh.configs.vite],
  },
  {
    // Command-line tools report progress on stdout.
    files: ['scripts/**', 'packages/*/src/cli.ts'],
    languageOptions: {globals: globals.node},
    rules: {'no-console': 'off'},
  },
  eslintConfigPrettier
);
