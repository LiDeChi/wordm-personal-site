import { AuthPanel, type AuthPanelProps } from './AuthPanel'

type SidebarMode = 'blog' | 'portfolio'

type TocItem = {
  id: string
  label: string
  meta?: string
}

type SidebarProps = {
  mode: SidebarMode
  activeKey: string
  lastUpdated: string
  onNavigate: (key: string) => void
  onModeChange: (mode: SidebarMode) => void
  tocItems: TocItem[]
  authPanel: Omit<AuthPanelProps, 'className'>
}

export function Sidebar({ mode, activeKey, lastUpdated, onNavigate, onModeChange, tocItems, authPanel }: SidebarProps) {
  return (
    <aside className={`sidebar ${mode === 'blog' ? 'blog-sidebar' : ''}`}>
      <div className="profile-block">
        <div className="profile-title">简永杰</div>
        <div className="profile-title profile-title-en">Jian Yongjie</div>
        <div className="profile-affil">
          Product Strategist &amp; Builder
          <br />
          AI + Design + Engineering
          <br />
          Base: New York / Beijing
        </div>
      </div>

      <div className="view-switch" role="tablist" aria-label="view switch">
        <button
          type="button"
          className={`view-btn ${mode === 'blog' ? 'active' : ''}`}
          onClick={() => onModeChange('blog')}
        >
          Blog
        </button>
        <button
          type="button"
          className={`view-btn ${mode === 'portfolio' ? 'active' : ''}`}
          onClick={() => onModeChange('portfolio')}
        >
          Portfolio
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

      <AuthPanel {...authPanel} className="sidebar-auth" />

      <div className="sidebar-meta">Last updated: {lastUpdated}</div>
    </aside>
  )
}
