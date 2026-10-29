import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { companies } from './companies'
import { contacts } from './contacts'
import { leadStageEnum } from './enums'

/** Contato que a IA qualificou durante o atendimento. */
export const leads = pgTable(
  'leads',
  {
    id: uuid().primaryKey().defaultRandom(),
    companyId: uuid()
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    contactId: uuid().references(() => contacts.id, { onDelete: 'set null' }),
    name: text().notNull(),
    interest: text(),
    /** De onde veio: WhatsApp, Instagram, indicação. */
    source: text(),
    stage: leadStageEnum().notNull().default('novo'),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('leads_company_created_idx').on(table.companyId, table.createdAt)],
)

export type Lead = typeof leads.$inferSelect
export type NewLead = typeof leads.$inferInsert
