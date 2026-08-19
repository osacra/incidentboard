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
    expect(response.body.user.role).toBe('admin')
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
    const response = await request(app).post('/api/incidents').send({ title: 'Sem descrição' })
    expect(response.status).toBe(400)
    expect(response.body.message).toContain('obrigatórios')
  })

  it('lista incidentes e permite consultar um incidente existente', async () => {
    const listResponse = await request(app).get('/api/incidents')
    expect(listResponse.status).toBe(200)
    expect(listResponse.body.length).toBeGreaterThan(0)

    const detailResponse = await request(app).get(`/api/incidents/${listResponse.body[0].id}`)
    expect(detailResponse.status).toBe(200)
    expect(detailResponse.body.id).toBe(listResponse.body[0].id)
  })

  afterAll(async () => {
    // A API não abre listener durante os testes; este hook deixa o ciclo explícito.
  })
})
