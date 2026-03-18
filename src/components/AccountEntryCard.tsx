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
  onLogout: () => Promise<void> | void
}

const ENTRY_COPY = {
  zh: {
    currentRole: '当前身份',
    enter: 'Enter',
    manage: '账户页',
    logout: '退出',
    processing: '处理中...',
  },
  en: {
    currentRole: 'Current role',
    enter: 'Enter',
    manage: 'Account page',
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
  onLogout,
}: AccountEntryCardProps) {
  const copy = ENTRY_COPY[lang]
  const guestClassName = ['auth-panel', 'account-entry-panel', className].filter(Boolean).join(' ')
  const userClassName = ['auth-panel', className].filter(Boolean).join(' ')

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
