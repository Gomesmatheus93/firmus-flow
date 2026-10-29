import { resolve } from 'node:path'
import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

// O drizzle-kit carrega este arquivo como CommonJS, onde `import.meta.dirname`
// não existe. Ele roda sempre a partir de packages/db, então subimos dois níveis
// pelo diretório de trabalho para achar o .env da raiz.
config({ path: resolve(process.cwd(), '../../.env'), quiet: true })

// `db:generate` só lê o schema e não conecta em nada, então roda sem DATABASE_URL.
// `db:migrate` e `db:studio` precisam da conexão e falham com erro claro se faltar.
const databaseUrl = process.env.DATABASE_URL ?? ''

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: databaseUrl },
  casing: 'snake_case',
  verbose: true,
  strict: true,
})
