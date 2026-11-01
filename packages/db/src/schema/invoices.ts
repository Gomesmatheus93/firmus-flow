import { date, index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { companies } from './companies'
import { invoiceStatusEnum } from './enums'
import { subscriptions } from './subscriptions'

/**
 * Cada cobrança emitida. É daqui que sai "quanto faturei" e "quem está devendo".
 *
 * Valor em centavos. `external_id` é o id da cobrança no gateway.
 */
export const invoices = pgTable(
  'invoices',
  {
    id: uuid().primaryKey().defaultRandom(),
    companyId: uuid()
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    subscriptionId: uuid().references(() => subscriptions.id, { onDelete: 'set null' }),
    amountCents: integer().notNull(),
    status: invoiceStatusEnum().notNull().default('aberta'),
    dueDate: date().notNull(),
    paidAt: timestamp({ withTimezone: true }),
    externalId: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('invoices_company_idx').on(table.companyId),
    index('invoices_status_due_idx').on(table.status, table.dueDate),
    index('invoices_paid_at_idx').on(table.paidAt),
  ],
)

export type Invoice = typeof invoices.$inferSelect
export type NewInvoice = typeof invoices.$inferInsert
