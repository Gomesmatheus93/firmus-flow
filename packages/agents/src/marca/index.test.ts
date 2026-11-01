import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { buildBrandBrain } from '.'
import {
  clienteFalso,
  cotacaoFixa,
  createAgentHarness,
  type createAgentHarness as Harness,
} from '../runtime/test-helpers'

let h: Awaited<ReturnType<typeof Harness>>

beforeEach(async () => {
  h = await createAgentHarness()
})

afterEach(async () => {
  await h.close()
})

/** Uma resposta no formato que o brandBrainDraftSchema exige. */
const rascunhoValido = {
  context: 'Estúdio de estética em Mossoró, atende por agendamento.',
  services: ['limpeza de pele'],
  audience: 'mulheres de 25 a 45 anos de Mossoró',
  differentiators: ['protocolo fechado de 4 sessões'],
  toneOfVoice: {
    summary: 'Direto e acolhedor.',
    dos: ['tratar por você'],
    donts: ['prometer cura'],
  },
  faq: [{ question: 'Dói?', answer: 'Usamos anestésico tópico.' }],
  missing: ['Quantos anos de mercado?'],
}

describe('agente marca', () => {
  it('devolve o rascunho do Cérebro e o que custou', async () => {
    const { client } = clienteFalso({ parsed_output: rascunhoValido })

    const { draft, costUsd } = await buildBrandBrain({
      db: h.db,
      client,
      usdBrlRate: cotacaoFixa,
      companyId: h.auraId,
      description: 'Tenho um estúdio de estética em Mossoró.',
    })

    expect(draft.audience).toBe('mulheres de 25 a 45 anos de Mossoró')
    expect(draft.missing).toContain('Quantos anos de mercado?')
    expect(Number(costUsd)).toBeGreaterThan(0)
  })

  it('manda para a IA o texto que o dono escreveu', async () => {
    const { client, chamadas } = clienteFalso({ parsed_output: rascunhoValido })

    await buildBrandBrain({
      db: h.db,
      client,
      usdBrlRate: cotacaoFixa,
      companyId: h.auraId,
      description: 'Faço sobrancelha há três anos no centro.',
    })

    expect(chamadas[0]!.input).toContain('Faço sobrancelha há três anos no centro.')
  })

  it('rascunho fora do schema não passa', async () => {
    // Falta `missing` e `toneOfVoice`: a saída estruturada devolveria null.
    const { client } = clienteFalso({ parsed_output: null })

    await expect(
      buildBrandBrain({
        db: h.db,
        client,
        usdBrlRate: cotacaoFixa,
        companyId: h.auraId,
        description: 'qualquer coisa',
      }),
    ).rejects.toThrow('fora do formato pedido')
  })
})
