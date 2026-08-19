export type IncidentStatus = 'open' | 'investigating' | 'monitoring' | 'resolved'
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical'

export type IncidentComment = {
  id: string
  author: string
  body: string
  createdAt: string
}

export type Incident = {
  id: string
  title: string
  description: string
  severity: IncidentSeverity
  status: IncidentStatus
  assignee: string
  service: string
  createdAt: string
  updatedAt: string
  slaHours: number
  comments: IncidentComment[]
}

export type IncidentFilters = {
  search: string
  status: 'all' | IncidentStatus
  severity: 'all' | IncidentSeverity
  service: 'all' | string
}

export const statusLabels: Record<IncidentStatus, string> = {
  open: 'Aberto',
  investigating: 'Investigando',
  monitoring: 'Monitorando',
  resolved: 'Resolvido',
}

export const severityLabels: Record<IncidentSeverity, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  critical: 'Crítica',
}
