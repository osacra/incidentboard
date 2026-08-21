import type { FormEvent } from 'react'
import { formatDate, getSlaProgress } from '../storage'
import type { Incident, IncidentEvent, IncidentStatus } from '../types'
import { severityLabels, statusLabels } from '../types'
import SlaProgress from './SlaProgress'

type IncidentDetailsProps = {
  incident: Incident | null
  onStatusChange: (status: IncidentStatus) => void
  onComment: (event: FormEvent<HTMLFormElement>) => void
}

const eventLabels: Record<string, string> = {
  'incident.created': 'Incidente criado',
  'incident.updated': 'Incidente atualizado',
  'incident.status_changed': 'Status alterado',
  'incident.severity_changed': 'Severidade alterada',
  'incident.assignee_changed': 'Responsável alterado',
  'incident.comment_added': 'Comentário adicionado',
  'incident.resolved': 'Incidente resolvido',
  'incident.reopened': 'Incidente reaberto',
}

const eventTones: Record<string, string> = {
  'incident.created': 'blue',
  'incident.updated': 'slate',
  'incident.status_changed': 'amber',
  'incident.severity_changed': 'red',
  'incident.assignee_changed': 'purple',
  'incident.comment_added': 'purple',
  'incident.resolved': 'green',
  'incident.reopened': 'amber',
}

const labelForEvent = (event: IncidentEvent) => eventLabels[event.type] ?? 'Atividade registrada'
const toneForEvent = (event: IncidentEvent) => eventTones[event.type] ?? 'slate'

const eventDetail = (event: IncidentEvent) => {
  const after = event.after ?? {}
  if (event.type === 'incident.comment_added' && typeof after.body === 'string') return after.body
  if (event.type === 'incident.status_changed' && typeof after.status === 'string') return `Novo status: ${statusLabels[after.status as IncidentStatus] ?? after.status}`
  if (event.type === 'incident.severity_changed' && typeof after.severity === 'string') return `Nova severidade: ${severityLabels[after.severity as keyof typeof severityLabels] ?? after.severity}`
  if (event.type === 'incident.assignee_changed' && typeof after.assignee === 'string') return `Novo responsável: ${after.assignee}`
  return null
}

const fallbackEvents = (incident: Incident): IncidentEvent[] => [
  {
    id: `created-${incident.id}`,
    type: 'incident.created',
    actor: 'Sistema',
    createdAt: incident.createdAt,
  },
  ...incident.comments.map((comment) => ({
    id: comment.id,
    type: 'incident.comment_added',
    actor: comment.author,
    after: { body: comment.body },
    createdAt: comment.createdAt,
  })),
]

export default function IncidentDetails({ incident, onStatusChange, onComment }: IncidentDetailsProps) {
  if (!incident) return <aside className="details-panel panel-card empty-details"><span>◈</span><h3>Selecione um incidente</h3><p>Escolha um item da tabela para ver os detalhes.</p></aside>
  const sla = getSlaProgress(incident)
  const events = incident.activity?.length ? incident.activity : fallbackEvents(incident)

  return <aside className="details-panel panel-card">
    <div className="details-heading"><div><span className={`badge severity-${incident.severity}`}><i />{severityLabels[incident.severity]}</span><h2>{incident.title}</h2><p>{incident.id} · Criado {formatDate(incident.createdAt)}</p></div></div>
    <div className="details-description"><p>{incident.description}</p></div>
    <div className="detail-meta"><div><span>Serviço</span><strong>{incident.service}</strong></div><div><span>Responsável</span><strong>{incident.assignee}</strong></div><div><span>SLA</span><SlaProgress progress={sla} /></div></div>
    <div className="status-control"><span>Status atual</span><select value={incident.status} onChange={(event) => onStatusChange(event.target.value as IncidentStatus)}>{Object.entries(statusLabels).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></div>
    <div className="activity">
      <div className="activity-header"><h3>Atividade</h3><span>{events.length} evento{events.length === 1 ? '' : 's'}</span></div>
      <ol className="activity-list" aria-label="Linha do tempo do incidente">
        {events.map((event) => <li className="activity-item" key={event.id}><span className={`timeline-dot ${toneForEvent(event)}`} aria-hidden="true" /><div><strong>{labelForEvent(event)}</strong><span className="activity-actor">{event.actor}</span>{eventDetail(event) && <p>{eventDetail(event)}</p>}<small>{formatDate(event.createdAt)}</small></div></li>)}
      </ol>
      <form className="comment-form" onSubmit={onComment}><input name="comment" placeholder="Adicionar comentário..." aria-label="Adicionar comentário" /><button aria-label="Enviar comentário">↑</button></form>
    </div>
  </aside>
}
