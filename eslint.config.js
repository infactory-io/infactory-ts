import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  // Apply ESLint recommended rules globally
  eslint.configs.recommended,

  // Apply TypeScript-specific and type-aware rules only to .ts files
  {
    files: ['**/*.ts'],
    // Apply recommended TS rules + type-aware rules
    extends: [...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json', // Explicitly point to tsconfig.json
        // tsconfigRootDir: import.meta.dirname, // Keep commented out for now
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      // Your custom rule overrides for TS files
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off', // Disabled as requested
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      // Add any other type-aware rule configurations if needed
    },
  },

  // Apply overrides for examples
  {
    files: ['examples/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
    },
  },

  // Apply overrides for tests
  {
    files: ['tests/**/*.ts'],
    rules: {
      '@typescript-eslint/unbound-method': 'off',
    },
  },

  // Apply Prettier config last to override other formatting rules
  prettierConfig,

  {
    // Global ignore patterns
    ignores: [
      'dist/',
      'node_modules/',
      '**/*.js',
      'eslint.config.js',
      'vitest.config.ts',
      'vitest.setup-env.ts',
      'examples/**/*.ts',
    ],
  },
);
