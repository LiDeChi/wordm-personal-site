import { useState, type FormEvent } from 'react'
import type { AuthRole } from '../lib/auth'
import type { Lang } from '../i18n/lang'
import { roleLabel } from '../i18n/roles'

type LoginPageProps = {
  lang: Lang
  enabled: boolean
  loading: boolean
  busy: boolean
  userEmail: string | null
  userRole: AuthRole
  statusMessage: string
  homeHref: string
  onLangChange: (lang: Lang) => void
  onLogin: (email: string, password: string) => Promise<void> | void
  onSignup: (email: string, password: string) => Promise<void> | void
  onGoogleLogin: () => Promise<void> | void
  onLogout: () => Promise<void> | void
}

type LoginMode = 'login' | 'signup'

const LOGIN_COPY = {
  zh: {
    kicker: 'NotesAI 账户',
    title: '在 wordm.us 专门登录',
    subtitle: '首页里的账号入口只保留一个 Enter；真正的注册、密码登录和 Google 登录都放在这个独立页面里。',
    loginMode: '登录',
    signupMode: '创建账号',
    emailLabel: '邮箱',
    passwordLabel: '密码',
    emailPlaceholder: 'you@company.com',
    passwordPlaceholder: '至少 6 位',
    loginAction: '登录',
    signupAction: '创建账号',
    googleAction: '使用 Google 登录',
    processing: '处理中...',
    disabled: '未配置 Supabase，账号系统暂不可用。',
    restoring: '正在恢复登录态...',
    backHome: '返回首页',
    currentRole: '当前身份',
    logout: '退出',
    signedInTitle: '你已登录',
    signedInBody: '这个账号已经可以承接后续的套餐、同步和跨设备能力。',
  },
  en: {
    kicker: 'NotesAI Account',
    title: 'Use a dedicated sign-in page on wordm.us',
    subtitle: 'The homepage reduces auth to a single Enter link. Email/password sign-up and Google auth live on this standalone page.',
    loginMode: 'Sign in',
    signupMode: 'Create account',
    emailLabel: 'Email',
    passwordLabel: 'Password',
    emailPlaceholder: 'you@company.com',
    passwordPlaceholder: 'At least 6 characters',
    loginAction: 'Sign in',
    signupAction: 'Create account',
    googleAction: 'Continue with Google',
    processing: 'Processing...',
    disabled: 'Supabase is not configured. Authentication is unavailable.',
    restoring: 'Restoring session...',
    backHome: 'Back home',
    currentRole: 'Current role',
    logout: 'Log out',
    signedInTitle: 'You are signed in',
    signedInBody: 'This account is now ready to carry plans, sync, and future cross-device capabilities.',
  },
} as const

export function LoginPage({
  lang,
  enabled,
  loading,
  busy,
  userEmail,
  userRole,
  statusMessage,
  homeHref,
  onLangChange,
  onLogin,
  onSignup,
  onGoogleLogin,
  onLogout,
}: LoginPageProps) {
  const copy = LOGIN_COPY[lang]
  const [mode, setMode] = useState<LoginMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
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

  return (
    <div className="login-page-shell">
      <div className="login-page-topbar">
        <a className="login-back-link" href={homeHref}>
          {copy.backHome}
        </a>
        <div className="login-lang-switch" role="group" aria-label="Language">
          <button type="button" className={lang === 'zh' ? 'active' : ''} onClick={() => onLangChange('zh')}>
            中文
          </button>
          <button type="button" className={lang === 'en' ? 'active' : ''} onClick={() => onLangChange('en')}>
            EN
          </button>
        </div>
      </div>

      <main className="login-page-main">
        <section className="login-page-copy">
          <p className="mono login-page-kicker">{copy.kicker}</p>
          <h1>{copy.title}</h1>
          <p className="login-page-subtitle">{copy.subtitle}</p>
        </section>

        <section className="login-page-card">
          {!enabled ? <p className="auth-muted">{copy.disabled}</p> : null}
          {enabled && loading ? <p className="auth-muted">{copy.restoring}</p> : null}

          {enabled && !loading && userEmail ? (
            <div className="login-signed-in-card">
              <h2>{copy.signedInTitle}</h2>
              <p className="login-page-subtitle">{copy.signedInBody}</p>
              <p className="auth-user-email">{userEmail}</p>
              <p className="auth-role">
                {copy.currentRole}: {roleLabel(userRole, lang)}
              </p>
              <div className="login-page-actions">
                <a className="auth-primary-btn" href={homeHref}>
                  {copy.backHome}
                </a>
                <button type="button" className="auth-primary-btn" disabled={busy} onClick={() => void onLogout()}>
                  {busy ? copy.processing : copy.logout}
                </button>
              </div>
            </div>
          ) : null}

          {enabled && !loading && !userEmail ? (
            <>
              <div className="login-mode-switch" role="tablist" aria-label={copy.kicker}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'login'}
                  className={mode === 'login' ? 'active' : ''}
                  onClick={() => setMode('login')}
                >
                  {copy.loginMode}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'signup'}
                  className={mode === 'signup' ? 'active' : ''}
                  onClick={() => setMode('signup')}
                >
                  {copy.signupMode}
                </button>
              </div>

              <form className="login-page-form" onSubmit={handleSubmit}>
                <label className="login-page-field">
                  <span>{copy.emailLabel}</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder={copy.emailPlaceholder}
                    autoComplete="email"
                    required
                  />
                </label>

                <label className="login-page-field">
                  <span>{copy.passwordLabel}</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={copy.passwordPlaceholder}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    minLength={6}
                    required
                  />
                </label>

                <div className="login-page-actions">
                  <button type="submit" className="auth-primary-btn" disabled={busy}>
                    {busy ? copy.processing : mode === 'login' ? copy.loginAction : copy.signupAction}
                  </button>
                  <button type="button" className="auth-primary-btn auth-google-btn" disabled={busy} onClick={() => void onGoogleLogin()}>
                    {busy ? copy.processing : copy.googleAction}
                  </button>
                </div>
              </form>
            </>
          ) : null}

          {statusMessage ? <p className="auth-status">{statusMessage}</p> : null}
        </section>
      </main>
    </div>
  )
}
