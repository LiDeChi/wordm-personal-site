import { useEffect, useMemo, useState } from 'react'
import { DebugPanel } from './components/DebugPanel'
import { MarginNotes } from './components/MarginNotes'
import { ProjectEntry } from './components/ProjectEntry'
import { Sidebar } from './components/Sidebar'
import { SubdomainProjectView } from './components/SubdomainProjectView'
import projectsSnapshotRaw from './data/projects.snapshot.json'
import {
  chooseProjects,
  fetchProjectsFromApi,
  formatDate,
  parseShowSlugs,
  resolveSubdomainView,
} from './lib/projects'
import type { PortfolioProject, ProjectsSnapshot } from './types'

const snapshot = projectsSnapshotRaw as ProjectsSnapshot
const sectionIds = ['home', 'about', 'projects', 'visual', 'contact']

function defaultSelection(projects: PortfolioProject[], preferred: string[]): string[] {
  const preferredExisting = preferred.filter((slug) => projects.some((project) => project.slug === slug))
  if (preferredExisting.length) {
    return preferredExisting
  }

  return projects.slice(0, 8).map((project) => project.slug)
}

function App() {
  const params = new URLSearchParams(window.location.search)
  const debugMode = params.get('debug') === '1' || import.meta.env.DEV
  const forcedSubdomain = params.get('subdomain')
  const initialApi = params.get('centerApi') || import.meta.env.VITE_CENTER_CONTROL_API || ''
  const initialShowSlugs = parseShowSlugs(params.get('show'))

  const [projects, setProjects] = useState<PortfolioProject[]>(snapshot.projects)
  const [activeSection, setActiveSection] = useState('home')
  const [centerApi, setCenterApi] = useState(initialApi)
  const [sourceLabel, setSourceLabel] = useState('center-control snapshot')
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(() => {
    if (initialShowSlugs.length) {
      return initialShowSlugs
    }

    return defaultSelection(snapshot.projects, snapshot.featured)
  })

  const primaryUpdatedAt = snapshot.centerControlGeneratedAt || snapshot.generatedAt
  const lastUpdated = formatDate(primaryUpdatedAt)

  useEffect(() => {
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

    sectionIds.forEach((id) => {
      const node = document.getElementById(id)
      if (node) {
        observer.observe(node)
      }
    })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!debugMode) {
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
  }, [debugMode, selectedSlugs, centerApi])

  async function loadLiveProjects() {
    if (!centerApi) {
      setLoadState('error')
      setErrorMessage('请先填写 center-control API 地址。')
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

  if (subdomainProject) {
    return <SubdomainProjectView project={subdomainProject} lastUpdated={lastUpdated} />
  }

  return (
    <div className="page-container">
      <Sidebar activeSection={activeSection} lastUpdated={lastUpdated} onNavigate={setActiveSection} />

      <main className="main-content">
        <section id="home">
          <h1>
            Personal Systems &amp;
            <br />
            Product Experiments
          </h1>
        </section>

        <section id="about" className="abstract-block">
          <span className="abstract-label">Statement / 个人介绍</span>
          <p>
            我专注于 AI 产品策略、工程落地与跨项目协同系统。当前主线是把多个工具链统一为可复用的工作流，从需求、实现到部署形成稳定闭环。
          </p>
          <p style={{ marginBottom: 0 }}>
            <span className="mono">Current Focus:</span> Multi-Agent Workflow, Automation Platform, Human-AI Collaboration.
          </p>
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

          <h2>项目展示 / Selected Projects</h2>
          {featuredProjects.map((project) => (
            <ProjectEntry key={project.id} project={project} />
          ))}
        </section>

        <section id="visual">
          <h2>可视化 / Visualizations</h2>
          <p className="visual-intro">From center-control metrics to curated project surfaces under dedicated subdomains.</p>

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
          <div className="formula">deploy(host) = wordm.us + {'{'}p-*.wordm.us{'}'}</div>
          <p>
            站点主域名：<a href="https://wordm.us">wordm.us</a>
            <br />
            项目子域名：由 center-control 数据自动分配，并可在 debug 模式手动控制展示。
          </p>
        </section>

        <footer>
          <div>© 2026 Jian Yongjie. All rights reserved.</div>
          <div>Typeset in Noto Serif SC &amp; JetBrains Mono</div>
        </footer>
      </main>

      <MarginNotes />
    </div>
  )
}

export default App
