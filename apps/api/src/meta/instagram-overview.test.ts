import { describe, expect, it } from 'vitest'
import type { RespostaDaMeta } from './instagram'
import { createOverviewFetcher, type GraphCaller } from './instagram-overview'

/**
 * Uma Meta de mentira: cada chamada é respondida pela primeira regra cujo
 * trecho aparece no caminho (ou é o caminho inteiro, quando começa com `=`).
 * O formato das respostas é o da documentação.
 */
function metaFalsa(regras: [trecho: string, resposta: RespostaDaMeta][]) {
  const chamadas: string[] = []
  const call: GraphCaller = async (caminho, _token, campos) => {
    chamadas.push(campos ? `${caminho}|${campos}` : caminho)
    const regra = regras.find(([trecho]) =>
      trecho.startsWith('=') ? caminho === trecho.slice(1) : caminho.includes(trecho),
    )
    return regra ? regra[1] : { error: { message: 'metric not supported' } }
  }
  return { call, chamadas }
}

const total = (value: number) => ({ data: [{ total_value: { value } }] })
const porTipo = (value: number, partes: [string, number][]) => ({
  data: [
    {
      total_value: {
        value,
        breakdowns: [
          { results: partes.map(([chave, v]) => ({ dimension_values: [chave], value: v })) },
        ],
      },
    },
  ],
})

const perfil = {
  username: 'somosfirmus',
  name: 'Firmus Tech',
  biography: 'Tecnologia em Mossoró',
  followers_count: 4500,
  follows_count: 147,
  media_count: 29,
}

const contaCompleta = metaFalsa([
  [
    'metric=reach&',
    {
      data: [
        {
          values: [
            { value: 100, end_time: '2026-11-01T08:00:00+0000' },
            { value: 250, end_time: '2026-11-02T08:00:00+0000' },
          ],
        },
      ],
    },
  ],
  [
    'metric=follower_count',
    { data: [{ values: [{ value: 7, end_time: '2026-11-02T08:00:00+0000' }] }] },
  ],
  ['metric=views', total(900)],
  ['metric=accounts_engaged', total(80)],
  ['metric=total_interactions', total(140)],
  ['metric=likes', total(100)],
  ['metric=comments', total(20)],
  ['metric=shares', total(10)],
  ['metric=saves', total(10)],
  ['metric=replies', total(3)],
  ['metric=reposts', total(1)],
  [
    'follows_and_unfollows',
    porTipo(12, [
      ['FOLLOWER', 10],
      ['NON_FOLLOWER', 2],
    ]),
  ],
  [
    'profile_links_taps',
    porTipo(9, [
      ['CALL', 4],
      ['DIRECTION', 5],
    ]),
  ],
  [
    'breakdown=city',
    porTipo(0, [
      ['Natal', 30],
      ['Mossoró, Rio Grande do Norte', 120],
    ]),
  ],
  [
    'breakdown=gender',
    porTipo(0, [
      ['F', 60],
      ['M', 40],
    ]),
  ],
  ['online_followers', { data: [{ values: [{ value: { '9': 40, '20': 90 } }] }] }],
  [
    '/media?',
    {
      data: [
        {
          id: 'p1',
          caption: 'Energia digital',
          media_type: 'IMAGE',
          media_product_type: 'FEED',
          media_url: 'https://cdn/p1.jpg',
          timestamp: '2026-10-30T15:00:00+0000',
          like_count: 50,
          comments_count: 5,
        },
        {
          id: 'r1',
          media_type: 'VIDEO',
          media_product_type: 'REELS',
          media_url: 'https://cdn/r1.mp4',
          thumbnail_url: 'https://cdn/r1.jpg',
          timestamp: '2026-10-29T15:00:00+0000',
        },
      ],
    },
  ],
  [
    'p1/insights',
    {
      data: [
        { name: 'reach', values: [{ value: 1000 }] },
        { name: 'saved', values: [{ value: 7 }] },
        { name: 'profile_visits', values: [{ value: 12 }] },
      ],
    },
  ],
  ['r1/insights', { data: [{ name: 'reach', values: [{ value: 300 }] }] }],
  ['=somosfirmus-id', perfil],
])

describe('o retrato da conta', () => {
  it('lê o perfil, os totais de 30 dias e os toques por botão', async () => {
    const { snapshot } = await createOverviewFetcher(contaCompleta.call)('token', 'somosfirmus-id')

    expect(snapshot.profile).toMatchObject({
      username: 'somosfirmus',
      follows: 147,
      mediaCount: 29,
    })
    expect(snapshot.totals).toMatchObject({
      views: 900,
      accountsEngaged: 80,
      interactions: 140,
      likes: 100,
      follows: 10,
      unfollows: 2,
      profileLinksTaps: 9,
    })
    expect(snapshot.contactTaps).toEqual({ CALL: 4, DIRECTION: 5 })
  })

  it('o alcance vira série diária e o total é a soma dos dias', async () => {
    const { snapshot } = await createOverviewFetcher(contaCompleta.call)('token', 'somosfirmus-id')

    // end_time marca o fim do dia: 08:00 de 02/11 é o dia 01/11.
    expect(snapshot.reachByDay).toEqual([
      { date: '2026-10-31', value: 100 },
      { date: '2026-11-01', value: 250 },
    ])
    expect(snapshot.totals.reach).toBe(350)
  })

  it('o público vem ordenado do maior para o menor', async () => {
    const { snapshot } = await createOverviewFetcher(contaCompleta.call)('token', 'somosfirmus-id')

    expect(snapshot.audience?.city[0]).toEqual({ key: 'Mossoró, Rio Grande do Norte', value: 120 })
    expect(snapshot.onlineByHour?.find((h) => h.hour === 20)?.value).toBe(90)
  })

  it('lê os posts com as métricas de cada um, e o Reels usa a capa', async () => {
    const { posts } = await createOverviewFetcher(contaCompleta.call)('token', 'somosfirmus-id')

    expect(posts).toHaveLength(2)
    expect(posts[0]).toMatchObject({
      igMediaId: 'p1',
      likes: 50,
      reach: 1000,
      saves: 7,
      profileVisits: 12,
    })
    expect(posts[1]).toMatchObject({
      igMediaId: 'r1',
      thumbnailUrl: 'https://cdn/r1.jpg',
      reach: 300,
    })
  })

  it('Reels não pede profile_visits, que a Meta não tem para ele', async () => {
    await createOverviewFetcher(contaCompleta.call)('token', 'somosfirmus-id')

    const doReels = contaCompleta.chamadas.find((c) => c.startsWith('r1/insights'))
    expect(doReels).not.toContain('profile_visits')
  })

  it('a janela nunca passa de 30 dias, que é o limite da Meta', async () => {
    const { snapshot } = await createOverviewFetcher(contaCompleta.call)('token', 'somosfirmus-id')

    const dias = (Date.parse(snapshot.until) - Date.parse(snapshot.since)) / 86_400_000
    expect(dias).toBeLessThan(30)
    expect(dias).toBeGreaterThan(29.9)
  })
})

describe('conta pequena, que a Meta recusa em parte', () => {
  it('o que veio é guardado, o que faltou fica nulo e é relatado', async () => {
    const pequena = metaFalsa([
      ['metric=views', total(40)],
      ['/media?', { data: [] }],
      ['=conta-id', { ...perfil, followers_count: 12 }],
    ])

    const { snapshot, recusadas } = await createOverviewFetcher(pequena.call)('token', 'conta-id')

    expect(snapshot.totals.views).toBe(40)
    expect(snapshot.totals.reach).toBeNull()
    expect(snapshot.audience).toBeNull()
    expect(snapshot.newFollowersByDay).toEqual([])
    expect(recusadas.map((r) => r.metrica)).toContain('follower_count')
  })

  it('sem o perfil não há retrato: o erro sobe', async () => {
    const semPerfil = metaFalsa([])

    await expect(createOverviewFetcher(semPerfil.call)('token', 'conta-id')).rejects.toThrow(
      'metric not supported',
    )
  })
})
