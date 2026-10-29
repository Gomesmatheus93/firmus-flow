import { index, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core'
import { companies } from './companies'

/**
 * Quem fala com a empresa no WhatsApp.
 * Guardamos só o necessário para atender: telefone e nome. Nada além disso (LGPD).
 */
export const contacts = pgTable(
  'contacts',
  {
    id: uuid().primaryKey().defaultRandom(),
    companyId: uuid()
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    phone: text().notNull(),
    name: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('contacts_company_phone_unique').on(table.companyId, table.phone),
    index('contacts_company_id_idx').on(table.companyId),
  ],
)

export type Contact = typeof contacts.$inferSelect
export type NewContact = typeof contacts.$inferInsert
