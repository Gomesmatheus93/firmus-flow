import { date, integer, pgTable, timestamp, unique, uuid } from 'drizzle-orm/pg-core'
import { companies } from './companies'

/**
 * Uma linha por dia de métrica do perfil, puxada da API do Instagram.
 * Depende da permissão instagram_manage_insights.
 *
 * Guardamos o histórico aqui porque a Meta só devolve uma janela curta.
 *
 * Os nomes seguem o que a API aceita **hoje**. A Meta aposenta métrica com
 * frequência — `impressions` morreu em abril de 2025 e `reach` já tem data
 * marcada —, então toda coluna aqui é anulável: dia em que a Meta recusar uma
 * delas fica com nulo naquele campo, e o resto do dia continua sendo guardado.
 */
export const instagramMetrics = pgTable(
  'instagram_metrics',
  {
    id: uuid().primaryKey().defaultRandom(),
    companyId: uuid()
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    capturedOn: date().notNull(),

    /** Do perfil (`followers_count`), nao das insights: a metrica de seguidor
     *  da API nao funciona em conta com menos de 100 seguidores. */
    followers: integer(),

    reach: integer(),
    /** Substituiu `impressions`, que a Meta deprecou em abril de 2025. */
    views: integer(),
    /** Contas que interagiram. Ocupa o lugar de `profile_views`, que saiu da API. */
    accountsEngaged: integer(),
    interactions: integer(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('instagram_metrics_company_day_unique').on(table.companyId, table.capturedOn)],
)

export type InstagramMetric = typeof instagramMetrics.$inferSelect
export type NewInstagramMetric = typeof instagramMetrics.$inferInsert
