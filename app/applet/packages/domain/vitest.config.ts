import { defineConfig } from 'vitest/config';

export default defineConfig({
  css: { postcss: false },
  test: {
    globals: true,
  },
});
