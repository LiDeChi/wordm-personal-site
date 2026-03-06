import { AuthPanel, type AuthPanelProps } from './AuthPanel'
import type { Lang } from '../i18n/lang'

type TocItem = {
  id: string
  label: string
  meta?: string
}

type SidebarProps = {
  lang: Lang
  mode: 'blog' | 'portfolio'
  activeKey: string
  lastUpdated: string
  onNavigate: (key: string) => void
  tocItems: TocItem[]
  authPanel: Omit<AuthPanelProps, 'className'>
}

const SIDEBAR_COPY = {
  zh: {
    lastUpdated: '最近更新',
  },
  en: {
    lastUpdated: 'Last updated',
  },
} as const

export function Sidebar({ lang, mode, activeKey, lastUpdated, onNavigate, tocItems, authPanel }: SidebarProps) {
  const copy = SIDEBAR_COPY[lang]

  return (
    <aside className={`sidebar ${mode === 'blog' ? 'blog-sidebar' : ''}`}>
      <AuthPanel {...authPanel} className="sidebar-auth" />

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
