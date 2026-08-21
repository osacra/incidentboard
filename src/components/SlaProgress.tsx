import type { SlaProgress as SlaProgressData } from '../storage'

type SlaProgressProps = {
  progress: SlaProgressData
  compact?: boolean
}

const statusLabels = {
  on_track: 'No prazo',
  at_risk: 'Em risco',
  breached: 'Violado',
  met: 'Cumprido',
} as const

export default function SlaProgress({ progress, compact = false }: SlaProgressProps) {
  const statusLabel = statusLabels[progress.status]
  return <div className={`sla-progress ${progress.tone} ${compact ? 'compact' : ''}`}>
    <div className="sla-progress-heading"><span>{statusLabel}</span><strong>{progress.label}</strong></div>
    <div className="sla-progress-track" role="progressbar" aria-label={`Progresso do SLA: ${statusLabel}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress.percentage)}><span style={{ width: `${progress.percentage}%` }} /></div>
    {!compact && <small>{Math.round(progress.percentage)}% do prazo consumido</small>}
  </div>
}
