import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    extensions: ['.ts', '.js', '.json'],
    alias: [
      { find: '@', replacement: path.resolve(__dirname, 'src') },
      {
        find: /^@\/(.*)\.js$/,
        replacement: path.resolve(__dirname, 'src/$1.ts'),
      },
    ],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './vitest.setup-env.ts',
  },
});
