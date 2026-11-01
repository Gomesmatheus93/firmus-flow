import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { companies } from './companies'

/**
 * A ligação de uma empresa com a conta profissional do Instagram dela.
 *
 * O token fica em `accessTokenCipher`, cifrado com AES-256-GCM pela chave da
 * plataforma (`FIRMUS_ENCRYPTION_KEY`, no .env). Nunca em texto puro: banco de
 * SaaS guarda credencial de dezenas de clientes, e um vazamento sem cifra
 * entregaria o Instagram de todos eles de uma vez.
 *
 * Separada de uma futura `whatsapp_connections` de propósito: aquela guarda
 * telefone e id de número, que não existem aqui. Uma tabela só para os dois
 * daria coluna nula em metade das linhas.
 */
export const instagramConnections = pgTable('instagram_connections', {
  id: uuid().primaryKey().defaultRandom(),
  companyId: uuid()
    .notNull()
    .unique()
    .references(() => companies.id, { onDelete: 'cascade' }),

  /** Id da conta profissional na Meta. É por ele que a Graph API é chamada. */
  igAccountId: text().notNull(),
  /** Guardado para a tela mostrar sem precisar chamar a Meta a cada visita. */
  username: text().notNull(),

  /** O token de acesso, cifrado. Nunca sai daqui para o navegador. */
  accessTokenCipher: text().notNull(),

  /**
   * Último número de seguidores visto. É cache de exibição: serve para o cartão
   * de Configurações mostrar sem ir à rede. O histórico de verdade é
   * `instagram_metrics`.
   */
  followersCount: integer(),

  connectedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  /** Última vez que a Meta confirmou que o token ainda vale. */
  lastVerifiedAt: timestamp({ withTimezone: true }),
})

export type InstagramConnection = typeof instagramConnections.$inferSelect
export type NewInstagramConnection = typeof instagramConnections.$inferInsert
