import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
    globals: true,
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './src'),
      'astrowind:config': path.resolve(__dirname, './src/__mocks__/astrowind-config.ts'),
    },
  },
});
