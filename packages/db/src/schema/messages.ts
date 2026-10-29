import { index, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core'
import { companies } from './companies'
import { conversations } from './conversations'
import { messageAuthorEnum, messageDirectionEnum } from './enums'

/**
 * Histórico da conversa.
 *
 * O conteúdo fica aqui e só aqui: o CLAUDE.md proíbe jogar mensagem completa
 * em log. `externalId` é o id da Meta, e é único por empresa para a mesma
 * mensagem não entrar duas vezes quando o webhook reenvia.
 */
export const messages = pgTable(
  'messages',
  {
    id: uuid().primaryKey().defaultRandom(),
    companyId: uuid()
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    conversationId: uuid()
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    direction: messageDirectionEnum().notNull(),
    author: messageAuthorEnum().notNull(),
    body: text().notNull(),
    externalId: text(),
    sentAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('messages_conversation_sent_idx').on(table.conversationId, table.sentAt),
    unique('messages_company_external_unique').on(table.companyId, table.externalId),
  ],
)

export type Message = typeof messages.$inferSelect
export type NewMessage = typeof messages.$inferInsert
