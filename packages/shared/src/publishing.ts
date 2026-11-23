import { z } from 'zod'

/** Estado de uma postagem na fila do programador. */
export const scheduledPostStatusSchema = z.enum([
  'rascunho',
  'agendado',
  /** Enviando para a Meta agora. Trava contra publicar duas vezes. */
  'publicando',
  'publicado',
  'falhou',
  'cancelado',
])

export type ScheduledPostStatus = z.infer<typeof scheduledPostStatusSchema>

export const scheduledPostStatusLabel: Record<ScheduledPostStatus, string> = {
  rascunho: 'Rascunho',
  agendado: 'Agendado',
  publicando: 'Publicando',
  publicado: 'Publicado',
  falhou: 'Falhou',
  cancelado: 'Cancelado',
}

/** O que dispara uma regra de resposta automática a comentários. */
export const commentTriggerSchema = z.enum(['palavra', 'qualquer'])

export type CommentTrigger = z.infer<typeof commentTriggerSchema>

export const commentTriggerLabel: Record<CommentTrigger, string> = {
  palavra: 'Quando o comentário contém uma palavra',
  qualquer: 'Em qualquer comentário',
}
