import type { AuthRole } from '../lib/auth'
import type { Lang } from '../i18n/lang'
import { roleLabel } from '../i18n/roles'

type AccountEntryCardProps = {
  lang: Lang
  enabled: boolean
  loading: boolean
  busy: boolean
  userEmail: string | null
  userRole: AuthRole
  statusMessage: string
  loginHref: string
  className?: string
  variant?: 'card' | 'topbar'
  onLogout: () => Promise<void> | void
}

const ENTRY_COPY = {
  zh: {
    currentRole: '当前身份',
    enter: 'Enter',
    manage: '账户',
    logout: '退出',
    processing: '处理中...',
  },
  en: {
    currentRole: 'Current role',
    enter: 'Enter',
    manage: 'Account',
    logout: 'Log out',
    processing: 'Processing...',
  },
} as const

export function AccountEntryCard({
  lang,
  enabled,
  loading,
  busy,
  userEmail,
  userRole,
  statusMessage,
  loginHref,
  className = '',
  variant = 'card',
  onLogout,
}: AccountEntryCardProps) {
  const copy = ENTRY_COPY[lang]
  const guestClassName = ['auth-panel', 'account-entry-panel', className].filter(Boolean).join(' ')
  const userClassName = ['auth-panel', className].filter(Boolean).join(' ')
  const compactGuestClassName = ['account-entry-topbar', 'account-entry-topbar-guest', className].filter(Boolean).join(' ')
  const compactUserClassName = ['account-entry-topbar', className].filter(Boolean).join(' ')

  if (variant === 'topbar') {
    if (!userEmail) {
      return (
        <section className={compactGuestClassName}>
          <a className="account-enter-link topbar-account-enter-link" href={loginHref}>
            {copy.enter}
          </a>
        </section>
      )
    }

    return (
      <section className={compactUserClassName}>
        <a className="topbar-account-overview topbar-account-overview-link" href={loginHref}>
          <span className="topbar-account-email" title={userEmail}>
            {userEmail}
          </span>
          <span className="topbar-account-role">{roleLabel(userRole, lang)}</span>
        </a>
        <div className="topbar-account-actions">
          <button
            type="button"
            className="auth-primary-btn topbar-account-btn"
            disabled={busy || loading || !enabled}
            onClick={() => void onLogout()}
          >
            {busy ? copy.processing : copy.logout}
          </button>
        </div>
      </section>
    )
  }

  if (!userEmail) {
    return (
      <section className={guestClassName}>
        <a className="account-enter-link" href={loginHref}>
          {copy.enter}
        </a>
      </section>
    )
  }

  return (
    <section className={userClassName}>
      <div className="auth-panel-head">
        <span className="mono">{lang === 'zh' ? '账号' : 'Account'}</span>
      </div>
      <div className="auth-user-card compact">
        <p className="auth-user-email">{userEmail}</p>
        <p className="auth-role">
          {copy.currentRole}: {roleLabel(userRole, lang)}
        </p>
        <div className="account-entry-actions">
          <a className="auth-primary-btn" href={loginHref}>
            {copy.manage}
          </a>
          <button type="button" className="auth-primary-btn" disabled={busy || loading || !enabled} onClick={() => void onLogout()}>
            {busy ? copy.processing : copy.logout}
          </button>
        </div>
      </div>
      {statusMessage ? <p className="auth-status">{statusMessage}</p> : null}
    </section>
  )
}
