import type { NextFunction, Request, Response } from 'express'

type LoginRateLimitOptions = { windowMs?: number; maxAttempts?: number; enabled?: boolean }

export const createLoginRateLimit = ({ windowMs = 60_000, maxAttempts = 10, enabled = process.env.NODE_ENV !== 'test' }: LoginRateLimitOptions = {}) => {
  const attempts = new Map<string, { count: number; resetAt: number }>()
  return (request: Request, response: Response, next: NextFunction) => {
    if (!enabled) return next()
    const key = request.ip || 'unknown'
    const now = Date.now()
    const current = attempts.get(key)
    if (!current || current.resetAt <= now) {
      attempts.set(key, { count: 1, resetAt: now + windowMs })
      return next()
    }
    if (current.count >= maxAttempts) return response.status(429).json({ message: 'Muitas tentativas de login. Tente novamente em um minuto.' })
    current.count += 1
    return next()
  }
}
