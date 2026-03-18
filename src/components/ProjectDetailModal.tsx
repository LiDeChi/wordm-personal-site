import type { Lang } from '../i18n/lang'
import type { ProjectOfferState, ProjectUnlockOptions } from '../lib/project-offers'
import type { PortfolioProject } from '../types'
import { ProjectDetailPage } from './ProjectDetailPage'

type ProjectDetailModalProps = {
  lang: Lang
  project: PortfolioProject
  lastUpdated: string
  unlocked: boolean
  offerState: ProjectOfferState
  unlockOptions: ProjectUnlockOptions
  unlockBusy: boolean
  statusMessage: string
  shareToken?: string | null
  indexLabel?: string | null
  hasPrevious: boolean
  hasNext: boolean
  onClose: () => void
  onPrevious: () => void
  onNext: () => void
  onUnlockSingle: (slug: string) => void
  onUnlockAllAccess: () => void
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
  unlockOptions,
  unlockBusy,
  statusMessage,
  shareToken = null,
  indexLabel = null,
  hasPrevious,
  hasNext,
  onClose,
  onPrevious,
  onNext,
  onUnlockSingle,
  onUnlockAllAccess,
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
        {hasPrevious ? (
          <button
            type="button"
            className="project-detail-modal-nav project-detail-modal-nav-prev"
            onClick={onPrevious}
            aria-label={copy.previous}
          >
            {copy.previous}
          </button>
        ) : null}

        {hasNext ? (
          <button
            type="button"
            className="project-detail-modal-nav project-detail-modal-nav-next"
            onClick={onNext}
            aria-label={copy.next}
          >
            {copy.next}
          </button>
        ) : null}

        <div className="project-detail-modal-sheet">
          {indexLabel ? <p className="mono project-detail-modal-index">{indexLabel}</p> : null}
          <ProjectDetailPage
            lang={lang}
            project={project}
            lastUpdated={lastUpdated}
            unlocked={unlocked}
            offerState={offerState}
            unlockOptions={unlockOptions}
            unlockBusy={unlockBusy}
            statusMessage={statusMessage}
            shareToken={shareToken}
            backLabel={copy.close}
            onBack={onClose}
            onUnlockSingle={onUnlockSingle}
            onUnlockAllAccess={onUnlockAllAccess}
          />
        </div>
      </div>
    </div>
  )
}
