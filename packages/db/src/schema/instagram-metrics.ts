import { date, integer, pgTable, timestamp, unique, uuid } from 'drizzle-orm/pg-core'
import { companies } from './companies'

/**
 * Uma linha por dia de métrica do perfil, puxada da API do Instagram.
 * Depende da permissão instagram_manage_insights.
 *
 * Guardamos o histórico aqui porque a Meta só devolve uma janela curta.
 */
export const instagramMetrics = pgTable(
  'instagram_metrics',
  {
    id: uuid().primaryKey().defaultRandom(),
    companyId: uuid()
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    capturedOn: date().notNull(),
    followers: integer(),
    reach: integer(),
    impressions: integer(),
    profileViews: integer(),
    interactions: integer(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('instagram_metrics_company_day_unique').on(table.companyId, table.capturedOn)],
)

export type InstagramMetric = typeof instagramMetrics.$inferSelect
export type NewInstagramMetric = typeof instagramMetrics.$inferInsert
