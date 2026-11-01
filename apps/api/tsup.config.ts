import { defineConfig } from 'tsup'
import { copyAgentPrompts } from '@firmus/agents/build'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node20',
  clean: true,
  sourcemap: true,
  // Os pacotes internos existem só como TypeScript, então entram no bundle.
  noExternal: [/^@firmus\//],
  // Markdown não entra em bundle de JavaScript, e os agentes leem o prompt.md
  // deles em disco. Sem esta cópia, o build sai sem prompt e todo agente falha
  // na primeira chamada — em produção, não aqui.
  onSuccess: async () => {
    const copiados = copyAgentPrompts(new URL('./dist/prompts/', import.meta.url))
    console.log(`[build] ${copiados} prompt.md copiados para dist/prompts/`)
  },
})
