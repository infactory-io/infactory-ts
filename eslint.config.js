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
      '@typescript-eslint/no-unsafe-member-access': 'warn', // Enabled as requested
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // Add any other type-aware rule configurations if needed
    },
  },

  // Apply Prettier config last to override other formatting rules
  prettierConfig,

  {
    // Global ignore patterns
    ignores: ['dist/', 'node_modules/', '**/*.js', 'eslint.config.js'],
  },
);
