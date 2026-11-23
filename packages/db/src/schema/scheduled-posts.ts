import { boolean, index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { companies } from './companies'
import { contentItems } from './content-items'
import { scheduledPostStatusEnum } from './enums'
import { users } from './users'

/**
 * Fila do programador de postagem.
 *
 * `externalId` é o id que a Meta devolve quando a publicação sai. Enquanto a
 * revisão do app na Meta não estiver aprovada, nada daqui é publicado sozinho:
 * a fila existe, mas quem publica ainda é o cliente.
 */
export const scheduledPosts = pgTable(
  'scheduled_posts',
  {
    id: uuid().primaryKey().defaultRandom(),
    companyId: uuid()
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    contentItemId: uuid()
      .notNull()
      .references(() => contentItems.id, { onDelete: 'cascade' }),
    /**
     * Quando vai ao ar. Nulo enquanto a peça só foi enviada ao Programador e
     * ninguém escolheu a hora ainda (situação `rascunho`).
     */
    scheduledFor: timestamp({ withTimezone: true }),
    status: scheduledPostStatusEnum().notNull().default('rascunho'),
    publishedAt: timestamp({ withTimezone: true }),
    externalId: text(),
    /** Contas convidadas para o post em colaboração (collab), sem o @. */
    collaborators: jsonb().$type<string[]>().notNull().default([]),
    /** Se as regras da Automação de comentários valem para este post. */
    commentAutomation: boolean().notNull().default(false),
    errorMessage: text(),
    createdByUserId: uuid().references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('scheduled_posts_company_when_idx').on(table.companyId, table.scheduledFor)],
)

export type ScheduledPost = typeof scheduledPosts.$inferSelect
export type NewScheduledPost = typeof scheduledPosts.$inferInsert
