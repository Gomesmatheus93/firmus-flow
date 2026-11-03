import type { Database } from '@firmus/db'
import { instagramConnections, instagramMedia, instagramSnapshots } from '@firmus/db/schema'
import {
  auditDraftSchema,
  postEngagementScore,
  type AuditFindings,
  type InstagramSnapshot,
} from '@firmus/shared'
import { desc, eq } from 'drizzle-orm'
import { runAgent, type ModelClient } from '../runtime/run-agent'

/** Quantos posts entram na auditoria. Trinta é o que o `ig-audit` pede para ver padrão. */
const POSTS_NA_AUDITORIA = 30

/**
 * A auditoria não tem o que olhar. Quem chama traduz isto para a tela.
 *
 * - `sem_instagram`: a empresa não conectou o Instagram.
 * - `sem_dados`: conectou, mas a plataforma ainda não buscou nada na Meta.
 */
export class AuditUnavailableError extends Error {
  constructor(
    readonly reason: 'sem_instagram' | 'sem_dados',
    message: string,
  ) {
    super(message)
    this.name = 'AuditUnavailableError'
  }
}

export type RunAuditInput = {
  db: Database
  client: ModelClient
  usdBrlRate: () => Promise<string>
  companyId: string
  /** Relógio injetável, para o teste não depender da hora em que roda. */
  now?: () => Date
}

type Post = typeof instagramMedia.$inferSelect

/** Mediana de uma lista. `null` quando a lista está vazia. */
function mediana(valores: number[]): number | null {
  if (valores.length === 0) return null

  const ordenados = [...valores].sort((a, b) => a - b)
  const meio = Math.floor(ordenados.length / 2)

  return ordenados.length % 2 === 0
    ? (ordenados[meio - 1]! + ordenados[meio]!) / 2
    : ordenados[meio]!
}

/** Número para o prompt: nulo vira "não entregue", nunca zero. */
function num(valor: number | null | undefined): string {
  return valor == null ? 'não entregue pela Meta' : valor.toLocaleString('pt-BR')
}

function dia(data: Date): string {
  return data.toISOString().slice(0, 10)
}

/** Corta a legenda: o agente precisa do tema e do começo, não do texto inteiro. */
function resumoLegenda(legenda: string | null): string {
  if (!legenda?.trim()) return '(sem legenda)'

  const limpa = legenda.replace(/\s+/g, ' ').trim()
  return limpa.length > 300 ? `${limpa.slice(0, 300)}… (${limpa.length} caracteres)` : limpa
}

function blocoPerfil(username: string, snapshot: InstagramSnapshot | null): string[] {
  const perfil = snapshot?.profile

  return [
    '## Perfil',
    `Nome de usuário: @${perfil?.username ?? username}`,
    `Nome do perfil: ${perfil?.name?.trim() || '(vazio)'}`,
    `Bio: ${perfil?.biography?.trim() || '(vazia)'}`,
    `Link: ${perfil?.website?.trim() || '(sem link)'}`,
    `Seguidores: ${num(perfil?.followers)}`,
    `Seguindo: ${num(perfil?.follows)}`,
    `Total de posts na conta: ${num(perfil?.mediaCount)}`,
  ]
}

function blocoTotais(snapshot: InstagramSnapshot | null): string[] {
  if (!snapshot) return ['## Totais da conta', 'A plataforma ainda não buscou os totais da conta.']

  const t = snapshot.totals

  return [
    `## Totais da conta de ${snapshot.since.slice(0, 10)} a ${snapshot.until.slice(0, 10)}`,
    `Alcance: ${num(t.reach)}`,
    `Visualizações: ${num(t.views)}`,
    `Contas que interagiram: ${num(t.accountsEngaged)}`,
    `Interações: ${num(t.interactions)}`,
    `Salvos: ${num(t.saves)}`,
    `Compartilhamentos: ${num(t.shares)}`,
    `Seguiram: ${num(t.follows)}`,
    `Deixaram de seguir: ${num(t.unfollows)}`,
    `Toques nos links e botões do perfil: ${num(t.profileLinksTaps)}`,
  ]
}

/**
 * Os posts com as contas já feitas. Modelo de linguagem erra divisão e
 * mediana; o código não. O prompt manda o agente usar estes números, não
 * refazer.
 */
function blocoPosts(posts: Post[], hoje: Date): string[] {
  if (posts.length === 0) return ['## Posts', 'Nenhum post guardado ainda.']

  const alcances = posts.map((p) => p.reach).filter((r): r is number => r != null && r > 0)
  const medianaAlcance = mediana(alcances)

  const ultimo = posts[0]!.postedAt
  // Dias de calendário, não horas: post de ontem à noite é "há 1 dia" mesmo
  // que tenham passado só 14 horas.
  const diasDesdeUltimo = Math.round((Date.parse(dia(hoje)) - Date.parse(dia(ultimo))) / 86_400_000)

  const linhas = [
    `## Posts (${posts.length} mais recentes, do mais novo para o mais antigo)`,
    `Hoje: ${dia(hoje)}. Último post: ${dia(ultimo)}, há ${diasDesdeUltimo} dias.`,
    `Mediana de alcance por post: ${medianaAlcance == null ? 'sem alcance entregue' : num(Math.round(medianaAlcance))}`,
    '',
  ]

  for (const [i, p] of posts.entries()) {
    const engajamento = postEngagementScore(p)
    const vezes =
      medianaAlcance && p.reach != null
        ? (p.reach / medianaAlcance).toFixed(1).replace('.', ',')
        : null

    linhas.push(
      `### Post ${i + 1} — ${dia(p.postedAt)} — ${p.mediaProductType === 'REELS' ? 'Reels' : p.mediaType}`,
      `Legenda: ${resumoLegenda(p.caption)}`,
      `Alcance: ${num(p.reach)} | Visualizações: ${num(p.views)} | Curtidas: ${num(p.likes)} | ` +
        `Comentários: ${num(p.comments)} | Salvos: ${num(p.saves)} | Compartilhamentos: ${num(p.shares)} | ` +
        `Visitas ao perfil: ${num(p.profileVisits)}`,
      `Engajamento por alcance: ${engajamento == null ? 'sem alcance para calcular' : `${num(engajamento)} a cada 100`} | ` +
        `Vezes a mediana: ${vezes == null ? 'sem alcance para calcular' : `${vezes}x`}`,
      '',
    )
  }

  return linhas
}

/** A nota geral é a média das áreas, com uma casa decimal. */
function notaGeral(areas: { score: number }[]): number {
  if (areas.length === 0) return 0

  const media = areas.reduce((soma, a) => soma + a.score, 0) / areas.length
  return Math.round(media * 10) / 10
}

/**
 * Roda a auditoria do Instagram da empresa.
 *
 * Só roda com o Instagram conectado e com dados já buscados na Meta: sem isso
 * a IA só teria o Cérebro para olhar, e auditoria sem dado vira opinião.
 *
 * Não salva nada. Quem chama decide onde a auditoria fica, igual ao `marca`.
 */
export async function runAudit({
  db,
  client,
  usdBrlRate,
  companyId,
  now = () => new Date(),
}: RunAuditInput): Promise<{ findings: AuditFindings; costUsd: string }> {
  const [ligacao] = await db
    .select({ username: instagramConnections.username })
    .from(instagramConnections)
    .where(eq(instagramConnections.companyId, companyId))
    .limit(1)

  if (!ligacao) {
    throw new AuditUnavailableError(
      'sem_instagram',
      'Conecte o Instagram da empresa em Configurações para rodar a auditoria.',
    )
  }

  const [retrato] = await db
    .select({ data: instagramSnapshots.data })
    .from(instagramSnapshots)
    .where(eq(instagramSnapshots.companyId, companyId))
    .limit(1)

  const posts = await db
    .select()
    .from(instagramMedia)
    .where(eq(instagramMedia.companyId, companyId))
    .orderBy(desc(instagramMedia.postedAt))
    .limit(POSTS_NA_AUDITORIA)

  if (!retrato && posts.length === 0) {
    throw new AuditUnavailableError(
      'sem_dados',
      'A plataforma ainda não buscou os dados do Instagram. Abra o Analytics e clique em Atualizar.',
    )
  }

  const snapshot = retrato?.data ?? null
  const hoje = now()

  const { output, costUsd } = await runAgent({
    db,
    client,
    usdBrlRate,
    agent: 'auditoria',
    companyId,
    schema: auditDraftSchema,
    input: [
      'Faça a auditoria do Instagram desta empresa com os dados abaixo.',
      'Área sem dado vai para `notEvaluated`, não ganha nota.',
      '',
      ...blocoPerfil(ligacao.username, snapshot),
      '',
      ...blocoTotais(snapshot),
      '',
      ...blocoPosts(posts, hoje),
    ].join('\n'),
  })

  return {
    findings: {
      overallScore: notaGeral(output.areas),
      areas: output.areas,
      strengths: output.strengths,
      issues: output.issues,
      notEvaluated: output.notEvaluated,
      generatedAt: hoje.toISOString(),
    },
    costUsd,
  }
}
