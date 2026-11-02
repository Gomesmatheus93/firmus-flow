import { integer, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core'
import { companies } from './companies'

/**
 * Os posts do feed da empresa, com os números que a Meta dá por post.
 *
 * Tabela própria, e não dentro do retrato, porque post é dado que outros
 * agentes vão querer ler (a auditoria olha quais posts engajaram). Cada
 * atualização corrige os números dos posts recentes; post antigo fica com o
 * último número visto.
 */
export const instagramMedia = pgTable(
  'instagram_media',
  {
    id: uuid().primaryKey().defaultRandom(),
    companyId: uuid()
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),

    igMediaId: text().notNull(),
    caption: text(),
    /** IMAGE, VIDEO ou CAROUSEL_ALBUM. */
    mediaType: text().notNull(),
    /** FEED ou REELS. */
    mediaProductType: text(),
    permalink: text(),
    /** Endereço da imagem no CDN da Meta. Expira; a atualização renova. */
    thumbnailUrl: text(),
    postedAt: timestamp({ withTimezone: true }).notNull(),

    likes: integer(),
    comments: integer(),
    reach: integer(),
    views: integer(),
    saves: integer(),
    shares: integer(),
    /** Só existe para post do feed; Reels não tem. */
    profileVisits: integer(),
    totalInteractions: integer(),

    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('instagram_media_company_media_unique').on(table.companyId, table.igMediaId)],
)

export type InstagramMediaRow = typeof instagramMedia.$inferSelect
export type NewInstagramMediaRow = typeof instagramMedia.$inferInsert
