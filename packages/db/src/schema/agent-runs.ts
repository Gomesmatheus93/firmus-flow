import { index, integer, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { companies } from './companies'

/**
 * Cada chamada de IA, com o que ela custou. É daqui que sai o gasto mensal.
 *
 * Sobre guardar o custo em dólar e não em centavos de real, ao contrário do
 * resto do sistema: cada chamada custa fração de centavo. Arredondar uma a uma
 * perderia dinheiro de forma sistemática — mil chamadas de R$ 0,004 virariam
 * R$ 0,00. Então guardamos o custo em dólar com oito casas e a cotação daquele
 * dia; o valor em reais é calculado na soma, arredondando uma vez só.
 *
 * Guardar a cotação junto é o que impede o histórico de mudar quando o dólar
 * mexe: o que você gastou em março continua valendo o dólar de março.
 */
export const agentRuns = pgTable(
  'agent_runs',
  {
    id: uuid().primaryKey().defaultRandom(),
    companyId: uuid()
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    agentName: text().notNull(),
    model: text().notNull(),

    inputTokens: integer().notNull().default(0),
    outputTokens: integer().notNull().default(0),

    /** Custo em dólar desta chamada. */
    costUsd: numeric({ precision: 14, scale: 8 }).notNull().default('0'),
    /** Cotação do dólar no dia em que ela rodou. */
    usdBrlRate: numeric({ precision: 10, scale: 4 }).notNull(),

    /** Quanto a chamada demorou, para achar agente lento. */
    durationMs: integer(),
    /** Preenchido quando a chamada falhou. */
    errorMessage: text(),

    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('agent_runs_company_created_idx').on(table.companyId, table.createdAt),
    index('agent_runs_created_idx').on(table.createdAt),
  ],
)

export type AgentRun = typeof agentRuns.$inferSelect
export type NewAgentRun = typeof agentRuns.$inferInsert
