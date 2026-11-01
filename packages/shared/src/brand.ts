import { z } from 'zod'

/**
 * Formato dos campos JSON do Cérebro da Marca.
 * O banco guarda estes objetos como jsonb; os agentes validam contra estes
 * schemas antes de salvar. Um lugar só, usado pela api, pelo worker e pela web.
 */

export const toneOfVoiceSchema = z.object({
  summary: z.string(),
  /** O que fazer: exemplos concretos, não adjetivos. */
  dos: z.array(z.string()),
  /** O que evitar: palavras e promessas proibidas. */
  donts: z.array(z.string()),
})

export type ToneOfVoice = z.infer<typeof toneOfVoiceSchema>

export const faqItemSchema = z.object({
  question: z.string(),
  answer: z.string(),
})

export type FaqItem = z.infer<typeof faqItemSchema>

export const auditPrioritySchema = z.enum(['alta', 'media', 'baixa'])

export type AuditPriority = z.infer<typeof auditPrioritySchema>

export const auditFindingsSchema = z.object({
  /** Nota de 0 a 10. */
  overallScore: z.number().min(0).max(10),
  areas: z.array(
    z.object({
      label: z.string(),
      score: z.number().min(0).max(10),
    }),
  ),
  strengths: z.array(z.string()),
  issues: z.array(
    z.object({
      priority: auditPrioritySchema,
      title: z.string(),
      detail: z.string(),
    }),
  ),
  /** Quando a auditoria rodou, em ISO 8601 UTC. */
  generatedAt: z.string(),
})

export type AuditFindings = z.infer<typeof auditFindingsSchema>

/**
 * O que o agente `marca` devolve ao montar o Cérebro.
 *
 * Todo campo é obrigatório, e nenhum é opcional ou nulo, porque é isso que a
 * saída estruturada da Anthropic exige — ela transforma este schema em JSON
 * Schema e cobra o formato do modelo. Ausência se diz com string vazia ou lista
 * vazia, nunca com campo faltando.
 *
 * `missing` é o campo que torna isso honesto: em vez de preencher público-alvo
 * com palpite, o agente deixa vazio e escreve aqui a pergunta que falta fazer
 * ao dono. É a mesma regra das telas — estado vazio honesto, nunca exemplo.
 */
export const brandBrainDraftSchema = z.object({
  context: z.string(),
  services: z.array(z.string()),
  audience: z.string(),
  differentiators: z.array(z.string()),
  toneOfVoice: toneOfVoiceSchema,
  faq: z.array(faqItemSchema),
  /** O que o chefe ainda precisa informar, como pergunta em português. */
  missing: z.array(z.string()),
})

export type BrandBrainDraft = z.infer<typeof brandBrainDraftSchema>
