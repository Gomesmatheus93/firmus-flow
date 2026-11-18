import { defineConfig } from 'tsup'
import { copyAgentPrompts } from '@firmus/agents/build'

export default defineConfig({
  // `index`: o servidor de sempre. `vercel`: a mesma api como função da Vercel.
  entry: ['src/index.ts', 'src/vercel.ts'],
  format: ['esm'],
  target: 'node20',
  clean: true,
  sourcemap: true,
  // Os pacotes internos existem só como TypeScript, então entram no bundle.
  noExternal: [/^@firmus\//],
  // Dependência CommonJS dos pacotes internos (o dotenv) entra no bundle e
  // chama `require`, que não existe em módulo ESM. Isto cria um `require` de
  // verdade no topo do arquivo. Sem ele, `node dist/index.js` quebrava ao subir.
  banner: {
    js: "import { createRequire as __firmusCreateRequire } from 'node:module'; const require = __firmusCreateRequire(import.meta.url);",
  },
  // Markdown não entra em bundle de JavaScript, e os agentes leem o prompt.md
  // deles em disco. Sem esta cópia, o build sai sem prompt e todo agente falha
  // na primeira chamada — em produção, não aqui.
  onSuccess: async () => {
    const copiados = copyAgentPrompts(new URL('./dist/prompts/', import.meta.url))
    console.log(`[build] ${copiados} prompt.md copiados para dist/prompts/`)
  },
})
