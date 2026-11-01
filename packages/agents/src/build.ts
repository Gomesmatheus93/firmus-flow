import { copyFileSync, mkdirSync, readdirSync } from 'node:fs'

/**
 * Copia o `prompt.md` de cada agente para a pasta informada.
 *
 * Existe por causa do bundle: o tsup junta os pacotes `@firmus/` num arquivo de
 * JavaScript só, e markdown não entra em bundle. Como o runtime lê o prompt em
 * disco, sem esta cópia o build sai sem prompt nenhum e todo agente falha na
 * primeira chamada — em produção, onde é caro descobrir.
 *
 * O destino bate com o segundo lugar que `loadPrompt` procura:
 * `<pasta do bundle>/prompts/<agente>.md`.
 *
 * Roda no build, nunca em tempo de execução.
 */
export function copyAgentPrompts(destino: URL): number {
  const origem = new URL('./', import.meta.url)

  mkdirSync(destino, { recursive: true })

  let copiados = 0

  for (const entrada of readdirSync(origem, { withFileTypes: true })) {
    if (!entrada.isDirectory()) continue

    try {
      copyFileSync(
        new URL(`./${entrada.name}/prompt.md`, origem),
        new URL(`./${entrada.name}.md`, destino),
      )
      copiados += 1
    } catch {
      // Pasta de agente que ainda não tem prompt.md escrito. Normal enquanto os
      // agentes vão sendo feitos um por tarefa.
    }
  }

  return copiados
}
