import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { companies } from './companies'
import { subscriptionStatusEnum } from './enums'
import { plans } from './plans'

/**
 * A assinatura de um cliente.
 *
 * `external_id` é o encaixe do gateway: quando a landing page de vendas
 * existir, o webhook passa a preencher e atualizar estas mesmas linhas.
 *
 * `canceled_at` e `cancel_reason` são o que responde "quantos desistiram".
 */
export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid().primaryKey().defaultRandom(),
    companyId: uuid()
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    planId: uuid().references(() => plans.id, { onDelete: 'restrict' }),
    status: subscriptionStatusEnum().notNull().default('teste'),
    startedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    /** Até quando o período pago vai. Depois disso, ou renova ou vence. */
    currentPeriodEnd: timestamp({ withTimezone: true }),
    canceledAt: timestamp({ withTimezone: true }),
    cancelReason: text(),
    externalId: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('subscriptions_company_idx').on(table.companyId),
    index('subscriptions_status_idx').on(table.status),
  ],
)

export type Subscription = typeof subscriptions.$inferSelect
export type NewSubscription = typeof subscriptions.$inferInsert
