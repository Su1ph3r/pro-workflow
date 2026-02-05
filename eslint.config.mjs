import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
  },
  {
    ignores: ['dist/', 'scripts/', 'tests/', 'node_modules/', '*.config.*'],
  },
);
