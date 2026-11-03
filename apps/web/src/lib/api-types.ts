import type {
  CommentTrigger,
  ContentStatus,
  ContentType,
  InstagramPost,
  InstagramSnapshot,
  ConversationStatus,
  LeadStage,
  ScheduledPostStatus,
} from '@firmus/shared'

/** O que cada rota da api devolve. Um lugar só, para a tela e a api não divergirem. */

export type ContentItem = {
  id: string
  type: ContentType
  status: ContentStatus
  title: string
  caption: string | null
  reviewNote: string | null
  createdAt: string
  authorName: string | null
  /** Links temporários das imagens dos slides, na ordem. Vazio quando ainda não há imagem. */
  images: string[]
}

export type PlanEntry = {
  id: string
  scheduledDate: string
  format: ContentType
  theme: string
  goal: string | null
}

export type TrendReport = {
  id: string
  niche: string
  findings: unknown
  sources: { title: string; url: string }[]
  generatedAt: string
}

export type ScheduledPost = {
  id: string
  scheduledFor: string
  status: ScheduledPostStatus
  publishedAt: string | null
  errorMessage: string | null
  contentTitle: string
  contentType: ContentType
}

export type CommentRule = {
  id: string
  name: string
  triggerType: CommentTrigger
  keywords: string[]
  replyTemplate: string
  active: boolean
  createdAt: string
}

export type CommentEvent = {
  id: string
  instagramCommentId: string
  repliedText: string
  createdAt: string
}

export type MetricDay = {
  id: string
  capturedOn: string
  followers: number | null
  reach: number | null
  /** Substituiu `impressions`, que a Meta deprecou. */
  views: number | null
  /** Contas que interagiram. Ocupou o lugar de `profileViews`, que saiu da API. */
  accountsEngaged: number | null
  interactions: number | null
}

/** Um post com o Score de Engajamento já calculado pela api. */
export type AnalyticsPost = InstagramPost & { score: number | null }

/** O que `GET /metrics` devolve. */
export type MetricsResponse = {
  days: MetricDay[]
  snapshot:
    | (InstagramSnapshot & {
        fetchedAt: string
        refused: { metrica: string; motivo: string }[]
      })
    | null
  posts: AnalyticsPost[]
  score: number | null
}

export type ConversationRow = {
  id: string
  status: ConversationStatus
  unreadCount: number
  lastMessageAt: string | null
  contactName: string | null
  contactPhone: string
}

export type LeadRow = {
  id: string
  name: string
  interest: string | null
  source: string | null
  stage: LeadStage
  createdAt: string
}
