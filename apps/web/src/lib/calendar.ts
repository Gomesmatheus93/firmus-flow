/**
 * Contas de calendário do Planejamento, sobre datas "AAAA-MM-DD".
 *
 * Tudo aqui trabalha com o texto da data, sem hora, e faz a conta em UTC.
 * É de propósito: `new Date('2026-11-09')` vira meia-noite em UTC, que em São
 * Paulo ainda é dia 08 — e a pauta de segunda apareceria no domingo. Data de
 * calendário não tem fuso; só o "hoje" precisa dele.
 */

const DIA_MS = 86_400_000

/** "AAAA-MM-DD" para um Date em UTC, meia-noite. */
function emUtc(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00Z`)
}

function paraIso(data: Date): string {
  return data.toISOString().slice(0, 10)
}

/** Soma dias a uma data. Negativo volta. */
export function addDays(isoDate: string, days: number): string {
  return paraIso(new Date(emUtc(isoDate).getTime() + days * DIA_MS))
}

/** Dia da semana com segunda = 0 e domingo = 6, como o calendário mostra. */
export function weekdayIndex(isoDate: string): number {
  return (emUtc(isoDate).getUTCDay() + 6) % 7
}

/** A segunda-feira da semana desta data. */
export function startOfWeek(isoDate: string): string {
  return addDays(isoDate, -weekdayIndex(isoDate))
}

/** "Hoje" no fuso de São Paulo, como "AAAA-MM-DD". */
export function todayInSaoPaulo(now: Date = new Date()): string {
  // en-CA formata como AAAA-MM-DD, que é o que a gente quer.
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(now)
}

/** A próxima segunda-feira depois de hoje. Se hoje é segunda, a da semana que vem. */
export function nextMonday(now: Date = new Date()): string {
  const hoje = todayInSaoPaulo(now)
  return addDays(startOfWeek(hoje), 7)
}

const NOMES_DIA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'] as const

/** "Seg", "Ter"... */
export function weekdayShort(isoDate: string): string {
  return NOMES_DIA[weekdayIndex(isoDate)]!
}

/** "09/11". */
export function dayMonth(isoDate: string): string {
  const [, mes, dia] = isoDate.split('-')
  return `${dia}/${mes}`
}

export type CalendarDay<T> = { date: string; entries: T[] }
export type CalendarWeek<T> = { start: string; days: CalendarDay<T>[] }

/**
 * Agrupa as pautas em semanas de segunda a domingo, da mais antiga para a
 * mais nova. Semana sem pauta nenhuma não aparece; dia sem pauta aparece
 * vazio, para o calendário ter sempre sete colunas.
 */
export function groupByWeek<T extends { scheduledDate: string }>(entries: T[]): CalendarWeek<T>[] {
  const porSemana = new Map<string, T[]>()

  for (const entry of entries) {
    const inicio = startOfWeek(entry.scheduledDate)
    porSemana.set(inicio, [...(porSemana.get(inicio) ?? []), entry])
  }

  return [...porSemana.keys()].sort().map((start) => ({
    start,
    days: Array.from({ length: 7 }, (_, i) => {
      const date = addDays(start, i)
      return { date, entries: porSemana.get(start)!.filter((e) => e.scheduledDate === date) }
    }),
  }))
}
