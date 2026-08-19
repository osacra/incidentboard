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

export const getSlaState = (incident: Incident) => {
  if (incident.status === 'resolved') return { label: 'Encerrado', tone: 'success' }
  const deadline = new Date(incident.createdAt).getTime() + incident.slaHours * 60 * 60 * 1000
  const remainingHours = (deadline - Date.now()) / (60 * 60 * 1000)
  if (remainingHours <= 0) return { label: 'SLA estourado', tone: 'danger' }
  if (remainingHours <= incident.slaHours * 0.25) return { label: `${Math.ceil(remainingHours)}h restantes`, tone: 'warning' }
  return { label: `${Math.ceil(remainingHours)}h restantes`, tone: 'success' }
}

export const nextIncidentId = (incidents: Incident[]) => {
  const highest = incidents.reduce((max, incident) => Math.max(max, Number(incident.id.replace('INC-', '')) || 0), 1040)
  return `INC-${highest + 1}`
}

export const hoursFromNowForPreview = hoursFromNow
