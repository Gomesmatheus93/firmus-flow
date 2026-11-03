import { instagramConnections, instagramMedia, instagramSnapshots } from '@firmus/db/schema'
import type { InstagramSnapshot } from '@firmus/shared'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AuditUnavailableError, runAudit } from '.'
import {
  clienteFalso,
  cotacaoFixa,
  createAgentHarness,
  type createAgentHarness as Harness,
} from '../runtime/test-helpers'

let h: Awaited<ReturnType<typeof Harness>>

beforeEach(async () => {
  h = await createAgentHarness()
})

afterEach(async () => {
  await h.close()
})

const agora = () => new Date('2026-11-03T12:00:00Z')

/** Uma resposta no formato que o auditDraftSchema exige. */
const rascunhoValido = {
  areas: [
    { label: 'Bio', score: 4 },
    { label: 'Link', score: 7 },
  ],
  strengths: ['O carrossel de 28/10 teve 3x a mediana de alcance.'],
  issues: [
    {
      priority: 'alta' as const,
      title: 'A bio não diz para quem é',
      detail: 'Pela bio atual: só o nome da empresa. Sugestão: "Estética em Mossoró…"',
    },
  ],
  notEvaluated: ['Destaques: a API da Meta não mostra.'],
}

function retrato(): InstagramSnapshot {
  return {
    profile: {
      username: 'studioaura',
      name: 'Studio Aura',
      biography: 'Estética avançada',
      website: 'https://wa.me/5584999999999',
      profilePictureUrl: null,
      followers: 1200,
      follows: 300,
      mediaCount: 85,
    },
    since: '2026-10-04T00:00:00Z',
    until: '2026-11-03T00:00:00Z',
    totals: {
      reach: 5000,
      views: 9000,
      accountsEngaged: 400,
      interactions: 700,
      likes: 500,
      comments: 40,
      shares: 60,
      saves: 100,
      replies: null,
      reposts: null,
      follows: 30,
      unfollows: 5,
      profileLinksTaps: 22,
    },
    contactTaps: {},
    reachByDay: [],
    newFollowersByDay: [],
    audience: null,
    onlineByHour: null,
  }
}

async function conectar(companyId: string) {
  await h.db.insert(instagramConnections).values({
    companyId,
    igAccountId: '1789',
    username: 'studioaura',
    accessTokenCipher: 'cifrado',
  })
}

async function postar(
  companyId: string,
  igMediaId: string,
  reach: number | null,
  postedAt: string,
) {
  await h.db.insert(instagramMedia).values({
    companyId,
    igMediaId,
    caption: `Legenda do post ${igMediaId}`,
    mediaType: 'CAROUSEL_ALBUM',
    mediaProductType: 'FEED',
    postedAt: new Date(postedAt),
    reach,
    likes: 50,
    comments: 5,
    saves: 10,
    shares: 5,
  })
}

const rodar = (client: Parameters<typeof runAudit>[0]['client'], companyId = h.auraId) =>
  runAudit({ db: h.db, client, usdBrlRate: cotacaoFixa, companyId, now: agora })

describe('agente auditoria', () => {
  it('sem Instagram conectado não chama a IA', async () => {
    const { client, chamadas } = clienteFalso({ parsed_output: rascunhoValido })

    const erro = await rodar(client).catch((e: unknown) => e)

    expect(erro).toBeInstanceOf(AuditUnavailableError)
    expect((erro as AuditUnavailableError).reason).toBe('sem_instagram')
    expect(chamadas).toHaveLength(0)
  })

  it('conectado mas sem nada buscado na Meta também não chama a IA', async () => {
    await conectar(h.auraId)
    const { client, chamadas } = clienteFalso({ parsed_output: rascunhoValido })

    const erro = await rodar(client).catch((e: unknown) => e)

    expect((erro as AuditUnavailableError).reason).toBe('sem_dados')
    expect(chamadas).toHaveLength(0)
  })

  it('manda o perfil e os posts com as contas já feitas', async () => {
    await conectar(h.auraId)
    await h.db.insert(instagramSnapshots).values({ companyId: h.auraId, data: retrato() })
    await postar(h.auraId, 'a', 100, '2026-10-20T15:00:00Z')
    await postar(h.auraId, 'b', 300, '2026-10-28T15:00:00Z')
    await postar(h.auraId, 'c', 200, '2026-10-24T15:00:00Z')

    const { client, chamadas } = clienteFalso({ parsed_output: rascunhoValido })
    await rodar(client)

    const entrada = chamadas[0]!.input
    expect(entrada).toContain('Bio: Estética avançada')
    expect(entrada).toContain('Mediana de alcance por post: 200')
    // O post de 300 de alcance sobre a mediana de 200: 1,5x.
    expect(entrada).toContain('Vezes a mediana: 1,5x')
    // Do mais novo para o mais antigo, com a distância até hoje.
    expect(entrada).toContain('Último post: 2026-10-28, há 6 dias.')
    expect(entrada.indexOf('Legenda do post b')).toBeLessThan(entrada.indexOf('Legenda do post a'))
  })

  it('número que a Meta não entregou não vira zero', async () => {
    await conectar(h.auraId)
    await postar(h.auraId, 'a', null, '2026-10-20T15:00:00Z')

    const { client, chamadas } = clienteFalso({ parsed_output: rascunhoValido })
    await rodar(client)

    expect(chamadas[0]!.input).toContain('Alcance: não entregue pela Meta')
    expect(chamadas[0]!.input).not.toContain('Alcance: 0')
  })

  it('calcula a nota geral e marca a hora no servidor', async () => {
    await conectar(h.auraId)
    await postar(h.auraId, 'a', 100, '2026-10-20T15:00:00Z')

    const { client } = clienteFalso({ parsed_output: rascunhoValido })
    const { findings } = await rodar(client)

    // Média de 4 e 7.
    expect(findings.overallScore).toBe(5.5)
    expect(findings.generatedAt).toBe('2026-11-03T12:00:00.000Z')
    expect(findings.notEvaluated).toContain('Destaques: a API da Meta não mostra.')
  })

  it('não lê os posts de outra empresa', async () => {
    await conectar(h.auraId)
    await postar(h.auraId, 'da-aura', 100, '2026-10-20T15:00:00Z')
    await postar(h.rivalId, 'da-rival', 900, '2026-10-21T15:00:00Z')

    const { client, chamadas } = clienteFalso({ parsed_output: rascunhoValido })
    await rodar(client)

    expect(chamadas[0]!.input).toContain('Legenda do post da-aura')
    expect(chamadas[0]!.input).not.toContain('da-rival')
    expect(chamadas[0]!.system).not.toContain('SEGREDO DA RIVAL')
  })

  it('resposta fora do schema não passa', async () => {
    await conectar(h.auraId)
    await postar(h.auraId, 'a', 100, '2026-10-20T15:00:00Z')

    const { client } = clienteFalso({ parsed_output: null })

    await expect(rodar(client)).rejects.toThrow('fora do formato pedido')
  })
})
