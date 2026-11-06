import { z } from 'zod'
import { brandBrainDraftSchema, type BrandBrainDraft } from './brand'

/**
 * O onboarding da marca: quatro perguntas, uma por tela, mais a identidade
 * visual opcional. As respostas ficam guardadas como o chefe escreveu,
 * separadas do Cérebro que o agente monta a partir delas — é o que deixa
 * regerar o Cérebro depois sem perguntar de novo.
 */

/** As chaves das quatro respostas, na ordem das telas. */
export const ONBOARDING_KEYS = ['oferta', 'cliente', 'diferencial', 'tom'] as const

export type OnboardingKey = (typeof ONBOARDING_KEYS)[number]

/** Texto, pergunta e exemplo de cada passo. A tela e o agente leem daqui. */
export const onboardingQuestions: Record<OnboardingKey, { pergunta: string; exemplo: string }> = {
  oferta: {
    pergunta: 'O que a sua empresa vende, e qual serviço ou produto você mais quer vender agora?',
    exemplo:
      'Clínica odontológica. Fazemos limpeza, clareamento, aparelho e implante. Quero vender mais implante e lentes de porcelana.',
  },
  cliente: {
    pergunta: 'Quem é o seu cliente ideal, e o que faz ele procurar você?',
    exemplo:
      'Mulheres de 25 a 45 anos que têm vergonha de sorrir em foto e querem resolver rápido.',
  },
  diferencial: {
    pergunta: 'Por que um cliente deveria escolher você, e não o concorrente?',
    exemplo: 'Atendimento sem pressa, parcelamento em 12x e 10 anos de experiência com implante.',
  },
  tom: {
    pergunta:
      'Se a sua marca fosse uma pessoa, como ela falaria? Dê 3 palavras que a descrevem e uma que ela nunca diria.',
    exemplo: 'Acolhedora, segura, moderna. Nunca diria "barato".',
  },
}

/** O mínimo para "Continuar" ficar ativo. A tela e o servidor cobram o mesmo. */
export const ONBOARDING_MIN_CHARS = 15

export const onboardingAnswerSchema = z
  .string()
  .trim()
  .min(ONBOARDING_MIN_CHARS, `Escreva pelo menos ${ONBOARDING_MIN_CHARS} caracteres.`)
  .max(2000, 'Resposta longa demais: até 2000 caracteres.')

export type OnboardingAnswers = Partial<Record<OnboardingKey, string>>

/** Cor em hexadecimal, como o seletor de cor do navegador devolve. */
export const hexColorSchema = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Use uma cor no formato #1C8CFF.')
  .transform((c) => c.toUpperCase())

export const onboardingVisualSchema = z.object({
  colors: z.array(hexColorSchema).max(4, 'No máximo 4 cores.'),
  /** Sem o @. Vazio quando o chefe não informou. */
  instagram: z
    .string()
    .trim()
    .transform((v) => v.replace(/^@/, ''))
    .pipe(
      z.string().regex(/^[a-zA-Z0-9._]{0,30}$/, 'Só letras, números, ponto e sublinhado, até 30.'),
    ),
})

export type OnboardingVisual = z.infer<typeof onboardingVisualSchema> & {
  /** Caminho do logo no Storage, quando enviado. */
  logoPath?: string | null
}

export const onboardingStatusSchema = z.enum([
  'respondendo',
  'gerando',
  'revisao',
  'concluido',
  'erro',
  'sem_ia',
])

export type OnboardingStatus = z.infer<typeof onboardingStatusSchema>

/**
 * O que o chefe confirma na revisão: os blocos editáveis do Cérebro. FAQ e
 * pendências não entram na tela de revisão; vêm do agente como estão.
 */
export const onboardingConfirmSchema = brandBrainDraftSchema
  .pick({ context: true, services: true, audience: true, differentiators: true, toneOfVoice: true })
  .extend({
    context: z.string().trim().min(1, 'Descreva a oferta.').max(4000),
    audience: z.string().trim().min(1, 'Descreva o cliente ideal.').max(2000),
    services: z.array(z.string().trim().min(1).max(200)).max(30),
    differentiators: z.array(z.string().trim().min(1).max(300)).max(20),
  })

export type OnboardingConfirm = z.infer<typeof onboardingConfirmSchema>

/**
 * O texto que o agente `marca` recebe: cada pergunta seguida da resposta.
 * Mandar a pergunta junto diz ao agente o que cada resposta é, sem ele chutar.
 */
export function answersToDescription(answers: OnboardingAnswers): string {
  return ONBOARDING_KEYS.filter((k) => answers[k]?.trim())
    .map((k) => `Pergunta: ${onboardingQuestions[k].pergunta}\nResposta: ${answers[k]!.trim()}`)
    .join('\n\n')
}

/**
 * Cérebro completo = tem o mínimo para os agentes trabalharem: o que a empresa
 * é, o que vende, para quem e como fala. A identidade visual é opcional e não
 * conta.
 */
export function isBrainComplete(
  brain: {
    context: string | null
    services: string[]
    audience: string | null
    toneOfVoice: BrandBrainDraft['toneOfVoice'] | null
  } | null,
): boolean {
  return Boolean(
    brain?.context?.trim() &&
    brain.services.length > 0 &&
    brain.audience?.trim() &&
    brain.toneOfVoice?.summary.trim(),
  )
}
