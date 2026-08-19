import type { FormEvent } from 'react'

type LoginScreenProps = {
  email: string
  password: string
  error: string
  recoveryMessage: string
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onForgotPassword: () => void
}

export default function LoginScreen({ email, password, error, recoveryMessage, onEmailChange, onPasswordChange, onSubmit, onForgotPassword }: LoginScreenProps) {
  return <main className="login-shell"><section className="login-card rounded-3xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-900/5"><div className="login-brand"><span className="brand-mark">◆</span><span>Incident<span className="brand-accent">Board</span></span></div><p className="eyebrow">NORTHSTAR ENGINEERING</p><h1>Bem-vindo de volta</h1><p className="login-subtitle max-w-sm text-slate-600">Entre para acompanhar a saúde dos seus serviços.</p><form className="login-form" onSubmit={onSubmit}><label>E-mail<input type="email" value={email} onChange={(event) => onEmailChange(event.target.value)} required /></label><label>Senha<input type="password" value={password} onChange={(event) => onPasswordChange(event.target.value)} required /></label>{error && <p className="login-error">{error}</p>}{recoveryMessage && <p className="login-success">{recoveryMessage}</p>}<button className="primary-button login-button inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white transition hover:bg-brand-500" type="submit">Entrar no workspace <span>→</span></button></form><button type="button" className="mt-4 text-sm font-semibold text-brand-700 hover:text-brand-500" onClick={onForgotPassword}>Esqueci minha senha</button><div className="demo-credentials"><strong>Acesso de demonstração</strong><span>demo@incidentboard.local</span><span>Senha: incidentboard</span></div></section><div className="login-decoration"><span className="deco-orb orb-one" /><span className="deco-orb orb-two" /><div><p className="eyebrow">OPERATIONS CONTROL CENTER</p><h2>Menos ruído.<br /><em>Mais contexto.</em></h2><p>Centralize incidentes, acompanhe SLAs e ajude sua equipe a responder melhor.</p></div></div></main>
}
