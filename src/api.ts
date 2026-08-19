import type { Incident, IncidentComment, IncidentSeverity, IncidentStatus } from './types'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) }, ...options })
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { message?: string }
    throw new Error(body.message ?? 'Não foi possível completar a solicitação.')
  }
  return response.json() as Promise<T>
}

export const api = {
  listIncidents: () => request<Incident[]>('/incidents'),
  createIncident: (payload: Pick<Incident, 'title' | 'description' | 'severity' | 'assignee' | 'service' | 'slaHours'>) => request<Incident>('/incidents', { method: 'POST', body: JSON.stringify(payload) }),
  updateIncident: (id: string, payload: Partial<Pick<Incident, 'status' | 'severity' | 'assignee' | 'service'>>) => request<Incident>(`/incidents/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  addComment: (id: string, payload: Pick<IncidentComment, 'body' | 'author'>) => request<Incident>(`/incidents/${id}/comments`, { method: 'POST', body: JSON.stringify(payload) }),
  isAvailable: async () => { try { await request<{ status: string }>('/health'); return true } catch { return false } },
}

export type IncidentUpdate = { status?: IncidentStatus; severity?: IncidentSeverity }
