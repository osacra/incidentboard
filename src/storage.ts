import type { Incident } from './types'

const STORAGE_KEY = 'incidentboard:incidents'

const hoursFromNow = (hours: number) => new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
const hoursAgo = (hours: number) => new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

export const demoIncidents: Incident[] = [
  {
    id: 'INC-1048',
    title: 'Latência elevada no checkout',
    description: 'A taxa de resposta do checkout ultrapassou 3 segundos em picos de tráfego.',
    severity: 'high',
    status: 'investigating',
    assignee: 'Marina Costa',
    service: 'Checkout',
    createdAt: hoursAgo(3),
    updatedAt: hoursAgo(1),
    slaHours: 8,
    comments: [
      { id: 'c-1048-1', author: 'Marina Costa', body: 'Logs indicam aumento de consultas lentas no catálogo.', createdAt: hoursAgo(1) },
    ],
  },
  {
    id: 'INC-1047',
    title: 'Falha intermitente no envio de e-mails',
    description: 'Mensagens transacionais estão sendo reprocessadas pela fila de notificações.',
    severity: 'medium',
    status: 'monitoring',
    assignee: 'Rafael Lima',
    service: 'Notifications',
    createdAt: hoursAgo(16),
    updatedAt: hoursAgo(4),
    slaHours: 24,
    comments: [],
  },
  {
    id: 'INC-1046',
    title: 'Erro 500 na tela de relatórios',
    description: 'Usuários administradores encontram erro ao exportar relatórios em CSV.',
    severity: 'critical',
    status: 'open',
    assignee: 'João Mendes',
    service: 'Reporting',
    createdAt: hoursAgo(2),
    updatedAt: hoursAgo(2),
    slaHours: 4,
    comments: [],
  },
  {
    id: 'INC-1045',
    title: 'Atualização de domínio concluída',
    description: 'A troca de domínio foi aplicada e validada em todos os ambientes.',
    severity: 'low',
    status: 'resolved',
    assignee: 'Camila Alves',
    service: 'Platform',
    createdAt: hoursAgo(48),
    updatedAt: hoursAgo(28),
    slaHours: 72,
    comments: [
      { id: 'c-1045-1', author: 'Camila Alves', body: 'Monitoramento concluído sem novas ocorrências.', createdAt: hoursAgo(28) },
    ],
  },
]

export const loadIncidents = (): Incident[] => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) as Incident[] : demoIncidents
  } catch {
    return demoIncidents
  }
}

export const saveIncidents = (incidents: Incident[]) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(incidents))
}

export const formatDate = (date: string) => new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
}).format(new Date(date))

export type SlaStatus = 'on_track' | 'at_risk' | 'breached' | 'met'

export type SlaProgress = {
  status: SlaStatus
  label: string
  tone: 'success' | 'warning' | 'danger'
  percentage: number
  remainingHours: number
}

export const getSlaProgress = (incident: Incident, now = Date.now()): SlaProgress => {
  const createdAt = new Date(incident.createdAt).getTime()
  const durationHours = Math.max(incident.slaHours, 1)
  const deadline = createdAt + durationHours * 60 * 60 * 1000
  const remainingHours = (deadline - now) / (60 * 60 * 1000)
  const percentage = Math.min(100, Math.max(0, ((now - createdAt) / (durationHours * 60 * 60 * 1000)) * 100))

  if (incident.status === 'resolved') return { status: 'met', label: 'Encerrado', tone: 'success', percentage, remainingHours: Math.max(0, remainingHours) }
  if (remainingHours <= 0) return { status: 'breached', label: 'SLA estourado', tone: 'danger', percentage: 100, remainingHours: 0 }
  if (remainingHours <= durationHours * 0.25) return { status: 'at_risk', label: `${Math.ceil(remainingHours)}h restantes`, tone: 'warning', percentage, remainingHours }
  return { status: 'on_track', label: `${Math.ceil(remainingHours)}h restantes`, tone: 'success', percentage, remainingHours }
}

export const getSlaState = (incident: Incident) => {
  const { label, tone } = getSlaProgress(incident)
  return { label, tone }
}

export const nextIncidentId = (incidents: Incident[]) => {
  const highest = incidents.reduce((max, incident) => Math.max(max, Number(incident.id.replace('INC-', '')) || 0), 1040)
  return `INC-${highest + 1}`
}

export const hoursFromNowForPreview = hoursFromNow
