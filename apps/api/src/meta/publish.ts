import { InstagramApiError, type RespostaDaMeta } from './instagram'

/**
 * Publicar no Instagram pela Graph API (Content Publishing).
 *
 * O caminho é sempre em duas etapas: primeiro cria um "contêiner" com a
 * imagem (a Meta baixa a imagem do link que a gente passa), depois publica o
 * contêiner. Carrossel tem uma etapa a mais: um contêiner por imagem e um
 * contêiner-pai com a lista deles.
 *
 * A imagem precisa ser JPEG e estar num link público: quem prepara isso é
 * `publishing/images.ts`. Aqui só se fala com a Meta.
 */

const versao = () => process.env.WHATSAPP_API_VERSION || 'v21.0'

export type PublishInput = {
  token: string
  igAccountId: string
  type: 'carrossel' | 'post' | 'story'
  /** Links públicos de JPEG, na ordem dos slides. */
  imageUrls: string[]
  caption: string | null
  /** @ sem o arroba. A Meta aceita no máximo 3, e não em story. */
  collaborators: string[]
}

export type PublishResult = { mediaId: string; permalink: string | null }

export type InstagramPublisher = (input: PublishInput) => Promise<PublishResult>

/** Uma chamada à Graph API, com os parâmetros no corpo do POST (ou na URL do GET). */
async function graph(
  metodo: 'GET' | 'POST',
  caminho: string,
  token: string,
  params: Record<string, string> = {},
): Promise<RespostaDaMeta> {
  const url = new URL(`https://graph.facebook.com/${versao()}/${caminho}`)
  const corpo = new URLSearchParams({ ...params, access_token: token })
  let resposta: Response
  try {
    resposta =
      metodo === 'GET'
        ? await fetch(`${url}?${corpo}`, { signal: AbortSignal.timeout(20_000) })
        : await fetch(url, { method: 'POST', body: corpo, signal: AbortSignal.timeout(60_000) })
  } catch (erro) {
    throw new InstagramApiError(
      `Não consegui falar com a Meta: ${erro instanceof Error ? erro.message : 'erro de rede'}.`,
    )
  }
  const json = ((await resposta.json().catch(() => null)) ?? {}) as RespostaDaMeta
  if (json.error) throw new InstagramApiError(traduzir(json.error))
  return json
}

/** A mensagem da Meta, com uma dica quando o problema é conhecido. */
function traduzir(erro: { message?: string; code?: number }): string {
  const msg = erro.message ?? 'a Meta recusou sem dizer o motivo'
  if (erro.code === 10 || erro.code === 200 || /permission/i.test(msg)) {
    return `A Meta não deu permissão para publicar nesta conta (${msg}). O token precisa da permissão instagram_content_publish.`
  }
  if (/collaborator/i.test(msg)) return `A Meta recusou os colaboradores: ${msg}`
  if (/aspect ratio/i.test(msg)) return `A Meta recusou o tamanho da imagem: ${msg}`
  return `A Meta recusou: ${msg}`
}

const idDe = (r: RespostaDaMeta) => {
  if (typeof r.id !== 'string')
    throw new InstagramApiError('A Meta não devolveu o id do contêiner.')
  return r.id
}

const espera = (ms: number) => new Promise((ok) => setTimeout(ok, ms))

/**
 * Espera o contêiner ficar pronto. Imagem costuma ficar em segundos; se a
 * Meta der erro ou passar de um minuto, desiste com a mensagem dela.
 */
async function aguardarPronto(id: string, token: string) {
  for (let tentativa = 0; tentativa < 30; tentativa++) {
    const r = await graph('GET', id, token, { fields: 'status_code,status' })
    if (r.status_code === 'FINISHED') return
    if (r.status_code === 'ERROR' || r.status_code === 'EXPIRED') {
      throw new InstagramApiError(
        `A Meta não conseguiu processar a imagem (${String(r.status ?? r.status_code)}).`,
      )
    }
    await espera(2_000)
  }
  throw new InstagramApiError('A Meta demorou demais para processar as imagens. Tente de novo.')
}

/** O publicador de verdade. Nos testes entra um falso, sem rede. */
export const publishToInstagram: InstagramPublisher = async (input) => {
  const { token, igAccountId: ig, type, imageUrls, caption } = input
  if (imageUrls.length === 0) throw new InstagramApiError('A peça não tem arte para publicar.')

  // Legenda e colaboradores só no feed: story não tem nenhum dos dois.
  const extras: Record<string, string> = {}
  if (type !== 'story' && caption) extras.caption = caption
  if (type !== 'story' && input.collaborators.length > 0) {
    extras.collaborators = JSON.stringify(input.collaborators)
  }

  let containerId: string

  if (type === 'story') {
    containerId = idDe(
      await graph('POST', `${ig}/media`, token, {
        media_type: 'STORIES',
        image_url: imageUrls[0]!,
      }),
    )
    await aguardarPronto(containerId, token)
  } else if (type === 'carrossel' && imageUrls.length > 1) {
    if (imageUrls.length > 10) {
      throw new InstagramApiError('O Instagram aceita no máximo 10 slides por carrossel.')
    }
    const filhos: string[] = []
    for (const url of imageUrls) {
      filhos.push(
        idDe(
          await graph('POST', `${ig}/media`, token, { image_url: url, is_carousel_item: 'true' }),
        ),
      )
    }
    for (const filho of filhos) await aguardarPronto(filho, token)
    containerId = idDe(
      await graph('POST', `${ig}/media`, token, {
        media_type: 'CAROUSEL',
        children: filhos.join(','),
        ...extras,
      }),
    )
    await aguardarPronto(containerId, token)
  } else {
    containerId = idDe(
      await graph('POST', `${ig}/media`, token, { image_url: imageUrls[0]!, ...extras }),
    )
    await aguardarPronto(containerId, token)
  }

  const publicado = await graph('POST', `${ig}/media_publish`, token, { creation_id: containerId })
  const mediaId = idDe(publicado)

  // O link é só conveniência: se a Meta não der, o post saiu do mesmo jeito.
  const detalhe = await graph('GET', mediaId, token, { fields: 'permalink' }).catch(() => null)
  const permalink = typeof detalhe?.permalink === 'string' ? detalhe.permalink : null

  return { mediaId, permalink }
}
