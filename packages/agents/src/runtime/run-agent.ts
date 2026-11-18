import type Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import type { Database } from '@firmus/db'
import { agentRuns } from '@firmus/db/schema'
import type { z } from 'zod'
import { brainToPrompt, loadBrain, loadStyleGuides, styleGuidesToPrompt } from './brain'
import { callCostUsd } from './pricing'
import { loadPrompt } from './prompt-file'

/**
 * A parte do cliente da Anthropic que o runtime usa.
 *
 * Fica como tipo próprio para o teste poder entregar um cliente falso sem subir
 * a rede. O resto do projeto faz igual: `createApp` recebe o banco, o
 * `usdBrlRate` recebe quem busca a cotação.
 */
export type ModelClient = Pick<Anthropic, 'messages'>

/** Uma imagem que o agente olha junto com o pedido. `data` em base64. */
export type AgentImage = {
  mediaType: 'image/png' | 'image/jpeg' | 'image/webp'
  data: string
}

export type RunAgentOptions<T> = {
  db: Database
  client: ModelClient
  /** Cotação do dólar de hoje, em string. Quem chama decide de onde vem. */
  usdBrlRate: () => Promise<string>

  /** Nome da pasta do agente em `src/`. É o que vai para `agent_runs`. */
  agent: string
  /** A empresa dona do trabalho. Define o Cérebro que o agente vai ler. */
  companyId: string
  /** O pedido desta chamada, em português. */
  input: string
  /** O formato exigido da resposta. Nada é salvo sem passar por ele. */
  schema: z.ZodType<T>
  /** Imagens que o agente precisa ver, como a referência de design do chefe. */
  images?: AgentImage[]

  model?: string
  maxTokens?: number
}

export type AgentResult<T> = {
  output: T
  runId: string
  costUsd: string
  inputTokens: number
  outputTokens: number
  durationMs: number
}

const MODELO_PADRAO = 'claude-opus-5-5'

/**
 * Roda um agente: monta o contexto, chama a IA, valida a resposta e registra o
 * que custou.
 *
 * Todo agente passa por aqui. É o único lugar que fala com a Anthropic e o
 * único que escreve em `agent_runs` — então não existe chamada de IA sem conta
 * registrada.
 */
export async function runAgent<T>({
  db,
  client,
  usdBrlRate,
  agent,
  companyId,
  input,
  schema,
  images = [],
  model = process.env.ANTHROPIC_MODEL || MODELO_PADRAO,
  maxTokens = 16_000,
}: RunAgentOptions<T>): Promise<AgentResult<T>> {
  const instrucoes = loadPrompt(agent)

  // O Cérebro é lido por empresa, sempre. Regra 3 do CLAUDE.md.
  // As referências de design entram no Cérebro, então todo agente segue o
  // estilo que o chefe escolheu sem precisar pedir.
  const [brain, guias] = await Promise.all([
    loadBrain(db, companyId),
    loadStyleGuides(db, companyId),
  ])
  const estilo = styleGuidesToPrompt(guias)

  const system = [
    instrucoes,
    '',
    '# Cérebro da Marca desta empresa',
    '',
    brainToPrompt(brain),
    ...(estilo ? ['', '## Estilo visual', '', estilo] : []),
  ].join('\n')

  // A cotação é buscada antes da chamada, de propósito: se o Banco Central
  // estiver fora do ar, melhor descobrir sem ter gasto token ainda.
  const rate = await usdBrlRate()
  const comecou = Date.now()

  try {
    const resposta = await client.messages.parse({
      model,
      max_tokens: maxTokens,
      // O padrão do opus-5-5 já é 'medium'. Escrito à mão para o dia em que o
      // padrão mudar não mudar o custo da plataforma sem a gente saber.
      output_config: { effort: 'medium', format: zodOutputFormat(schema) },
      system,
      // Sem imagem, o pedido vai como texto puro, como sempre foi. Com imagem,
      // elas vêm antes do texto: a Anthropic recomenda essa ordem.
      messages: [
        {
          role: 'user',
          content:
            images.length === 0
              ? input
              : [
                  ...images.map((imagem) => ({
                    type: 'image' as const,
                    source: {
                      type: 'base64' as const,
                      media_type: imagem.mediaType,
                      data: imagem.data,
                    },
                  })),
                  { type: 'text' as const, text: input },
                ],
        },
      ],
    })

    const durationMs = Date.now() - comecou
    const inputTokens = resposta.usage.input_tokens
    const outputTokens = resposta.usage.output_tokens

    // Classificador de segurança recusou. Vem com HTTP 200, então sem esta
    // checagem a recusa passaria como resposta vazia.
    if (resposta.stop_reason === 'refusal') {
      throw new Error(
        `A IA recusou o pedido (${resposta.stop_details?.category ?? 'sem categoria'}).`,
      )
    }

    if (resposta.stop_reason === 'max_tokens') {
      throw new Error(
        `A resposta foi cortada no limite de ${maxTokens} tokens. Aumente maxTokens ou peça menos de uma vez.`,
      )
    }

    // `parsed_output` é nulo quando a resposta não encaixou no schema.
    if (resposta.parsed_output == null) {
      throw new Error('A IA respondeu fora do formato pedido.')
    }

    const output = resposta.parsed_output as T
    const costUsd = callCostUsd(model, { inputTokens, outputTokens })

    const [run] = await db
      .insert(agentRuns)
      .values({
        companyId,
        agentName: agent,
        model,
        inputTokens,
        outputTokens,
        costUsd,
        usdBrlRate: rate,
        durationMs,
      })
      .returning({ id: agentRuns.id })

    return { output, runId: run!.id, costUsd, inputTokens, outputTokens, durationMs }
  } catch (erro) {
    // Chamada que falhou também gastou. Registrar o fracasso é o que evita
    // agente quebrado consumindo dinheiro em silêncio.
    //
    // Sem tokens aqui de propósito: quando a chamada estoura, não há `usage`
    // confiável. O que importa é a linha existir, com o motivo.
    const mensagem = erro instanceof Error ? erro.message : String(erro)

    await db.insert(agentRuns).values({
      companyId,
      agentName: agent,
      model,
      usdBrlRate: rate,
      durationMs: Date.now() - comecou,
      errorMessage: mensagem.slice(0, 500),
    })

    throw erro
  }
}
