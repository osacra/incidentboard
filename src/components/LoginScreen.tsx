import type { FormEvent } from 'react'

type RecoveryMode = 'login' | 'request' | 'reset'

type LoginScreenProps = {
  email: string
  password: string
  recoveryToken: string
  newPassword: string
  confirmPassword: string
  mode: RecoveryMode
  error: string
  recoveryMessage: string
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onRecoveryTokenChange: (value: string) => void
  onNewPasswordChange: (value: string) => void
  onConfirmPasswordChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onForgotPassword: () => void
  onRequestRecovery: () => void
  onResetPassword: (event: FormEvent<HTMLFormElement>) => void
  onBackToLogin: () => void
}

export default function LoginScreen({ email, password, recoveryToken, newPassword, confirmPassword, mode, error, recoveryMessage, onEmailChange, onPasswordChange, onRecoveryTokenChange, onNewPasswordChange, onConfirmPasswordChange, onSubmit, onForgotPassword, onRequestRecovery, onResetPassword, onBackToLogin }: LoginScreenProps) {
  const isReset = mode === 'reset'
  const isRequest = mode === 'request'
  return <main className="login-shell"><section className="login-card rounded-3xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-900/5"><div className="login-brand"><span className="brand-mark">◆</span><span>Incident<span className="brand-accent">Board</span></span></div><p className="eyebrow">NORTHSTAR ENGINEERING</p><h1>{isReset ? 'Defina uma nova senha' : isRequest ? 'Recupere seu acesso' : 'Bem-vindo de volta'}</h1><p className="login-subtitle max-w-sm text-slate-600">{isReset ? 'Crie uma senha nova para voltar ao workspace.' : isRequest ? 'Gere um token local para redefinir sua senha.' : 'Entre para acompanhar a saúde dos seus serviços.'}</p>
  {mode === 'login' && <form className="login-form" onSubmit={onSubmit}><label>E-mail<input type="email" value={email} onChange={(event) => onEmailChange(event.target.value)} required /></label><label>Senha<input type="password" value={password} onChange={(event) => onPasswordChange(event.target.value)} required /></label>{error && <p className="login-error">{error}</p>}{recoveryMessage && <p className="login-success">{recoveryMessage}</p>}<button className="primary-button login-button inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white transition hover:bg-brand-500" type="submit">Entrar no workspace <span>→</span></button><button type="button" className="mt-4 text-sm font-semibold text-brand-700 hover:text-brand-500" onClick={onForgotPassword}>Esqueci minha senha</button></form>}
  {isRequest && <form className="login-form" onSubmit={(event) => { event.preventDefault(); onRequestRecovery() }}><label>E-mail<input type="email" value={email} onChange={(event) => onEmailChange(event.target.value)} autoComplete="email" required /></label>{error && <p className="login-error">{error}</p>}{recoveryMessage && <p className="login-success">{recoveryMessage}</p>}<button className="primary-button login-button inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white transition hover:bg-brand-500" type="submit">Gerar token de recuperação <span>→</span></button><button type="button" className="mt-4 text-sm font-semibold text-brand-700 hover:text-brand-500" onClick={onBackToLogin}>Voltar para o login</button></form>}
  {isReset && <form className="login-form" onSubmit={onResetPassword}><label>Token de recuperação<input type="text" value={recoveryToken} onChange={(event) => onRecoveryTokenChange(event.target.value)} autoComplete="one-time-code" required /></label><label>Nova senha<input type="password" value={newPassword} onChange={(event) => onNewPasswordChange(event.target.value)} autoComplete="new-password" minLength={8} required /></label><label>Confirmar nova senha<input type="password" value={confirmPassword} onChange={(event) => onConfirmPasswordChange(event.target.value)} autoComplete="new-password" minLength={8} required /></label>{recoveryMessage && <p className="login-success">{recoveryMessage}</p>}{error && <p className="login-error">{error}</p>}<button className="primary-button login-button inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white transition hover:bg-brand-500" type="submit">Redefinir senha <span>→</span></button><button type="button" className="mt-4 text-sm font-semibold text-brand-700 hover:text-brand-500" onClick={onBackToLogin}>Voltar para o login</button></form>}
  {mode === 'login' && <div className="demo-credentials"><strong>Acesso de demonstração</strong><span>demo@incidentboard.local</span><span>Senha: incidentboard</span></div>}</section><div className="login-decoration"><span className="deco-orb orb-one" /><span className="deco-orb orb-two" /><div><p className="eyebrow">OPERATIONS CONTROL CENTER</p><h2>Menos ruído.<br /><em>Mais contexto.</em></h2><p>Centralize incidentes, acompanhe SLAs e ajude sua equipe a responder melhor.</p></div></div></main>
}
