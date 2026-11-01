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
