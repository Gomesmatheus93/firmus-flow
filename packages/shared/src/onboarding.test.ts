import { describe, expect, it } from 'vitest'
import {
  answersToDescription,
  isBrainComplete,
  onboardingAnswerSchema,
  onboardingVisualSchema,
} from './onboarding'

describe('respostas do onboarding', () => {
  it('cobra 15 caracteres, contando sem os espaços das pontas', () => {
    expect(onboardingAnswerSchema.safeParse('   curta demais ').success).toBe(false)
    expect(onboardingAnswerSchema.safeParse('Clínica odontológica em Mossoró').success).toBe(true)
  })

  it('manda ao agente cada pergunta com a resposta, na ordem das telas', () => {
    const texto = answersToDescription({
      tom: 'Acolhedora e direta',
      oferta: 'Clínica de implante',
    })
    expect(texto.indexOf('Clínica de implante')).toBeLessThan(texto.indexOf('Acolhedora e direta'))
    expect(texto).toContain('Pergunta: O que a sua empresa vende')
  })
})

describe('identidade visual', () => {
  it('aceita até 4 cores em hex e guarda em maiúscula', () => {
    const ok = onboardingVisualSchema.safeParse({ colors: ['#1c8cff'], instagram: '@firmus.tech' })
    expect(ok.success && ok.data).toEqual({ colors: ['#1C8CFF'], instagram: 'firmus.tech' })
    expect(onboardingVisualSchema.safeParse({ colors: ['azul'], instagram: '' }).success).toBe(
      false,
    )
    expect(
      onboardingVisualSchema.safeParse({ colors: Array(5).fill('#000000'), instagram: '' }).success,
    ).toBe(false)
  })
})

describe('Cérebro completo', () => {
  const cheio = {
    context: 'Clínica',
    services: ['implante'],
    audience: 'mulheres de 25 a 45',
    toneOfVoice: { summary: 'acolhedora', dos: [], donts: [] },
  }

  it('precisa de contexto, serviços, público e tom', () => {
    expect(isBrainComplete(cheio)).toBe(true)
    expect(isBrainComplete({ ...cheio, services: [] })).toBe(false)
    expect(isBrainComplete({ ...cheio, toneOfVoice: null })).toBe(false)
    expect(isBrainComplete(null)).toBe(false)
  })
})
