type MetricCardProps = { label: string; value: number; trend: string; trendPositive: boolean; detail: string; icon: string; tone: string }

export default function MetricCard({ label, value, trend, trendPositive, detail, icon, tone }: MetricCardProps) {
  return <article className="metric-card"><div className={`metric-icon ${tone}`}>{icon}</div><div className="metric-info"><span>{label}</span><strong>{value}</strong><small><b className={trendPositive ? 'positive' : 'negative'}>{trendPositive ? '↗' : '↘'} {trend}</b> {detail}</small></div></article>
}
