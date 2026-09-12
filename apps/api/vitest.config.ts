import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';
import path from 'path';

export default defineConfig({
  css: { postcss: false },
  test: {
    globals: true,
    fileParallelism: false,
    maxConcurrency: 1,
  },
  resolve: {
    alias: {
      '@class-scheduling/contracts': path.resolve(__dirname, '../../packages/contracts/src/index.ts'),
      '@class-scheduling/domain': path.resolve(__dirname, '../../packages/domain/src/index.ts'),
    }
  },
  plugins: [
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
});
