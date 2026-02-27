import { type FormEvent, useState } from 'react'
import type { AuthRole } from '../lib/auth'
import type { Lang } from '../i18n/lang'
import { roleLabel } from '../i18n/roles'

export type AuthPanelProps = {
  lang: Lang
  enabled: boolean
  loading: boolean
  busy: boolean
  userEmail: string | null
  userRole: AuthRole
  statusMessage: string
  className?: string
  onLogin: (email: string, password: string) => Promise<void> | void
  onSignup: (email: string, password: string) => Promise<void> | void
  onLogout: () => Promise<void> | void
}

const PANEL_COPY: Record<
  Lang,
  {
    title: string
    disabled: string
    restoring: string
    currentRole: string
    processing: string
    logout: string
    authModeAria: string
    loginTab: string
    signupTab: string
    passwordPlaceholder: string
    loginAction: string
    signupAction: string
  }
> = {
  zh: {
    title: '账号',
    disabled: '未配置 Supabase，账号系统暂不可用。',
    restoring: '正在恢复登录态...',
    currentRole: '当前身份',
    processing: '处理中...',
    logout: '退出登录',
    authModeAria: '账号模式',
    loginTab: '登录',
    signupTab: '注册',
    passwordPlaceholder: '至少 6 位密码',
    loginAction: '登录账号',
    signupAction: '创建账号',
  },
  en: {
    title: 'Account',
    disabled: 'Supabase is not configured. Authentication is unavailable.',
    restoring: 'Restoring session...',
    currentRole: 'Current role',
    processing: 'Processing...',
    logout: 'Log out',
    authModeAria: 'Authentication mode',
    loginTab: 'Log in',
    signupTab: 'Sign up',
    passwordPlaceholder: 'At least 6 characters',
    loginAction: 'Log in',
    signupAction: 'Create account',
  },
}

export function AuthPanel({
  lang,
  enabled,
  loading,
  busy,
  userEmail,
  userRole,
  statusMessage,
  className,
  onLogin,
  onSignup,
  onLogout,
}: AuthPanelProps) {
  const copy = PANEL_COPY[lang]
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const panelClassName = className ? `auth-panel ${className}` : 'auth-panel'

  function submit() {
    const normalizedEmail = email.trim()
    if (!normalizedEmail || !password) {
      return
    }

    if (mode === 'login') {
      void onLogin(normalizedEmail, password)
      return
    }

    void onSignup(normalizedEmail, password)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    submit()
  }

  return (
    <section className={panelClassName}>
      <div className="auth-panel-head">
        <span className="mono">{copy.title}</span>
      </div>

      {!enabled ? <p className="auth-muted">{copy.disabled}</p> : null}

      {enabled && loading ? <p className="auth-muted">{copy.restoring}</p> : null}

      {enabled && !loading && userEmail ? (
        <div className="auth-user-card">
          <p className="auth-user-email">{userEmail}</p>
          <p className="auth-role">
            {copy.currentRole}: {roleLabel(userRole, lang)}
          </p>
          <button type="button" className="auth-primary-btn" disabled={busy} onClick={() => void onLogout()}>
            {busy ? copy.processing : copy.logout}
          </button>
        </div>
      ) : null}

      {enabled && !loading && !userEmail ? (
        <>
          <div className="auth-mode-switch" role="tablist" aria-label={copy.authModeAria}>
            <button
              type="button"
              className={`auth-mode-btn ${mode === 'login' ? 'active' : ''}`}
              onClick={() => setMode('login')}
            >
              {copy.loginTab}
            </button>
            <button
              type="button"
              className={`auth-mode-btn ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => setMode('signup')}
            >
              {copy.signupTab}
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={copy.passwordPlaceholder}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength={6}
              required
            />
            <button type="submit" className="auth-primary-btn" disabled={busy}>
              {busy ? copy.processing : mode === 'login' ? copy.loginAction : copy.signupAction}
            </button>
          </form>
        </>
      ) : null}

      {!userEmail ? (
        <p className="auth-role auth-role-guest">
          {copy.currentRole}: {roleLabel(userRole, lang)}
        </p>
      ) : null}
      {statusMessage ? <p className="auth-status">{statusMessage}</p> : null}
    </section>
  )
}
