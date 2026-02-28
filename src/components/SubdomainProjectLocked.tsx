import { AuthPanel, type AuthPanelProps } from './AuthPanel'
import type { PortfolioProject } from '../types'
import type { Lang } from '../i18n/lang'
import type { AuthRole } from '../lib/auth'
import { roleLabel } from '../i18n/roles'
import { withLangParam } from '../lib/lang-url'

type SubdomainProjectLockedProps = {
  lang: Lang
  role: AuthRole
  project: PortfolioProject
  statusMessage: string
  canUseFreeUnlock: boolean
  unlockBusy: boolean
  freeRemaining: number
  authPanel: Omit<AuthPanelProps, 'className'>
  onUnlockSingle: (projectSlug: string) => void
  onUnlockFree: (projectSlug: string) => void
}

const LOCKED_COPY = {
  zh: {
    title: '项目尚未解锁',
    rolePrefix: '当前身份',
    description: '该作品需要先解锁后才能打开子域名和一键安装。',
    plansHint: '可选方式：单作品解锁 / 当前全部作品 / 当前作品+一年内新作品。',
    unlockSingle: '解锁此作品',
    freeUnlock: '使用免费解锁',
    freeEmpty: '免费额度已用完',
    freeRemaining: '免费额度剩余',
    goPortfolio: '去作品集解锁',
  },
  en: {
    title: 'Project Locked',
    rolePrefix: 'Current role',
    description: 'You need to unlock this project before opening its subdomain and one-click install flow.',
    plansHint: 'Available plans: single project / all current projects / current projects + one year of new projects.',
    unlockSingle: 'Unlock this project',
    freeUnlock: 'Use free unlock',
    freeEmpty: 'No free unlock quota left',
    freeRemaining: 'Free quota left',
    goPortfolio: 'Go to portfolio unlock',
  },
} as const

export function SubdomainProjectLocked({
  lang,
  role,
  project,
  statusMessage,
  canUseFreeUnlock,
  unlockBusy,
  freeRemaining,
  authPanel,
  onUnlockSingle,
  onUnlockFree,
}: SubdomainProjectLockedProps) {
  const copy = LOCKED_COPY[lang]
  const portfolioUrl = withLangParam(`https://wordm.us?view=portfolio&unlock=${encodeURIComponent(project.slug)}`, lang)

  return (
    <div className="subdomain-page">
      <main className="subdomain-main">
        <p className="mono subdomain-tag">{project.subdomain}.wordm.us</p>
        <h1>{copy.title}</h1>
        <p className="meta">
          {copy.rolePrefix}: {roleLabel(role, lang)}
        </p>
        <p>{copy.description}</p>
        <p className="meta">{copy.plansHint}</p>

        <div className="subdomain-unlock-panel">
          <button
            type="button"
            className="auth-primary-btn"
            disabled={unlockBusy}
            onClick={() => onUnlockSingle(project.slug)}
          >
            {copy.unlockSingle}
          </button>
          <button
            type="button"
            className="auth-primary-btn subdomain-unlock-free"
            disabled={!canUseFreeUnlock || unlockBusy}
            onClick={() => onUnlockFree(project.slug)}
          >
            {canUseFreeUnlock ? copy.freeUnlock : copy.freeEmpty}
          </button>
          <p className="subdomain-inline-status">
            {copy.freeRemaining}: {freeRemaining}
          </p>
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
