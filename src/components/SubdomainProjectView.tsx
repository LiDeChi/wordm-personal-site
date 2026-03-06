import { AuthPanel, type AuthPanelProps } from './AuthPanel'
import type { PortfolioProject } from '../types'
import { formatDate } from '../lib/projects'
import type { Lang } from '../i18n/lang'
import { withSiteParams } from '../lib/lang-url'

type SubdomainProjectViewProps = {
  lang: Lang
  project: PortfolioProject
  lastUpdated: string
  shareToken?: string | null
  authPanel: Omit<AuthPanelProps, 'className'>
}

const SUBDOMAIN_COPY = {
  zh: {
    lastCommit: '最近提交',
    activity: '活跃度',
    techStack: '技术栈',
    production: '线上地址',
    source: '源码',
    backHome: '返回主页',
    footerLeft: '项目展示子域名',
    updated: '最近更新',
  },
  en: {
    lastCommit: 'Last Commit',
    activity: 'Activity',
    techStack: 'Tech Stack',
    production: 'Production',
    source: 'Source',
    backHome: 'Back to Home',
    footerLeft: 'Project showcase subdomain',
    updated: 'Updated',
  },
} as const

export function SubdomainProjectView({ lang, project, lastUpdated, shareToken = null, authPanel }: SubdomainProjectViewProps) {
  const copy = SUBDOMAIN_COPY[lang]
  const homeUrl = withSiteParams('https://wordm.us', { lang, shareToken })

  return (
    <div className="subdomain-page">
      <main className="subdomain-main">
        <p className="mono subdomain-tag">{project.subdomain}.wordm.us</p>
        <h1>{project.name}</h1>
        <p className="meta">
          {copy.lastCommit}: {formatDate(project.lastCommitAt)} · {copy.activity}: {project.activityScore}
        </p>
        <AuthPanel {...authPanel} className="subdomain-auth" />
        <p>{project.summary}</p>

        {project.techStack.length ? (
          <div className="abstract-block">
            <span className="abstract-label">{copy.techStack}</span>
            <p>{project.techStack.join(' · ')}</p>
          </div>
        ) : null}

        <div className="paper-links">
          {project.productionUrl ? (
            <a href={project.productionUrl} target="_blank" rel="noreferrer">
              {copy.production}
            </a>
          ) : null}
          {project.sourceUrl ? (
            <a href={project.sourceUrl} target="_blank" rel="noreferrer">
              {copy.source}
            </a>
          ) : null}
          <a href={homeUrl} target="_blank" rel="noreferrer">
            {copy.backHome}
          </a>
        </div>

        <footer className="subdomain-footer">
          <div>{copy.footerLeft}</div>
          <div>
            {copy.updated}: {lastUpdated}
          </div>
        </footer>
      </main>
    </div>
  )
}
