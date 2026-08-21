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

export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
})

export const comments = pgTable('comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  incidentId: uuid('incident_id').notNull().references(() => incidents.id, { onDelete: 'cascade' }),
  authorId: integer('author_id').references(() => users.id, { onDelete: 'set null' }),
  authorName: text('author_name').notNull(),
  body: text('body').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const incidentEvents = pgTable('incident_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  incidentId: uuid('incident_id').notNull().references(() => incidents.id, { onDelete: 'cascade' }),
  actorId: integer('actor_id').references(() => users.id, { onDelete: 'set null' }),
  actorName: text('actor_name').notNull(),
  type: text('type').notNull(),
  beforeData: text('before_data'),
  afterData: text('after_data'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
