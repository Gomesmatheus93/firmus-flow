/**
 * Quanto cada modelo cobra, em dólar por milhão de tokens.
 *
 * Fonte: tabela de preços da Anthropic. Os valores ficam aqui, escritos à mão,
 * porque a API não devolve preço na resposta — ela devolve tokens. Preço errado
 * aqui significa custo errado guardado para sempre em `agent_runs`, e o
 * histórico não se corrige depois, então confira ao mexer.
 */
const PRICE_PER_MILLION: Record<string, { input: number; output: number }> = {
  'claude-opus-5-5': { input: 4, output: 20 },
  'claude-opus-5': { input: 5, output: 25 },
  'claude-sonnet-5-5': { input: 2, output: 10 },
  'claude-haiku-5-5': { input: 0.1, output: 0.5 },
}

export type TokenUsage = {
  inputTokens: number
  outputTokens: number
}

/**
 * Custo em dólar de uma chamada, como string de oito casas — o formato da
 * coluna `agent_runs.cost_usd`.
 *
 * Devolve string, e não número, de propósito: `numeric` do Postgres entra e sai
 * como texto no Drizzle. Converter para float no caminho é o jeito clássico de
 * perder centavo sem perceber.
 */
export function callCostUsd(model: string, usage: TokenUsage): string {
  const price = PRICE_PER_MILLION[model]

  // Modelo novo configurado no .env e esquecido aqui: erra agora, alto e claro.
  // O silêncio alternativo seria gravar custo zero e inflar a margem do painel.
  if (!price) {
    const conhecidos = Object.keys(PRICE_PER_MILLION).join(', ')
    throw new Error(
      `Modelo sem preço cadastrado: "${model}". ` +
        `Acrescente em packages/agents/src/runtime/pricing.ts. Conhecidos: ${conhecidos}.`,
    )
  }

  const dolares =
    (usage.inputTokens / 1_000_000) * price.input + (usage.outputTokens / 1_000_000) * price.output

  return dolares.toFixed(8)
}

/** Os modelos com preço cadastrado. Usado na mensagem de erro e nos testes. */
export const PRICED_MODELS = Object.keys(PRICE_PER_MILLION)
