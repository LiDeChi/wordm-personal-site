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
  compact?: boolean
  onLogin: (email: string, password: string) => Promise<void> | void
  onSignup: (email: string, password: string) => Promise<void> | void
  onGoogleLogin: () => Promise<void> | void
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
    passwordPlaceholder: string
    submitAction: string
    googleAction: string
    googleHint: string
  }
> = {
  zh: {
    title: '账号',
    disabled: '未配置 Supabase，账号系统暂不可用。',
    restoring: '正在恢复登录态...',
    currentRole: '当前身份',
    processing: '处理中...',
    logout: '退出',
    passwordPlaceholder: '密码',
    submitAction: '登录 / 注册',
    googleAction: 'Google 登录',
    googleHint: '也支持直接使用 Google 账号登录',
  },
  en: {
    title: 'Account',
    disabled: 'Supabase is not configured. Authentication is unavailable.',
    restoring: 'Restoring session...',
    currentRole: 'Current role',
    processing: 'Processing...',
    logout: 'Log out',
    passwordPlaceholder: 'Password',
    submitAction: 'Log in / Sign up',
    googleAction: 'Continue with Google',
    googleHint: 'Google sign-in is also supported',
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
  compact = false,
  onLogin,
  onGoogleLogin,
  onLogout,
}: AuthPanelProps) {
  const copy = PANEL_COPY[lang]
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const panelClassName = className ? `auth-panel ${className}${compact ? ' auth-panel-compact' : ''}` : `auth-panel${compact ? ' auth-panel-compact' : ''}`

  function submit() {
    const normalizedEmail = email.trim()
    if (!normalizedEmail || !password) {
      return
    }

    void onLogin(normalizedEmail, password)
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
        <div className={`auth-user-card${compact ? ' compact' : ''}`}>
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
        <form className={`auth-form${compact ? ' compact' : ''}`} onSubmit={handleSubmit}>
          <div className="auth-form-fields">
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
              autoComplete="current-password"
              minLength={6}
              required
            />
          </div>
          <div className="auth-form-actions">
            <button type="submit" className="auth-primary-btn" disabled={busy}>
              {busy ? copy.processing : copy.submitAction}
            </button>
            <button type="button" className="auth-primary-btn auth-google-btn" disabled={busy} onClick={() => void onGoogleLogin()}>
              {busy ? copy.processing : copy.googleAction}
            </button>
          </div>
          {!compact ? <p className="auth-muted auth-google-hint">{copy.googleHint}</p> : null}
        </form>
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
