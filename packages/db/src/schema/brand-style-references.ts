import type { StyleGuide } from '@firmus/shared'
import { index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { companies } from './companies'

/**
 * As referências de design que o chefe enviou ("Enviar template", no Cérebro
 * da Marca), cada uma com o guia de estilo que o agente `referencia` tirou dela.
 *
 * Faz parte do Cérebro: `brainToPrompt` junta os guias daqui no texto que todo
 * agente lê. Tabela própria, e não uma coluna em `brand_brains`, porque são
 * várias por empresa e cada uma tem o próprio arquivo no Storage.
 *
 * Só existe linha com guia pronto: se a IA falhar, o envio é desfeito, para não
 * sobrar imagem que nenhum agente consegue usar.
 */
export const brandStyleReferences = pgTable(
  'brand_style_references',
  {
    id: uuid().primaryKey().defaultRandom(),
    companyId: uuid()
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),

    /** Caminho no bucket privado: `<companyId>/referencias/<id>.<ext>`. */
    imagePath: text().notNull(),
    guide: jsonb().$type<StyleGuide>().notNull(),

    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('brand_style_references_company_idx').on(table.companyId)],
)

export type BrandStyleReference = typeof brandStyleReferences.$inferSelect
export type NewBrandStyleReference = typeof brandStyleReferences.$inferInsert
