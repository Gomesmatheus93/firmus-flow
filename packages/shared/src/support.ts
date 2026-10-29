import { z } from 'zod'

/** Quem está conduzindo a conversa no WhatsApp. */
export const conversationStatusSchema = z.enum(['ia', 'humano', 'resolvida'])

export type ConversationStatus = z.infer<typeof conversationStatusSchema>

export const conversationStatusLabel: Record<ConversationStatus, string> = {
  ia: 'IA atendendo',
  humano: 'Com a equipe',
  resolvida: 'Resolvida',
}

/** Quem escreveu a mensagem. */
export const messageAuthorSchema = z.enum(['contato', 'ia', 'equipe'])

export type MessageAuthor = z.infer<typeof messageAuthorSchema>

/** Temperatura do lead. */
export const leadStageSchema = z.enum(['novo', 'quente', 'frio', 'ganho', 'perdido'])

export type LeadStage = z.infer<typeof leadStageSchema>

export const leadStageLabel: Record<LeadStage, string> = {
  novo: 'Novo',
  quente: 'Quente',
  frio: 'Frio',
  ganho: 'Ganho',
  perdido: 'Perdido',
}
