/**
 * O retrato do Instagram que a tela de Analytics mostra.
 *
 * É o que a Meta entrega hoje sobre a conta da própria empresa, numa janela de
 * 30 dias. Todo número é anulável: a Meta recusa métrica em conta pequena
 * (menos de 100 seguidores) e aposenta métrica com frequência. Nulo quer dizer
 * "a Meta não entregou", e a tela mostra isso em vez de inventar um zero.
 */

export type InstagramProfile = {
  username: string
  name: string | null
  biography: string | null
  website: string | null
  profilePictureUrl: string | null
  followers: number | null
  follows: number | null
  mediaCount: number | null
}

/** Totais da janela de 30 dias, um por métrica de conta da Meta. */
export type InstagramTotals = {
  reach: number | null
  views: number | null
  accountsEngaged: number | null
  interactions: number | null
  likes: number | null
  comments: number | null
  shares: number | null
  saves: number | null
  replies: number | null
  reposts: number | null
  /** De `follows_and_unfollows`. Só vem acima de 100 seguidores. */
  follows: number | null
  unfollows: number | null
  /** Toques nos botões de contato do perfil (`profile_links_taps`). */
  profileLinksTaps: number | null
}

/** Um ponto de série diária. `date` é AAAA-MM-DD, em UTC. */
export type DailyPoint = { date: string; value: number }

/** Uma fatia de público: a cidade, a faixa de idade, o gênero. */
export type AudienceSlice = { key: string; value: number }

export type InstagramSnapshot = {
  profile: InstagramProfile
  /** Começo e fim da janela, em ISO. */
  since: string
  until: string
  totals: InstagramTotals
  /**
   * Toques por tipo de botão, como a Meta nomeia: CALL, DIRECTION, EMAIL,
   * TEXT, BOOK_NOW… Tipo que não aparece teve zero toques ou não existe no perfil.
   */
  contactTaps: Record<string, number>
  reachByDay: DailyPoint[]
  /** Seguidores novos por dia (`follower_count`). Vazio abaixo de 100 seguidores. */
  newFollowersByDay: DailyPoint[]
  /** Público dos seguidores. `null` quando a Meta não entregou (menos de 100 seguidores). */
  audience: {
    city: AudienceSlice[]
    country: AudienceSlice[]
    age: AudienceSlice[]
    gender: AudienceSlice[]
  } | null
  /** Seguidores online por hora do dia (0 a 23, no fuso da conta). */
  onlineByHour: { hour: number; value: number }[] | null
}

/** Um post do feed, com os números que a Meta dá por post. */
export type InstagramPost = {
  igMediaId: string
  caption: string | null
  mediaType: string
  mediaProductType: string | null
  permalink: string | null
  thumbnailUrl: string | null
  postedAt: string
  likes: number | null
  comments: number | null
  reach: number | null
  views: number | null
  saves: number | null
  shares: number | null
  profileVisits: number | null
  totalInteractions: number | null
}

/** O pedaço do post que a conta do score usa. */
type PostNumbers = Pick<InstagramPost, 'likes' | 'comments' | 'shares' | 'saves' | 'reach'>

/**
 * Score de Engajamento de um post: quantas interações ele teve a cada 100
 * pessoas alcançadas.
 *
 *   (curtidas + comentários + compartilhamentos + salvos) ÷ alcance × 100
 *
 * Dividir pelo alcance, e não pelos seguidores, é o que deixa o número justo:
 * um post que chegou a pouca gente mas engajou quem viu pontua alto.
 *
 * Sem alcance não há conta — devolve `null`, nunca zero.
 */
export function postEngagementScore(post: PostNumbers): number | null {
  if (!post.reach || post.reach <= 0) return null

  const interacoes =
    (post.likes ?? 0) + (post.comments ?? 0) + (post.shares ?? 0) + (post.saves ?? 0)

  return Math.round((interacoes / post.reach) * 10_000) / 100
}

/** O score da conta: a média dos posts que têm alcance. */
export function accountEngagementScore(posts: PostNumbers[]): number | null {
  const notas = posts.map(postEngagementScore).filter((n): n is number => n !== null)
  if (notas.length === 0) return null

  const media = notas.reduce((soma, n) => soma + n, 0) / notas.length
  return Math.round(media * 100) / 100
}
