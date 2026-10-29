import { resolve } from 'node:path'
import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

config({ path: resolve(import.meta.dirname, '../../.env'), quiet: true })

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL não está definida. Preencha o .env na raiz do projeto.')
}

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: databaseUrl },
  casing: 'snake_case',
})
