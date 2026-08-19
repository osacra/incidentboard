import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router'
import './App.css'
import IncidentDetails from './components/IncidentDetails'
import IncidentRow from './components/IncidentRow'
import LoginScreen from './components/LoginScreen'
import MetricCard from './components/MetricCard'
import { api, session } from './api'
import type { AuthUser } from './api'
import { loadIncidents, nextIncidentId, saveIncidents } from './storage'
import { useIncidentUiStore } from './store'
import type { Incident, IncidentFilters, IncidentSeverity } from './types'
import { severityLabels, statusLabels } from './types'

const services = ['Checkout', 'Notifications', 'Reporting', 'Platform', 'Identity']
const assignees = ['Marina Costa', 'Rafael Lima', 'João Mendes', 'Camila Alves', 'Lucas Ferreira']

function App() {
  const [incidents, setIncidents] = useState<Incident[]>(loadIncidents)
  const { filters, selectedId, setFilters, setSelectedId, resetFilters } = useIncidentUiStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [apiConnected, setApiConnected] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loginEmail, setLoginEmail] = useState('demo@incidentboard.local')
  const [loginPassword, setLoginPassword] = useState('incidentboard')
  const [loginError, setLoginError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const { incidentId } = useParams<{ incidentId: string }>()
  const activeView = location.pathname.startsWith('/incidents') ? 'incidents' : 'overview'
  const searchInputRef = useRef<HTMLInputElement>(null)
  const selectedIncident = incidents.find((incident) => incident.id === selectedId) ?? null

  useEffect(() => {
    const token = session.getToken()
    if (token) api.me().then(setUser).catch(() => session.clear())
  }, [])

  useEffect(() => {
    let active = true
    api.listIncidents().then((remoteIncidents) => {
      if (!active) return
      setIncidents(remoteIncidents)
      setSelectedId(incidentId && remoteIncidents.some((incident) => incident.id === incidentId) ? incidentId : remoteIncidents[0]?.id ?? null)
      setApiConnected(true)
    }).catch(() => setApiConnected(false)).finally(() => active && setIsLoading(false))
    return () => { active = false }
  }, [incidentId, setSelectedId])

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
  const login = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setLoginError('')
    try { const result = await api.login(loginEmail, loginPassword); session.setToken(result.token); setUser(result.user); const remoteIncidents = await api.listIncidents(); setIncidents(remoteIncidents); setSelectedId(remoteIncidents[0]?.id ?? null); setApiConnected(true); showToast('Sessão iniciada') } catch (error) { setLoginError(error instanceof Error ? error.message : 'Não foi possível entrar') }
  }
  const logout = () => { session.clear(); setUser(null); showToast('Sessão encerrada') }
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

  if (!user) return <LoginScreen email={loginEmail} password={loginPassword} error={loginError} onEmailChange={setLoginEmail} onPasswordChange={setLoginPassword} onSubmit={login} />

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">◆</span><span>Incident<span className="brand-accent">Board</span></span></div>
      <div className="workspace-switcher"><span className="workspace-icon">N</span><span><strong>Northstar Engineering</strong><small>Workspace principal</small></span><span className="chevron">⌄</span></div>
      <nav className="main-nav" aria-label="Navegação principal"><p className="nav-label">Workspace</p><button className={`nav-item ${activeView === 'overview' ? 'active' : ''}`} onClick={() => navigate('/')}><span>▦</span> Visão geral</button><button className={`nav-item ${activeView === 'incidents' ? 'active' : ''}`} onClick={() => navigate('/incidents')}><span>◈</span> Incidentes <b>{metrics.active}</b></button></nav>
      <div className="sidebar-footer"><button className="help-card" onClick={() => window.open('https://github.com/osacra/incidentboard#readme', '_blank', 'noopener,noreferrer')}><span className="help-icon">?</span><span><strong>Precisa de ajuda?</strong><small>Consulte a documentação</small></span></button><div className="profile"><span className="avatar avatar-purple">{user.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</span><span><strong>{user.name}</strong><small>{user.role === 'admin' ? 'Administrador' : 'Operador'}</small></span><button className="logout-button" onClick={logout} aria-label="Sair">↪</button></div></div>
    </aside>
    <main className="main-content">
      <header className="topbar"><div className="breadcrumb"><span>Workspace</span><span>/</span><strong>{activeView === 'overview' ? 'Visão geral' : 'Incidentes'}</strong></div><div className="top-actions"><button className="icon-button" aria-label="Pesquisar" onClick={() => searchInputRef.current?.focus()}>⌕</button><button className="icon-button notification" aria-label="Notificações" onClick={() => showToast('Você não tem novas notificações')}>♢<i /></button><button className="avatar avatar-purple top-avatar" onClick={logout} title="Sair">{user.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</button></div></header>
      <div className="page-content">
        <section className="page-heading"><div><p className="eyebrow">QUARTA-FEIRA, 18 DE JUNHO DE 2025</p><h1>{activeView === 'overview' ? 'Visão geral' : 'Incidentes'}</h1><p className="heading-subtitle">{activeView === 'overview' ? 'Acompanhe a saúde dos seus serviços em tempo real.' : 'Filtre, atualize e acompanhe todos os incidentes.'}</p><span className={`connection-status ${isLoading ? 'loading' : apiConnected ? 'online' : 'offline'}`}><i />{isLoading ? 'Conectando à API...' : apiConnected ? 'API conectada · dados sincronizados' : 'Modo demonstração · API offline'}</span></div><button className="primary-button" onClick={() => setIsModalOpen(true)}><span>＋</span> Novo incidente</button></section>
        {activeView === 'overview' && <section className="metric-grid" aria-label="Resumo de incidentes"><MetricCard label="Incidentes ativos" value={metrics.active} trend="12%" trendPositive={false} detail="vs. semana anterior" icon="◈" tone="blue" /><MetricCard label="Severidade crítica" value={metrics.critical} trend="8%" trendPositive={true} detail="vs. semana anterior" icon="⚠" tone="red" /><MetricCard label="Em monitoramento" value={metrics.monitoring} trend="24%" trendPositive={true} detail="vs. semana anterior" icon="◉" tone="amber" /><MetricCard label="Resolvidos" value={metrics.resolved} trend="18%" trendPositive={true} detail="vs. semana anterior" icon="✓" tone="green" /></section>}
        <section className="content-grid">
          <div className="incidents-panel panel-card"><div className="panel-heading"><div><h2>Incidentes recentes</h2><p>Gerencie e acompanhe os incidentes ativos.</p></div><button className="ghost-button" onClick={() => { navigate('/incidents'); resetFilters() }}>Ver todos <span>→</span></button></div><div className="filter-bar"><label className="search-field"><span>⌕</span><input ref={searchInputRef} value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="Buscar incidentes..." /></label><select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value as IncidentFilters['status'] })}><option value="all">Todos os status</option>{Object.entries(statusLabels).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select><select value={filters.severity} onChange={(event) => setFilters({ ...filters, severity: event.target.value as IncidentFilters['severity'] })}><option value="all">Todas severidades</option>{Object.entries(severityLabels).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></div><div className="table-wrap"><table><thead><tr><th>Incidente</th><th>Serviço</th><th>Severidade</th><th>Status</th><th>Responsável</th><th>SLA</th></tr></thead><tbody>{filteredIncidents.map((incident) => <IncidentRow key={incident.id} incident={incident} selected={incident.id === selectedId} onClick={() => { setSelectedId(incident.id); navigate(`/incidents/${incident.id}`) }} />)}</tbody></table>{filteredIncidents.length === 0 && <div className="empty-state"><span>⌕</span><strong>Nenhum incidente encontrado</strong><small>Tente ajustar os filtros de busca.</small></div>}</div><div className="table-footer"><span>Mostrando <strong>{filteredIncidents.length}</strong> de {incidents.length} incidentes</span><div className="pagination"><span className="page-current">1</span></div></div></div>
          <IncidentDetails incident={selectedIncident} onStatusChange={(status) => selectedIncident && updateIncident(selectedIncident.id, { status })} onComment={addComment} />
        </section>
      </div>
    </main>
    {isModalOpen && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setIsModalOpen(false)}><form className="modal" onSubmit={createIncident}><div className="modal-header"><div><p className="eyebrow">NOVO REGISTRO</p><h2>Criar incidente</h2></div><button type="button" className="close-button" onClick={() => setIsModalOpen(false)}>×</button></div><label>Título<input name="title" required placeholder="Ex.: Erro no processamento de pagamentos" /></label><label>Descrição<textarea name="description" required rows={3} placeholder="Descreva o impacto observado..." /></label><div className="form-row"><label>Serviço<select name="service" defaultValue={services[0]}>{services.map((service) => <option key={service}>{service}</option>)}</select></label><label>Severidade<select name="severity" defaultValue="medium">{Object.entries(severityLabels).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label></div><div className="form-row"><label>Responsável<select name="assignee" defaultValue={assignees[0]}>{assignees.map((assignee) => <option key={assignee}>{assignee}</option>)}</select></label><label>SLA (horas)<input name="slaHours" type="number" min="1" defaultValue="24" /></label></div><div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setIsModalOpen(false)}>Cancelar</button><button className="primary-button" type="submit">Criar incidente</button></div></form></div>}
    {toast && <div className="toast"><span>✓</span>{toast}</div>}
  </div>
}


export default App

