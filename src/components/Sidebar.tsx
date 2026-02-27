import { AuthPanel, type AuthPanelProps } from './AuthPanel'
import type { Lang } from '../i18n/lang'

type SidebarMode = 'blog' | 'portfolio'

type TocItem = {
  id: string
  label: string
  meta?: string
}

type SidebarProps = {
  lang: Lang
  mode: SidebarMode
  activeKey: string
  lastUpdated: string
  onNavigate: (key: string) => void
  onLangChange: (lang: Lang) => void
  onModeChange: (mode: SidebarMode) => void
  tocItems: TocItem[]
  authPanel: Omit<AuthPanelProps, 'className'>
}

const SIDEBAR_COPY = {
  zh: {
    viewSwitchAria: '视图切换',
    langSwitchAria: '语言切换',
    blog: '博客',
    portfolio: '作品集',
    lastUpdated: '最近更新',
    zhLabel: '中文',
    enLabel: 'EN',
  },
  en: {
    viewSwitchAria: 'View switch',
    langSwitchAria: 'Language switch',
    blog: 'Blog',
    portfolio: 'Portfolio',
    lastUpdated: 'Last updated',
    zhLabel: '中文',
    enLabel: 'EN',
  },
} as const

export function Sidebar({
  lang,
  mode,
  activeKey,
  lastUpdated,
  onNavigate,
  onLangChange,
  onModeChange,
  tocItems,
  authPanel,
}: SidebarProps) {
  const copy = SIDEBAR_COPY[lang]

  return (
    <aside className={`sidebar ${mode === 'blog' ? 'blog-sidebar' : ''}`}>
      <AuthPanel {...authPanel} className="sidebar-auth" />

      <div className="lang-switch" role="tablist" aria-label={copy.langSwitchAria}>
        <button
          type="button"
          className={`lang-btn ${lang === 'zh' ? 'active' : ''}`}
          onClick={() => onLangChange('zh')}
        >
          {copy.zhLabel}
        </button>
        <button
          type="button"
          className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
          onClick={() => onLangChange('en')}
        >
          {copy.enLabel}
        </button>
      </div>

      <div className="view-switch" role="tablist" aria-label={copy.viewSwitchAria}>
        <button
          type="button"
          className={`view-btn ${mode === 'blog' ? 'active' : ''}`}
          onClick={() => onModeChange('blog')}
        >
          {copy.blog}
        </button>
        <button
          type="button"
          className={`view-btn ${mode === 'portfolio' ? 'active' : ''}`}
          onClick={() => onModeChange('portfolio')}
        >
          {copy.portfolio}
        </button>
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
