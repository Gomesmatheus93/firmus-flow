import type { InstagramSnapshot } from '@firmus/shared'
import { jsonb, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core'
import { companies } from './companies'

/**
 * O último retrato da conta do Instagram: perfil, totais de 30 dias, séries,
 * público e horário dos seguidores. Uma linha por empresa, trocada a cada
 * atualização.
 *
 * Fica em `jsonb` porque é a fotografia do que a Meta devolveu, e a Meta muda
 * o cardápio de métricas com frequência: uma coluna por métrica viraria uma
 * migration a cada aposentadoria. O formato é `InstagramSnapshot`, de
 * @firmus/shared. O histórico dia a dia continua em `instagram_metrics`.
 */
export const instagramSnapshots = pgTable('instagram_snapshots', {
  id: uuid().primaryKey().defaultRandom(),
  companyId: uuid()
    .notNull()
    .unique()
    .references(() => companies.id, { onDelete: 'cascade' }),

  data: jsonb().$type<InstagramSnapshot>().notNull(),

  /** O que a Meta recusou nessa coleta, com o motivo dela. É o "Diagnosticar". */
  refused: jsonb().$type<{ metrica: string; motivo: string }[]>().notNull().default([]),

  fetchedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
})

export type InstagramSnapshotRow = typeof instagramSnapshots.$inferSelect
export type NewInstagramSnapshotRow = typeof instagramSnapshots.$inferInsert
