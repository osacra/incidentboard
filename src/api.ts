import type { Incident, IncidentComment, IncidentSeverity, IncidentStatus } from './types'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api'
const TOKEN_KEY = 'incidentboard:token'
const REFRESH_TOKEN_KEY = 'incidentboard:refresh-token'

export type AuthUser = { id: number; email: string; name: string; role: 'admin' | 'operator' | 'viewer' }
type AuthResponse = { token: string; refreshToken: string; user: AuthUser }

export const session = {
  getToken: () => window.localStorage.getItem(TOKEN_KEY),
  getRefreshToken: () => window.localStorage.getItem(REFRESH_TOKEN_KEY),
  setSession: (auth: Pick<AuthResponse, 'token' | 'refreshToken'>) => {
    window.localStorage.setItem(TOKEN_KEY, auth.token)
    window.localStorage.setItem(REFRESH_TOKEN_KEY, auth.refreshToken)
  },
  clear: () => {
    window.localStorage.removeItem(TOKEN_KEY)
    window.localStorage.removeItem(REFRESH_TOKEN_KEY)
  },
}

async function refreshSession() {
  const refreshToken = session.getRefreshToken()
  if (!refreshToken) return false
  const response = await fetch(`${API_URL}/auth/refresh`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken }) })
  if (!response.ok) { session.clear(); return false }
  const auth = await response.json() as AuthResponse
  session.setSession(auth)
  return true
}

async function request<T>(path: string, options?: RequestInit, canRefresh = true): Promise<T> {
  const token = session.getToken()
  const response = await fetch(`${API_URL}${path}`, { headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options?.headers ?? {}) }, ...options })
  if (response.status === 401 && canRefresh && !path.startsWith('/auth/')) {
    if (await refreshSession()) return request<T>(path, options, false)
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { message?: string }
    throw new Error(body.message ?? 'Não foi possível completar a solicitação.')
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const api = {
  login: (email: string, password: string) => request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  refresh: refreshSession,
  logout: async () => { const refreshToken = session.getRefreshToken(); session.clear(); if (refreshToken) await request<void>('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) }, false) },
  me: () => request<AuthUser>('/auth/me'),
  listIncidents: () => request<Incident[]>('/incidents'),
  createIncident: (payload: Pick<Incident, 'title' | 'description' | 'severity' | 'assignee' | 'service' | 'slaHours'>) => request<Incident>('/incidents', { method: 'POST', body: JSON.stringify(payload) }),
  updateIncident: (id: string, payload: Partial<Pick<Incident, 'status' | 'severity' | 'assignee' | 'service'>>) => request<Incident>(`/incidents/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  addComment: (id: string, payload: Pick<IncidentComment, 'body' | 'author'>) => request<Incident>(`/incidents/${id}/comments`, { method: 'POST', body: JSON.stringify(payload) }),
  isAvailable: async () => { try { await request<{ status: string }>('/health'); return true } catch { return false } },
}

export type IncidentUpdate = { status?: IncidentStatus; severity?: IncidentSeverity }
