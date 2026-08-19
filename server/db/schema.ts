import { integer, pgEnum, pgTable, serial, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const incidentStatus = pgEnum('incident_status', ['open', 'investigating', 'monitoring', 'resolved'])
export const incidentSeverity = pgEnum('incident_severity', ['low', 'medium', 'high', 'critical'])
export const userRole = pgEnum('user_role', ['admin', 'operator', 'viewer'])

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: userRole('role').notNull().default('operator'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const incidents = pgTable('incidents', {
  id: uuid('id').defaultRandom().primaryKey(),
  legacyId: text('legacy_id').unique(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  severity: incidentSeverity('severity').notNull(),
  status: incidentStatus('status').notNull().default('open'),
  assignee: text('assignee').notNull(),
  service: text('service').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  slaHours: integer('sla_hours').notNull().default(24),
})

export const comments = pgTable('comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  incidentId: uuid('incident_id').notNull().references(() => incidents.id, { onDelete: 'cascade' }),
  authorId: integer('author_id').references(() => users.id, { onDelete: 'set null' }),
  authorName: text('author_name').notNull(),
  body: text('body').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
