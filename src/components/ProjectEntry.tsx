import type { PortfolioProject } from '../types'
import { formatMonth } from '../lib/projects'
import type { Lang } from '../i18n/lang'

type ProjectEntryProps = {
  lang: Lang
  project: PortfolioProject
}

function initials(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s-]/g, ' ')
    .split(/[\s-_]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function slugAccent(seed: string): string {
  let hash = 0
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index)
    hash |= 0
  }
  const degree = Math.abs(hash) % 360
  return `hsl(${degree} 14% 28%)`
}

const PROJECT_COPY = {
  zh: {
    activity: '活跃度',
    commits: '近30天提交',
    scopePrefix: '作品集条目 · 范围: tracked · 关联数',
    tagsAria: '项目标签',
    stack: '技术栈',
    subdomain: '子域名',
    production: '线上地址',
    source: '源码',
  },
  en: {
    activity: 'ACTIVITY',
    commits: 'COMMITS/30D',
    scopePrefix: 'Portfolio Item · Scope: tracked · Relations',
    tagsAria: 'Project tags',
    stack: 'Stack',
    subdomain: 'Subdomain',
    production: 'Production',
    source: 'Source',
  },
} as const

export function ProjectEntry({ lang, project }: ProjectEntryProps) {
  const copy = PROJECT_COPY[lang]
  const coverInitials = initials(project.name)
  const accent = slugAccent(project.slug)

  return (
    <article className="gallery-card" id={`project-${project.slug}`}>
      <a className="gallery-cover" href={project.subdomainUrl} target="_blank" rel="noreferrer">
        <div className="gallery-cover-grid" aria-hidden="true" />
        <div className="gallery-cover-initials" style={{ color: accent }}>
          {coverInitials || 'PJ'}
        </div>
        <div className="gallery-cover-subdomain mono">{project.subdomain}.wordm.us</div>
      </a>

      <div className="gallery-card-body">
        <div className="paper-meta gallery-meta">
          <span>{formatMonth(project.lastCommitAt)}</span>
          <span>
            {copy.activity} {project.activityScore}
          </span>
          <span>
            {copy.commits} {project.commitCount30d}
          </span>
        </div>

        <a className="paper-title gallery-title" href={project.subdomainUrl} target="_blank" rel="noreferrer">
          {project.name}
        </a>

        <div className="paper-authors gallery-scope">
          {copy.scopePrefix}: {project.relationCount}
        </div>

        <p className="paper-summary gallery-summary">{project.summary}</p>

        {project.tags.length ? (
          <div className="gallery-tags" aria-label={copy.tagsAria}>
            {project.tags.slice(0, 4).map((tag) => (
              <span className="gallery-tag mono" key={`${project.id}-${tag}`}>
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        {project.techStack.length ? (
          <p className="paper-stack">
            <span className="mono">{copy.stack}:</span> {project.techStack.slice(0, 4).join(' · ')}
          </p>
        ) : null}

        <div className="paper-links">
          <a href={project.subdomainUrl} target="_blank" rel="noreferrer">
            {copy.subdomain}
          </a>
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
        </div>
      </div>
    </article>
  )
}
