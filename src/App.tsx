import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'
import { api } from './api'
import { formatDate, getSlaState, loadIncidents, nextIncidentId, saveIncidents } from './storage'
import type { Incident, IncidentFilters, IncidentSeverity, IncidentStatus } from './types'
import { severityLabels, statusLabels } from './types'

const services = ['Checkout', 'Notifications', 'Reporting', 'Platform', 'Identity']
const assignees = ['Marina Costa', 'Rafael Lima', 'João Mendes', 'Camila Alves', 'Lucas Ferreira']
const emptyFilters: IncidentFilters = { search: '', status: 'all', severity: 'all', service: 'all' }

function App() {
  const [incidents, setIncidents] = useState<Incident[]>(loadIncidents)
  const [filters, setFilters] = useState<IncidentFilters>(emptyFilters)
  const [selectedId, setSelectedId] = useState<string | null>(incidents[0]?.id ?? null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [apiConnected, setApiConnected] = useState(false)
  const selectedIncident = incidents.find((incident) => incident.id === selectedId) ?? null

  useEffect(() => {
    let active = true
    api.listIncidents().then((remoteIncidents) => {
      if (!active) return
      setIncidents(remoteIncidents)
      setSelectedId(remoteIncidents[0]?.id ?? null)
      setApiConnected(true)
    }).catch(() => setApiConnected(false)).finally(() => active && setIsLoading(false))
    return () => { active = false }
  }, [])

  const filteredIncidents = useMemo(() => incidents.filter((incident) => {
    const text = `${incident.id} ${incident.title} ${incident.description} ${incident.assignee}`.toLowerCase()
    return (!filters.search || text.includes(filters.search.toLowerCase()))
      && (filters.status === 'all' || incident.status === filters.status)
      && (filters.severity === 'all' || incident.severity === filters.severity)
      && (filters.service === 'all' || incident.service === filters.service)
  }), [filters, incidents])

  const metrics = useMemo(() => ({
    active: incidents.filter((incident) => incident.status !== 'resolved').length,
    critical: incidents.filter((incident) => incident.severity === 'critical' && incident.status !== 'resolved').length,
    monitoring: incidents.filter((incident) => incident.status === 'monitoring').length,
    resolved: incidents.filter((incident) => incident.status === 'resolved').length,
  }), [incidents])

  const updateIncidents = (next: Incident[]) => { setIncidents(next); saveIncidents(next) }
  const showToast = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2800) }
  const updateIncident = async (id: string, changes: Partial<Incident>) => {
    try {
      const updated = apiConnected ? await api.updateIncident(id, changes) : { ...incidents.find((incident) => incident.id === id)!, ...changes, updatedAt: new Date().toISOString() }
      updateIncidents(incidents.map((incident) => incident.id === id ? updated : incident))
      showToast('Incidente atualizado')
    } catch (error) { showToast(error instanceof Error ? error.message : 'Não foi possível atualizar o incidente') }
  }

  const createIncident = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const payload = { title: String(formData.get('title') ?? ''), description: String(formData.get('description') ?? ''), severity: String(formData.get('severity') ?? 'medium') as IncidentSeverity, assignee: String(formData.get('assignee') ?? assignees[0]), service: String(formData.get('service') ?? services[0]), slaHours: Number(formData.get('slaHours') ?? 24) }
    try {
      const incident: Incident = apiConnected ? await api.createIncident(payload) : { id: nextIncidentId(incidents), ...payload, status: 'open', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), comments: [] }
      updateIncidents([incident, ...incidents]); setSelectedId(incident.id); setIsModalOpen(false); event.currentTarget.reset(); showToast(`${incident.id} criado com sucesso`)
    } catch (error) { showToast(error instanceof Error ? error.message : 'Não foi possível criar o incidente') }
  }

  const addComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!selectedIncident) return
    const body = String(new FormData(event.currentTarget).get('comment') ?? '').trim(); if (!body) return
    try {
      const updated = apiConnected ? await api.addComment(selectedIncident.id, { body, author: 'Você' }) : { ...selectedIncident, comments: [...selectedIncident.comments, { id: crypto.randomUUID(), author: 'Você', body, createdAt: new Date().toISOString() }] }
      updateIncidents(incidents.map((incident) => incident.id === updated.id ? updated : incident)); event.currentTarget.reset(); showToast('Comentário adicionado')
    } catch (error) { showToast(error instanceof Error ? error.message : 'Não foi possível adicionar o comentário') }
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">◆</span><span>Incident<span className="brand-accent">Board</span></span></div>
      <div className="workspace-switcher"><span className="workspace-icon">N</span><span><strong>Northstar Engineering</strong><small>Workspace principal</small></span><span className="chevron">⌄</span></div>
      <nav className="main-nav" aria-label="Navegação principal"><p className="nav-label">Workspace</p><button className="nav-item active"><span>▦</span> Visão geral</button><button className="nav-item"><span>◈</span> Incidentes <b>{metrics.active}</b></button><button className="nav-item"><span>◷</span> Serviços</button><button className="nav-item"><span>⌁</span> Relatórios</button><p className="nav-label second">Gerenciar</p><button className="nav-item"><span>♙</span> Equipe</button><button className="nav-item"><span>⚙</span> Configurações</button></nav>
      <div className="sidebar-footer"><div className="help-card"><span className="help-icon">?</span><div><strong>Precisa de ajuda?</strong><small>Consulte a documentação</small></div></div><div className="profile"><span className="avatar avatar-purple">AS</span><span><strong>Arthur Sacramento</strong><small>Administrador</small></span><span className="more">•••</span></div></div>
    </aside>
    <main className="main-content">
      <header className="topbar"><div className="breadcrumb"><span>Workspace</span><span>/</span><strong>Visão geral</strong></div><div className="top-actions"><button className="icon-button" aria-label="Pesquisar">⌕</button><button className="icon-button notification" aria-label="Notificações">♢<i /></button><button className="avatar avatar-purple">AS</button></div></header>
      <div className="page-content">
        <section className="page-heading"><div><p className="eyebrow">QUARTA-FEIRA, 18 DE JUNHO DE 2025</p><h1>Visão geral</h1><p className="heading-subtitle">Acompanhe a saúde dos seus serviços em tempo real.</p><span className={`connection-status ${isLoading ? 'loading' : apiConnected ? 'online' : 'offline'}`}><i />{isLoading ? 'Conectando à API...' : apiConnected ? 'API conectada · dados sincronizados' : 'Modo demonstração · API offline'}</span></div><button className="primary-button" onClick={() => setIsModalOpen(true)}><span>＋</span> Novo incidente</button></section>
        <section className="metric-grid" aria-label="Resumo de incidentes"><MetricCard label="Incidentes ativos" value={metrics.active} trend="12%" trendPositive={false} detail="vs. semana anterior" icon="◈" tone="blue" /><MetricCard label="Severidade crítica" value={metrics.critical} trend="8%" trendPositive={true} detail="vs. semana anterior" icon="⚠" tone="red" /><MetricCard label="Em monitoramento" value={metrics.monitoring} trend="24%" trendPositive={true} detail="vs. semana anterior" icon="◉" tone="amber" /><MetricCard label="Resolvidos" value={metrics.resolved} trend="18%" trendPositive={true} detail="vs. semana anterior" icon="✓" tone="green" /></section>
        <section className="content-grid">
          <div className="incidents-panel panel-card"><div className="panel-heading"><div><h2>Incidentes recentes</h2><p>Gerencie e acompanhe os incidentes ativos.</p></div><button className="ghost-button">Ver todos <span>→</span></button></div><div className="filter-bar"><label className="search-field"><span>⌕</span><input value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="Buscar incidentes..." /></label><select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value as IncidentFilters['status'] })}><option value="all">Todos os status</option>{Object.entries(statusLabels).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select><select value={filters.severity} onChange={(event) => setFilters({ ...filters, severity: event.target.value as IncidentFilters['severity'] })}><option value="all">Todas severidades</option>{Object.entries(severityLabels).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></div><div className="table-wrap"><table><thead><tr><th>Incidente</th><th>Serviço</th><th>Severidade</th><th>Status</th><th>Responsável</th><th>SLA</th></tr></thead><tbody>{filteredIncidents.map((incident) => <IncidentRow key={incident.id} incident={incident} selected={incident.id === selectedId} onClick={() => setSelectedId(incident.id)} />)}</tbody></table>{filteredIncidents.length === 0 && <div className="empty-state"><span>⌕</span><strong>Nenhum incidente encontrado</strong><small>Tente ajustar os filtros de busca.</small></div>}</div><div className="table-footer"><span>Mostrando <strong>{filteredIncidents.length}</strong> de {incidents.length} incidentes</span><div className="pagination"><button disabled>←</button><button className="page-current">1</button><button disabled>→</button></div></div></div>
          <IncidentDetails incident={selectedIncident} onStatusChange={(status) => selectedIncident && updateIncident(selectedIncident.id, { status })} onComment={addComment} />
        </section>
      </div>
    </main>
    {isModalOpen && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setIsModalOpen(false)}><form className="modal" onSubmit={createIncident}><div className="modal-header"><div><p className="eyebrow">NOVO REGISTRO</p><h2>Criar incidente</h2></div><button type="button" className="close-button" onClick={() => setIsModalOpen(false)}>×</button></div><label>Título<input name="title" required placeholder="Ex.: Erro no processamento de pagamentos" /></label><label>Descrição<textarea name="description" required rows={3} placeholder="Descreva o impacto observado..." /></label><div className="form-row"><label>Serviço<select name="service" defaultValue={services[0]}>{services.map((service) => <option key={service}>{service}</option>)}</select></label><label>Severidade<select name="severity" defaultValue="medium">{Object.entries(severityLabels).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label></div><div className="form-row"><label>Responsável<select name="assignee" defaultValue={assignees[0]}>{assignees.map((assignee) => <option key={assignee}>{assignee}</option>)}</select></label><label>SLA (horas)<input name="slaHours" type="number" min="1" defaultValue="24" /></label></div><div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setIsModalOpen(false)}>Cancelar</button><button className="primary-button" type="submit">Criar incidente</button></div></form></div>}
    {toast && <div className="toast"><span>✓</span>{toast}</div>}
  </div>
}

function MetricCard({ label, value, trend, trendPositive, detail, icon, tone }: { label: string; value: number; trend: string; trendPositive: boolean; detail: string; icon: string; tone: string }) { return <article className="metric-card"><div className={`metric-icon ${tone}`}>{icon}</div><div className="metric-info"><span>{label}</span><strong>{value}</strong><small><b className={trendPositive ? 'positive' : 'negative'}>{trendPositive ? '↗' : '↘'} {trend}</b> {detail}</small></div></article> }
function IncidentRow({ incident, selected, onClick }: { incident: Incident; selected: boolean; onClick: () => void }) { const sla = getSlaState(incident); return <tr className={selected ? 'selected-row' : ''} onClick={onClick}><td><div className="incident-cell"><span className={`incident-dot ${incident.severity}`} /><div><strong>{incident.title}</strong><small>{incident.id} · {formatDate(incident.updatedAt)}</small></div></div></td><td><span className="service-tag">{incident.service}</span></td><td><span className={`badge severity-${incident.severity}`}><i />{severityLabels[incident.severity]}</span></td><td><span className={`badge status-${incident.status}`}><i />{statusLabels[incident.status]}</span></td><td><div className="assignee"><span className="avatar avatar-small">{incident.assignee.split(' ').map((name) => name[0]).join('').slice(0, 2)}</span>{incident.assignee.split(' ')[0]}</div></td><td><span className={`sla ${sla.tone}`}>{sla.label}</span></td></tr> }
function IncidentDetails({ incident, onStatusChange, onComment }: { incident: Incident | null; onStatusChange: (status: IncidentStatus) => void; onComment: (event: FormEvent<HTMLFormElement>) => void }) { if (!incident) return <aside className="details-panel panel-card empty-details"><span>◈</span><h3>Selecione um incidente</h3><p>Escolha um item da tabela para ver os detalhes.</p></aside>; const sla = getSlaState(incident); return <aside className="details-panel panel-card"><div className="details-heading"><div><span className={`badge severity-${incident.severity}`}><i />{severityLabels[incident.severity]}</span><h2>{incident.title}</h2><p>{incident.id} · Criado {formatDate(incident.createdAt)}</p></div><button className="more-button">•••</button></div><div className="details-description"><p>{incident.description}</p></div><div className="detail-meta"><div><span>Serviço</span><strong>{incident.service}</strong></div><div><span>Responsável</span><strong>{incident.assignee}</strong></div><div><span>SLA</span><strong className={`sla ${sla.tone}`}>{sla.label}</strong></div></div><div className="status-control"><span>Status atual</span><select value={incident.status} onChange={(event) => onStatusChange(event.target.value as IncidentStatus)}>{Object.entries(statusLabels).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></div><div className="activity"><div className="activity-header"><h3>Atividade</h3><span>{incident.comments.length} comentário{incident.comments.length === 1 ? '' : 's'}</span></div><div className="activity-list"><div className="activity-item"><span className="timeline-dot blue" /><div><strong>Incidente criado</strong><small>{formatDate(incident.createdAt)}</small></div></div>{incident.comments.map((comment) => <div className="activity-item" key={comment.id}><span className="timeline-dot purple" /><div><strong>{comment.author} comentou</strong><p>{comment.body}</p><small>{formatDate(comment.createdAt)}</small></div></div>)}</div><form className="comment-form" onSubmit={onComment}><input name="comment" placeholder="Adicionar comentário..." aria-label="Adicionar comentário" /><button aria-label="Enviar comentário">↑</button></form></div></aside> }

export default App
