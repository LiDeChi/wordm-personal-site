import type { PortfolioProject } from '../types'
import type { Lang } from '../i18n/lang'

type ProjectEntryProps = {
  lang: Lang
  project: PortfolioProject
  unlocked: boolean
  focused?: boolean
  unlockBusy: boolean
  onSelectProject: (projectSlug: string) => void
  onUnlockSingle: (projectSlug: string) => void
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

const PROJECT_COPY = {
  zh: {
    unlocked: '已解锁',
    locked: '未解锁',
    unlockSingle: '解锁作品',
    viewDetail: '查看详情',
  },
  en: {
    unlocked: 'Unlocked',
    locked: 'Locked',
    unlockSingle: 'Unlock',
    viewDetail: 'View detail',
  },
} as const

export function ProjectEntry({
  lang,
  project,
  unlocked,
  focused = false,
  unlockBusy,
  onSelectProject,
  onUnlockSingle,
}: ProjectEntryProps) {
  const copy = PROJECT_COPY[lang]
  const cardClassNames = [
    'gallery-card',
    unlocked ? 'gallery-card-unlocked' : 'gallery-card-locked',
    focused ? 'gallery-card-focused' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <article className={cardClassNames} id={`project-${project.slug}`}>
      <button type="button" className="gallery-cover gallery-cover-button" onClick={() => onSelectProject(project.slug)}>
        {project.thumbnailUrl ? (
          <img className="gallery-cover-image" src={project.thumbnailUrl} alt={project.name} loading="lazy" />
        ) : (
          <div className="gallery-cover-placeholder">{initials(project.name) || 'PJ'}</div>
        )}
        <div className="gallery-lock-badge mono">{unlocked ? copy.unlocked : copy.locked}</div>
        <div className="gallery-hover-detail">
          <p>{project.summary}</p>
        </div>
      </button>

      <div className="gallery-card-body gallery-card-body-simple">
        <button type="button" className="paper-title gallery-title gallery-title-button" onClick={() => onSelectProject(project.slug)}>
          {project.name}
        </button>
        <p className="gallery-tagline">{project.tagline}</p>
        <div className="gallery-card-actions">
          <button
            type="button"
            className="gallery-unlock-btn"
            disabled={unlockBusy}
            onClick={() => (unlocked ? onSelectProject(project.slug) : onUnlockSingle(project.slug))}
          >
            {unlocked ? copy.viewDetail : copy.unlockSingle}
          </button>
        </div>
      </div>
    </article>
  )
}
