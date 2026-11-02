/**
 * O pedaço da Graph API que a plataforma usa hoje.
 *
 * Recebido por parâmetro nas rotas, como o buscador de cotação da PTAX e o
 * cliente da Anthropic — é o que deixa o teste exercitar o caminho de produção
 * sem rede. Quando o worker precisar disto (coleta diária de métrica), vira
 * pacote em packages/.
 */

/** Versão da Graph API. Vem do .env para subir de versão sem mexer em código. */
const versao = () => process.env.WHATSAPP_API_VERSION || 'v21.0'

const CAMPOS = 'id,username,followers_count,name,profile_picture_url'

export type InstagramAccount = {
  id: string
  username: string
  followersCount: number
  name: string | null
  profilePictureUrl: string | null
}

export type InstagramAccountFetcher = (
  token: string,
  igAccountId?: string,
) => Promise<InstagramAccount>

export class InstagramApiError extends Error {}

type RespostaDaMeta = Record<string, unknown> & {
  error?: { message?: string; code?: number }
  data?: unknown[]
}

/** Uma chamada à Graph API. Devolve o corpo, ou `null` quando a Meta recusou. */
async function chamar(caminho: string, token: string, campos?: string): Promise<RespostaDaMeta> {
  // `caminho` pode trazer querystring (ex.: "123/insights?metric=reach"); o
  // construtor da URL preserva o que ja vem e os append abaixo acrescentam.
  const url = new URL(`https://graph.facebook.com/${versao()}/${caminho}`)
  if (campos) url.searchParams.set('fields', campos)
  url.searchParams.set('access_token', token)

  let resposta: Response

  try {
    resposta = await fetch(url, { signal: AbortSignal.timeout(15_000) })
  } catch (erro) {
    throw new InstagramApiError(
      `Não consegui falar com a Meta: ${erro instanceof Error ? erro.message : 'erro de rede'}.`,
    )
  }

  const corpo = (await resposta.json().catch(() => null)) as RespostaDaMeta | null

  return corpo ?? {}
}

/** Transforma o objeto da Meta no nosso, quando ele é mesmo uma conta. */
function paraConta(bruto: Record<string, unknown> | undefined): InstagramAccount | null {
  if (!bruto || typeof bruto.id !== 'string' || typeof bruto.username !== 'string') return null

  return {
    id: bruto.id,
    username: bruto.username,
    followersCount: typeof bruto.followers_count === 'number' ? bruto.followers_count : 0,
    name: typeof bruto.name === 'string' ? bruto.name : null,
    profilePictureUrl:
      typeof bruto.profile_picture_url === 'string' ? bruto.profile_picture_url : null,
  }
}

/**
 * Descobre, ou confirma, a conta profissional que o token enxerga.
 *
 * **Por que não `/me`:** com token de usuário de sistema, `/me` é o próprio
 * usuário de sistema — um robô, que não tem seguidores. Pedir
 * `followers_count` dele devolve "(#100) Tried accessing nonexisting field".
 * Foi o primeiro erro real que esta função levou.
 *
 * Com o id em mãos, a consulta é direta e certa. Sem ele, tentamos descobrir:
 * os negócios do token, e as contas do Instagram de cada negócio. Se a
 * descoberta falhar, o erro diz para informar o id — que fica à vista no
 * Gerenciador de Negócios, embaixo do @ da conta.
 */
export const fetchInstagramAccount: InstagramAccountFetcher = async (token, igAccountId) => {
  // Caminho certo: o id foi informado.
  if (igAccountId) {
    const bruto = await chamar(igAccountId, token, CAMPOS)

    if (bruto.error) {
      throw new InstagramApiError(
        `${bruto.error.message ?? 'A Meta recusou a consulta.'} ` +
          `(conferindo a conta ${igAccountId})`,
      )
    }

    const conta = paraConta(bruto)
    if (!conta) {
      throw new InstagramApiError(
        `O id ${igAccountId} não é de uma conta profissional do Instagram.`,
      )
    }

    return conta
  }

  // Sem id: descobrir pelos negócios que o token alcança.
  const tentativas: string[] = []

  const negocios = await chamar('me/businesses', token, 'id,name')

  if (negocios.error) {
    tentativas.push(`me/businesses: ${negocios.error.message}`)
  } else if (Array.isArray(negocios.data)) {
    for (const negocio of negocios.data) {
      const id = (negocio as { id?: string }).id
      if (!id) continue

      for (const aresta of ['owned_instagram_accounts', 'instagram_accounts']) {
        const lista = await chamar(`${id}/${aresta}`, token, CAMPOS)

        if (lista.error) {
          tentativas.push(`${aresta}: ${lista.error.message}`)
          continue
        }

        const primeira = Array.isArray(lista.data)
          ? paraConta(lista.data[0] as Record<string, unknown>)
          : null

        if (primeira) return primeira
      }
    }
  }

  throw new InstagramApiError(
    'Não consegui descobrir sozinho qual conta do Instagram este token alcança. ' +
      'Informe o ID da conta no campo abaixo — ele aparece no Gerenciador de Negócios, ' +
      'em Contas do Instagram, logo abaixo do @ do perfil.' +
      (tentativas.length > 0 ? ` (tentei: ${tentativas.join(' | ')})` : ''),
  )
}

/** O que uma coleta trouxe. Campo nulo = a Meta não entregou aquele número. */
export type InstagramInsights = {
  followers: number | null
  reach: number | null
  views: number | null
  accountsEngaged: number | null
  interactions: number | null
  /** O que a Meta recusou, com o motivo dela. A tela mostra isso. */
  recusadas: { metrica: string; motivo: string }[]
}

export type InstagramInsightsFetcher = (
  token: string,
  igAccountId: string,
) => Promise<InstagramInsights>

/** As métricas de perfil que a API aceita hoje, com period=day. */
const METRICAS = ['reach', 'views', 'total_interactions', 'accounts_engaged'] as const

/**
 * Quais métricas a Meta só entrega como total, e não como série dia a dia.
 *
 * A documentação diz: `metric_type=time_series` vale só para `reach` (e para a
 * finada `impressions`); todas as outras aceitam **apenas** `total_value`. Sem
 * esse parâmetro a Meta recusa a métrica — foi o que deixou views, contas
 * engajadas e interações vazias na primeira coleta real do @somosfirmus.
 */
const SO_TOTAL = new Set(['views', 'total_interactions', 'accounts_engaged', 'profile_links_taps'])

/** O caminho da consulta de uma métrica do perfil, com o tipo que ela exige. */
export function insightsPath(igAccountId: string, metrica: string): string {
  const tipo = SO_TOTAL.has(metrica) ? '&metric_type=total_value' : ''
  return `${igAccountId}/insights?metric=${metrica}&period=day${tipo}`
}

/**
 * Coleta as métricas do dia.
 *
 * **Uma métrica por chamada, de propósito.** A Meta aposenta métrica com
 * frequência — `impressions` morreu em abril de 2025, `reach` já tem data
 * marcada — e algumas não funcionam em conta pequena (`follower_count` exige
 * 100 seguidores). Pedindo todas juntas, um nome recusado derrubaria a coleta
 * inteira; pedindo uma a uma, o que funciona é guardado e o que falhou é
 * relatado com a mensagem da Meta.
 *
 * Seguidores vêm do perfil, não das insights, porque ali sempre funciona.
 */
export const fetchInstagramInsights: InstagramInsightsFetcher = async (token, igAccountId) => {
  const recusadas: { metrica: string; motivo: string }[] = []

  const perfil = await chamar(igAccountId, token, 'followers_count')
  const followers =
    typeof perfil.followers_count === 'number' ? perfil.followers_count : null

  if (perfil.error) {
    recusadas.push({ metrica: 'followers_count', motivo: perfil.error.message ?? 'recusada' })
  }

  const valores = new Map<string, number>()

  for (const metrica of METRICAS) {
    const url = insightsPath(igAccountId, metrica)
    const resposta = await chamar(url, token)

    if (resposta.error) {
      recusadas.push({ metrica, motivo: resposta.error.message ?? 'recusada' })
      continue
    }

    // A resposta vem como uma lista de métricas; cada uma traz `values` com um
    // ponto por dia, ou `total_value` quando a métrica só aceita total.
    const primeira = Array.isArray(resposta.data)
      ? (resposta.data[0] as Record<string, unknown> | undefined)
      : undefined

    const total = (primeira?.total_value as { value?: unknown } | undefined)?.value
    const serie = Array.isArray(primeira?.values)
      ? (primeira.values.at(-1) as { value?: unknown } | undefined)?.value
      : undefined

    const valor = typeof total === 'number' ? total : typeof serie === 'number' ? serie : null

    if (valor === null) {
      recusadas.push({ metrica, motivo: 'a Meta respondeu sem número para este dia' })
      continue
    }

    valores.set(metrica, valor)
  }

  return {
    followers,
    reach: valores.get('reach') ?? null,
    views: valores.get('views') ?? null,
    accountsEngaged: valores.get('accounts_engaged') ?? null,
    interactions: valores.get('total_interactions') ?? null,
    recusadas,
  }
}
