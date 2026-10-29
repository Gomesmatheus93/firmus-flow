import { index, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core'
import { companies } from './companies'
import { invitationStatusEnum, roleEnum } from './enums'
import { users } from './users'

/**
 * Convite de funcionário. O chefe informa o e-mail; geramos um `token`
 * aleatório que vira o link. Quem abre o link cria a conta e entra na empresa
 * com o papel registrado aqui.
 *
 * O token é o segredo: é por ele que o convidado é encontrado, nunca pelo id.
 */
export const invitations = pgTable(
  'invitations',
  {
    id: uuid().primaryKey().defaultRandom(),
    companyId: uuid()
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    email: text().notNull(),
    role: roleEnum().notNull().default('funcionario'),
    token: text().notNull().unique(),
    status: invitationStatusEnum().notNull().default('pendente'),
    invitedByUserId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    acceptedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Evita dois convites para o mesmo e-mail na mesma empresa.
    // Convite cancelado ou expirado é reaproveitado: a api atualiza a linha.
    unique('invitations_company_email_unique').on(table.companyId, table.email),
    index('invitations_company_id_idx').on(table.companyId),
  ],
)

export type Invitation = typeof invitations.$inferSelect
export type NewInvitation = typeof invitations.$inferInsert
