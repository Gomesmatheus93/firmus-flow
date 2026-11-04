import { describe, expect, it } from 'vitest'
import {
  addDays,
  dayMonth,
  groupByWeek,
  nextMonday,
  startOfWeek,
  todayInSaoPaulo,
  weekdayIndex,
  weekdayShort,
} from './calendar'

describe('contas de calendário', () => {
  it('segunda é o dia 0 e domingo o 6', () => {
    expect(weekdayIndex('2026-11-09')).toBe(0) // segunda
    expect(weekdayIndex('2026-11-15')).toBe(6) // domingo
    expect(weekdayShort('2026-11-13')).toBe('Sex')
  })

  it('a semana começa na segunda, inclusive vista do domingo', () => {
    expect(startOfWeek('2026-11-15')).toBe('2026-11-09')
    expect(startOfWeek('2026-11-09')).toBe('2026-11-09')
  })

  it('soma dias atravessando o mês', () => {
    expect(addDays('2026-11-29', 3)).toBe('2026-12-02')
    expect(addDays('2026-11-01', -1)).toBe('2026-10-31')
  })

  it('"hoje" é o de São Paulo, não o de Londres', () => {
    // 01h de quarta em UTC ainda é terça às 22h em São Paulo.
    expect(todayInSaoPaulo(new Date('2026-11-04T01:00:00Z'))).toBe('2026-11-03')
  })

  it('a próxima segunda nunca é hoje', () => {
    // Terça, 03/11 → segunda, 09/11.
    expect(nextMonday(new Date('2026-11-03T15:00:00Z'))).toBe('2026-11-09')
    // Segunda, 09/11 → a da semana seguinte, 16/11.
    expect(nextMonday(new Date('2026-11-09T15:00:00Z'))).toBe('2026-11-16')
  })

  it('escreve a data como o calendário mostra', () => {
    expect(dayMonth('2026-11-09')).toBe('09/11')
  })
})

describe('agrupar pautas por semana', () => {
  const pauta = (id: string, scheduledDate: string) => ({ id, scheduledDate })

  it('sete dias por semana, com os vazios no lugar', () => {
    const [semana] = groupByWeek([pauta('a', '2026-11-09'), pauta('b', '2026-11-13')])

    expect(semana!.start).toBe('2026-11-09')
    expect(semana!.days).toHaveLength(7)
    expect(semana!.days[0]!.entries.map((e) => e.id)).toEqual(['a'])
    expect(semana!.days[1]!.entries).toEqual([])
    expect(semana!.days[4]!.entries.map((e) => e.id)).toEqual(['b'])
  })

  it('separa as semanas e põe em ordem, mesmo fora de ordem na entrada', () => {
    const semanas = groupByWeek([pauta('depois', '2026-11-18'), pauta('antes', '2026-11-10')])

    expect(semanas.map((s) => s.start)).toEqual(['2026-11-09', '2026-11-16'])
  })

  it('duas pautas no mesmo dia ficam juntas', () => {
    const [semana] = groupByWeek([pauta('a', '2026-11-11'), pauta('b', '2026-11-11')])

    expect(semana!.days[2]!.entries).toHaveLength(2)
  })

  it('sem pauta, sem semana', () => {
    expect(groupByWeek([])).toEqual([])
  })
})
