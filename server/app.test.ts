import { afterAll, describe, expect, it } from 'vitest'
import request from 'supertest'
import { createApp } from './app'

const app = createApp()

describe('IncidentBoard API', () => {
  it('responde ao health check', async () => {
    const response = await request(app).get('/api/health')
    expect(response.status).toBe(200)
    expect(response.body).toEqual({ status: 'ok', service: 'incidentboard-api' })
  })

  it('faz login com a conta de demonstração', async () => {
    const response = await request(app).post('/api/auth/login').send({ email: 'demo@incidentboard.local', password: 'incidentboard' })
    expect(response.status).toBe(200)
    expect(response.body.token).toEqual(expect.any(String))
    expect(response.body.refreshToken).toEqual(expect.any(String))
    expect(response.body.user.role).toBe('admin')
  })

  it('rotaciona e revoga refresh tokens', async () => {
    const login = await request(app).post('/api/auth/login').send({ email: 'demo@incidentboard.local', password: 'incidentboard' })
    const firstRefreshToken = login.body.refreshToken as string
    const rotated = await request(app).post('/api/auth/refresh').send({ refreshToken: firstRefreshToken })
    expect(rotated.status).toBe(200)
    expect(rotated.body.token).toEqual(expect.any(String))
    expect(rotated.body.refreshToken).toEqual(expect.any(String))
    const reused = await request(app).post('/api/auth/refresh').send({ refreshToken: firstRefreshToken })
    expect(reused.status).toBe(401)
    const logout = await request(app).post('/api/auth/logout').send({ refreshToken: rotated.body.refreshToken })
    expect(logout.status).toBe(204)
    const afterLogout = await request(app).post('/api/auth/refresh').send({ refreshToken: rotated.body.refreshToken })
    expect(afterLogout.status).toBe(401)
  })

  it('recusa credenciais inválidas', async () => {
    const response = await request(app).post('/api/auth/login').send({ email: 'demo@incidentboard.local', password: 'errada' })
    expect(response.status).toBe(401)
  })

  it('recusa perfil sem token', async () => {
    const response = await request(app).get('/api/auth/me')
    expect(response.status).toBe(401)
  })

  it('recusa a criação sem campos obrigatórios', async () => {
    const login = await request(app).post('/api/auth/login').send({ email: 'demo@incidentboard.local', password: 'incidentboard' })
    const response = await request(app).post('/api/incidents').set('Authorization', `Bearer ${login.body.token}`).send({ title: 'Sem descrição' })
    expect(response.status).toBe(400)
    expect(response.body.message).toContain('obrigatórios')
  })

  it('protege e permite consultar incidentes após login', async () => {
    const unauthorized = await request(app).get('/api/incidents')
    expect(unauthorized.status).toBe(401)
    const login = await request(app).post('/api/auth/login').send({ email: 'demo@incidentboard.local', password: 'incidentboard' })
    const token = login.body.token as string
    const listResponse = await request(app).get('/api/incidents').set('Authorization', `Bearer ${token}`)
    expect(listResponse.status).toBe(200)
    expect(listResponse.body.length).toBeGreaterThan(0)
    const detailResponse = await request(app).get(`/api/incidents/${listResponse.body[0].id}`).set('Authorization', `Bearer ${token}`)
    expect(detailResponse.status).toBe(200)
    expect(detailResponse.body.id).toBe(listResponse.body[0].id)
  })

  afterAll(async () => {
    // A API não abre listener durante os testes; este hook deixa o ciclo explícito.
  })
})
