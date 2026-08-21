import bcrypt from 'bcryptjs'
import { randomUUID } from 'node:crypto'
import { desc, eq, inArray } from 'drizzle-orm'
import type { Incident } from '../src/types'
import { demoIncidents } from '../src/storage'
import { db, pool } from './db/client'
import { comments, incidents, users } from './db/schema'

let initialization: Promise<void> | undefined

const toIncident = (row: typeof incidents.$inferSelect, incidentComments: typeof comments.$inferSelect[]): Incident => ({
  id: row.legacyId ?? row.id,
  title: row.title,
  description: row.description,
  severity: row.severity,
  status: row.status,
  assignee: row.assignee,
  service: row.service,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
  slaHours: row.slaHours,
  comments: incidentComments.map((comment) => ({ id: comment.id, author: comment.authorName, body: comment.body, createdAt: comment.createdAt.toISOString() })),
})

async function seedDatabase() {
  const [userCount, incidentCount] = await Promise.all([
    db.select({ id: users.id }).from(users).limit(1),
    db.select({ id: incidents.id }).from(incidents).limit(1),
  ])
  if (userCount.length === 0) {
    await db.insert(users).values({ email: 'demo@incidentboard.local', passwordHash: await bcrypt.hash('incidentboard', 10), name: 'Demo Operator', role: 'admin' })
  }
  if (incidentCount.length === 0) {
    for (const incident of demoIncidents) {
      const [created] = await db.insert(incidents).values({ legacyId: incident.id, title: incident.title, description: incident.description, severity: incident.severity, status: incident.status, assignee: incident.assignee, service: incident.service, createdAt: new Date(incident.createdAt), updatedAt: new Date(incident.updatedAt), slaHours: incident.slaHours }).returning({ id: incidents.id })
      if (created && incident.comments.length > 0) await db.insert(comments).values(incident.comments.map((comment) => ({ id: randomUUID(), incidentId: created.id, authorName: comment.author, body: comment.body, createdAt: new Date(comment.createdAt) })))
    }
  }
}

export function ensureStore() {
  initialization ??= seedDatabase()
  return initialization
}

async function rowsToIncidents(rows: typeof incidents.$inferSelect[]) {
  if (rows.length === 0) return []
  const ids = rows.map((row) => row.id)
  const allComments = await db.select().from(comments).where(inArray(comments.incidentId, ids))
  return rows.map((row) => toIncident(row, allComments.filter((comment) => comment.incidentId === row.id)))
}

export async function getIncidents(): Promise<Incident[]> {
  await ensureStore()
  return rowsToIncidents(await db.select().from(incidents).orderBy(desc(incidents.createdAt)))
}

export async function getIncident(id: string): Promise<Incident | null> {
  await ensureStore()
  const rows = await db.select().from(incidents).where(eq(incidents.legacyId, id)).limit(1)
  if (rows.length === 0) return null
  const mapped = await rowsToIncidents(rows)
  return mapped[0] ?? null
}

export async function saveIncidents(next: Incident[]) {
  await ensureStore()
  await db.transaction(async (tx) => {
    const current = await tx.select({ legacyId: incidents.legacyId }).from(incidents)
    const ids = new Set(next.map((incident) => incident.id))
    for (const row of current) if (row.legacyId && !ids.has(row.legacyId)) await tx.delete(incidents).where(eq(incidents.legacyId, row.legacyId))
    for (const incident of next) {
      const existing = await tx.select({ id: incidents.id }).from(incidents).where(eq(incidents.legacyId, incident.id)).limit(1)
      const values = { title: incident.title, description: incident.description, severity: incident.severity, status: incident.status, assignee: incident.assignee, service: incident.service, createdAt: new Date(incident.createdAt), updatedAt: new Date(incident.updatedAt), slaHours: incident.slaHours }
      if (existing[0]) await tx.update(incidents).set(values).where(eq(incidents.id, existing[0].id))
      else await tx.insert(incidents).values({ legacyId: incident.id, ...values })
    }
  })
}

export async function addIncidentComment(legacyId: string, author: { id: number; name: string }, body: string): Promise<Incident | null> {
  await ensureStore()
  const incidentId = await db.transaction(async (tx) => {
    const incident = await tx.select({ id: incidents.id }).from(incidents).where(eq(incidents.legacyId, legacyId)).limit(1)
    if (!incident[0]) return null
    await tx.insert(comments).values({ incidentId: incident[0].id, authorId: author.id, authorName: author.name, body })
    await tx.update(incidents).set({ updatedAt: new Date() }).where(eq(incidents.id, incident[0].id))
    return incident[0].id
  })
  if (!incidentId) return null
  return getIncident(legacyId)
}

export { db, pool }
