import bcrypt from 'bcryptjs'
import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import type { Incident } from '../src/types'
import { demoIncidents } from '../src/storage'

const databasePath = resolve(process.cwd(), 'server/data/incidentboard.sqlite')
mkdirSync(dirname(databasePath), { recursive: true })
const database = new Database(databasePath)
database.pragma('journal_mode = WAL')
database.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'operator'
  );
  CREATE TABLE IF NOT EXISTS incidents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    severity TEXT NOT NULL,
    status TEXT NOT NULL,
    assignee TEXT NOT NULL,
    service TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    sla_hours INTEGER NOT NULL,
    comments_json TEXT NOT NULL DEFAULT '[]'
  )
`)

const userCount = database.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
if (userCount.count === 0) {
  const passwordHash = bcrypt.hashSync('incidentboard', 10)
  database.prepare('INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)').run('demo@incidentboard.local', passwordHash, 'Demo Operator', 'admin')
}

const count = database.prepare('SELECT COUNT(*) as count FROM incidents').get() as { count: number }
if (count.count === 0) {
  const insert = database.prepare(`INSERT INTO incidents (id, title, description, severity, status, assignee, service, created_at, updated_at, sla_hours, comments_json) VALUES (@id, @title, @description, @severity, @status, @assignee, @service, @createdAt, @updatedAt, @slaHours, @commentsJson)`)
  const seed = database.transaction((incidents: Incident[]) => { incidents.forEach((incident) => insert.run({ ...incident, commentsJson: JSON.stringify(incident.comments) })) })
  seed(demoIncidents)
}

const mapRow = (row: Record<string, unknown>): Incident => ({
  id: String(row.id), title: String(row.title), description: String(row.description), severity: row.severity as Incident['severity'], status: row.status as Incident['status'], assignee: String(row.assignee), service: String(row.service), createdAt: String(row.created_at), updatedAt: String(row.updated_at), slaHours: Number(row.sla_hours), comments: JSON.parse(String(row.comments_json)),
})

export { database }
export async function ensureStore() { return database }
export function getIncidents(): Incident[] { return (database.prepare('SELECT * FROM incidents ORDER BY created_at DESC').all() as Record<string, unknown>[]).map(mapRow) }
export function getIncident(id: string) { const row = database.prepare('SELECT * FROM incidents WHERE id = ?').get(id) as Record<string, unknown> | undefined; return row ? mapRow(row) : null }
export function saveIncidents(incidents: Incident[]) {
  const replace = database.prepare(`INSERT OR REPLACE INTO incidents (id, title, description, severity, status, assignee, service, created_at, updated_at, sla_hours, comments_json) VALUES (@id, @title, @description, @severity, @status, @assignee, @service, @createdAt, @updatedAt, @slaHours, @commentsJson)`)
  const remove = database.prepare('DELETE FROM incidents WHERE id = ?')
  const persist = database.transaction((next: Incident[]) => { const current = getIncidents(); const ids = new Set(next.map((incident) => incident.id)); current.filter((incident) => !ids.has(incident.id)).forEach((incident) => remove.run(incident.id)); next.forEach((incident) => replace.run({ ...incident, commentsJson: JSON.stringify(incident.comments) })) })
  persist(incidents)
}
