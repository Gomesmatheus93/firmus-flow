import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from './app'

describe('GET /health', () => {
  it('responde 200 com { ok: true }', async () => {
    const response = await request(createApp()).get('/health')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ ok: true })
  })
})
