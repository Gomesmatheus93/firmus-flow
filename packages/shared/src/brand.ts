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
  /**
   * O que a auditoria não teve como ver: destaques, fixados, stories, foto. A
   * Meta não entrega isso pela API, e área sem dado não ganha nota — vai para
   * cá, para a tela dizer o que ficou de fora em vez de chutar.
   *
   * Opcional porque auditoria guardada antes deste campo não tem ele.
   */
  notEvaluated: z.array(z.string()).optional(),
  /** Quando a auditoria rodou, em ISO 8601 UTC. */
  generatedAt: z.string(),
})

export type AuditFindings = z.infer<typeof auditFindingsSchema>

/**
 * O que o agente `auditoria` devolve.
 *
 * Sem `generatedAt`: a hora quem marca é o servidor, não a IA — modelo não
 * sabe que horas são. Sem `overallScore`: a nota geral é a média das áreas,
 * conta que o código faz sem errar. E `notEvaluated` vira obrigatório, porque
 * a saída estruturada exige todo campo presente (lista vazia quando viu tudo).
 */
export const auditDraftSchema = auditFindingsSchema
  .omit({ overallScore: true, generatedAt: true, notEvaluated: true })
  .extend({ notEvaluated: z.array(z.string()) })

export type AuditDraft = z.infer<typeof auditDraftSchema>

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

/** Uma cor da referência e o papel dela no design. */
export const styleColorSchema = z.object({
  hex: z.string(),
  /** Ex.: "fundo", "título", "destaque", "texto corrido". */
  role: z.string(),
})

/**
 * O guia de estilo que o agente `referencia` tira de uma imagem enviada pelo
 * chefe (o "template" de referência).
 *
 * Descreve o **estilo**, nunca o conteúdo: texto, logo e marca de terceiros
 * que estejam na imagem não entram aqui. Todos os campos são obrigatórios pelo
 * mesmo motivo do `brandBrainDraftSchema` — a saída estruturada exige —, e
 * ausência se diz com string vazia ou lista vazia.
 */
export const styleGuideSchema = z.object({
  /** Duas ou três frases: o que define este visual. */
  summary: z.string(),
  palette: z.array(styleColorSchema),
  /** Família (serifada, sem serifa, condensada…), peso, caixa alta, contraste de tamanhos. */
  typography: z.string(),
  /** Como os elementos se organizam: grade, hierarquia, alinhamento, respiro. */
  composition: z.string(),
  /** Quanto texto cabe por peça e como ele é quebrado. */
  textDensity: z.string(),
  /** Uso de foto, ilustração, ícone, textura. */
  imagery: z.string(),
  /** O clima em poucas palavras: "sóbrio e premium", "vibrante e jovem". */
  mood: z.string(),
  dos: z.array(z.string()),
  donts: z.array(z.string()),
})

export type StyleGuide = z.infer<typeof styleGuideSchema>
