import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node20',
  clean: true,
  sourcemap: true,
  // Os pacotes internos existem só como TypeScript, então entram no bundle.
  noExternal: [/^@firmus\//],
})
