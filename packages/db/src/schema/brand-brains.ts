import type { AuditFindings, FaqItem, ToneOfVoice } from '@firmus/shared'
import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { companies } from './companies'

/**
 * O Cérebro da Marca: um por empresa. Todos os agentes leem daqui.
 *
 * Campos de texto livre ficam como `text`; listas e objetos ficam em `jsonb`
 * com o tipo declarado em @firmus/shared, para o TypeScript saber o formato.
 * Tudo é opcional porque o onboarding é preenchido aos poucos.
 */
export const brandBrains = pgTable('brand_brains', {
  id: uuid().primaryKey().defaultRandom(),
  companyId: uuid()
    .notNull()
    .unique()
    .references(() => companies.id, { onDelete: 'cascade' }),

  context: text(),
  services: jsonb().$type<string[]>().notNull().default([]),
  audience: text(),
  differentiators: jsonb().$type<string[]>().notNull().default([]),
  toneOfVoice: jsonb().$type<ToneOfVoice>(),

  colorPalette: jsonb().$type<string[]>().notNull().default([]),
  logoUrl: text(),
  instagramHandle: text(),

  faq: jsonb().$type<FaqItem[]>().notNull().default([]),

  /** Saída do agente `auditoria`, validada por auditFindingsSchema antes de salvar. */
  auditFindings: jsonb().$type<AuditFindings>(),

  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
})

export type BrandBrain = typeof brandBrains.$inferSelect
export type NewBrandBrain = typeof brandBrains.$inferInsert
