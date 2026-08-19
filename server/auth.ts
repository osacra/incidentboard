import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { NextFunction, Request, Response } from 'express'
import { database } from './store'

const jwtSecret = process.env.JWT_SECRET ?? 'incidentboard-development-secret'

type AuthUser = { id: number; email: string; name: string; role: string }

type TokenPayload = AuthUser & { iat: number; exp: number }

export function authenticate(email: string, password: string): AuthUser | null {
  const user = database.prepare('SELECT id, email, name, role, password_hash FROM users WHERE email = ?').get(email.toLowerCase().trim()) as (AuthUser & { password_hash: string }) | undefined
  if (!user || !bcrypt.compareSync(password, user.password_hash)) return null
  return { id: user.id, email: user.email, name: user.name, role: user.role }
}

export function createToken(user: AuthUser) {
  return jwt.sign(user, jwtSecret, { expiresIn: '8h' })
}

export function requireAuth(request: Request, response: Response, next: NextFunction) {
  const header = request.header('Authorization')
  if (!header?.startsWith('Bearer ')) return response.status(401).json({ message: 'Autenticação necessária.' })
  try {
    const payload = jwt.verify(header.slice(7), jwtSecret) as TokenPayload
    response.locals.user = payload
    return next()
  } catch { return response.status(401).json({ message: 'Token inválido ou expirado.' }) }
}
