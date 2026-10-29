import { defineConfig } from 'vitest/config'

// Um "project" por pacote: `pnpm test` roda todos de uma vez,
// e a saída mostra de qual pacote veio cada teste.
export default defineConfig({
  test: {
    passWithNoTests: true,
    projects: [
      {
        test: {
          name: 'api',
          root: './apps/api',
          environment: 'node',
          passWithNoTests: true,
          testTimeout: 30_000,
        },
      },
      {
        test: {
          name: 'worker',
          root: './apps/worker',
          environment: 'node',
          passWithNoTests: true,
          testTimeout: 30_000,
        },
      },
      {
        test: {
          name: 'shared',
          root: './packages/shared',
          environment: 'node',
          passWithNoTests: true,
          testTimeout: 30_000,
        },
      },
      {
        test: {
          name: 'db',
          root: './packages/db',
          environment: 'node',
          passWithNoTests: true,
          testTimeout: 30_000,
        },
      },
      {
        test: {
          name: 'agents',
          root: './packages/agents',
          environment: 'node',
          passWithNoTests: true,
          testTimeout: 30_000,
        },
      },
    ],
  },
})
