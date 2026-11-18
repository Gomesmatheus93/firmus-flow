import type { Database } from '@firmus/db'
import { styleGuideSchema, type StyleGuide } from '@firmus/shared'
import { runAgent, type AgentImage, type ModelClient } from '../runtime/run-agent'

export type ReadReferenceInput = {
  db: Database
  client: ModelClient
  usdBrlRate: () => Promise<string>
  companyId: string
  /** A imagem que o chefe enviou como referência. */
  image: AgentImage
}

/**
 * Lê uma referência de design e devolve o guia de estilo dela.
 *
 * Roda uma vez por imagem enviada. O guia é guardado e daí em diante entra no
 * Cérebro de todo agente: a imagem não precisa ser mandada à IA de novo, o que
 * deixaria toda chamada mais cara.
 */
export async function readStyleReference({
  db,
  client,
  usdBrlRate,
  companyId,
  image,
}: ReadReferenceInput): Promise<{ guide: StyleGuide; costUsd: string }> {
  const { output, costUsd } = await runAgent({
    db,
    client,
    usdBrlRate,
    agent: 'referencia',
    companyId,
    schema: styleGuideSchema,
    images: [image],
    // Um guia de estilo é curto; o limite baixo é o que impede uma resposta
    // descontrolada de custar caro.
    maxTokens: 4_000,
    input:
      'Esta é a referência de design que o dono enviou. Extraia o guia de estilo dela, ' +
      'seguindo as suas instruções. Descreva o estilo, nunca o conteúdo.',
  })

  return { guide: output, costUsd }
}
