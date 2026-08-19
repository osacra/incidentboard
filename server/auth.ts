import 'dotenv/config'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { NextFunction, Request, Response } from 'express'
import { eq } from 'drizzle-orm'
import { db, ensureStore } from './store'
import { users } from './db/schema'

const jwtSecret = process.env.JWT_SECRET ?? 'incidentboard-development-secret'

type AuthUser = { id: number; email: string; name: string; role: string }
type TokenPayload = AuthUser & { iat: number; exp: number }

export async function authenticate(email: string, password: string): Promise<AuthUser | null> {
  await ensureStore()
  const rows = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).limit(1)
  const user = rows[0]
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return null
  return { id: user.id, email: user.email, name: user.name, role: user.role }
}

export function createToken(user: AuthUser) { return jwt.sign(user, jwtSecret, { expiresIn: '8h' }) }

export function requireAuth(request: Request, response: Response, next: NextFunction) {
  const header = request.header('Authorization')
  if (!header?.startsWith('Bearer ')) return response.status(401).json({ message: 'Autenticação necessária.' })
  try {
    response.locals.user = jwt.verify(header.slice(7), jwtSecret) as TokenPayload
    return next()
  } catch { return response.status(401).json({ message: 'Token inválido ou expirado.' }) }
}
