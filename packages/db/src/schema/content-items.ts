import { index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { companies } from './companies'
import { contentStatusEnum, contentTypeEnum } from './enums'
import { users } from './users'

/**
 * Toda peça que a plataforma cria: carrossel, post único, story e roteiro de reel.
 * Alimenta a tela de Criação e a fila de Aprovações.
 *
 * `body` guarda o que varia por formato — slides do carrossel, blocos do roteiro —
 * e por isso é jsonb em vez de colunas separadas por tipo.
 */
export const contentItems = pgTable(
  'content_items',
  {
    id: uuid().primaryKey().defaultRandom(),
    companyId: uuid()
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    type: contentTypeEnum().notNull(),
    status: contentStatusEnum().notNull().default('rascunho'),

    title: text().notNull(),
    caption: text(),
    body: jsonb().$type<unknown>(),

    createdByUserId: uuid().references(() => users.id, { onDelete: 'set null' }),
    approvedByUserId: uuid().references(() => users.id, { onDelete: 'set null' }),
    approvedAt: timestamp({ withTimezone: true }),
    /** Comentário do chefe ao pedir ajuste. */
    reviewNote: text(),

    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('content_items_company_id_idx').on(table.companyId),
    index('content_items_company_status_idx').on(table.companyId, table.status),
  ],
)

export type ContentItem = typeof contentItems.$inferSelect
export type NewContentItem = typeof contentItems.$inferInsert
