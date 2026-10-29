import { date, index, pgTable, text, uuid, timestamp } from 'drizzle-orm/pg-core'
import { companies } from './companies'
import { contentItems } from './content-items'
import { contentTypeEnum } from './enums'

/**
 * Uma linha do calendário de planejamento: o que publicar, quando e por quê.
 * Vira conteúdo de verdade quando `contentItemId` é preenchido.
 */
export const planEntries = pgTable(
  'plan_entries',
  {
    id: uuid().primaryKey().defaultRandom(),
    companyId: uuid()
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    scheduledDate: date().notNull(),
    format: contentTypeEnum().notNull(),
    theme: text().notNull(),
    goal: text(),
    contentItemId: uuid().references(() => contentItems.id, { onDelete: 'set null' }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('plan_entries_company_date_idx').on(table.companyId, table.scheduledDate)],
)

export type PlanEntry = typeof planEntries.$inferSelect
export type NewPlanEntry = typeof planEntries.$inferInsert
