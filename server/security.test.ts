import express from 'express'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createLoginRateLimit } from './security'

const createLimitedApp = (options: Parameters<typeof createLoginRateLimit>[0]) => {
  const app = express()
  app.post('/login', createLoginRateLimit(options), (_request, response) => response.status(204).send())
  return app
}

describe('proteções de autenticação', () => {
  it('bloqueia novas tentativas quando o limite é atingido', async () => {
    const app = createLimitedApp({ maxAttempts: 2, windowMs: 60_000, enabled: true })
    expect((await request(app).post('/login')).status).toBe(204)
    expect((await request(app).post('/login')).status).toBe(204)
    const blocked = await request(app).post('/login')
    expect(blocked.status).toBe(429)
    expect(blocked.body.message).toContain('Muitas tentativas')
  })

  it('permite uma nova tentativa depois da janela configurada', async () => {
    const app = createLimitedApp({ maxAttempts: 1, windowMs: 1, enabled: true })
    expect((await request(app).post('/login')).status).toBe(204)
    await new Promise((resolve) => setTimeout(resolve, 5))
    expect((await request(app).post('/login')).status).toBe(204)
  })
})
