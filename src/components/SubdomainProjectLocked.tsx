import { AuthPanel, type AuthPanelProps } from './AuthPanel'
import type { PortfolioProject } from '../types'
import type { Lang } from '../i18n/lang'
import type { AuthRole } from '../lib/auth'
import { roleLabel } from '../i18n/roles'
import { withSiteParams } from '../lib/lang-url'
import { formatUnlockActionLabel, type ProjectUnlockOptions } from '../lib/project-offers'

type SubdomainProjectLockedProps = {
  lang: Lang
  role: AuthRole
  project: PortfolioProject
  statusMessage: string
  unlockOptions: ProjectUnlockOptions
  unlockBusy: boolean
  shareToken?: string | null
  authPanel: Omit<AuthPanelProps, 'className'>
  onUnlockSingle: (projectSlug: string) => void
  onUnlockAllAccess: () => void
}

const LOCKED_COPY = {
  zh: {
    title: '项目尚未解锁',
    rolePrefix: '当前身份',
    description: '该作品需要先解锁后才能打开子域名和一键安装。',
    plansHint: '可选方式：单独解锁这个作品，或者一次性全部解锁，后续作品也免费。',
    plansUnavailable: '这个作品当前不开放线上解锁，请先回作品集查看公开内容。',
    unlockSingle: '解锁此作品',
    unlockAllAccess: '全部解锁',
    goPortfolio: '去作品集解锁',
  },
  en: {
    title: 'Project Locked',
    rolePrefix: 'Current role',
    description: 'You need to unlock this project before opening its subdomain and one-click install flow.',
    plansHint: 'Available paths: unlock only this project, or unlock everything and keep future projects included.',
    plansUnavailable: 'This project is not open for online unlock right now. Go back to the portfolio for public entries first.',
    unlockSingle: 'Unlock this project',
    unlockAllAccess: 'Unlock all',
    goPortfolio: 'Go to portfolio unlock',
  },
} as const

export function SubdomainProjectLocked({
  lang,
  role,
  project,
  statusMessage,
  unlockOptions,
  unlockBusy,
  shareToken = null,
  authPanel,
  onUnlockSingle,
  onUnlockAllAccess,
}: SubdomainProjectLockedProps) {
  const copy = LOCKED_COPY[lang]
  const portfolioUrl = withSiteParams(`https://wordm.us?view=portfolio&unlock=${encodeURIComponent(project.slug)}`, {
    lang,
    shareToken,
  })
  const singleUnlockLabel = unlockOptions.singleEnabled
    ? formatUnlockActionLabel(copy.unlockSingle, unlockOptions.singlePriceLabel)
    : null
  const allAccessUnlockLabel = unlockOptions.allAccessEnabled
    ? formatUnlockActionLabel(copy.unlockAllAccess, unlockOptions.allAccessPriceLabel)
    : null

  return (
    <div className="subdomain-page">
      <main className="subdomain-main">
        <p className="mono subdomain-tag">{project.subdomain}.wordm.us</p>
        <h1>{copy.title}</h1>
        <p className="meta">
          {copy.rolePrefix}: {roleLabel(role, lang)}
        </p>
        <p>{copy.description}</p>
        <p className="meta">{singleUnlockLabel || allAccessUnlockLabel ? copy.plansHint : copy.plansUnavailable}</p>

        <div className="subdomain-unlock-panel">
          {singleUnlockLabel ? (
            <button
              type="button"
              className="auth-primary-btn"
              disabled={unlockBusy}
              onClick={() => onUnlockSingle(project.slug)}
            >
              {singleUnlockLabel}
            </button>
          ) : null}
          {allAccessUnlockLabel ? (
            <button type="button" className="auth-primary-btn" disabled={unlockBusy} onClick={onUnlockAllAccess}>
              {allAccessUnlockLabel}
            </button>
          ) : null}
          {statusMessage ? <p className="auth-status subdomain-inline-status">{statusMessage}</p> : null}
        </div>

        <AuthPanel {...authPanel} className="subdomain-auth" />

        <footer className="subdomain-footer">
          <div>
            <a href={portfolioUrl} target="_blank" rel="noreferrer">
              {copy.goPortfolio}
            </a>
          </div>
        </footer>
      </main>
    </div>
  )
}
