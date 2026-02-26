import { type FormEvent, useState } from 'react'
import type { AuthRole } from '../lib/auth'

export type AuthPanelProps = {
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

function roleLabel(role: AuthRole) {
  if (role === 'admin') {
    return '管理员'
  }
  if (role === 'tester') {
    return '测试账号'
  }
  if (role === 'user') {
    return '普通账号'
  }
  return '游客'
}

export function AuthPanel({
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
        <span className="mono">Account</span>
      </div>

      {!enabled ? (
        <p className="auth-muted">未配置 Supabase，账号系统暂不可用。</p>
      ) : null}

      {enabled && loading ? <p className="auth-muted">正在恢复登录态...</p> : null}

      {enabled && !loading && userEmail ? (
        <div className="auth-user-card">
          <p className="auth-user-email">{userEmail}</p>
          <p className="auth-role">当前身份：{roleLabel(userRole)}</p>
          <button type="button" className="auth-primary-btn" disabled={busy} onClick={() => void onLogout()}>
            {busy ? '处理中...' : '退出登录'}
          </button>
        </div>
      ) : null}

      {enabled && !loading && !userEmail ? (
        <>
          <div className="auth-mode-switch" role="tablist" aria-label="auth mode">
            <button
              type="button"
              className={`auth-mode-btn ${mode === 'login' ? 'active' : ''}`}
              onClick={() => setMode('login')}
            >
              登录
            </button>
            <button
              type="button"
              className={`auth-mode-btn ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => setMode('signup')}
            >
              注册
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
              placeholder="至少 6 位密码"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength={6}
              required
            />
            <button type="submit" className="auth-primary-btn" disabled={busy}>
              {busy ? '处理中...' : mode === 'login' ? '登录账号' : '创建账号'}
            </button>
          </form>
        </>
      ) : null}

      {!userEmail ? <p className="auth-role auth-role-guest">当前身份：{roleLabel(userRole)}</p> : null}
      {statusMessage ? <p className="auth-status">{statusMessage}</p> : null}
    </section>
  )
}
