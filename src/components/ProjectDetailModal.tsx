import type { Lang } from '../i18n/lang'
import type { ProjectOfferState } from '../lib/project-offers'
import type { PortfolioProject } from '../types'
import { ProjectDetailPage } from './ProjectDetailPage'

type ProjectDetailModalProps = {
  lang: Lang
  project: PortfolioProject
  lastUpdated: string
  unlocked: boolean
  offerState: ProjectOfferState
  shareToken?: string | null
  indexLabel?: string | null
  hasPrevious: boolean
  hasNext: boolean
  onClose: () => void
  onPrevious: () => void
  onNext: () => void
}

const COPY = {
  zh: {
    close: '关闭',
    previous: '上一个项目',
    next: '下一个项目',
    dialogLabelSuffix: '项目弹窗',
  },
  en: {
    close: 'Close',
    previous: 'Previous project',
    next: 'Next project',
    dialogLabelSuffix: 'project modal',
  },
} as const

export function ProjectDetailModal({
  lang,
  project,
  lastUpdated,
  unlocked,
  offerState,
  shareToken = null,
  indexLabel = null,
  hasPrevious,
  hasNext,
  onClose,
  onPrevious,
  onNext,
}: ProjectDetailModalProps) {
  const copy = COPY[lang]

  return (
    <div
      className="project-detail-modal"
      role="dialog"
      aria-modal="true"
      aria-label={`${project.name} ${copy.dialogLabelSuffix}`}
      onClick={onClose}
    >
      <div className="project-detail-modal-shell" onClick={(event) => event.stopPropagation()}>
        {hasPrevious || hasNext || indexLabel ? (
          <div className="project-detail-modal-toolbar">
            <div className="project-detail-modal-toolbar-side">
              {hasPrevious ? (
                <button
                  type="button"
                  className="project-detail-modal-nav"
                  onClick={onPrevious}
                  aria-label={copy.previous}
                >
                  {copy.previous}
                </button>
              ) : null}
            </div>

            {indexLabel ? <p className="mono project-detail-modal-index">{indexLabel}</p> : null}

            <div className="project-detail-modal-toolbar-side project-detail-modal-toolbar-side-end">
              {hasNext ? (
                <button
                  type="button"
                  className="project-detail-modal-nav"
                  onClick={onNext}
                  aria-label={copy.next}
                >
                  {copy.next}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="project-detail-modal-sheet">
          <ProjectDetailPage
            key={project.slug}
            lang={lang}
            project={project}
            lastUpdated={lastUpdated}
            unlocked={unlocked}
            offerState={offerState}
            shareToken={shareToken}
            backLabel={copy.close}
            onBack={onClose}
          />
        </div>
      </div>
    </div>
  )
}
