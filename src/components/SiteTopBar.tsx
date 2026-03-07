import type { AuthPanelProps } from './AuthPanel'
import type { Lang } from '../i18n/lang'

type SiteTopBarProps = {
  lang: Lang
  authPanel: Omit<AuthPanelProps, 'className'>
}

const COPY = {
  zh: {
    account: '账号',
    guest: '游客',
  },
  en: {
    account: 'Account',
    guest: 'Guest',
  },
} as const

export function SiteTopBar({ lang, authPanel }: SiteTopBarProps) {
  const copy = COPY[lang]
  const label = authPanel.userEmail || copy.account
  const meta = authPanel.userEmail ? authPanel.userRole : copy.guest

  return (
    <header className="site-topbar site-topbar-minimal">
      <div className="site-topbar-status">
        <span className="mono site-topbar-status-label">{label}</span>
        <span className="site-topbar-status-meta">{meta}</span>
      </div>
    </header>
  )
}
