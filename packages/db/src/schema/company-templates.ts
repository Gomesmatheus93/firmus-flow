import { pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { companies } from './companies'

/**
 * Quais modelos visuais cada empresa pode usar na criação.
 *
 * Modelo é desenho exclusivo: os da Firmus Tech são só dela. Por isso quem
 * libera é uma linha aqui, por empresa, e não uma lista no código — a api
 * entrega à tela apenas o que estiver liberado para a empresa da sessão.
 *
 * `templateKey` é a chave de @firmus/templates (ex.: 'kit-carrossel'). Chave
 * que o código não conhece mais é ignorada na leitura, sem quebrar a tela.
 */
export const companyTemplates = pgTable(
  'company_templates',
  {
    companyId: uuid()
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    templateKey: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.companyId, table.templateKey] })],
)

export type CompanyTemplate = typeof companyTemplates.$inferSelect
export type NewCompanyTemplate = typeof companyTemplates.$inferInsert
