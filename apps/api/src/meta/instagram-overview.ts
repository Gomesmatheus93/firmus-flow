/**
 * O retrato completo da conta para a tela de Analytics: perfil, totais de 30
 * dias, séries, público, horário dos seguidores e os últimos posts.
 *
 * Mesma filosofia de `fetchInstagramInsights`: **uma métrica por chamada**,
 * para uma recusa não derrubar as outras. O que a Meta recusa vai para
 * `recusadas`, com a mensagem dela, e o campo fica nulo. Nunca zero.
 *
 * As chamadas saem em paralelo: são umas 30, e uma de cada vez a tela
 * esperaria meio minuto.
 *
 * O que a Meta **não entrega mais** e por isso não está aqui (conferido na
 * documentação em 02/11/2026): `impressions` (saiu em abril de 2025, o
 * substituto é `views`), `profile_views` e `website_clicks`. Visitas ao perfil
 * ainda existem **por post** (`profile_visits`), e é daí que a tela soma.
 */
import type {
  AudienceSlice,
  DailyPoint,
  InstagramPost,
  InstagramProfile,
  InstagramSnapshot,
  InstagramTotals,
} from '@firmus/shared'
import { chamar, InstagramApiError, type RespostaDaMeta } from './instagram'

export type InstagramOverview = {
  snapshot: InstagramSnapshot
  posts: InstagramPost[]
  recusadas: { metrica: string; motivo: string }[]
}

export type InstagramOverviewFetcher = (
  token: string,
  igAccountId: string,
) => Promise<InstagramOverview>

/** A função que fala com a Graph API. Trocada nos testes por uma tabela de respostas. */
export type GraphCaller = (
  caminho: string,
  token: string,
  campos?: string,
) => Promise<RespostaDaMeta>

/** Quantos posts o Analytics olha. Doze é o que cabe no gráfico de barras do score. */
export const POSTS_ANALISADOS = 12

const CAMPOS_PERFIL =
  'username,name,biography,website,profile_picture_url,followers_count,follows_count,media_count'

const CAMPOS_POST =
  'id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count'

/** Métricas de conta que só aceitam total, com o campo de `InstagramTotals` onde cada uma cai. */
const TOTAIS = {
  views: 'views',
  accounts_engaged: 'accountsEngaged',
  total_interactions: 'interactions',
  likes: 'likes',
  comments: 'comments',
  shares: 'shares',
  saves: 'saves',
  replies: 'replies',
  reposts: 'reposts',
} as const satisfies Record<string, keyof InstagramTotals>

/**
 * A Meta aceita no máximo 30 dias entre `since` e `until`. Um minuto a menos
 * para a borda nunca passar do limite por causa do relógio.
 */
const JANELA_SEGUNDOS = 30 * 86_400 - 60

const numero = (v: unknown): number | null => (typeof v === 'number' ? v : null)
const texto = (v: unknown): string | null => (typeof v === 'string' && v !== '' ? v : null)

type MetricaBruta = {
  values?: { value?: unknown; end_time?: string }[]
  total_value?: {
    value?: unknown
    breakdowns?: { results?: { dimension_values?: string[]; value?: unknown }[] }[]
  }
}

const primeiraMetrica = (r: RespostaDaMeta): MetricaBruta | undefined =>
  Array.isArray(r.data) ? (r.data[0] as MetricaBruta | undefined) : undefined

/**
 * O dia que um ponto da série mede. A Meta marca o **fim** do dia
 * (`end_time`, ex.: 08:00 UTC do dia seguinte, no fuso do Pacífico), então
 * recuar 12 horas cai sempre dentro do dia certo.
 */
function diaDoPonto(endTime: string): string {
  return new Date(new Date(endTime).getTime() - 12 * 3_600_000).toISOString().slice(0, 10)
}

/** As fatias de um `breakdown`, já somadas por chave e da maior para a menor. */
function fatias(m: MetricaBruta | undefined): AudienceSlice[] {
  const resultados = m?.total_value?.breakdowns?.[0]?.results ?? []
  const soma = new Map<string, number>()

  for (const r of resultados) {
    const chave = r.dimension_values?.[0]
    const valor = numero(r.value)
    if (chave && valor !== null) soma.set(chave, (soma.get(chave) ?? 0) + valor)
  }

  return [...soma].map(([key, value]) => ({ key, value })).sort((a, b) => b.value - a.value)
}

function serie(m: MetricaBruta | undefined): DailyPoint[] {
  return (m?.values ?? []).flatMap((p) => {
    const valor = numero(p.value)
    return valor !== null && p.end_time ? [{ date: diaDoPonto(p.end_time), value: valor }] : []
  })
}

/** Média por hora dos dias que a Meta devolveu em `online_followers`. */
function porHora(m: MetricaBruta | undefined): { hour: number; value: number }[] | null {
  const dias = (m?.values ?? [])
    .map((p) => p.value)
    .filter((v): v is Record<string, number> => typeof v === 'object' && v !== null)

  if (dias.length === 0) return null

  return Array.from({ length: 24 }, (_, hour) => {
    const valores = dias.map((d) => numero(d[String(hour)])).filter((v): v is number => v !== null)
    const media = valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : 0
    return { hour, value: Math.round(media) }
  })
}

/** As métricas de um post, conforme o tipo. Reels não tem `profile_visits`. */
function metricasDoPost(mediaProductType: string | null): string {
  const base = 'reach,likes,comments,saved,shares,views,total_interactions'
  return mediaProductType === 'REELS' ? base : `${base},profile_visits`
}

export function createOverviewFetcher(call: GraphCaller = chamar): InstagramOverviewFetcher {
  return async (token, igAccountId) => {
    const recusadas: { metrica: string; motivo: string }[] = []
    const recusar = (metrica: string, r: RespostaDaMeta) => {
      if (r.error) recusadas.push({ metrica, motivo: r.error.message ?? 'recusada' })
      return !r.error
    }

    const until = Math.floor(Date.now() / 1000)
    const since = until - JANELA_SEGUNDOS
    const janela = `&since=${since}&until=${until}`
    const insights = (query: string) => call(`${igAccountId}/insights?${query}`, token)
    const total = (metrica: string, extra = '') =>
      insights(`metric=${metrica}&period=day&metric_type=total_value${janela}${extra}`)
    const publico = (breakdown: string) =>
      insights(
        `metric=follower_demographics&period=lifetime&metric_type=total_value` +
          `&timeframe=this_month&breakdown=${breakdown}`,
      )

    const [
      perfil,
      alcance,
      seguidoresNovos,
      totais,
      seguirDeixar,
      toques,
      demografia,
      online,
      lista,
    ] = await Promise.all([
      call(igAccountId, token, CAMPOS_PERFIL),
      insights(`metric=reach&period=day${janela}`),
      insights(`metric=follower_count&period=day${janela}`),
      Promise.all(Object.keys(TOTAIS).map((m) => total(m))),
      total('follows_and_unfollows', '&breakdown=follow_type'),
      total('profile_links_taps', '&breakdown=contact_button_type'),
      Promise.all(['city', 'country', 'age', 'gender'].map(publico)),
      insights('metric=online_followers&period=lifetime'),
      call(`${igAccountId}/media?limit=${POSTS_ANALISADOS}`, token, CAMPOS_POST),
    ])

    // Sem o perfil não há tela: o token caiu ou a conta não é mais acessível.
    if (perfil.error || typeof perfil.username !== 'string') {
      throw new InstagramApiError(perfil.error?.message ?? 'A Meta não devolveu o perfil da conta.')
    }

    const profile: InstagramProfile = {
      username: perfil.username,
      name: texto(perfil.name),
      biography: texto(perfil.biography),
      website: texto(perfil.website),
      profilePictureUrl: texto(perfil.profile_picture_url),
      followers: numero(perfil.followers_count),
      follows: numero(perfil.follows_count),
      mediaCount: numero(perfil.media_count),
    }

    const totals: InstagramTotals = {
      reach: null,
      views: null,
      accountsEngaged: null,
      interactions: null,
      likes: null,
      comments: null,
      shares: null,
      saves: null,
      replies: null,
      reposts: null,
      follows: null,
      unfollows: null,
      profileLinksTaps: null,
    }

    Object.entries(TOTAIS).forEach(([metrica, campo], i) => {
      const r = totais[i]!
      if (recusar(metrica, r)) totals[campo] = numero(primeiraMetrica(r)?.total_value?.value)
    })

    const reachByDay = recusar('reach', alcance) ? serie(primeiraMetrica(alcance)) : []
    // O total de alcance é a soma dos dias. Não é o "alcance único" da janela —
    // a mesma pessoa em dois dias conta duas vezes —, e a tela diz isso.
    if (reachByDay.length > 0) totals.reach = reachByDay.reduce((s, p) => s + p.value, 0)

    const newFollowersByDay = recusar('follower_count', seguidoresNovos)
      ? serie(primeiraMetrica(seguidoresNovos))
      : []

    if (recusar('follows_and_unfollows', seguirDeixar)) {
      // FOLLOWER = quem passou a seguir; NON_FOLLOWER = quem deixou de seguir.
      const porTipo = new Map(fatias(primeiraMetrica(seguirDeixar)).map((f) => [f.key, f.value]))
      totals.follows = porTipo.get('FOLLOWER') ?? null
      totals.unfollows = porTipo.get('NON_FOLLOWER') ?? null
    }

    const contactTaps: Record<string, number> = {}
    if (recusar('profile_links_taps', toques)) {
      const m = primeiraMetrica(toques)
      totals.profileLinksTaps = numero(m?.total_value?.value)
      for (const f of fatias(m)) contactTaps[f.key] = f.value
    }

    const [cidade, pais, idade, genero] = demografia.map((r, i) =>
      recusar(`follower_demographics (${['city', 'country', 'age', 'gender'][i]})`, r)
        ? fatias(primeiraMetrica(r))
        : [],
    ) as [AudienceSlice[], AudienceSlice[], AudienceSlice[], AudienceSlice[]]

    const audience =
      cidade.length + pais.length + idade.length + genero.length > 0
        ? { city: cidade, country: pais, age: idade, gender: genero }
        : null

    const onlineByHour = recusar('online_followers', online)
      ? porHora(primeiraMetrica(online))
      : null

    const posts = recusar('media', lista) ? await lerPosts(call, token, lista, recusadas) : []

    return {
      snapshot: {
        profile,
        since: new Date(since * 1000).toISOString(),
        until: new Date(until * 1000).toISOString(),
        totals,
        contactTaps,
        reachByDay,
        newFollowersByDay,
        audience,
        onlineByHour,
      },
      posts,
      recusadas,
    }
  }
}

/** Lê a lista de posts e busca as métricas de cada um, em paralelo. */
async function lerPosts(
  call: GraphCaller,
  token: string,
  lista: RespostaDaMeta,
  recusadas: { metrica: string; motivo: string }[],
): Promise<InstagramPost[]> {
  const brutos = (Array.isArray(lista.data) ? lista.data : []) as Record<string, unknown>[]

  const posts = await Promise.all(
    brutos.map(async (b): Promise<InstagramPost | null> => {
      const id = texto(b.id)
      const postedAt = texto(b.timestamp)
      if (!id || !postedAt) return null

      const mediaProductType = texto(b.media_product_type)
      let r = await call(`${id}/insights?metric=${metricasDoPost(mediaProductType)}`, token)
      // Post antigo ou de formato raro às vezes recusa uma métrica da lista, e
      // a Meta recusa a lista inteira. Tenta de novo com o mínimo do score.
      if (r.error) r = await call(`${id}/insights?metric=reach,saved,shares`, token)

      const valores = new Map<string, number>()
      if (r.error) {
        recusadas.push({ metrica: `insights do post ${id}`, motivo: r.error.message ?? 'recusada' })
      } else if (Array.isArray(r.data)) {
        for (const m of r.data as ({ name?: string } & MetricaBruta)[]) {
          const v = numero(m.values?.[0]?.value) ?? numero(m.total_value?.value)
          if (m.name && v !== null) valores.set(m.name, v)
        }
      }

      const mediaType = texto(b.media_type) ?? 'IMAGE'

      return {
        igMediaId: id,
        caption: texto(b.caption),
        mediaType,
        mediaProductType,
        permalink: texto(b.permalink),
        // Vídeo não tem imagem em media_url; a capa vem em thumbnail_url.
        thumbnailUrl: mediaType === 'VIDEO' ? texto(b.thumbnail_url) : texto(b.media_url),
        postedAt: new Date(postedAt).toISOString(),
        likes: valores.get('likes') ?? numero(b.like_count),
        comments: valores.get('comments') ?? numero(b.comments_count),
        reach: valores.get('reach') ?? null,
        views: valores.get('views') ?? null,
        saves: valores.get('saved') ?? null,
        shares: valores.get('shares') ?? null,
        profileVisits: valores.get('profile_visits') ?? null,
        totalInteractions: valores.get('total_interactions') ?? null,
      }
    }),
  )

  return posts.filter((p): p is InstagramPost => p !== null)
}

export const fetchInstagramOverview = createOverviewFetcher()
