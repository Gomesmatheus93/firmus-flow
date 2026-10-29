import { index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { companies } from './companies'

/**
 * Saída do agente ig-viral: o que está em alta no nicho do cliente.
 *
 * A API do Instagram não entrega dado de concorrente, então isto vem de pesquisa
 * na web. `sources` guarda de onde saiu cada achado — sem fonte, a tela não mostra.
 */
export const trendReports = pgTable(
  'trend_reports',
  {
    id: uuid().primaryKey().defaultRandom(),
    companyId: uuid()
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    niche: text().notNull(),
    findings: jsonb().$type<unknown>().notNull(),
    sources: jsonb().$type<{ title: string; url: string }[]>().notNull().default([]),
    generatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('trend_reports_company_generated_idx').on(table.companyId, table.generatedAt)],
)

export type TrendReport = typeof trendReports.$inferSelect
export type NewTrendReport = typeof trendReports.$inferInsert
