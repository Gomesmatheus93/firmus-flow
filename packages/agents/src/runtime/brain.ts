import type { Database } from '@firmus/db'
import { brandBrains, brandStyleReferences } from '@firmus/db/schema'
import type { StyleGuide } from '@firmus/shared'
import { asc, eq } from 'drizzle-orm'

/**
 * O Cérebro da Marca de uma empresa, pronto para entrar num prompt.
 *
 * Só existe uma função de leitura, e ela **exige `companyId`**: é o que garante
 * que nenhum agente leia a marca de outra empresa. A regra 3 do CLAUDE.md vale
 * para job e agente igual vale para rota.
 */
export async function loadBrain(db: Database, companyId: string) {
  const [brain] = await db
    .select()
    .from(brandBrains)
    .where(eq(brandBrains.companyId, companyId))
    .limit(1)

  return brain ?? null
}

/** Uma linha "Rótulo: valor", ou nada quando não há valor. */
function linha(rotulo: string, valor: string | null | undefined): string[] {
  const limpo = valor?.trim()
  return limpo ? [`${rotulo}: ${limpo}`] : []
}

/** Uma lista com marcadores, ou nada quando está vazia. */
function lista(rotulo: string, itens: string[] | null | undefined): string[] {
  const limpos = (itens ?? []).map((i) => i.trim()).filter(Boolean)
  if (limpos.length === 0) return []

  return [`${rotulo}:`, ...limpos.map((i) => `  - ${i}`)]
}

/**
 * Transforma o Cérebro em texto para o prompt do agente.
 *
 * Campo vazio não vira "não informado": vira ausência. Escrever "público-alvo:
 * não informado" ensina o modelo a inventar um; não dizer nada o deixa
 * perguntar ou se abster, que é o comportamento certo.
 */
export function brainToPrompt(brain: Awaited<ReturnType<typeof loadBrain>>): string {
  if (!brain) {
    return 'Esta empresa ainda não tem Cérebro da Marca preenchido.'
  }

  const partes = [
    ...linha('Contexto da empresa', brain.context),
    ...lista('Serviços', brain.services),
    ...linha('Público', brain.audience),
    ...lista('Diferenciais', brain.differentiators),
    ...linha('Instagram', brain.instagramHandle),
  ]

  if (brain.toneOfVoice) {
    partes.push(
      ...linha('Tom de voz', brain.toneOfVoice.summary),
      ...lista('O que fazer na escrita', brain.toneOfVoice.dos),
      ...lista('O que nunca fazer na escrita', brain.toneOfVoice.donts),
    )
  }

  if (brain.faq.length > 0) {
    partes.push(
      'Perguntas frequentes:',
      ...brain.faq.map((item) => `  - ${item.question} -> ${item.answer}`),
    )
  }

  if (brain.colorPalette.length > 0) {
    partes.push(`Paleta da marca: ${brain.colorPalette.join(', ')}`)
  }

  if (partes.length === 0) {
    return 'Esta empresa ainda não tem Cérebro da Marca preenchido.'
  }

  return partes.join('\n')
}

/**
 * Os guias de estilo das referências de design que o chefe enviou, da mais
 * antiga para a mais nova. Também exige `companyId`, pelo mesmo motivo.
 */
export async function loadStyleGuides(db: Database, companyId: string): Promise<StyleGuide[]> {
  const linhas = await db
    .select({ guide: brandStyleReferences.guide })
    .from(brandStyleReferences)
    .where(eq(brandStyleReferences.companyId, companyId))
    .orderBy(asc(brandStyleReferences.createdAt))

  return linhas.map((l) => l.guide)
}

/**
 * Os guias de estilo em texto, para o prompt. Sem referência, nada — e o
 * agente segue só a paleta e o tom do Cérebro.
 */
export function styleGuidesToPrompt(guias: StyleGuide[]): string {
  if (guias.length === 0) return ''

  const blocos = guias.map((g, i) =>
    [
      `Referência ${i + 1}: ${g.summary}`,
      ...linha('Clima', g.mood),
      ...(g.palette.length > 0
        ? [`Cores: ${g.palette.map((c) => `${c.hex} (${c.role})`).join(', ')}`]
        : []),
      ...linha('Tipografia', g.typography),
      ...linha('Composição', g.composition),
      ...linha('Quantidade de texto', g.textDensity),
      ...linha('Imagens', g.imagery),
      ...lista('Fazer', g.dos),
      ...lista('Evitar', g.donts),
    ].join('\n'),
  )

  return [
    'Referências de design que o dono escolheu. Siga este estilo nas peças visuais;',
    'quando ele brigar com a paleta da marca, a paleta da marca vence.',
    '',
    blocos.join('\n\n'),
  ].join('\n')
}
