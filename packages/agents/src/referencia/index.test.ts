import { brandStyleReferences } from '@firmus/db/schema'
import type { StyleGuide } from '@firmus/shared'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { readStyleReference } from '.'
import { runAgent } from '../runtime/run-agent'
import {
  clienteFalso,
  cotacaoFixa,
  createAgentHarness,
  type createAgentHarness as Harness,
} from '../runtime/test-helpers'
import { z } from 'zod'

let h: Awaited<ReturnType<typeof Harness>>

beforeEach(async () => {
  h = await createAgentHarness()
})

afterEach(async () => {
  await h.close()
})

/** Um guia no formato que o styleGuideSchema exige. */
const guiaValido: StyleGuide = {
  summary: 'Fundo escuro chapado com um único destaque em laranja.',
  palette: [
    { hex: '#111111', role: 'fundo' },
    { hex: '#FF6A00', role: 'destaque' },
  ],
  typography: 'Sem serifa, peso pesado, caixa alta no título.',
  composition: 'Título enorme no terço de cima, o resto vazio.',
  textDensity: 'Uma frase de até 8 palavras.',
  imagery: 'Nenhuma foto; só tipografia.',
  mood: 'sóbrio e direto',
  dos: ['usar uma cor de destaque só'],
  donts: ['encher a peça de texto'],
}

const imagem = { mediaType: 'image/png' as const, data: 'aW1hZ2Vt' }

describe('agente referencia', () => {
  it('manda a imagem para a IA e devolve o guia', async () => {
    const { client, chamadas } = clienteFalso({ parsed_output: guiaValido })

    const { guide } = await readStyleReference({
      db: h.db,
      client,
      usdBrlRate: cotacaoFixa,
      companyId: h.auraId,
      image: imagem,
    })

    expect(chamadas[0]!.images).toBe(1)
    expect(chamadas[0]!.input).toContain('nunca o conteúdo')
    expect(guide.mood).toBe('sóbrio e direto')
  })

  it('guia fora do schema não passa', async () => {
    const { client } = clienteFalso({ parsed_output: null })

    await expect(
      readStyleReference({
        db: h.db,
        client,
        usdBrlRate: cotacaoFixa,
        companyId: h.auraId,
        image: imagem,
      }),
    ).rejects.toThrow('fora do formato pedido')
  })
})

describe('o guia entra no Cérebro de todo agente', () => {
  it('os guias guardados aparecem no prompt de qualquer agente', async () => {
    await h.db.insert(brandStyleReferences).values({
      companyId: h.auraId,
      imagePath: `${h.auraId}/referencias/um.png`,
      guide: guiaValido,
    })

    const { client, chamadas } = clienteFalso({ parsed_output: { ok: true } })
    await runAgent({
      db: h.db,
      client,
      usdBrlRate: cotacaoFixa,
      agent: 'marca',
      companyId: h.auraId,
      input: 'qualquer pedido',
      schema: z.object({ ok: z.boolean() }),
    })

    expect(chamadas[0]!.system).toContain('## Estilo visual')
    expect(chamadas[0]!.system).toContain('#FF6A00 (destaque)')
    // Sem imagem no pedido, o conteúdo continua texto puro.
    expect(chamadas[0]!.images).toBe(0)
  })

  it('o guia de uma empresa não vaza para a outra', async () => {
    await h.db.insert(brandStyleReferences).values({
      companyId: h.auraId,
      imagePath: `${h.auraId}/referencias/um.png`,
      guide: guiaValido,
    })

    const { client, chamadas } = clienteFalso({ parsed_output: { ok: true } })
    await runAgent({
      db: h.db,
      client,
      usdBrlRate: cotacaoFixa,
      agent: 'marca',
      companyId: h.rivalId,
      input: 'qualquer pedido',
      schema: z.object({ ok: z.boolean() }),
    })

    expect(chamadas[0]!.system).not.toContain('Estilo visual')
    expect(chamadas[0]!.system).not.toContain('#FF6A00')
  })
})
