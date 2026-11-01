import { exchangeRates } from '@firmus/db/schema'
import { createTestDb } from '@firmus/db/testing'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { usdBrlRate, type RateFetcher } from './ptax'

let db: Awaited<ReturnType<typeof createTestDb>>['db']
let close: () => Promise<void>

beforeEach(async () => {
  const teste = await createTestDb()
  db = teste.db
  close = teste.close
})

afterEach(async () => {
  await close()
})

const hoje = new Date()
const diaIso = (d: Date) => d.toISOString().slice(0, 10)

/** Banco Central falso: só cota nos dias que a gente mandar. */
function bcbFalso(diasComCotacao: Record<string, string>): RateFetcher {
  return async (day) => diasComCotacao[diaIso(day)] ?? null
}

const nunca: RateFetcher = async () => {
  throw new Error('não deveria ir à rede')
}

describe('cotação do dólar', () => {
  it('usa o cache do dia sem ir à rede', async () => {
    await db
      .insert(exchangeRates)
      .values({ day: diaIso(hoje), usdBrl: '5.4212', quotedFor: diaIso(hoje), source: 'teste' })

    expect(await usdBrlRate(db, hoje, nunca)).toBe('5.4212')
  })

  it('anda para trás quando o dia pedido não tem cotação', async () => {
    const sexta = new Date(Date.UTC(2026, 9, 30))
    const domingo = new Date(Date.UTC(2026, 10, 1))

    const valor = await usdBrlRate(db, domingo, bcbFalso({ '2026-10-30': '5.4212' }))

    expect(valor).toBe('5.4212')

    // Grava sob a data pedida para não refazer a caminhada amanhã.
    const [guardado] = await db.select().from(exchangeRates)
    expect(guardado?.day).toBe(diaIso(domingo))
    expect(guardado?.quotedFor).toBe(diaIso(sexta))
  })

  it('Banco Central fora do ar cai na última cotação guardada', async () => {
    await db
      .insert(exchangeRates)
      .values({ day: '2026-10-30', usdBrl: '5.4212', quotedFor: '2026-10-30', source: 'teste' })

    const caiu: RateFetcher = async () => {
      throw new Error('rede fora')
    }

    expect(await usdBrlRate(db, hoje, caiu)).toBe('5.4212')
  })

  it('sem rede e sem cache nenhum, devolve o valor de reserva em vez de quebrar', async () => {
    const caiu: RateFetcher = async () => {
      throw new Error('rede fora')
    }

    const valor = await usdBrlRate(db, hoje, caiu)

    expect(Number(valor)).toBeGreaterThan(0)
  })
})
