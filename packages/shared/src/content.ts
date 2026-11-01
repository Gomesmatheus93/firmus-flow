import { z } from 'zod'

/** O que a plataforma cria para o Instagram. */
export const contentTypeSchema = z.enum(['carrossel', 'post', 'story', 'reel'])

export type ContentType = z.infer<typeof contentTypeSchema>

export const contentTypeLabel: Record<ContentType, string> = {
  carrossel: 'Carrossel',
  post: 'Post único',
  story: 'Story',
  reel: 'Reel',
}

/** Onde a peça está no fluxo de aprovação. */
export const contentStatusSchema = z.enum([
  'rascunho',
  'aguardando',
  'ajustar',
  'aprovado',
  'rejeitado',
])

export type ContentStatus = z.infer<typeof contentStatusSchema>

export const contentStatusLabel: Record<ContentStatus, string> = {
  rascunho: 'Rascunho',
  aguardando: 'Aguardando aprovação',
  ajustar: 'Pedido de ajuste',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
}
