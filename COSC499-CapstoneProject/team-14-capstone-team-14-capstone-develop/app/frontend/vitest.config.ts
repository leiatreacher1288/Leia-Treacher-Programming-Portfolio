// vitest.config.ts
import { defineConfig } from 'vitest/config';
import viteConfig from './vite.config';
import { mergeConfig } from 'vite'; // ← pull in from 'vite', not 'vitest/config'

export default defineConfig(
  mergeConfig(viteConfig, {
    // this object can contain all the Vite options you want to override/add,
    // including a `test` block for Vitest and any extra aliases.
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/test/setup.ts',
      css: true,
      testTimeout: 10000, // 10 seconds timeout for each test
      hookTimeout: 10000, // 10 seconds timeout for hooks
      coverage: {
        provider: 'v8', // ← now you can safely set provider
        reporter: ['text', 'html'],
        all: true,
        exclude: ['src/test/**'],
      },
    },
    resolve: {
      alias: {
        '@mui/x-data-grid/esm/index.css': 'vitest-mock-css',
      },
    },
  })
);
