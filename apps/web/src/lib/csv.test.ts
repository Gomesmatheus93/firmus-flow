import { describe, expect, it } from 'vitest'
import { toCsv } from './csv'

describe('CSV para o Excel em português', () => {
  it('separa por ponto e vírgula', () => {
    // Vírgula faria o Excel em pt-BR empilhar tudo numa coluna só.
    const csv = toCsv(['Nome', 'Situação'], [['Ana', 'Quente']])

    expect(csv).toBe('Nome;Situação\r\nAna;Quente')
  })

  it('campo vazio ou nulo vira coluna vazia, não a palavra null', () => {
    const csv = toCsv(
      ['Nome', 'Interesse'],
      [
        ['Ana', null],
        ['Bruno', undefined],
      ],
    )

    expect(csv).toBe('Nome;Interesse\r\nAna;\r\nBruno;')
  })

  it('campo com ponto e vírgula fica entre aspas', () => {
    // Sem isso, um interesse como "limpeza; microagulhamento" viraria duas
    // colunas e desalinharia a planilha inteira daquela linha em diante.
    const csv = toCsv(['Interesse'], [['limpeza; microagulhamento']])

    expect(csv).toBe('Interesse\r\n"limpeza; microagulhamento"')
  })

  it('aspas dentro do texto são dobradas', () => {
    const csv = toCsv(['Nota'], [['ela disse "quero fechar"']])

    expect(csv).toBe('Nota\r\n"ela disse ""quero fechar"""')
  })

  it('quebra de linha dentro do campo não quebra a linha do arquivo', () => {
    const csv = toCsv(['Nota'], [['primeira\nsegunda']])

    expect(csv).toBe('Nota\r\n"primeira\nsegunda"')
  })

  it('sem linhas, sai só o cabeçalho', () => {
    expect(toCsv(['Nome'], [])).toBe('Nome')
  })
})
