import type { Lang } from '../i18n/lang'
import type { PortfolioProject } from '../types'
import { formatDate } from '../lib/projects'
import { withSiteParams } from '../lib/lang-url'
import { getProjectPresentation } from '../data/projectPresentation'
import {
  formatUnlockActionLabel,
  formatProjectOfferCountdown,
  formatProjectOfferLabel,
  type ProjectOfferState,
  type ProjectUnlockOptions,
} from '../lib/project-offers'

type ProjectDetailPageProps = {
  lang: Lang
  project: PortfolioProject
  lastUpdated: string
  unlocked: boolean
  offerState: ProjectOfferState
  unlockOptions: ProjectUnlockOptions
  unlockBusy: boolean
  statusMessage: string
  shareToken?: string | null
  onBack: () => void
  onUnlockSingle: (slug: string) => void
  onUnlockAllAccess: () => void
}

const COPY = {
  zh: {
    back: '返回作品集',
    updated: '最近更新',
    worthSeeing: '为什么值得看',
    signals: '关键信号',
    preview: '项目预览',
    previewMissing: '暂无预览图',
    openProject: '打开项目页',
    openProjectFree: '打开免费版',
    openProjectFull: '打开完整版',
    openLive: '打开线上版本',
    experienceTitle: '先从哪里看',
    progressTitle: '现在做到哪一步',
    angleTitle: '适合怎么理解',
    experienceLive: '它已经有线上入口，先直接看真实界面和交互，比看字段更有效。',
    experienceProject: '它有独立项目页，适合先看界面、说明和入口，再决定是否深入。',
    experienceLocal: '虽然没有公共线上入口，但已经给出了明确的运行或安装方式，不只是概念稿。',
    experienceDetail: '目前更适合先从这个详情页理解方向，再决定要不要继续点进去。',
    progressReady: '状态已经收敛到可展示，而不是只停留在想法层。',
    progressPipeline: '同时还有构建、测试或发布前校验链路，完成度比普通 demo 更高。',
    progressActive: (count: number) => `近 30 天还有 ${count} 次提交，说明它还在被认真维护。`,
    progressFallback: '它更像是做完一轮打磨的作品，而不是只摆一个空壳页面。',
    angleFocus: (focus: string) => `它的重点不是堆参数，而是把 ${focus} 做成一个能被直接理解的作品。`,
    angleRelation: (count: number) => `它还连着 ${count} 个相关条目，说明不是孤立样品。`,
    angleFallback: '这个页面应该帮你快速判断值不值得点进去，而不是把内部字段整页摊开。',
    recentCommits: '近 30 天更新',
    access: '可用入口',
    installers: '安装支持',
    delivery: '交付信号',
    focus: '重心',
    commitsValue: (count: number) => `${count} 次提交`,
    deliveryVerified: '部署前校验',
    deliveryRunnable: '可本地运行',
    deliveryBuild: '可构建',
    deliveryTest: '可测试',
    signalReady: '可展示',
    signalLocked: '当前免费版',
    signalUnlocked: '已升级完整版',
    signalLive: '线上可访问',
    signalRunnable: '可本地运行',
    signalVerified: '带校验链路',
    signalOfferPrefix: '升级方式',
    availabilityProject: '项目页',
    availabilityLive: '线上',
    availabilityLocal: '本地运行',
    unlockSingle: '解锁此作品',
    unlockAllAccess: '全部解锁，后续作品免费',
    offerCountdownPrefix: '限免剩余',
    lockedHint: '现在打开的是免费版。登录并升级后，可切到完整版并使用付费部分。',
    lockedHintUnavailable: '当前先开放免费版；完整版升级入口会后续补上。',
  },
  en: {
    back: 'Back to portfolio',
    updated: 'Updated',
    worthSeeing: 'Why this is worth seeing',
    signals: 'Useful signals',
    preview: 'Preview',
    previewMissing: 'No preview image',
    openProject: 'Open project page',
    openProjectFree: 'Open free edition',
    openProjectFull: 'Open full edition',
    openLive: 'Open live version',
    experienceTitle: 'Start here',
    progressTitle: 'How far it goes',
    angleTitle: 'Best lens',
    experienceLive: 'There is already a live entry point, so start with the real UI instead of a field dump.',
    experienceProject: 'It has a dedicated project page, which is a better first stop than raw metadata.',
    experienceLocal: 'There is no public live link, but it already has a clear local run or install path.',
    experienceDetail: 'This detail page should help you decide whether the project is worth opening next.',
    progressReady: 'It has already converged into something presentable, not just an idea stub.',
    progressPipeline: 'It also has build, test, or pre-deploy verification signals, which puts it above a throwaway demo.',
    progressActive: (count: number) => `${count} commits in the last 30 days suggest it is still being maintained.`,
    progressFallback: 'It reads more like a worked piece than a shell built only for display.',
    angleFocus: (focus: string) => `The value here is not raw metadata. It is how ${focus} turns into something legible and usable.`,
    angleRelation: (count: number) => `It also connects to ${count} related entries, so it is not standing alone as a sample.`,
    angleFallback: 'This page should help you decide fast, instead of spreading internal manifest fields across the whole screen.',
    recentCommits: 'Last 30 days',
    access: 'Ways in',
    installers: 'Install support',
    delivery: 'Delivery signals',
    focus: 'Focus',
    commitsValue: (count: number) => `${count} commits`,
    deliveryVerified: 'Pre-deploy verification',
    deliveryRunnable: 'Runnable locally',
    deliveryBuild: 'Build path',
    deliveryTest: 'Tests available',
    signalReady: 'Ready',
    signalLocked: 'Free edition',
    signalUnlocked: 'Full edition unlocked',
    signalLive: 'Live access',
    signalRunnable: 'Runs locally',
    signalVerified: 'Verification path',
    signalOfferPrefix: 'Upgrade path',
    availabilityProject: 'Project page',
    availabilityLive: 'Live',
    availabilityLocal: 'Local run',
    unlockSingle: 'Unlock this project',
    unlockAllAccess: 'Unlock all projects, future projects included',
    offerCountdownPrefix: 'Free for',
    lockedHint: 'The project page opens in free edition by default. Sign in and upgrade to switch to the full edition and paid modules.',
    lockedHintUnavailable: 'The free edition stays open for now. Full-edition upgrade controls will be added later.',
  },
} as const

const TYPE_LABELS = {
  app: { zh: '应用项目', en: 'App' },
  library: { zh: '库 / 工具', en: 'Library / Tooling' },
  package: { zh: '包 / SDK', en: 'Package / SDK' },
  docs: { zh: '文档型项目', en: 'Docs project' },
  content: { zh: '内容型项目', en: 'Content project' },
} as const

const STATUS_LABELS = {
  ready: { zh: '可展示', en: 'Ready' },
  active: { zh: '持续推进中', en: 'Active' },
  beta: { zh: 'Beta', en: 'Beta' },
  draft: { zh: '实验中', en: 'Experimental' },
} as const

const LANGUAGE_LABELS = {
  js: 'JavaScript',
  ts: 'TypeScript',
  py: 'Python',
  swift: 'Swift',
  go: 'Go',
  rust: 'Rust',
} as const

const INSTALLER_LABELS = {
  mac: { zh: 'Mac', en: 'Mac' },
  linux: { zh: 'Linux', en: 'Linux' },
  windows_powershell: { zh: 'Windows', en: 'Windows' },
  windows_cmd: { zh: 'Windows', en: 'Windows' },
  cross_platform: { zh: '跨平台', en: 'Cross-platform' },
} as const

function hasValue(value: string | null | undefined): value is string {
  if (!value) {
    return false
  }

  const normalized = value.trim()
  if (!normalized) {
    return false
  }

  return normalized.toUpperCase() !== 'N/A'
}

function uniq(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))]
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

function formatMappedValue(
  value: string | null | undefined,
  lang: Lang,
  mapping: Record<string, { zh: string; en: string }>,
): string | null {
  if (!hasValue(value)) {
    return null
  }

  const normalized = value.trim().toLowerCase()
  return mapping[normalized]?.[lang] ?? value.trim()
}

function formatLanguage(value: string | null | undefined): string | null {
  if (!hasValue(value)) {
    return null
  }

  const normalized = value.trim().toLowerCase()
  return LANGUAGE_LABELS[normalized as keyof typeof LANGUAGE_LABELS] ?? value.trim()
}

function formatInstaller(value: string, lang: Lang): string {
  return INSTALLER_LABELS[value as keyof typeof INSTALLER_LABELS]?.[lang] ?? value.replaceAll('_', ' ')
}

export function ProjectDetailPage({
  lang,
  project,
  lastUpdated,
  unlocked,
  offerState,
  unlockOptions,
  unlockBusy,
  statusMessage,
  shareToken = null,
  onBack,
  onUnlockSingle,
  onUnlockAllAccess,
}: ProjectDetailPageProps) {
  const copy = COPY[lang]
  const detail = project.detail
  const presentation = getProjectPresentation(project, lang)
  const subdomainUrl = withSiteParams(project.subdomainUrl, { lang, shareToken })
  const formattedStatus = formatMappedValue(detail?.status, lang, STATUS_LABELS)
  const formattedType = formatMappedValue(detail?.type, lang, TYPE_LABELS)
  const formattedLanguage = formatLanguage(detail?.language)
  const lastProjectUpdated = formatDate(project.lastCommitAt)
  const headline = hasValue(presentation.tagline) ? presentation.tagline.trim() : hasValue(presentation.summary) ? presentation.summary.trim() : ''
  const summary = hasValue(presentation.summary) && presentation.summary.trim() !== headline ? presentation.summary.trim() : null
  const techFocus = project.techStack.length
    ? project.techStack.slice(0, 4).join(' / ')
    : uniq([formattedType, formattedLanguage]).join(' / ') || null
  const hasRun = hasValue(detail?.commands.run)
  const hasTest = hasValue(detail?.commands.test)
  const hasBuild = hasValue(detail?.commands.build)
  const installerLabels = uniq(
    (detail?.clickInstallers ?? [])
      .filter((item) => item.label !== 'trust_once')
      .map((item) => formatInstaller(item.label, lang)),
  )
  const offerLabel = formatProjectOfferLabel(offerState, lang)
  const offerCountdown = formatProjectOfferCountdown(offerState, lang)
  const offerSignal = `${copy.signalOfferPrefix}: ${offerLabel}`
  const singleUnlockLabel = unlockOptions.singleEnabled
    ? formatUnlockActionLabel(copy.unlockSingle, unlockOptions.singlePriceLabel)
    : null
  const allAccessUnlockLabel = unlockOptions.allAccessEnabled
    ? formatUnlockActionLabel(copy.unlockAllAccess, unlockOptions.allAccessPriceLabel)
    : null

  const heroSignals = uniq([
    offerSignal,
    offerCountdown ? `${copy.offerCountdownPrefix} ${offerCountdown}` : null,
    formattedStatus ?? (detail?.status === 'ready' ? copy.signalReady : null),
    formattedType,
    formattedLanguage,
    project.productionUrl ? copy.signalLive : null,
    hasRun ? copy.signalRunnable : null,
    detail?.verifyBeforeDeploy ? copy.signalVerified : null,
    unlocked ? copy.signalUnlocked : copy.signalLocked,
  ]).slice(0, 6)

  const actionLinks: Array<{ label: string; shortLabel: string; href: string; primary: boolean }> = []
  actionLinks.push({
    label: unlocked ? copy.openProjectFull : copy.openProjectFree,
    shortLabel: copy.availabilityProject,
    href: subdomainUrl,
    primary: !project.productionUrl,
  })
  if (project.productionUrl) {
    actionLinks.push({
      label: copy.openLive,
      shortLabel: copy.availabilityLive,
      href: project.productionUrl,
      primary: true,
    })
  }

  const progressParts = [
    detail?.status === 'ready' ? copy.progressReady : null,
    hasBuild || hasTest || detail?.verifyBeforeDeploy ? copy.progressPipeline : null,
    project.commitCount30d > 0 ? copy.progressActive(project.commitCount30d) : null,
  ].filter((item): item is string => Boolean(item))

  const angleParts = [
    techFocus ? copy.angleFocus(techFocus) : null,
    project.relationCount > 0 ? copy.angleRelation(project.relationCount) : null,
  ].filter((item): item is string => Boolean(item))

  const storyCards = [
    {
      title: copy.experienceTitle,
      body: project.productionUrl
        ? copy.experienceLive
        : unlocked
          ? copy.experienceProject
          : hasRun || installerLabels.length
            ? copy.experienceLocal
            : copy.experienceDetail,
    },
    {
      title: copy.progressTitle,
      body: progressParts.length ? progressParts.slice(0, 2).join(' ') : copy.progressFallback,
    },
    {
      title: copy.angleTitle,
      body: angleParts.length ? angleParts.slice(0, 2).join(' ') : copy.angleFallback,
    },
  ]

  const factCards: Array<{ label: string; value: string }> = [
    {
      label: copy.updated,
      value: lastProjectUpdated !== 'N/A' ? lastProjectUpdated : lastUpdated,
    },
  ]

  if (project.commitCount30d > 0) {
    factCards.push({
      label: copy.recentCommits,
      value: copy.commitsValue(project.commitCount30d),
    })
  }

  if (actionLinks.length) {
    factCards.push({
      label: copy.access,
      value: actionLinks.map((item) => item.shortLabel).join(' · '),
    })
  } else if (hasRun) {
    factCards.push({
      label: copy.access,
      value: copy.availabilityLocal,
    })
  }

  if (installerLabels.length) {
    factCards.push({
      label: copy.installers,
      value: installerLabels.join(' · '),
    })
  }

  const deliverySignals = uniq([
    hasRun ? copy.deliveryRunnable : null,
    hasBuild ? copy.deliveryBuild : null,
    hasTest ? copy.deliveryTest : null,
    detail?.verifyBeforeDeploy ? copy.deliveryVerified : null,
  ])

  if (deliverySignals.length) {
    factCards.push({
      label: copy.delivery,
      value: deliverySignals.join(' · '),
    })
  }

  if (techFocus) {
    factCards.push({
      label: copy.focus,
      value: techFocus,
    })
  }

  return (
    <section id="project-detail" className="project-detail-page">
      <div className="project-detail-head">
        <button type="button" className="unlock-plan-btn project-detail-back" onClick={onBack}>
          {copy.back}
        </button>
        <p className="mono project-detail-updated">
          {copy.updated}: {lastProjectUpdated !== 'N/A' ? lastProjectUpdated : lastUpdated}
        </p>
      </div>

      <section className="project-detail-hero">
        <div className="project-detail-hero-copy">
          {heroSignals.length ? (
            <div className="project-detail-signal-strip">
              {heroSignals.map((item) => (
                <span key={item} className="project-detail-pill mono">
                  {item}
                </span>
              ))}
            </div>
          ) : null}

          <h2 className="project-detail-title">{presentation.name}</h2>
          {headline ? <p className="project-detail-deck">{headline}</p> : null}
          {summary ? <p className="project-detail-summary">{summary}</p> : null}

          {actionLinks.length ? (
            <div className="project-detail-action-list">
              {actionLinks.map((item) => (
                <a
                  key={`${item.label}-${item.href}`}
                  className={`project-detail-action-link ${item.primary ? 'is-primary' : ''}`}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {item.label}
                </a>
              ))}
            </div>
          ) : null}

          {!unlocked ? (
            <section className="unlock-control-panel project-detail-unlock-panel">
              <p className="unlock-control-intro">{singleUnlockLabel || allAccessUnlockLabel ? copy.lockedHint : copy.lockedHintUnavailable}</p>
              <div className="unlock-plan-actions">
                {singleUnlockLabel ? (
                  <button type="button" className="unlock-plan-btn" disabled={unlockBusy} onClick={() => onUnlockSingle(project.slug)}>
                    {singleUnlockLabel}
                  </button>
                ) : null}
                {allAccessUnlockLabel ? (
                  <button type="button" className="unlock-plan-btn" disabled={unlockBusy} onClick={onUnlockAllAccess}>
                    {allAccessUnlockLabel}
                  </button>
                ) : null}
              </div>
              {statusMessage ? <p className="unlock-status-message">{statusMessage}</p> : null}
            </section>
          ) : null}
        </div>

        <div className="project-detail-visual">
          <span className="project-detail-visual-label mono">{copy.preview}</span>
          <div className="project-detail-visual-frame">
            {presentation.thumbnailUrl ? (
              <img className="project-detail-visual-image" src={presentation.thumbnailUrl} alt={presentation.name} loading="lazy" />
            ) : (
              <div className="project-detail-visual-placeholder">
                <span>{initials(presentation.name) || copy.previewMissing}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="project-detail-section">
        <h3>{copy.worthSeeing}</h3>
        <div className="project-detail-story-grid">
          {storyCards.map((item) => (
            <article key={item.title} className="project-detail-story-card">
              <span className="mono project-detail-story-label">{item.title}</span>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      {factCards.length ? (
        <section className="project-detail-section">
          <h3>{copy.signals}</h3>
          <div className="project-detail-fact-grid">
            {factCards.map((item) => (
              <div key={`${item.label}-${item.value}`} className="project-detail-fact-card">
                <span className="mono">{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  )
}
