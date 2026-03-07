import { useMemo, useState } from 'react'
import { AuthPanel, type AuthPanelProps } from './AuthPanel'
import type { Lang } from '../i18n/lang'

type SiteTopBarProps = {
  lang: Lang
  mode: 'blog' | 'portfolio'
  authPanel: Omit<AuthPanelProps, 'className'>
  onLangChange: (lang: Lang) => void
  onModeChange: (mode: 'blog' | 'portfolio') => void
}

const COPY = {
  zh: {
    langAria: '语言切换',
    viewAria: '视图切换',
    accountAria: '账号面板',
    zhLabel: '中文',
    enLabel: 'EN',
    blog: '博客',
    portfolio: '作品集',
    account: '账号',
    close: '收起',
  },
  en: {
    langAria: 'Language switch',
    viewAria: 'View switch',
    accountAria: 'Account panel',
    zhLabel: '中文',
    enLabel: 'EN',
    blog: 'Blog',
    portfolio: 'Portfolio',
    account: 'Account',
    close: 'Close',
  },
} as const

export function SiteTopBar({ lang, mode, authPanel, onLangChange, onModeChange }: SiteTopBarProps) {
  const copy = COPY[lang]
  const [accountOpen, setAccountOpen] = useState(false)

  const accountLabel = useMemo(() => {
    if (authPanel.userEmail) {
      return authPanel.userEmail
    }
    return copy.account
  }, [authPanel.userEmail, copy.account])

  return (
    <header className="site-topbar">
      <div className="site-topbar-account">
        <button
          type="button"
          className={`site-topbar-account-btn ${accountOpen ? 'active' : ''}`}
          aria-expanded={accountOpen}
          aria-label={copy.accountAria}
          onClick={() => setAccountOpen((value) => !value)}
        >
          <span className="mono site-topbar-account-label">{accountLabel}</span>
          <span className="site-topbar-account-caret">{accountOpen ? copy.close : copy.account}</span>
        </button>

        {accountOpen ? <AuthPanel {...authPanel} className="topbar-auth-panel" /> : null}
      </div>

      <div className="site-topbar-controls">
        <div className="site-topbar-group" role="tablist" aria-label={copy.langAria}>
          <button type="button" className={`lang-btn ${lang === 'zh' ? 'active' : ''}`} onClick={() => onLangChange('zh')}>
            {copy.zhLabel}
          </button>
          <button type="button" className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => onLangChange('en')}>
            {copy.enLabel}
          </button>
        </div>

        <div className="site-topbar-group" role="tablist" aria-label={copy.viewAria}>
          <button type="button" className={`view-btn ${mode === 'blog' ? 'active' : ''}`} onClick={() => onModeChange('blog')}>
            {copy.blog}
          </button>
          <button type="button" className={`view-btn ${mode === 'portfolio' ? 'active' : ''}`} onClick={() => onModeChange('portfolio')}>
            {copy.portfolio}
          </button>
        </div>
      </div>
    </header>
  )
}
