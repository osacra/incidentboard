import { formatDate, getSlaProgress } from '../storage'
import type { Incident } from '../types'
import { severityLabels, statusLabels } from '../types'
import SlaProgress from './SlaProgress'

type IncidentRowProps = { incident: Incident; selected: boolean; onClick: () => void }

export default function IncidentRow({ incident, selected, onClick }: IncidentRowProps) {
  const sla = getSlaProgress(incident)
  return <tr className={selected ? 'selected-row' : ''} onClick={onClick}><td><div className="incident-cell"><span className={`incident-dot ${incident.severity}`} /><div><strong>{incident.title}</strong><small>{incident.id} · {formatDate(incident.updatedAt)}</small></div></div></td><td><span className="service-tag">{incident.service}</span></td><td><span className={`badge severity-${incident.severity}`}><i />{severityLabels[incident.severity]}</span></td><td><span className={`badge status-${incident.status}`}><i />{statusLabels[incident.status]}</span></td><td><div className="assignee"><span className="avatar avatar-small">{incident.assignee.split(' ').map((name) => name[0]).join('').slice(0, 2)}</span>{incident.assignee.split(' ')[0]}</div></td><td><SlaProgress progress={sla} compact /></td></tr>
}
