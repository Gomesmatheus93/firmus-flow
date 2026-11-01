import { boolean, integer, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core'
import { billingIntervalEnum } from './enums'

/**
 * Os planos que a Firmus vende. Configuração nossa, não do cliente.
 *
 * Preço em centavos, como manda o CLAUDE.md: 12990 = R$ 129,90. Guardar
 * dinheiro em decimal flutuante é como se perde centavo sem perceber.
 */
export const plans = pgTable(
  'plans',
  {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull(),
    description: text(),
    priceCents: integer().notNull(),
    interval: billingIntervalEnum().notNull().default('mensal'),
    active: boolean().notNull().default(true),
    /** Id do mesmo plano no gateway de pagamento, quando houver. */
    externalId: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('plans_name_unique').on(table.name)],
)

export type Plan = typeof plans.$inferSelect
export type NewPlan = typeof plans.$inferInsert
