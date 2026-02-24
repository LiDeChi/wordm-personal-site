type SidebarProps = {
  activeSection: string
  lastUpdated: string
  onNavigate: (sectionId: string) => void
}

const navItems = [
  { id: 'home', label: 'Home [首页]' },
  { id: 'about', label: 'About [介绍]' },
  { id: 'resume', label: 'Resume [简历]' },
  { id: 'projects', label: 'Projects [项目]' },
  { id: 'visual', label: 'Visual [图示]' },
  { id: 'contact', label: 'Contact [联系]' },
]

export function Sidebar({ activeSection, lastUpdated, onNavigate }: SidebarProps) {
  return (
    <aside className="sidebar">
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

      <nav>
        <ul className="nav-list">
          {navItems.map((item) => {
            const isActive = activeSection === item.id

            return (
              <li className="nav-item" key={item.id}>
                <a
                  href={`#${item.id}`}
                  className={`nav-link${isActive ? ' active' : ''}`}
                  onClick={() => onNavigate(item.id)}
                >
                  {item.label}
                </a>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="sidebar-meta">Last updated: {lastUpdated}</div>
    </aside>
  )
}
