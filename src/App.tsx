import { useEffect, useMemo, useState } from 'react'
import { DebugPanel } from './components/DebugPanel'
import { ProjectEntry } from './components/ProjectEntry'
import { ResumeAccessDenied } from './components/ResumeAccessDenied'
import { ResumePage } from './components/ResumePage'
import { Sidebar } from './components/Sidebar'
import { SiteHeroBanner } from './components/SiteHeroBanner'
import { SubdomainProjectView } from './components/SubdomainProjectView'
import { BLOG_ARTICLES } from './data/blogArticles'
import projectsSnapshotRaw from './data/projects.snapshot.json'
import {
  type AuthRoleRulesJson,
  type AuthRole,
  type AuthRoleRules,
  type AuthUserSummary,
  fetchSessionUser,
  isAuthConfigured,
  mergeRoleRules,
  loginWithPassword,
  logout,
  normalizeAuthError,
  parseRoleEmailSet,
  signupWithPassword,
  subscribeAuthState,
  toRoleRulesFromJson,
  toAuthUserSummary,
} from './lib/auth'
import {
  chooseProjects,
  fetchProjectsFromApi,
  formatDate,
  parseShowSlugs,
  resolveSubdomainView,
} from './lib/projects'
import type { PortfolioProject, ProjectsSnapshot } from './types'

type RootView = 'blog' | 'portfolio'

const snapshot = projectsSnapshotRaw as ProjectsSnapshot
const portfolioSectionIds = ['home', 'projects', 'visual', 'contact']

function defaultSelection(projects: PortfolioProject[], preferred: string[]): string[] {
  const preferredExisting = preferred.filter((slug) => projects.some((project) => project.slug === slug))
  if (preferredExisting.length) {
    return preferredExisting
  }

  return projects.slice(0, 8).map((project) => project.slug)
}

function toRootView(raw: string | null): RootView {
  return raw === 'portfolio' ? 'portfolio' : 'blog'
}

function App() {
  const params = new URLSearchParams(window.location.search)
  const hostname = window.location.hostname.toLowerCase()
  const debugMode = params.get('debug') === '1' || import.meta.env.DEV
  const forcedSubdomain = params.get('subdomain')
  const forcedPage = params.get('page')
  const initialApi = params.get('centerApi') || import.meta.env.VITE_CENTER_CONTROL_API || ''
  const initialShowSlugs = parseShowSlugs(params.get('show'))
  const initialRootView = toRootView(params.get('view'))
  const authConfig = useMemo(
    () => ({
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
      supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    }),
    [],
  )
  const envRoleRules = useMemo<AuthRoleRules>(
    () => ({
      adminEmails: parseRoleEmailSet(import.meta.env.VITE_AUTH_ADMIN_EMAILS || import.meta.env.VITE_ADMIN_EMAILS || ''),
      testerEmails: parseRoleEmailSet(import.meta.env.VITE_AUTH_TEST_EMAILS || import.meta.env.VITE_TEST_EMAILS || ''),
    }),
    [],
  )
  const [authRoleRules, setAuthRoleRules] = useState<AuthRoleRules>(envRoleRules)
  const authEnabled = isAuthConfigured(authConfig)

  const [rootView, setRootView] = useState<RootView>(initialRootView)
  const [projects, setProjects] = useState<PortfolioProject[]>(snapshot.projects)
  const [activeSection, setActiveSection] = useState('home')
  const [activeArticleId, setActiveArticleId] = useState(BLOG_ARTICLES[0]?.id || '')
  const [centerApi, setCenterApi] = useState(initialApi)
  const [sourceLabel, setSourceLabel] = useState('project snapshot')
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [authUser, setAuthUser] = useState<AuthUserSummary | null>(null)
  const [authLoading, setAuthLoading] = useState(authEnabled)
  const [authBusy, setAuthBusy] = useState(false)
  const [authStatusMessage, setAuthStatusMessage] = useState('')
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(() => {
    if (initialShowSlugs.length) {
      return initialShowSlugs
    }

    return defaultSelection(snapshot.projects, snapshot.featured)
  })

  const primaryUpdatedAt = snapshot.centerControlGeneratedAt || snapshot.generatedAt
  const lastUpdated = formatDate(primaryUpdatedAt)

  useEffect(() => {
    const next = new URL(window.location.href)
    if (rootView === 'portfolio') {
      next.searchParams.set('view', 'portfolio')
    } else {
      next.searchParams.delete('view')
    }

    window.history.replaceState({}, '', next)
  }, [rootView])

  useEffect(() => {
    if (rootView !== 'portfolio') {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)

        if (visible[0]) {
          setActiveSection(visible[0].target.id)
        }
      },
      {
        rootMargin: '-25% 0px -60% 0px',
        threshold: [0.2, 0.5, 0.8],
      },
    )

    portfolioSectionIds.forEach((id) => {
      const node = document.getElementById(id)
      if (node) {
        observer.observe(node)
      }
    })

    return () => observer.disconnect()
  }, [rootView])

  useEffect(() => {
    if (rootView !== 'blog') {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)

        if (visible[0]) {
          setActiveArticleId(visible[0].target.id)
        }
      },
      {
        rootMargin: '-30% 0px -55% 0px',
        threshold: [0.2, 0.45, 0.7],
      },
    )

    BLOG_ARTICLES.forEach((article) => {
      const node = document.getElementById(article.id)
      if (node) {
        observer.observe(node)
      }
    })

    return () => observer.disconnect()
  }, [rootView])

  useEffect(() => {
    if (!debugMode || rootView !== 'portfolio') {
      return
    }

    const next = new URL(window.location.href)

    if (selectedSlugs.length) {
      next.searchParams.set('show', selectedSlugs.join(','))
    } else {
      next.searchParams.delete('show')
    }

    if (centerApi) {
      next.searchParams.set('centerApi', centerApi)
    } else {
      next.searchParams.delete('centerApi')
    }

    next.searchParams.set('debug', '1')
    window.history.replaceState({}, '', next)
  }, [debugMode, rootView, selectedSlugs, centerApi])

  useEffect(() => {
    let active = true

    async function loadRoleRulesFromPublicFile() {
      try {
        const response = await fetch('/auth-role-rules.json', {
          cache: 'no-store',
        })

        if (!response.ok) {
          throw new Error(`role rules file not found (${response.status})`)
        }

        const payload = (await response.json()) as AuthRoleRulesJson
        const fileRules = toRoleRulesFromJson(payload)

        if (!active) {
          return
        }

        setAuthRoleRules(mergeRoleRules(envRoleRules, fileRules))
      } catch {
        if (!active) {
          return
        }

        setAuthRoleRules(envRoleRules)
      }
    }

    void loadRoleRulesFromPublicFile()

    return () => {
      active = false
    }
  }, [envRoleRules])

  useEffect(() => {
    if (!authEnabled) {
      setAuthLoading(false)
      setAuthUser(null)
      return
    }

    let active = true
    setAuthLoading(true)

    void fetchSessionUser(authConfig)
      .then((user) => {
        if (!active) {
          return
        }

        setAuthUser(toAuthUserSummary(user, authRoleRules))
      })
      .catch((error) => {
        if (!active) {
          return
        }

        setAuthStatusMessage(`会话恢复失败：${normalizeAuthError(error, '请重新登录。')}`)
      })
      .finally(() => {
        if (active) {
          setAuthLoading(false)
        }
      })

    const unsubscribe = subscribeAuthState(authConfig, (user) => {
      if (!active) {
        return
      }

      setAuthUser(toAuthUserSummary(user, authRoleRules))
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [authConfig, authEnabled, authRoleRules])

  async function loadLiveProjects() {
    if (!centerApi) {
      setLoadState('error')
      setErrorMessage('请先填写项目 API 地址。')
      return
    }

    setLoadState('loading')
    setErrorMessage('')

    try {
      const liveProjects = await fetchProjectsFromApi(centerApi)
      setProjects(liveProjects)
      setSelectedSlugs((prev) => {
        const available = new Set(liveProjects.map((project) => project.slug))
        const filtered = prev.filter((slug) => available.has(slug))
        if (filtered.length) {
          return filtered
        }

        return defaultSelection(liveProjects, snapshot.featured)
      })
      setSourceLabel(`live api: ${centerApi}`)
      setLoadState('idle')
    } catch (error) {
      setLoadState('error')
      setErrorMessage(error instanceof Error ? error.message : '加载失败')
    }
  }

  async function handleLogin(email: string, password: string) {
    if (!authEnabled) {
      setAuthStatusMessage('未配置 Supabase，无法登录。')
      return
    }

    if (!email || !password) {
      setAuthStatusMessage('请输入邮箱和密码。')
      return
    }

    setAuthBusy(true)
    setAuthStatusMessage('登录中...')

    try {
      const user = await loginWithPassword(authConfig, email, password)
      const normalizedUser = toAuthUserSummary(user, authRoleRules)
      setAuthUser(normalizedUser)
      setAuthStatusMessage(normalizedUser?.email ? `登录成功：${normalizedUser.email}` : '登录成功。')
    } catch (error) {
      setAuthStatusMessage(`登录失败：${normalizeAuthError(error, '请检查邮箱或密码。')}`)
    } finally {
      setAuthBusy(false)
    }
  }

  async function handleSignup(email: string, password: string) {
    if (!authEnabled) {
      setAuthStatusMessage('未配置 Supabase，无法注册。')
      return
    }

    if (!email || !password) {
      setAuthStatusMessage('请输入邮箱和密码。')
      return
    }

    setAuthBusy(true)
    setAuthStatusMessage('注册中...')

    try {
      const result = await signupWithPassword(authConfig, email, password)

      if (result.outcome === 'exists') {
        setAuthStatusMessage('该邮箱已注册，请直接登录。')
        return
      }

      if (result.outcome === 'confirm') {
        setAuthStatusMessage('注册成功，请先到邮箱点击确认链接，再回来登录。')
        return
      }

      const normalizedUser = toAuthUserSummary(result.user, authRoleRules)
      setAuthUser(normalizedUser)
      setAuthStatusMessage(normalizedUser?.email ? `注册并登录成功：${normalizedUser.email}` : '注册成功。')
    } catch (error) {
      setAuthStatusMessage(`注册失败：${normalizeAuthError(error, '请稍后重试。')}`)
    } finally {
      setAuthBusy(false)
    }
  }

  async function handleLogout() {
    if (!authEnabled) {
      setAuthStatusMessage('未配置 Supabase。')
      return
    }

    setAuthBusy(true)
    setAuthStatusMessage('退出中...')

    try {
      await logout(authConfig)
      setAuthUser(null)
      setAuthStatusMessage('已退出登录。')
    } catch (error) {
      setAuthStatusMessage(`退出失败：${normalizeAuthError(error, '请稍后重试。')}`)
    } finally {
      setAuthBusy(false)
    }
  }

  const featuredProjects = useMemo(() => {
    const chosen = chooseProjects(projects, selectedSlugs)
    if (chosen.length) {
      return chosen
    }

    const fallbackSlugs = defaultSelection(projects, snapshot.featured)
    return chooseProjects(projects, fallbackSlugs)
  }, [projects, selectedSlugs])

  const highlightedProjects = featuredProjects.slice(0, 3)

  const subdomainProject = useMemo(
    () => resolveSubdomainView(projects, window.location.hostname, forcedSubdomain),
    [projects, forcedSubdomain],
  )
  const isResumeView = forcedPage === 'resume' || hostname === 'resume.wordm.us' || hostname === 'cv.wordm.us'

  const activeArticleIndex = Math.max(
    0,
    BLOG_ARTICLES.findIndex((article) => article.id === activeArticleId),
  )
  const activeArticle = BLOG_ARTICLES[activeArticleIndex] || BLOG_ARTICLES[0]
  const nextArticle = BLOG_ARTICLES[activeArticleIndex + 1] || null
  const authRole: AuthRole = authUser?.role ?? 'guest'
  const canAccessResume = authRole === 'admin' || authRole === 'tester'
  const authPanelProps = {
    enabled: authEnabled,
    loading: authLoading,
    busy: authBusy,
    userEmail: authUser?.email ?? null,
    userRole: authRole,
    statusMessage: authStatusMessage,
    onLogin: handleLogin,
    onSignup: handleSignup,
    onLogout: handleLogout,
  }

  function jumpToArticle(id: string) {
    setActiveArticleId(id)
    const target = document.getElementById(id)
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  if (subdomainProject) {
    return <SubdomainProjectView project={subdomainProject} lastUpdated={lastUpdated} authPanel={authPanelProps} />
  }
  if (isResumeView) {
    if (!canAccessResume) {
      return <ResumeAccessDenied role={authRole} authPanel={authPanelProps} />
    }
    return <ResumePage lastUpdated={lastUpdated} authPanel={authPanelProps} />
  }

  if (rootView === 'blog') {
    return (
      <div className="page-container blog-page">
        <Sidebar
          mode="blog"
          activeKey={activeArticle.id}
          lastUpdated={lastUpdated}
          onModeChange={setRootView}
          onNavigate={jumpToArticle}
          tocItems={BLOG_ARTICLES.map((article) => ({
            id: article.id,
            label: article.title,
            meta: article.date,
          }))}
          authPanel={authPanelProps}
        />

        <main className="main-content blog-main">
          <section id="home" className="blog-home-head">
            <SiteHeroBanner className="blog-hero-banner" />
            <div className="blog-home-profile">
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
          </section>

          {BLOG_ARTICLES.map((article) => (
            <article key={article.id} id={article.id} className="blog-article">
              <div className="paper-meta">
                <span>{article.date}</span>
                <span>{article.category}</span>
              </div>
              <h2 className="blog-article-title">{article.title}</h2>
              <p className="meta">{article.summary}</p>
              {article.paragraphs.map((paragraph) => (
                <p key={`${article.id}-${paragraph.slice(0, 12)}`}>{paragraph}</p>
              ))}
            </article>
          ))}

          <footer>
            <div>© 2026 Jian Yongjie. All rights reserved.</div>
            <div>Blog mode on wordm.us</div>
          </footer>
        </main>
        <div className="blog-next-fixed-wrap" aria-live="polite">
          <button
            type="button"
            className="blog-next-fixed-btn"
            onClick={() => {
              if (!nextArticle) {
                return
              }
              jumpToArticle(nextArticle.id)
            }}
            disabled={!nextArticle}
            title={nextArticle ? `下一篇：${nextArticle.title}` : '已经是最后一篇'}
            aria-label={nextArticle ? `跳转到下一篇：${nextArticle.title}` : '已经是最后一篇'}
          >
            <span className="mono blog-next-fixed-label">NEXT</span>
            <span className="blog-next-fixed-text">
              {nextArticle ? `跳到下一篇：${nextArticle.title}` : '已经是最后一篇'}
            </span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <Sidebar
        mode="portfolio"
        activeKey={activeSection}
        lastUpdated={lastUpdated}
        onModeChange={setRootView}
        onNavigate={(id) => setActiveSection(id)}
        tocItems={[
          { id: 'home', label: 'Home [首页]' },
          { id: 'projects', label: 'Projects [项目]' },
          { id: 'visual', label: 'Visual [图示]' },
          { id: 'contact', label: 'Contact [联系]' },
        ]}
        authPanel={authPanelProps}
      />

      <main className="main-content portfolio-main-content">
        <section id="home">
          <SiteHeroBanner className="portfolio-hero-banner" />
        </section>

        <section id="projects">
          <h2>最新动态 / News</h2>
          <ul className="news-list">
            {featuredProjects.slice(0, 3).map((project) => (
              <li key={`news-${project.id}`} className="news-item">
                <span className="mono news-date">{formatDate(project.lastCommitAt)}</span>
                <span>
                  {project.name} 活跃度 <strong>{project.activityScore}</strong>，子域名已分配为{' '}
                  <a href={project.subdomainUrl} target="_blank" rel="noreferrer">
                    {project.subdomain}.wordm.us
                  </a>
                  。
                </span>
              </li>
            ))}
          </ul>

          {debugMode ? (
            <DebugPanel
              allProjects={projects}
              selectedSlugs={selectedSlugs}
              centerApi={centerApi}
              sourceLabel={sourceLabel}
              loadState={loadState}
              errorMessage={errorMessage}
              onCenterApiChange={setCenterApi}
              onLoadLive={loadLiveProjects}
              onToggleProject={(slug) => {
                setSelectedSlugs((prev) => {
                  if (prev.includes(slug)) {
                    return prev.filter((item) => item !== slug)
                  }

                  return [...prev, slug]
                })
              }}
              onSelectFeatured={() => setSelectedSlugs(defaultSelection(projects, snapshot.featured))}
              onSelectAll={() => setSelectedSlugs(projects.map((project) => project.slug))}
            />
          ) : null}

          <h2>作品集 / Portfolio Gallery</h2>
          <p className="visual-intro">以 gallery 形式展示项目卡片，点击任一卡片可进入对应子域名详情页。</p>
          <div className="portfolio-gallery">
            {featuredProjects.map((project) => (
              <ProjectEntry key={project.id} project={project} />
            ))}
          </div>
        </section>

        <section id="visual">
          <h2>可视化 / Visualizations</h2>
          <p className="visual-intro">From article insights to portfolio evidence, with each project accessible via its own subdomain.</p>

          <div className="visual-grid">
            {highlightedProjects.map((project, index) => (
              <div key={`visual-${project.id}`}>
                <div className="grid-item">
                  <svg width="100%" height="100%" viewBox="0 0 100 100" aria-hidden="true">
                    <rect x="8" y="8" width="84" height="84" fill="none" stroke="#cdcdcd" strokeWidth="1" />
                    <line x1="16" y1="84" x2="84" y2="16" stroke="#222" strokeWidth="1.2" />
                    <line x1="16" y1="16" x2="84" y2="84" stroke="#555" strokeWidth="0.8" strokeDasharray="3 2" />
                    <circle cx={30 + index * 20} cy={40 + index * 8} r="5" fill="#111" />
                    <path d="M 18 70 Q 50 20 82 70" stroke="#111" fill="none" strokeWidth="1" />
                  </svg>
                </div>
                <div className="grid-caption">{project.name}</div>
              </div>
            ))}
          </div>
        </section>

        <section id="contact">
          <h2>联系 / Contact</h2>
          <div className="formula">deploy(host) = wordm.us + {'{'}resume.wordm.us + p-*.wordm.us{'}'}</div>
          <p>
            站点主域名：<a href="https://wordm.us">wordm.us</a>
            <br />
            简历子域名：<a href="https://resume.wordm.us">resume.wordm.us</a>
            <br />
            项目子域名：按作品独立分配，可在 debug 模式手动控制展示。
          </p>
        </section>

        <footer>
          <div>© 2026 Jian Yongjie. All rights reserved.</div>
          <div>Portfolio mode on wordm.us</div>
        </footer>
      </main>

    </div>
  )
}

export default App
