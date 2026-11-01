import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { companies } from './companies'
import { users } from './users'

/**
 * Registro de cada vez que um operador da Firmus entrou numa empresa cliente.
 *
 * Sem isto, "ver tudo" seria poder sem rastro. Com isto dá para responder, em
 * qualquer auditoria, quem olhou os dados de qual cliente e quando.
 *
 * Fica fora do `onDelete: cascade` do usuário de propósito: apagar o operador
 * não deve apagar o histórico do que ele acessou.
 */
export const operatorAccess = pgTable(
  'operator_access',
  {
    id: uuid().primaryKey().defaultRandom(),
    operatorUserId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    companyId: uuid()
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    /** O que ele foi buscar, quando a rota deixa claro. */
    route: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('operator_access_company_idx').on(table.companyId, table.createdAt),
    index('operator_access_operator_idx').on(table.operatorUserId, table.createdAt),
  ],
)

export type OperatorAccess = typeof operatorAccess.$inferSelect
export type NewOperatorAccess = typeof operatorAccess.$inferInsert
