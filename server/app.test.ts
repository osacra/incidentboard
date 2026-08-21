import { afterAll, describe, expect, it } from 'vitest'
import request from 'supertest'
import { createApp } from './app'

const app = createApp()

describe('IncidentBoard API', () => {
  it('responde aos health checks e envia request ID', async () => {
    const response = await request(app).get('/api/health')
    expect(response.status).toBe(200)
    expect(response.body).toEqual({ status: 'ok', service: 'incidentboard-api' })
    expect(response.headers['x-request-id']).toEqual(expect.any(String))

    const live = await request(app).get('/api/health/live')
    expect(live.status).toBe(200)
    expect(live.body).toEqual({ status: 'ok', service: 'incidentboard-api' })

    const ready = await request(app).get('/api/health/ready')
    expect(ready.status).toBe(200)
    expect(ready.body).toEqual({ status: 'ready', database: 'ok' })
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

  it('gera e consome token de recuperação de senha local', async () => {
    const forgot = await request(app).post('/api/auth/forgot-password').send({ email: 'demo@incidentboard.local' })
    expect(forgot.status).toBe(202)
    expect(forgot.body.resetToken).toEqual(expect.any(String))
    const reset = await request(app).post('/api/auth/reset-password').send({ token: forgot.body.resetToken, password: 'temporary-password' })
    expect(reset.status).toBe(204)
    const temporaryLogin = await request(app).post('/api/auth/login').send({ email: 'demo@incidentboard.local', password: 'temporary-password' })
    expect(temporaryLogin.status).toBe(200)
    const restore = await request(app).post('/api/auth/forgot-password').send({ email: 'demo@incidentboard.local' })
    const restored = await request(app).post('/api/auth/reset-password').send({ token: restore.body.resetToken, password: 'incidentboard' })
    expect(restored.status).toBe(204)
  })

  it('permite ao administrador listar usuários e alterar papéis', async () => {
    const login = await request(app).post('/api/auth/login').send({ email: 'demo@incidentboard.local', password: 'incidentboard' })
    const token = login.body.token as string
    const list = await request(app).get('/api/users').set('Authorization', `Bearer ${token}`)
    expect(list.status).toBe(200)
    expect(list.body[0]).not.toHaveProperty('passwordHash')
    const updated = await request(app).patch('/api/users/1/role').set('Authorization', `Bearer ${token}`).send({ role: 'admin' })
    expect(updated.status).toBe(200)
    expect(updated.body.role).toBe('admin')
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

  it('persiste comentários e usa a autoria da sessão autenticada', async () => {
    const login = await request(app).post('/api/auth/login').send({ email: 'demo@incidentboard.local', password: 'incidentboard' })
    const token = login.body.token as string
    const incidents = await request(app).get('/api/incidents').set('Authorization', `Bearer ${token}`)
    const incidentId = incidents.body[0].id as string

    const created = await request(app)
      .post(`/api/incidents/${incidentId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ author: 'Usuário forjado', body: 'Investigação iniciada' })

    expect(created.status).toBe(201)
    expect(created.body.comments.at(-1)).toMatchObject({ author: 'Demo Operator', body: 'Investigação iniciada' })

    const reloaded = await request(app).get(`/api/incidents/${incidentId}`).set('Authorization', `Bearer ${token}`)
    expect(reloaded.status).toBe(200)
    expect(reloaded.body.comments).toContainEqual(expect.objectContaining({ author: 'Demo Operator', body: 'Investigação iniciada' }))
  })

  it('rejeita transições inválidas e registra a mudança de status', async () => {
    const login = await request(app).post('/api/auth/login').send({ email: 'demo@incidentboard.local', password: 'incidentboard' })
    const token = login.body.token as string
    const created = await request(app).post('/api/incidents').set('Authorization', `Bearer ${token}`).send({
      title: 'Falha criada para teste de domínio',
      description: 'Incidente temporário para testar o ciclo de vida.',
      severity: 'high',
      assignee: 'Demo Operator',
      service: 'Checkout',
      slaHours: 8,
    })
    expect(created.status).toBe(201)

    const invalid = await request(app).patch(`/api/incidents/${created.body.id}`).set('Authorization', `Bearer ${token}`).send({ status: 'resolved' })
    expect(invalid.status).toBe(409)

    const valid = await request(app).patch(`/api/incidents/${created.body.id}`).set('Authorization', `Bearer ${token}`).send({ status: 'investigating' })
    expect(valid.status).toBe(200)

    const reloaded = await request(app).get(`/api/incidents/${created.body.id}`).set('Authorization', `Bearer ${token}`)
    expect(reloaded.body.activity).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'incident.created', actor: 'Demo Operator' }),
      expect.objectContaining({ type: 'incident.status_changed', actor: 'Demo Operator' }),
    ]))
  })

  afterAll(async () => {
    // A API não abre listener durante os testes; este hook deixa o ciclo explícito.
  })
})
