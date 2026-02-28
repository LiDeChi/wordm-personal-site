import type { PortfolioProject } from '../types'
import { formatMonth } from '../lib/projects'
import type { Lang } from '../i18n/lang'
import { withLangParam } from '../lib/lang-url'

type ProjectEntryProps = {
  lang: Lang
  project: PortfolioProject
  unlocked: boolean
  focused?: boolean
  canUseFreeUnlock: boolean
  onUnlockSingle: (projectSlug: string) => void
  onUnlockFree: (projectSlug: string) => void
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
    subdomain: '详情页',
    install: '一键安装',
    production: '线上地址',
    source: '源码',
    unlocked: '已解锁',
    locked: '已锁定',
    lockHint: '解锁后可进入子域名并一键安装',
    unlockSingle: '解锁此作品',
    freeUnlock: '免费解锁',
    freeUnlockUnavailable: '免费名额已用完',
  },
  en: {
    activity: 'ACTIVITY',
    commits: 'COMMITS/30D',
    scopePrefix: 'Portfolio Item · Scope: tracked · Relations',
    tagsAria: 'Project tags',
    stack: 'Stack',
    subdomain: 'Details',
    install: 'Install',
    production: 'Production',
    source: 'Source',
    unlocked: 'Unlocked',
    locked: 'Locked',
    lockHint: 'Unlock to open subdomain and install in one click',
    unlockSingle: 'Unlock this project',
    freeUnlock: 'Free unlock',
    freeUnlockUnavailable: 'No free unlock quota left',
  },
} as const

export function ProjectEntry({
  lang,
  project,
  unlocked,
  focused = false,
  canUseFreeUnlock,
  onUnlockSingle,
  onUnlockFree,
}: ProjectEntryProps) {
  const copy = PROJECT_COPY[lang]
  const coverInitials = initials(project.name)
  const accent = slugAccent(project.slug)
  const localizedSubdomainUrl = withLangParam(project.subdomainUrl, lang)
  const cardClassNames = [
    'gallery-card',
    unlocked ? 'gallery-card-unlocked' : 'gallery-card-locked',
    focused ? 'gallery-card-focused' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const cardTitle = unlocked ? copy.unlocked : copy.locked

  return (
    <article className={cardClassNames} id={`project-${project.slug}`}>
      {unlocked ? (
        <a className="gallery-cover" href={localizedSubdomainUrl} target="_blank" rel="noreferrer">
          <div className="gallery-cover-grid" aria-hidden="true" />
          <div className="gallery-cover-initials" style={{ color: accent }}>
            {coverInitials || 'PJ'}
          </div>
          <div className="gallery-cover-subdomain mono">{project.subdomain}.wordm.us</div>
          <div className="gallery-lock-badge mono">{cardTitle}</div>
        </a>
      ) : (
        <div className="gallery-cover">
          <div className="gallery-cover-grid" aria-hidden="true" />
          <div className="gallery-cover-initials" style={{ color: accent }}>
            {coverInitials || 'PJ'}
          </div>
          <div className="gallery-cover-subdomain mono">{project.subdomain}.wordm.us</div>
          <div className="gallery-lock-badge mono">{cardTitle}</div>
        </div>
      )}

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

        {unlocked ? (
          <a className="paper-title gallery-title" href={localizedSubdomainUrl} target="_blank" rel="noreferrer">
            {project.name}
          </a>
        ) : (
          <span className="paper-title gallery-title gallery-title-locked">{project.name}</span>
        )}

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

        {unlocked ? (
          <div className="paper-links">
            <a href={localizedSubdomainUrl} target="_blank" rel="noreferrer">
              {copy.install}
            </a>
            <a href={localizedSubdomainUrl} target="_blank" rel="noreferrer">
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
        ) : (
          <div className="gallery-lock-actions">
            <p className="gallery-lock-hint">{copy.lockHint}</p>
            <div className="gallery-lock-buttons">
              <button type="button" className="gallery-unlock-btn" onClick={() => onUnlockSingle(project.slug)}>
                {copy.unlockSingle}
              </button>
              <button
                type="button"
                className="gallery-unlock-btn ghost"
                disabled={!canUseFreeUnlock}
                onClick={() => onUnlockFree(project.slug)}
              >
                {canUseFreeUnlock ? copy.freeUnlock : copy.freeUnlockUnavailable}
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  )
}
