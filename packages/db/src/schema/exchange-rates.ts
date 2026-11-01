import { date, numeric, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

/**
 * Cotação do dólar por dia, vinda da PTAX do Banco Central.
 *
 * É cache: sem ela, cada abertura do painel bateria na API do Banco Central.
 * A data é a chave primária porque existe uma cotação por dia, e só.
 *
 * O Banco Central não cota fim de semana nem feriado; quem busca anda para
 * trás até o último dia útil e grava sob a data pedida, para não repetir a
 * caminhada toda vez.
 */
export const exchangeRates = pgTable('exchange_rates', {
  day: date().primaryKey(),
  usdBrl: numeric({ precision: 10, scale: 4 }).notNull(),
  /** De qual dia útil veio a cotação, quando o dia pedido não tinha. */
  quotedFor: date().notNull(),
  source: text().notNull().default('ptax'),
  fetchedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
})

export type ExchangeRate = typeof exchangeRates.$inferSelect
export type NewExchangeRate = typeof exchangeRates.$inferInsert
