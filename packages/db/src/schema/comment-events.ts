import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { commentRules } from './comment-rules'
import { companies } from './companies'

/** Histórico do que a automação respondeu, para auditar o que foi dito em nome da marca. */
export const commentEvents = pgTable(
  'comment_events',
  {
    id: uuid().primaryKey().defaultRandom(),
    companyId: uuid()
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    ruleId: uuid().references(() => commentRules.id, { onDelete: 'set null' }),
    instagramCommentId: text().notNull(),
    repliedText: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('comment_events_company_created_idx').on(table.companyId, table.createdAt)],
)

export type CommentEvent = typeof commentEvents.$inferSelect
export type NewCommentEvent = typeof commentEvents.$inferInsert
