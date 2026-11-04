import { z } from 'zod'

/**
 * Leitura do `body` das peças, num lugar só: a rota de conteúdo e a prévia do
 * feed precisam ler os slides do mesmo jeito.
 */

/** Texto opcional do body: ausente, nulo ou vazio viram `null`. */
const textoOpcional = z
  .string()
  .nullish()
  .transform((v) => v?.trim() || null)

/**
 * O pedaço do `body` que a tela usa: o texto e o caminho da imagem de cada
 * slide. O resto do body varia por formato e fica no banco.
 */
const slidesSchema = z.object({
  /** O modelo visual usado, quando a peça foi feita com um. */
  template: z.string().optional(),
  slides: z.array(
    z
      .object({
        label: textoOpcional,
        title: textoOpcional,
        body: textoOpcional,
        imagePath: z.string().optional(),
      })
      .loose(),
  ),
})

export type Slide = z.infer<typeof slidesSchema>['slides'][number]

/** Os slides da peça, ou lista vazia quando o body não tem slides. */
export function slidesOf(body: unknown): Slide[] {
  const parsed = slidesSchema.safeParse(body)
  return parsed.success ? parsed.data.slides : []
}

export function templateOf(body: unknown): string | null {
  const parsed = slidesSchema.safeParse(body)
  return (parsed.success && parsed.data.template) || null
}

/** Os caminhos de imagem da peça que ficam dentro da pasta da empresa. */
export function imagePathsOf(body: unknown, companyId: string): string[] {
  const pasta = `${companyId}/`
  return slidesOf(body)
    .map((s) => s.imagePath)
    .filter((p): p is string => Boolean(p?.startsWith(pasta)))
}
