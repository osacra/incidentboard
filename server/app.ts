import cors from 'cors'
import express from 'express'
import { randomUUID } from 'node:crypto'
import type { Incident, IncidentComment, IncidentSeverity, IncidentStatus } from '../src/types'
import { authenticate, createAccessToken, createRefreshToken, requestPasswordReset, requireAuth, requireRole, resetPassword, revokeRefreshToken, rotateRefreshToken, type AuthUser } from './auth'
import { eq } from 'drizzle-orm'
import { assertTransition } from './domain/incident'
import { users } from './db/schema'
import { pool } from './db/client'
import { db, ensureStore } from './store'
import { addIncidentComment, createIncidentEvent, getIncident, getIncidents, saveIncidents } from './store'

const loginAttempts = new Map<string, { count: number; resetAt: number }>()
const loginWindowMs = 60_000
const maxLoginAttempts = 10

const loginRateLimit = (request: express.Request, response: express.Response, next: express.NextFunction) => {
  if (process.env.NODE_ENV === 'test') return next()
  const key = request.ip || 'unknown'
  const now = Date.now()
  const current = loginAttempts.get(key)
  if (!current || current.resetAt <= now) {
    loginAttempts.set(key, { count: 1, resetAt: now + loginWindowMs })
    return next()
  }
  if (current.count >= maxLoginAttempts) return response.status(429).json({ message: 'Muitas tentativas de login. Tente novamente em um minuto.' })
  current.count += 1
  return next()
}

export const createApp = () => {
  const app = express()
  const validStatuses: IncidentStatus[] = ['open', 'investigating', 'monitoring', 'resolved']
  const validSeverities: IncidentSeverity[] = ['low', 'medium', 'high', 'critical']
  const allowedOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:5173'

  app.use((request, response, next) => {
    response.setHeader('X-Request-Id', randomUUID())
    next()
  })
  app.use(cors({ origin: allowedOrigin, credentials: true }))
  app.use(express.json({ limit: '100kb' }))
  app.get('/api/health', (_request, response) => response.json({ status: 'ok', service: 'incidentboard-api' }))
  app.get('/api/health/live', (_request, response) => response.json({ status: 'ok', service: 'incidentboard-api' }))
  app.get('/api/health/ready', async (_request, response) => {
    try {
      await pool.query('SELECT 1')
      return response.json({ status: 'ready', database: 'ok' })
    } catch {
      return response.status(503).json({ status: 'not_ready', database: 'unavailable' })
    }
  })

  app.post('/api/auth/login', loginRateLimit, async (request, response, next) => {
    const { email, password } = request.body as { email?: string; password?: string }
    if (!email || !password) return response.status(400).json({ message: 'E-mail e senha são obrigatórios.' })
    try {
      const user = await authenticate(email, password)
      if (!user) return response.status(401).json({ message: 'Credenciais inválidas.' })
      return response.json({ token: createAccessToken(user), refreshToken: await createRefreshToken(user), user })
    } catch (error) { return next(error) }
  })

  app.post('/api/auth/refresh', async (request, response, next) => {
    try {
      const result = await rotateRefreshToken(String(request.body?.refreshToken ?? ''))
      if (!result) return response.status(401).json({ message: 'Refresh token inválido ou expirado.' })
      return response.json(result)
    } catch (error) { return next(error) }
  })

  app.post('/api/auth/logout', async (request, response, next) => {
    try { await revokeRefreshToken(String(request.body?.refreshToken ?? '')); return response.status(204).send() } catch (error) { return next(error) }
  })

  app.post('/api/auth/forgot-password', async (request, response, next) => {
    const { email } = request.body as { email?: string }
    if (!email?.trim()) return response.status(400).json({ message: 'E-mail é obrigatório.' })
    try {
      const token = await requestPasswordReset(email)
      const payload: { message: string; resetToken?: string } = { message: 'Se o e-mail existir, as instruções de recuperação foram geradas.' }
      if (token && process.env.NODE_ENV !== 'production') payload.resetToken = token
      return response.status(202).json(payload)
    } catch (error) { return next(error) }
  })

  app.post('/api/auth/reset-password', async (request, response, next) => {
    const { token, password } = request.body as { token?: string; password?: string }
    if (!token || !password || password.length < 8) return response.status(400).json({ message: 'Token e senha com pelo menos 8 caracteres são obrigatórios.' })
    try {
      const changed = await resetPassword(token, password)
      return changed ? response.status(204).send() : response.status(400).json({ message: 'Token inválido ou expirado.' })
    } catch (error) { return next(error) }
  })

  app.get('/api/auth/me', requireAuth, (_request, response) => response.json(response.locals.user))

  app.get('/api/users', requireAuth, requireRole('admin'), async (_request, response, next) => {
    try {
      await ensureStore()
      const records = await db.select({ id: users.id, email: users.email, name: users.name, role: users.role, createdAt: users.createdAt }).from(users)
      return response.json(records)
    } catch (error) { return next(error) }
  })

  app.patch('/api/users/:id/role', requireAuth, requireRole('admin'), async (request, response, next) => {
    const role = request.body?.role as string
    if (!['admin', 'operator', 'viewer'].includes(role)) return response.status(400).json({ message: 'Papel inválido.' })
    try {
      await ensureStore()
      const records = await db.update(users).set({ role: role as 'admin' | 'operator' | 'viewer', updatedAt: new Date() }).where(eq(users.id, Number(request.params.id))).returning({ id: users.id, email: users.email, name: users.name, role: users.role, createdAt: users.createdAt })
      if (!records[0]) return response.status(404).json({ message: 'Usuário não encontrado.' })
      return response.json(records[0])
    } catch (error) { return next(error) }
  })

  app.use('/api/incidents', requireAuth)
  app.patch('/api/incidents/:id', requireRole('admin', 'operator'))
  app.post('/api/incidents', requireRole('admin', 'operator'))
  app.post('/api/incidents/:id/comments', requireRole('admin', 'operator'))

  app.get('/api/incidents', async (_request, response, next) => {
    try { response.json(await getIncidents()) } catch (error) { next(error) }
  })

  app.get('/api/incidents/:id', async (request, response, next) => {
    try {
      const incident = await getIncident(request.params.id)
      if (!incident) return response.status(404).json({ message: 'Incidente não encontrado.' })
      return response.json(incident)
    } catch (error) { return next(error) }
  })

  app.post('/api/incidents', async (request, response, next) => {
    try {
      const { title, description, severity, assignee, service, slaHours } = request.body as Partial<Incident>
      if (!title?.trim() || !description?.trim() || !assignee?.trim() || !service?.trim()) return response.status(400).json({ message: 'Título, descrição, responsável e serviço são obrigatórios.' })
      if (!validSeverities.includes(severity as IncidentSeverity)) return response.status(400).json({ message: 'Severidade inválida.' })
      const incidents = await getIncidents()
      const highest = incidents.reduce((max, incident) => Math.max(max, Number(incident.id.replace('INC-', '')) || 0), 1040)
      const now = new Date().toISOString()
      const incident: Incident = { id: `INC-${highest + 1}`, title: title.trim(), description: description.trim(), severity: severity as IncidentSeverity, status: 'open', assignee: assignee.trim(), service: service.trim(), createdAt: now, updatedAt: now, slaHours: Number(slaHours) > 0 ? Number(slaHours) : 24, comments: [] }
      await saveIncidents([incident, ...incidents])
      await createIncidentEvent({ legacyId: incident.id, actor: response.locals.user as AuthUser, type: 'incident.created', after: incident })
      return response.status(201).json(incident)
    } catch (error) { return next(error) }
  })

  app.patch('/api/incidents/:id', async (request, response, next) => {
    try {
      const incidents = await getIncidents()
      const index = incidents.findIndex((incident) => incident.id === request.params.id)
      if (index === -1) return response.status(404).json({ message: 'Incidente não encontrado.' })
      const { status, severity, assignee, service } = request.body as Partial<Incident>
      const previous = incidents[index]
      if (status && !validStatuses.includes(status)) return response.status(400).json({ message: 'Status inválido.' })
      if (severity && !validSeverities.includes(severity)) return response.status(400).json({ message: 'Severidade inválida.' })
      if (status && status !== previous.status) {
        try { assertTransition(previous.status, status) } catch (error) { return response.status(409).json({ message: error instanceof Error ? error.message : 'Transição de status inválida.' }) }
      }
      incidents[index] = { ...previous, ...(status && { status }), ...(severity && { severity }), ...(assignee && { assignee }), ...(service && { service }), updatedAt: new Date().toISOString() }
      await saveIncidents(incidents)
      await createIncidentEvent({ legacyId: incidents[index].id, actor: response.locals.user as AuthUser, type: status && status !== previous.status ? 'incident.status_changed' : 'incident.updated', before: previous, after: incidents[index] })
      return response.json(incidents[index])
    } catch (error) { return next(error) }
  })

  app.post('/api/incidents/:id/comments', async (request, response, next) => {
    try {
      const { body } = request.body as Partial<IncidentComment>
      if (!body?.trim()) return response.status(400).json({ message: 'O comentário não pode ficar vazio.' })
      const actor = response.locals.user as AuthUser
      const incident = await addIncidentComment(request.params.id, actor, body.trim())
      if (!incident) return response.status(404).json({ message: 'Incidente não encontrado.' })
      await createIncidentEvent({ legacyId: request.params.id, actor, type: 'incident.comment_added', after: { body: body.trim() } })
      return response.status(201).json(incident)
    } catch (error) { return next(error) }
  })

  app.use((error: unknown, _request: express.Request, response: express.Response, next: express.NextFunction) => {
    void next
    console.error(error)
    response.status(500).json({ message: 'Erro interno ao processar a solicitação.' })
  })
  return app
}
