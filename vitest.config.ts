import { defineConfig } from 'vitest/config'

// Cada teste sobe um Postgres com PGlite num beforeEach. Isso e um hook, e o
// limite de hook do Vitest e 10s por padrao — bem menor que o de teste. Sob
// carga o hook estourava e o teste falhava sem motivo real.
//
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
          hookTimeout: 30_000,
        },
      },
      {
        test: {
          name: 'worker',
          root: './apps/worker',
          environment: 'node',
          passWithNoTests: true,
          testTimeout: 30_000,
          hookTimeout: 30_000,
        },
      },
      {
        test: {
          name: 'shared',
          root: './packages/shared',
          environment: 'node',
          passWithNoTests: true,
          testTimeout: 30_000,
          hookTimeout: 30_000,
        },
      },
      {
        test: {
          name: 'db',
          root: './packages/db',
          environment: 'node',
          passWithNoTests: true,
          testTimeout: 30_000,
          hookTimeout: 30_000,
        },
      },
      {
        test: {
          // Só lógica pura por enquanto (formatação, cálculo). Testar
          // componente exige jsdom, que é dependência nova — quando precisar.
          name: 'web',
          root: './apps/web',
          environment: 'node',
          passWithNoTests: true,
          testTimeout: 30_000,
          hookTimeout: 30_000,
        },
      },
      {
        test: {
          name: 'agents',
          root: './packages/agents',
          environment: 'node',
          passWithNoTests: true,
          testTimeout: 30_000,
          hookTimeout: 30_000,
        },
      },
    ],
  },
})
