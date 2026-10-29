import { resolve } from 'node:path'
import { config } from 'dotenv'

// Este arquivo mora em packages/shared/src, então a raiz do monorepo fica três níveis acima.
const repoRoot = resolve(import.meta.dirname, '../../..')

let loaded = false

/**
 * Carrega o .env da raiz do monorepo. Chame uma vez, antes de ler process.env.
 */
export function loadRootEnv(): void {
  if (loaded) return
  config({ path: resolve(repoRoot, '.env'), quiet: true })
  loaded = true
}
