import { describe, expect, it } from 'vitest'
import { accountEngagementScore, postEngagementScore } from './analytics'

const post = (
  likes: number,
  comments: number,
  shares: number,
  saves: number,
  reach: number | null,
) => ({
  likes,
  comments,
  shares,
  saves,
  reach,
})

describe('score de engajamento', () => {
  it('é interações a cada 100 pessoas alcançadas', () => {
    // 50 + 10 + 5 + 5 = 70 interações em 1000 de alcance = 7 pontos
    expect(postEngagementScore(post(50, 10, 5, 5, 1000))).toBe(7)
  })

  it('sem alcance não inventa zero', () => {
    expect(postEngagementScore(post(10, 0, 0, 0, null))).toBeNull()
    expect(postEngagementScore(post(10, 0, 0, 0, 0))).toBeNull()
  })

  it('a conta é a média dos posts com alcance', () => {
    const posts = [post(50, 10, 5, 5, 1000), post(30, 0, 0, 0, 1000), post(9, 0, 0, 0, null)]

    // (7 + 3) / 2 — o post sem alcance fica de fora
    expect(accountEngagementScore(posts)).toBe(5)
  })

  it('conta sem post nenhum fica sem score', () => {
    expect(accountEngagementScore([])).toBeNull()
  })
})
