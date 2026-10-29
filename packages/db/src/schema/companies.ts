import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

/** A empresa é o tenant: tudo que é dado de cliente pendura em company_id. */
export const companies = pgTable('companies', {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  segment: text(),
  instagramHandle: text(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
})

export type Company = typeof companies.$inferSelect
export type NewCompany = typeof companies.$inferInsert
