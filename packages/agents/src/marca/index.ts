import { brandBrainDraftSchema, type BrandBrainDraft } from '@firmus/shared'
import { runAgent, type ModelClient } from '../runtime/run-agent'
import type { Database } from '@firmus/db'

export type BuildBrainInput = {
  db: Database
  client: ModelClient
  usdBrlRate: () => Promise<string>
  companyId: string
  /** O que o dono contou sobre a empresa, do jeito que ele escreveu. */
  description: string
}

/**
 * Monta o Cérebro da Marca a partir do texto que o dono escreveu.
 *
 * É o primeiro passo da plataforma: sem Cérebro, nenhum outro agente tem o que
 * ler. Roda uma vez no onboarding e de novo quando o dono quiser refazer.
 */
export async function buildBrandBrain({
  db,
  client,
  usdBrlRate,
  companyId,
  description,
}: BuildBrainInput): Promise<{ draft: BrandBrainDraft; costUsd: string }> {
  const { output, costUsd } = await runAgent({
    db,
    client,
    usdBrlRate,
    agent: 'marca',
    companyId,
    schema: brandBrainDraftSchema,
    input: [
      'Organize o Cérebro da Marca desta empresa a partir do que o dono escreveu abaixo.',
      'O que ele não disse fica vazio e vai para `missing`.',
      '',
      '--- o que o dono escreveu ---',
      description.trim(),
    ].join('\n'),
  })

  return { draft: output, costUsd }
}
