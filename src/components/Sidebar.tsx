import { AuthPanel, type AuthPanelProps } from './AuthPanel'
import type { Lang } from '../i18n/lang'

type TocItem = {
  id: string
  label: string
  meta?: string
}

type SidebarProps = {
  lang: Lang
  activeKey: string
  lastUpdated: string
  onNavigate: (key: string) => void
  onLangChange: (lang: Lang) => void
  tocItems: TocItem[]
  authPanel: Omit<AuthPanelProps, 'className'>
}

const SIDEBAR_COPY = {
  zh: {
    lastUpdated: '最近更新',
    langLabel: '语言',
    zhLabel: '中文',
    enLabel: 'EN',
  },
  en: {
    lastUpdated: 'Last updated',
    langLabel: 'Language',
    zhLabel: '中文',
    enLabel: 'EN',
  },
} as const

export function Sidebar({ lang, activeKey, lastUpdated, onNavigate, onLangChange, tocItems, authPanel }: SidebarProps) {
  const copy = SIDEBAR_COPY[lang]

  return (
    <aside className="sidebar">
      <AuthPanel {...authPanel} className="sidebar-auth" compact />

      <div className="sidebar-select-stack">
        <label className="sidebar-select-field">
          <span className="mono">{copy.langLabel}</span>
          <select value={lang} onChange={(event) => onLangChange(event.target.value as Lang)}>
            <option value="zh">{copy.zhLabel}</option>
            <option value="en">{copy.enLabel}</option>
          </select>
        </label>
      </div>

      <nav>
        <ul className="nav-list">
          {tocItems.map((item) => {
            const isActive = activeKey === item.id

            return (
              <li className="nav-item" key={item.id}>
                <a
                  href={`#${item.id}`}
                  className={`nav-link${isActive ? ' active' : ''}`}
                  onClick={() => onNavigate(item.id)}
                >
                  {item.label}
                </a>
                {item.meta ? <div className="toc-meta">{item.meta}</div> : null}
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="sidebar-meta">
        {copy.lastUpdated}: {lastUpdated}
      </div>
    </aside>
  )
}
