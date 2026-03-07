import { useEffect, useMemo, useRef, useState } from 'react'
import { AuthPanel, type AuthPanelProps } from './AuthPanel'
import type { Lang } from '../i18n/lang'

type SiteTopBarProps = {
  lang: Lang
  authPanel: Omit<AuthPanelProps, 'className'>
}

const COPY = {
  zh: {
    accountAria: '账号面板',
    account: '账号',
    close: '收起',
    guest: '游客',
  },
  en: {
    accountAria: 'Account panel',
    account: 'Account',
    close: 'Close',
    guest: 'Guest',
  },
} as const

export function SiteTopBar({ lang, authPanel }: SiteTopBarProps) {
  const copy = COPY[lang]
  const [accountOpen, setAccountOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current) {
        return
      }

      if (!rootRef.current.contains(event.target as Node)) {
        setAccountOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setAccountOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const accountLabel = useMemo(() => {
    if (authPanel.userEmail) {
      return authPanel.userEmail
    }
    return copy.account
  }, [authPanel.userEmail, copy.account])

  const accountMeta = useMemo(() => {
    if (authPanel.userEmail) {
      return authPanel.userRole
    }
    return copy.guest
  }, [authPanel.userEmail, authPanel.userRole, copy.guest])

  return (
    <header className="site-topbar">
      <div ref={rootRef} className="site-topbar-account">
        <button
          type="button"
          className={`site-topbar-account-btn ${accountOpen ? 'active' : ''}`}
          aria-expanded={accountOpen}
          aria-label={copy.accountAria}
          onClick={() => setAccountOpen((value) => !value)}
        >
          <span className="site-topbar-account-text">
            <span className="mono site-topbar-account-label">{accountLabel}</span>
            <span className="site-topbar-account-meta">{accountMeta}</span>
          </span>
          <span className="site-topbar-account-caret">{accountOpen ? copy.close : copy.account}</span>
        </button>

        {accountOpen ? <AuthPanel {...authPanel} className="topbar-auth-panel" /> : null}
      </div>
    </header>
  )
}
