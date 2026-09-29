/**
 * ESLint flat config (ESLint 10).
 *
 * - src TS files: type-checked baseline (recommendedTypeChecked). The host tsconfig
 *   covers only src/index.ts and the client tsconfig only the client subtree, so
 *   type-aware linting relies on projectService to pick the right tsconfig per file.
 * - tests TS files: covered by no tsconfig (they run on node --experimental-strip-types),
 *   so they get the non-type-aware recommended baseline.
 * - scripts plus diagnose-console.js: js.recommended only.
 */
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

// Repo convention: unused vars/params are errors, underscore prefix exempts.
const repoRules = {
  '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
};

export default tseslint.config(
  {
    ignores: ['lib/**', 'node_modules/**', 'assets/**'],
  },
  {
    files: ['src/**/*.ts'],
    extends: [js.configs.recommended, tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        // Dual tsconfig by design: tsconfig.json (host) covers only src/index.ts and
        // tsconfig.client.json (client) only the client subtree; projectService's
        // default autoload only recognizes tsconfig.json filenames, so name both.
        project: ['./tsconfig.json', './tsconfig.client.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: repoRules,
  },
  {
    files: ['src/client/**/*.ts'],
    languageOptions: { globals: { ...globals.browser } },
  },
  {
    files: ['src/index.ts'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ['tests/**/*.ts'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: { globals: { ...globals.node } },
    rules: repoRules,
  },
  {
    files: ['scripts/**/*.mjs', 'diagnose-console.js'],
    extends: [js.configs.recommended],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
);
