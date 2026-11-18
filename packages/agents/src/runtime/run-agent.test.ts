import { agentRuns } from '@firmus/db/schema'
import { eq } from 'drizzle-orm'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { z } from 'zod'
import { runAgent } from './run-agent'
import {
  clienteFalso,
  clienteQueFalha,
  cotacaoFixa,
  createAgentHarness,
  type createAgentHarness as Harness,
} from './test-helpers'

let h: Awaited<ReturnType<typeof Harness>>

beforeEach(async () => {
  h = await createAgentHarness()
})

afterEach(async () => {
  await h.close()
})

const schemaSimples = z.object({ resumo: z.string() })

/** Roda o agente `marca`, que é o único com prompt.md escrito até agora. */
function rodar(opcoes: { client: Parameters<typeof runAgent>[0]['client']; companyId?: string }) {
  return runAgent({
    db: h.db,
    client: opcoes.client,
    usdBrlRate: cotacaoFixa,
    agent: 'marca',
    companyId: opcoes.companyId ?? h.auraId,
    input: 'Monte o Cérebro.',
    schema: schemaSimples,
    // Fixo de propósito: sem isto o modelo vem do ANTHROPIC_MODEL do .env, que
    // outros arquivos de teste carregam — e o custo esperado mudava conforme a
    // ordem em que a suíte rodava.
    model: 'claude-opus-5-5',
  })
}

describe('o contexto que chega na IA', () => {
  it('leva o prompt do agente e o Cérebro da empresa', async () => {
    const { client, chamadas } = clienteFalso({ parsed_output: { resumo: 'ok' } })

    await rodar({ client })

    const { system } = chamadas[0]!
    // Do prompt.md do marca:
    expect(system).toContain('Você não inventa nada')
    // Do Cérebro da Studio Aura, no banco:
    expect(system).toContain('Estúdio de estética avançada em Mossoró')
    expect(system).toContain('microagulhamento')
    expect(system).toContain('prometer resultado permanente')
  })

  it('não vaza o Cérebro de outra empresa', async () => {
    const { client, chamadas } = clienteFalso({ parsed_output: { resumo: 'ok' } })

    await rodar({ client, companyId: h.auraId })

    // A Rival tem um Cérebro no mesmo banco, com uma frase que só é dela.
    expect(chamadas[0]!.system).not.toContain('SEGREDO DA RIVAL')
  })

  it('empresa sem Cérebro ainda roda, dizendo que está vazio', async () => {
    const { db } = h
    const [nova] = await db
      .insert((await import('@firmus/db/schema')).companies)
      .values({ name: 'Recém-chegada' })
      .returning()

    const { client, chamadas } = clienteFalso({ parsed_output: { resumo: 'ok' } })

    await rodar({ client, companyId: nova!.id })

    expect(chamadas[0]!.system).toContain('ainda não tem Cérebro da Marca preenchido')
  })
})

describe('registro do que custou', () => {
  it('grava tokens, custo e a cotação do dia', async () => {
    const { client } = clienteFalso({
      parsed_output: { resumo: 'ok' },
      input_tokens: 2000,
      output_tokens: 1000,
    })

    const resultado = await rodar({ client })

    const [run] = await h.db.select().from(agentRuns).where(eq(agentRuns.id, resultado.runId))

    expect(run!.companyId).toBe(h.auraId)
    expect(run!.agentName).toBe('marca')
    expect(run!.inputTokens).toBe(2000)
    expect(run!.outputTokens).toBe(1000)
    expect(run!.usdBrlRate).toBe('5.4212')
    expect(run!.errorMessage).toBeNull()

    // 2000 de entrada a US$ 4/milhão + 1000 de saída a US$ 20/milhão
    // = 0,008 + 0,02 = US$ 0,028. Pela cotação de 5,4212, R$ 0,15.
    expect(run!.costUsd).toBe('0.02800000')
  })

  it('a chamada que falha também vira linha, com o motivo', async () => {
    // Agente que quebra caro em silêncio é o pior caso: gasta e não aparece.
    await expect(rodar({ client: clienteQueFalha('a rede caiu') })).rejects.toThrow('a rede caiu')

    const linhas = await h.db.select().from(agentRuns)

    expect(linhas).toHaveLength(1)
    expect(linhas[0]!.errorMessage).toBe('a rede caiu')
    expect(linhas[0]!.companyId).toBe(h.auraId)
  })
})

describe('resposta que não serve', () => {
  it('fora do formato pedido levanta erro', async () => {
    const { client } = clienteFalso({ parsed_output: null })

    await expect(rodar({ client })).rejects.toThrow('fora do formato pedido')
  })

  it('recusa do classificador não passa como resposta vazia', async () => {
    // A recusa chega com HTTP 200. Sem a checagem, viraria saída silenciosa.
    const { client } = clienteFalso({
      stop_reason: 'refusal',
      stop_details: { category: 'bio' },
    })

    await expect(rodar({ client })).rejects.toThrow(/recusou/)
  })

  it('resposta cortada no limite de tokens levanta erro', async () => {
    const { client } = clienteFalso({ stop_reason: 'max_tokens' })

    await expect(rodar({ client })).rejects.toThrow(/cortada no limite/)
  })

  it('erro de resposta ruim também fica registrado', async () => {
    const { client } = clienteFalso({ stop_reason: 'refusal' })

    await expect(rodar({ client })).rejects.toThrow()

    const linhas = await h.db.select().from(agentRuns)
    expect(linhas[0]!.errorMessage).toMatch(/recusou/)
  })
})

describe('agente sem prompt', () => {
  it('não chama a IA quando não acha o prompt.md', async () => {
    const { client, chamadas } = clienteFalso()

    await expect(
      runAgent({
        db: h.db,
        client,
        usdBrlRate: cotacaoFixa,
        agent: 'agente-que-nao-existe',
        companyId: h.auraId,
        input: 'oi',
        schema: schemaSimples,
      }),
    ).rejects.toThrow(/Não achei o prompt/)

    // Falhou antes de gastar: nenhuma chamada e nenhuma linha de custo.
    expect(chamadas).toHaveLength(0)
    expect(await h.db.select().from(agentRuns)).toHaveLength(0)
  })
})
