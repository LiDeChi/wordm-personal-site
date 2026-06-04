import type { Lang } from '../i18n/lang'
import { type ProjectOfferState } from '../lib/project-offers'
import { getProjectPresentation } from '../data/projectPresentation'
import type { PortfolioProject } from '../types'

type ProjectEntryProps = {
  lang: Lang
  project: PortfolioProject
  accessible: boolean
  offerState: ProjectOfferState
  focused?: boolean
  onSelectProject: (projectSlug: string) => void
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

export function ProjectEntry({
  lang,
  project,
  accessible,
  offerState,
  focused = false,
  onSelectProject,
}: ProjectEntryProps) {
  const presentation = getProjectPresentation(project, lang)
  const offerVariant =
    offerState.baseKind === 'free'
      ? 'gallery-card-free'
      : offerState.baseKind === 'limited_free' && offerState.effectiveKind === 'free'
        ? 'gallery-card-limited-free'
        : 'gallery-card-paid'
  const showLock = offerState.effectiveKind === 'paid' && !accessible
  const cardClassNames = [
    'gallery-card',
    accessible ? 'gallery-card-unlocked' : 'gallery-card-locked',
    offerVariant,
    focused ? 'gallery-card-focused' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <article className={cardClassNames} id={`project-${project.slug}`}>
      <button type="button" className="gallery-cover gallery-cover-button" onClick={() => onSelectProject(project.slug)}>
        {presentation.thumbnailUrl ? (
          <div className="gallery-cover-image-shell">
            <img className="gallery-cover-image" src={presentation.thumbnailUrl} alt={presentation.name} loading="lazy" />
          </div>
        ) : (
          <div className="gallery-cover-placeholder">{initials(presentation.name) || 'PJ'}</div>
        )}
        {showLock ? (
          <span className="gallery-lock-indicator" aria-hidden="true">
            <svg viewBox="0 0 16 16" focusable="false">
              <path d="M5.5 6V4.75a2.5 2.5 0 1 1 5 0V6h.75A1.75 1.75 0 0 1 13 7.75v4.5A1.75 1.75 0 0 1 11.25 14h-6.5A1.75 1.75 0 0 1 3 12.25v-4.5A1.75 1.75 0 0 1 4.75 6H5.5Zm1 0h3V4.75a1.5 1.5 0 1 0-3 0V6Z" />
            </svg>
          </span>
        ) : null}
        <div className="gallery-hover-detail">
          <p>{presentation.summary}</p>
        </div>
      </button>

      <div className="gallery-card-body gallery-card-body-simple">
        <button type="button" className="paper-title gallery-title gallery-title-button" onClick={() => onSelectProject(project.slug)}>
          {presentation.name}
        </button>
        <p className="gallery-tagline">{presentation.tagline}</p>
      </div>
    </article>
  )
}
