import { describe, expect, it } from 'vitest'
import { callCostUsd } from './pricing'

describe('custo de uma chamada', () => {
  it('cobra entrada e saída com preços diferentes', () => {
    // opus-5-5: US$ 4 por milhão na entrada, US$ 20 na saída.
    // 1M de entrada + 1M de saída = 4 + 20 = US$ 24.
    expect(callCostUsd('claude-opus-5-5', { inputTokens: 1_000_000, outputTokens: 1_000_000 })).toBe(
      '24.00000000',
    )
  })

  it('guarda oito casas, porque a chamada barata custa fração de centavo', () => {
    // Uma resposta curta de atendimento no haiku-5-5: 100 de entrada a US$ 0,10
    // por milhão e 50 de saída a US$ 0,50 por milhão.
    // 0,00001 + 0,000025 = US$ 0,000035. Isso é R$ 0,0002 — zero, se a coluna
    // fosse em centavos. É exatamente o motivo de ela não ser.
    const custo = callCostUsd('claude-haiku-5-5', { inputTokens: 100, outputTokens: 50 })

    expect(custo).toBe('0.00003500')
    expect(Number(custo)).toBeGreaterThan(0)
  })

  it('o haiku é muito mais barato que o opus na mesma conta', () => {
    const uso = { inputTokens: 100_000, outputTokens: 50_000 }

    const opus = Number(callCostUsd('claude-opus-5-5', uso))
    const haiku = Number(callCostUsd('claude-haiku-5-5', uso))

    expect(haiku).toBeLessThan(opus / 10)
  })

  it('chamada sem token nenhum custa zero, e não quebra', () => {
    expect(callCostUsd('claude-opus-5-5', { inputTokens: 0, outputTokens: 0 })).toBe('0.00000000')
  })

  it('modelo sem preço cadastrado levanta erro em vez de gravar zero', () => {
    // O silêncio aqui seria pior: custo zero no banco infla a margem do painel
    // e ninguém descobre até a fatura da Anthropic chegar.
    expect(() => callCostUsd('claude-modelo-inventado', { inputTokens: 1000, outputTokens: 10 })) //
      .toThrow(/sem preço cadastrado/)
  })
})
