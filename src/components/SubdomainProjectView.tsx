import { AuthPanel, type AuthPanelProps } from './AuthPanel'
import { getProjectPresentation } from '../data/projectPresentation'
import type { PortfolioProject } from '../types'
import { formatDate } from '../lib/projects'
import type { Lang } from '../i18n/lang'
import { withSiteParams } from '../lib/lang-url'
import {
  formatProjectOfferLabel,
  formatUnlockActionLabel,
  type ProjectOfferState,
  type ProjectUnlockOptions,
} from '../lib/project-offers'

type SubdomainProjectViewProps = {
  lang: Lang
  project: PortfolioProject
  lastUpdated: string
  shareToken?: string | null
  authPanel: Omit<AuthPanelProps, 'className'>
  paidAccess: boolean
  offerState: ProjectOfferState
  unlockOptions: ProjectUnlockOptions
  unlockBusy: boolean
  statusMessage: string
  onUnlockSingle: (projectSlug: string) => void
  onUnlockAllAccess: () => void
}

const SUBDOMAIN_COPY = {
  zh: {
    lastCommit: '最近提交',
    activity: '活跃度',
    techStack: '技术栈',
    production: '线上地址',
    backHome: '返回主页',
    backDetail: '查看详情',
    footerLeft: '项目展示子域名',
    updated: '最近更新',
    edition: '当前版本',
    editionFree: '免费版',
    editionFull: '完整版',
    upgradePath: '升级路径',
    freeIntro: '当前打开的是免费版。没登录或还没升级时，自部署拿到的也是免费版。',
    fullIntro: '当前账号已拿到完整版权限；从这里继续打开或部署，会保留付费部分。',
    upgradeHint: '想切到完整版，可以单独升级这个作品，或者直接全部升级。',
    upgradeUnavailable: '当前先开放免费版；完整版升级入口会后续补上。',
    unlockSingle: '升级这个作品',
    unlockAllAccess: '升级全部作品',
  },
  en: {
    lastCommit: 'Last Commit',
    activity: 'Activity',
    techStack: 'Tech Stack',
    production: 'Production',
    backHome: 'Back to Home',
    backDetail: 'View detail',
    footerLeft: 'Project showcase subdomain',
    updated: 'Updated',
    edition: 'Current edition',
    editionFree: 'Free edition',
    editionFull: 'Full edition',
    upgradePath: 'Upgrade path',
    freeIntro: 'You are opening the free edition right now. If you are not signed in or not upgraded yet, self-host deploy will also use the free edition.',
    fullIntro: 'This account already has full-edition access. Opening or deploying from here keeps the paid modules enabled.',
    upgradeHint: 'Switch to the full edition by upgrading this project or unlocking all projects.',
    upgradeUnavailable: 'The free edition is open for now. Full-edition upgrade controls will be added later.',
    unlockSingle: 'Upgrade this project',
    unlockAllAccess: 'Upgrade all projects',
  },
} as const

export function SubdomainProjectView({
  lang,
  project,
  lastUpdated,
  shareToken = null,
  authPanel,
  paidAccess,
  offerState,
  unlockOptions,
  unlockBusy,
  statusMessage,
  onUnlockSingle,
  onUnlockAllAccess,
}: SubdomainProjectViewProps) {
  const copy = SUBDOMAIN_COPY[lang]
  const presentation = getProjectPresentation(project, lang)
  const homeUrl = withSiteParams('https://wordm.us', { lang, shareToken })
  const detailUrl = withSiteParams(`https://wordm.us?view=portfolio&project=${encodeURIComponent(project.slug)}`, { lang, shareToken })
  const offerLabel = formatProjectOfferLabel(offerState, lang)
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
        <h1>{presentation.name}</h1>
        <p className="meta">
          {copy.lastCommit}: {formatDate(project.lastCommitAt)} · {copy.activity}: {project.activityScore}
        </p>
        <div className="subdomain-unlock-panel">
          <p className="auth-status subdomain-inline-status">
            {copy.edition}: {paidAccess ? copy.editionFull : copy.editionFree} · {copy.upgradePath}: {offerLabel}
          </p>
        </div>
        <AuthPanel {...authPanel} className="subdomain-auth" />
        <p>{paidAccess ? copy.fullIntro : copy.freeIntro}</p>
        <p>{presentation.summary}</p>

        {project.techStack.length ? (
          <div className="abstract-block">
            <span className="abstract-label">{copy.techStack}</span>
            <p>{project.techStack.join(' · ')}</p>
          </div>
        ) : null}

        {!paidAccess ? (
          <div className="subdomain-unlock-panel">
            <p className="auth-status subdomain-inline-status">
              {singleUnlockLabel || allAccessUnlockLabel ? copy.upgradeHint : copy.upgradeUnavailable}
            </p>
            {singleUnlockLabel ? (
              <button type="button" className="auth-primary-btn" disabled={unlockBusy} onClick={() => onUnlockSingle(project.slug)}>
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
        ) : null}

        <div className="paper-links">
          {project.productionUrl ? (
            <a href={project.productionUrl} target="_blank" rel="noreferrer">
              {copy.production}
            </a>
          ) : null}
          <a href={detailUrl} target="_blank" rel="noreferrer">
            {copy.backDetail}
          </a>
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
