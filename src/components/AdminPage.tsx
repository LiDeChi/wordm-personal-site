import type { PortfolioProject } from '../types'
import type { Lang } from '../i18n/lang'
import { formatDate } from '../lib/projects'
import { withSiteParams } from '../lib/lang-url'

type AdminPageProps = {
  lang: Lang
  lastUpdated: string
  projects: PortfolioProject[]
}

const COPY = {
  zh: {
    title: '后台系统',
    subtitle: 'admin.wordm.us 受管理员认证保护，用于管理站点入口与项目分发。',
    projectCount: '项目总数',
    featuredCount: '详情已接入',
    updated: '快照更新',
    protected: '访问方式',
    protectedValue: 'HTTP Basic Auth',
    quickLinks: '快捷入口',
    rootPortfolio: '根域作品集',
    rootBlog: '根域博客',
    resume: '简历子域',
    debug: '根域 Debug',
    projects: '项目管理',
    detail: '查看详情',
    subdomain: '项目子域',
    source: '源码',
    production: '线上地址',
    commandRun: '运行',
    commandBuild: '构建',
    commandEntry: '入口',
    noCommand: 'N/A',
  },
  en: {
    title: 'Admin Backend',
    subtitle: 'admin.wordm.us is protected by administrator authentication and is used to manage site entry points and project distribution.',
    projectCount: 'Projects',
    featuredCount: 'With details',
    updated: 'Snapshot updated',
    protected: 'Access mode',
    protectedValue: 'HTTP Basic Auth',
    quickLinks: 'Quick links',
    rootPortfolio: 'Root portfolio',
    rootBlog: 'Root blog',
    resume: 'Resume subdomain',
    debug: 'Root debug',
    projects: 'Project management',
    detail: 'View detail',
    subdomain: 'Project subdomain',
    source: 'Source',
    production: 'Production',
    commandRun: 'Run',
    commandBuild: 'Build',
    commandEntry: 'Entry',
    noCommand: 'N/A',
  },
} as const

function commandValue(value: string | null | undefined, fallback: string) {
  return value && value.trim() ? value : fallback
}

export function AdminPage({ lang, lastUpdated, projects }: AdminPageProps) {
  const copy = COPY[lang]
  const detailedCount = projects.filter((project) => project.detail).length
  const rootPortfolioUrl = withSiteParams('https://wordm.us', { lang })
  const rootBlogUrl = withSiteParams('https://wordm.us?view=blog', { lang })
  const debugUrl = withSiteParams('https://wordm.us?debug=1', { lang })
  const resumeUrl = withSiteParams('https://resume.wordm.us', { lang })

  return (
    <div className="subdomain-page admin-page-shell">
      <main className="subdomain-main admin-main">
        <p className="mono subdomain-tag">admin.wordm.us</p>
        <h1>{copy.title}</h1>
        <p>{copy.subtitle}</p>

        <section className="admin-overview-grid">
          <div className="admin-overview-card">
            <span className="mono">{copy.projectCount}</span>
            <strong>{projects.length}</strong>
          </div>
          <div className="admin-overview-card">
            <span className="mono">{copy.featuredCount}</span>
            <strong>{detailedCount}</strong>
          </div>
          <div className="admin-overview-card">
            <span className="mono">{copy.updated}</span>
            <strong>{lastUpdated}</strong>
          </div>
          <div className="admin-overview-card">
            <span className="mono">{copy.protected}</span>
            <strong>{copy.protectedValue}</strong>
          </div>
        </section>

        <section className="project-detail-section">
          <h2>{copy.quickLinks}</h2>
          <div className="paper-links admin-quick-links">
            <a href={rootPortfolioUrl} target="_blank" rel="noreferrer">{copy.rootPortfolio}</a>
            <a href={rootBlogUrl} target="_blank" rel="noreferrer">{copy.rootBlog}</a>
            <a href={resumeUrl} target="_blank" rel="noreferrer">{copy.resume}</a>
            <a href={debugUrl} target="_blank" rel="noreferrer">{copy.debug}</a>
          </div>
        </section>

        <section className="project-detail-section">
          <h2>{copy.projects}</h2>
          <div className="admin-project-list">
            {projects.map((project) => {
              const detailUrl = withSiteParams(`https://wordm.us?view=portfolio&project=${encodeURIComponent(project.slug)}`, { lang })
              const subdomainUrl = withSiteParams(project.subdomainUrl, { lang })
              return (
                <article key={project.id} className="admin-project-card">
                  <div className="admin-project-head">
                    <div>
                      <h3>{project.name}</h3>
                      <p className="meta">{formatDate(project.lastCommitAt)} · {project.slug}</p>
                    </div>
                    <div className="paper-links">
                      <a href={detailUrl} target="_blank" rel="noreferrer">{copy.detail}</a>
                      <a href={subdomainUrl} target="_blank" rel="noreferrer">{copy.subdomain}</a>
                      {project.productionUrl ? <a href={project.productionUrl} target="_blank" rel="noreferrer">{copy.production}</a> : null}
                      {project.sourceUrl ? <a href={project.sourceUrl} target="_blank" rel="noreferrer">{copy.source}</a> : null}
                    </div>
                  </div>
                  <p>{project.summary}</p>
                  {project.detail ? (
                    <div className="admin-project-meta-grid">
                      <div>
                        <span className="mono">{copy.commandRun}</span>
                        <code>{commandValue(project.detail.commands.run, copy.noCommand)}</code>
                      </div>
                      <div>
                        <span className="mono">{copy.commandBuild}</span>
                        <code>{commandValue(project.detail.commands.build, copy.noCommand)}</code>
                      </div>
                      <div>
                        <span className="mono">{copy.commandEntry}</span>
                        <code>{commandValue(project.detail.entry, copy.noCommand)}</code>
                      </div>
                    </div>
                  ) : null}
                </article>
              )
            })}
          </div>
        </section>
      </main>
    </div>
  )
}
