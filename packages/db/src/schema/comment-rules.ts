import { boolean, index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { companies } from './companies'
import { commentTriggerEnum } from './enums'
import { users } from './users'

/**
 * Regra de resposta automática a comentários no Instagram.
 *
 * É a única função da plataforma que funciona inteira sem agente e sem a Meta:
 * a regra é escrita e guardada aqui. O envio da resposta depende da permissão
 * instagram_manage_comments, que precisa de revisão do app.
 */
export const commentRules = pgTable(
  'comment_rules',
  {
    id: uuid().primaryKey().defaultRandom(),
    companyId: uuid()
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    name: text().notNull(),
    triggerType: commentTriggerEnum().notNull().default('palavra'),
    /** Palavras que disparam a regra. Vazio quando o gatilho é 'qualquer'. */
    keywords: jsonb().$type<string[]>().notNull().default([]),
    replyTemplate: text().notNull(),
    active: boolean().notNull().default(true),
    createdByUserId: uuid().references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('comment_rules_company_id_idx').on(table.companyId)],
)

export type CommentRule = typeof commentRules.$inferSelect
export type NewCommentRule = typeof commentRules.$inferInsert
