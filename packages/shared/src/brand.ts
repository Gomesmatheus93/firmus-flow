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
