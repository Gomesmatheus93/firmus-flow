import { index, integer, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core'
import { companies } from './companies'
import { contacts } from './contacts'
import { conversationStatusEnum } from './enums'
import { users } from './users'

/**
 * Uma conversa por contato. `status` diz quem está conduzindo:
 * a IA, alguém da equipe, ou já acabou.
 */
export const conversations = pgTable(
  'conversations',
  {
    id: uuid().primaryKey().defaultRandom(),
    companyId: uuid()
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    contactId: uuid()
      .notNull()
      .references(() => contacts.id, { onDelete: 'cascade' }),
    status: conversationStatusEnum().notNull().default('ia'),
    /** Quem da equipe assumiu, quando a IA passou para humano. */
    assignedToUserId: uuid().references(() => users.id, { onDelete: 'set null' }),
    unreadCount: integer().notNull().default(0),
    lastMessageAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('conversations_company_last_message_idx').on(table.companyId, table.lastMessageAt),
  ],
)

export type Conversation = typeof conversations.$inferSelect
export type NewConversation = typeof conversations.$inferInsert
