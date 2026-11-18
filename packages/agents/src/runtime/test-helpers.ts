import { brandBrains, companies } from '@firmus/db/schema'
import { createTestDb } from '@firmus/db/testing'
import type { ModelClient } from './run-agent'

/** Banco limpo com duas empresas, para provar que um agente não lê a do outro. */
export async function createAgentHarness() {
  const { db, close } = await createTestDb()

  const [aura] = await db
    .insert(companies)
    .values({ name: 'Studio Aura', segment: 'Estética' })
    .returning()

  const [rival] = await db
    .insert(companies)
    .values({ name: 'Clínica Rival', segment: 'Odontologia' })
    .returning()

  await db.insert(brandBrains).values({
    companyId: aura!.id,
    context: 'Estúdio de estética avançada em Mossoró, atende por agendamento.',
    services: ['limpeza de pele', 'microagulhamento'],
    audience: 'mulheres de 25 a 45 anos que querem resultado sem agulha grande',
    differentiators: ['atendimento individual', 'protocolo fechado de 4 sessões'],
    toneOfVoice: {
      summary: 'Direto e acolhedor, sem promessa de milagre.',
      dos: ['falar em sessões e prazo'],
      donts: ['prometer resultado permanente'],
    },
    faq: [{ question: 'Dói?', answer: 'Usamos anestésico tópico.' }],
    colorPalette: ['#1C8CFF'],
    instagramHandle: 'studioaura',
  })

  await db.insert(brandBrains).values({
    companyId: rival!.id,
    context: 'SEGREDO DA RIVAL: clareamento a laser com desconto de 40%.',
    services: ['clareamento'],
  })

  return { db, close, auraId: aura!.id, rivalId: rival!.id }
}

/** Cotação fixa, para o teste não depender do Banco Central. */
export const cotacaoFixa = async () => '5.4212'

type RespostaFalsa = {
  parsed_output?: unknown
  input_tokens?: number
  output_tokens?: number
  stop_reason?: string
  stop_details?: { category: string } | null
}

/**
 * Cliente da Anthropic falso. Guarda o que recebeu, para o teste conferir que o
 * Cérebro certo entrou no prompt.
 *
 * O `as unknown as ModelClient` existe porque o tipo real do SDK tem genéricos
 * de `parse` que um objeto literal não satisfaz. O que importa é o runtime
 * receber exatamente os campos que usa — e ele usa só estes.
 */
export function clienteFalso(resposta: RespostaFalsa = {}) {
  const chamadas: { system: string; input: string; model: string; images: number }[] = []

  type Bloco = { type: string; text?: string }

  const client = {
    messages: {
      parse: async (params: {
        system: string
        model: string
        messages: { content: string | Bloco[] }[]
      }) => {
        // Com imagem, o conteúdo é uma lista de blocos; o texto do pedido é o
        // bloco de texto, e as imagens são contadas.
        const conteudo = params.messages[0]!.content
        const blocos = typeof conteudo === 'string' ? [] : conteudo

        chamadas.push({
          system: params.system,
          model: params.model,
          input:
            typeof conteudo === 'string'
              ? conteudo
              : (blocos.find((b) => b.type === 'text')?.text ?? ''),
          images: blocos.filter((b) => b.type === 'image').length,
        })

        return {
          // `in` e nao `??`: o teste precisa poder mandar null de proposito,
          // que e como a API avisa que a resposta nao encaixou no schema.
          parsed_output: 'parsed_output' in resposta ? resposta.parsed_output : { ok: true },
          stop_reason: resposta.stop_reason ?? 'end_turn',
          stop_details: resposta.stop_details ?? null,
          usage: {
            input_tokens: resposta.input_tokens ?? 1000,
            output_tokens: resposta.output_tokens ?? 500,
          },
        }
      },
    },
  } as unknown as ModelClient

  return { client, chamadas }
}

/** Cliente que estoura, para testar o registro de falha. */
export function clienteQueFalha(mensagem = 'a rede caiu') {
  return {
    messages: {
      parse: async () => {
        throw new Error(mensagem)
      },
    },
  } as unknown as ModelClient
}
