import { readFileSync } from 'node:fs'

/**
 * Onde mora o `prompt.md` de cada agente.
 *
 * Rodando do fonte (desenvolvimento e testes), o prompt do agente `marca` fica
 * em `src/marca/prompt.md`, do lado do `index.ts` dele — é o que o CLAUDE.md
 * manda e é o arquivo que a gente edita.
 *
 * Em produção o tsup junta os pacotes `@firmus/` num arquivo só (`noExternal`),
 * e markdown não entra em bundle de JavaScript. Então o build copia os prompts
 * para `dist/prompts/<agente>.md`. São esses dois lugares, nessa ordem.
 *
 * Importar o .md direto (`import prompt from './prompt.md'`) resolveria isso
 * num lugar só, mas o `tsx` do modo desenvolvimento não sabe fazer isso —
 * testei. Daí a leitura em disco.
 */
function candidatos(agent: string): URL[] {
  return [
    new URL(`../${agent}/prompt.md`, import.meta.url),
    new URL(`./prompts/${agent}.md`, import.meta.url),
  ]
}

/** Lido uma vez por agente: o prompt não muda enquanto o processo vive. */
const cache = new Map<string, string>()

/**
 * O prompt.md do agente, como texto.
 *
 * Falha alto quando não acha: agente sem instrução não deve chamar a IA e
 * gastar dinheiro para devolver qualquer coisa.
 */
export function loadPrompt(agent: string): string {
  const guardado = cache.get(agent)
  if (guardado !== undefined) return guardado

  for (const caminho of candidatos(agent)) {
    try {
      const texto = readFileSync(caminho, 'utf8').trim()
      cache.set(agent, texto)
      return texto
    } catch {
      // Tenta o próximo lugar.
    }
  }

  throw new Error(
    `Não achei o prompt do agente "${agent}". ` +
      `Procurei em ${candidatos(agent)
        .map((u) => decodeURIComponent(u.pathname))
        .join(' e em ')}.`,
  )
}
