import { index, pgTable, timestamp, unique, uuid } from 'drizzle-orm/pg-core'
import { companies } from './companies'
import { roleEnum } from './enums'
import { users } from './users'

/**
 * Liga um usuário a uma empresa com um papel. É a tabela que responde
 * "de qual empresa este usuário é, e o que ele pode fazer lá".
 * Toda rota de dado de cliente passa por aqui antes de tocar no banco.
 */
export const memberships = pgTable(
  'memberships',
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    companyId: uuid()
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    role: roleEnum().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Um usuário tem no máximo um papel por empresa.
    unique('memberships_user_company_unique').on(table.userId, table.companyId),
    // A consulta mais comum do sistema: "qual a empresa deste usuário?"
    index('memberships_user_id_idx').on(table.userId),
    index('memberships_company_id_idx').on(table.companyId),
  ],
)

export type Membership = typeof memberships.$inferSelect
export type NewMembership = typeof memberships.$inferInsert
