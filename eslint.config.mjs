import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['node_modules', 'dist', 'coverage', 'cloudfunctions', 'tools', 'miniprogram_npm'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['miniprogram/**/*.ts', 'tests/**/*.ts'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: { ...globals.node, ...globals.es2020 },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },
);
