import { defineConfig } from 'vitest/config';

export default defineConfig({
  // client.ts resolves its base URL from import.meta.env.VITE_API_BASE_URL at
  // module-import time. Node's fetch (unlike a browser's) has no page origin
  // to resolve a relative URL against, so tests need an absolute base.
  // `define` does a compile-time replacement (like Vite's own handling of
  // import.meta.env.VITE_*), unlike `test.env`, which only reached
  // process.env and left import.meta.env's value unset.
  define: {
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify('http://test.local'),
  },
  test: {
    environment: 'node',
    globals: true,
  },
});
