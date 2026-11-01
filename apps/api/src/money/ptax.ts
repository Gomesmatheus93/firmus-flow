import type { Database } from '@firmus/db'
import { exchangeRates } from '@firmus/db/schema'
import { desc, eq } from 'drizzle-orm'

/**
 * Cotação do dólar pela PTAX do Banco Central.
 *
 * A API é aberta, sem chave. Ela não cota fim de semana nem feriado, então
 * quando o dia pedido vem vazio andamos para trás até achar um dia útil — e
 * gravamos o resultado sob a data pedida, para não repetir a caminhada.
 */

const BASE =
  'https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)'

/** Último recurso: Banco Central fora do ar e nenhuma cotação guardada. */
const FALLBACK = '5.4000'

/**
 * Quem vai buscar a cotação de um dia. Em produção é o Banco Central; nos
 * testes, uma função falsa — mesmo padrão do banco e do verificador de token,
 * e é o que mantém a suíte sem depender de rede.
 */
export type RateFetcher = (day: Date) => Promise<string | null>

/** A PTAX quer a data no formato americano: MM-DD-AAAA. */
function toAmericanDate(day: Date): string {
  const mm = String(day.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(day.getUTCDate()).padStart(2, '0')
  return `${mm}-${dd}-${day.getUTCFullYear()}`
}

const toIsoDay = (day: Date): string => day.toISOString().slice(0, 10)

export const fetchFromBcb: RateFetcher = async (day) => {
  const url = `${BASE}?@dataCotacao='${toAmericanDate(day)}'&$top=1&$format=json`

  const response = await fetch(url, { signal: AbortSignal.timeout(8000) })
  if (!response.ok) return null

  const body: unknown = await response.json()

  if (
    typeof body !== 'object' ||
    body === null ||
    !('value' in body) ||
    !Array.isArray(body.value)
  ) {
    return null
  }

  const primeiro: unknown = body.value[0]
  if (typeof primeiro !== 'object' || primeiro === null || !('cotacaoVenda' in primeiro)) {
    return null
  }

  const venda = primeiro.cotacaoVenda
  return typeof venda === 'number' ? venda.toFixed(4) : null
}

/** Anda para trás até sete dias procurando um dia útil com cotação. */
async function findRecentRate(
  from: Date,
  fetchRate: RateFetcher,
): Promise<{ usdBrl: string; quotedFor: string } | null> {
  for (let voltar = 0; voltar <= 7; voltar++) {
    const dia = new Date(from)
    dia.setUTCDate(dia.getUTCDate() - voltar)

    const valor = await fetchRate(dia)
    if (valor) return { usdBrl: valor, quotedFor: toIsoDay(dia) }
  }

  return null
}

/**
 * Cotação para um dia, com cache no banco.
 *
 * Nunca lança: se o Banco Central estiver fora do ar, usa a última cotação
 * guardada e, se não houver nenhuma, um valor de reserva. Um painel não pode
 * cair porque um serviço externo caiu.
 */
export async function usdBrlRate(
  db: Database,
  day = new Date(),
  fetchRate: RateFetcher = fetchFromBcb,
): Promise<string> {
  const chave = toIsoDay(day)

  const [cache] = await db
    .select({ usdBrl: exchangeRates.usdBrl })
    .from(exchangeRates)
    .where(eq(exchangeRates.day, chave))
    .limit(1)

  if (cache) return cache.usdBrl

  try {
    const cotacao = await findRecentRate(day, fetchRate)

    if (cotacao) {
      await db
        .insert(exchangeRates)
        .values({ day: chave, usdBrl: cotacao.usdBrl, quotedFor: cotacao.quotedFor })
        .onConflictDoNothing()

      return cotacao.usdBrl
    }
  } catch {
    // Rede fora, tempo esgotado, resposta estranha: cai no plano B abaixo.
  }

  const [ultima] = await db
    .select({ usdBrl: exchangeRates.usdBrl })
    .from(exchangeRates)
    .orderBy(desc(exchangeRates.day))
    .limit(1)

  return ultima?.usdBrl ?? FALLBACK
}
