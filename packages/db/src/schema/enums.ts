import { pgEnum } from 'drizzle-orm/pg-core'

/**
 * Os valores vivem em @firmus/shared (roleSchema, invitationStatusSchema).
 * Aqui eles viram tipos do Postgres, para o banco recusar valor fora da lista.
 */
export const roleEnum = pgEnum('role', ['chefe', 'funcionario'])

export const invitationStatusEnum = pgEnum('invitation_status', [
  'pendente',
  'aceito',
  'cancelado',
  'expirado',
])
