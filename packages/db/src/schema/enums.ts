import { pgEnum } from 'drizzle-orm/pg-core'

/**
 * Os valores vivem em @firmus/shared. Aqui eles viram tipos do Postgres,
 * para o banco recusar valor fora da lista.
 */
export const roleEnum = pgEnum('role', ['chefe', 'funcionario'])

/**
 * Papel na plataforma inteira, separado do papel dentro de uma empresa.
 * Nulo = usuário comum. 'operador' = equipe da Firmus, com acesso de suporte.
 */
export const platformRoleEnum = pgEnum('platform_role', ['operador'])

export const invitationStatusEnum = pgEnum('invitation_status', [
  'pendente',
  'aceito',
  'cancelado',
  'expirado',
])

export const contentTypeEnum = pgEnum('content_type', ['carrossel', 'post', 'story', 'reel'])

export const contentStatusEnum = pgEnum('content_status', [
  'rascunho',
  'aguardando',
  'ajustar',
  'aprovado',
])

export const scheduledPostStatusEnum = pgEnum('scheduled_post_status', [
  'rascunho',
  'agendado',
  'publicado',
  'falhou',
  'cancelado',
])

export const commentTriggerEnum = pgEnum('comment_trigger', ['palavra', 'qualquer'])

export const conversationStatusEnum = pgEnum('conversation_status', ['ia', 'humano', 'resolvida'])

export const messageAuthorEnum = pgEnum('message_author', ['contato', 'ia', 'equipe'])

export const messageDirectionEnum = pgEnum('message_direction', ['entrada', 'saida'])

export const leadStageEnum = pgEnum('lead_stage', ['novo', 'quente', 'frio', 'ganho', 'perdido'])
