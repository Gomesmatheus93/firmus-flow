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

export type InstagramAccount = {
  id: string
  username: string
  followersCount: number
  name: string | null
  profilePictureUrl: string | null
}

/**
 * Busca a conta profissional que o token enxerga.
 *
 * Serve de prova do token: se a Meta responde com uma conta, o token vale e é
 * de uma conta profissional. Guardar sem conferir deixaria o chefe achando que
 * conectou, e o erro só apareceria na primeira publicação, dias depois.
 */
export type InstagramAccountFetcher = (token: string) => Promise<InstagramAccount>

export class InstagramApiError extends Error {}

/** O que a Graph API devolve quando algo dá errado. */
type RespostaDeErro = {
  error?: { message?: string; type?: string; code?: number }
}

/**
 * Implementação de verdade, contra a Graph API.
 *
 * Pede a conta profissional ligada ao token. Com token de usuário de sistema,
 * `/me/accounts` não serve — o caminho é a conta do Instagram no portfólio, que
 * vem em `/me?fields=...` para o token do Instagram.
 */
export const fetchInstagramAccount: InstagramAccountFetcher = async (token) => {
  const url = new URL(`https://graph.facebook.com/${versao()}/me`)
  url.searchParams.set('fields', 'id,username,followers_count,name,profile_picture_url')
  url.searchParams.set('access_token', token)

  let resposta: Response

  try {
    resposta = await fetch(url, { signal: AbortSignal.timeout(15_000) })
  } catch (erro) {
    throw new InstagramApiError(
      `Não consegui falar com a Meta: ${erro instanceof Error ? erro.message : 'erro de rede'}.`,
    )
  }

  const corpo = (await resposta.json().catch(() => null)) as
    | (RespostaDeErro & Record<string, unknown>)
    | null

  if (!resposta.ok || corpo?.error) {
    // A mensagem da Meta vem em inglês, mas é específica ("token expired",
    // "unsupported get request"). Repassar é mais útil do que traduzir por
    // cima e perder a pista.
    throw new InstagramApiError(
      corpo?.error?.message ?? `A Meta recusou o token (HTTP ${resposta.status}).`,
    )
  }

  if (!corpo || typeof corpo.id !== 'string' || typeof corpo.username !== 'string') {
    throw new InstagramApiError(
      'A Meta respondeu, mas sem conta do Instagram. Confira se o token foi gerado com a ' +
        'conta profissional atribuída ao usuário do sistema.',
    )
  }

  return {
    id: corpo.id,
    username: corpo.username,
    followersCount: typeof corpo.followers_count === 'number' ? corpo.followers_count : 0,
    name: typeof corpo.name === 'string' ? corpo.name : null,
    profilePictureUrl:
      typeof corpo.profile_picture_url === 'string' ? corpo.profile_picture_url : null,
  }
}
