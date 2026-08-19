import 'dotenv/config'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { createHash, randomBytes } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'
import { and, eq, isNull } from 'drizzle-orm'
import { db, ensureStore } from './store'
import { refreshTokens, users } from './db/schema'

const jwtSecret = process.env.JWT_SECRET ?? 'incidentboard-development-secret'
const refreshTokenDays = 7

type UserRole = 'admin' | 'operator' | 'viewer'
type AuthUser = { id: number; email: string; name: string; role: UserRole }
type TokenPayload = AuthUser & { iat: number; exp: number }

const toAuthUser = (user: typeof users.$inferSelect): AuthUser => ({ id: user.id, email: user.email, name: user.name, role: user.role })
const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')

export async function authenticate(email: string, password: string): Promise<AuthUser | null> {
  await ensureStore()
  const rows = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).limit(1)
  const user = rows[0]
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return null
  return toAuthUser(user)
}

export function createAccessToken(user: AuthUser) { return jwt.sign(user, jwtSecret, { expiresIn: '15m' }) }

export async function createRefreshToken(user: AuthUser) {
  const token = randomBytes(48).toString('base64url')
  await db.insert(refreshTokens).values({ userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + refreshTokenDays * 24 * 60 * 60 * 1000) })
  return token
}

export async function rotateRefreshToken(token: string) {
  await ensureStore()
  const rows = await db.select({ stored: refreshTokens, user: users }).from(refreshTokens).innerJoin(users, eq(refreshTokens.userId, users.id)).where(and(eq(refreshTokens.tokenHash, hashToken(token)), isNull(refreshTokens.revokedAt))).limit(1)
  const record = rows[0]
  if (!record || record.stored.expiresAt.getTime() <= Date.now()) return null
  await db.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.id, record.stored.id))
  const user = toAuthUser(record.user)
  return { user, token: createAccessToken(user), refreshToken: await createRefreshToken(user) }
}

export async function revokeRefreshToken(token: string) {
  await db.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.tokenHash, hashToken(token)))
}

export function requireAuth(request: Request, response: Response, next: NextFunction) {
  const header = request.header('Authorization')
  if (!header?.startsWith('Bearer ')) return response.status(401).json({ message: 'Autenticação necessária.' })
  try {
    response.locals.user = jwt.verify(header.slice(7), jwtSecret) as TokenPayload
    return next()
  } catch { return response.status(401).json({ message: 'Token inválido ou expirado.' }) }
}

export function requireRole(...roles: UserRole[]) {
  return (_request: Request, response: Response, next: NextFunction) => {
    const user = response.locals.user as AuthUser | undefined
    if (!user || !roles.includes(user.role)) return response.status(403).json({ message: 'Você não tem permissão para esta ação.' })
    return next()
  }
}

export type { AuthUser, UserRole }
