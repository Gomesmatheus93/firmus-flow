import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { platformRoleEnum } from './enums'

/**
 * Espelho do usuário do Supabase Auth.
 * `id` é o mesmo id que o Supabase gera (auth.users.id) — não geramos outro.
 * Guardamos só o necessário para mostrar nome e e-mail sem ir ao Supabase.
 * A senha nunca passa por aqui: quem cuida dela é o Supabase.
 */
export const users = pgTable('users', {
  id: uuid().primaryKey(),
  email: text().notNull().unique(),
  fullName: text().notNull(),

  /**
   * Papel na plataforma inteira, separado do papel dentro de uma empresa
   * (que vive em memberships). Nulo para todo mundo, menos a equipe da Firmus.
   *
   * É promovido pela linha de comando, nunca por uma tela: um botão de
   * "virar operador" transformaria qualquer conta invadida em acesso total.
   */
  platformRole: platformRoleEnum(),

  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
