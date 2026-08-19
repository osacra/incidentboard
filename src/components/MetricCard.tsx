type MetricCardProps = { label: string; value: number; trend: string; trendPositive: boolean; detail: string; icon: string; tone: string }

export default function MetricCard({ label, value, trend, trendPositive, detail, icon, tone }: MetricCardProps) {
  return <article className="metric-card rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className={`metric-icon ${tone}`}>{icon}</div><div className="metric-info flex flex-col gap-1"><span>{label}</span><strong>{value}</strong><small><b className={trendPositive ? 'positive' : 'negative'}>{trendPositive ? '↗' : '↘'} {trend}</b> {detail}</small></div></article>
}
