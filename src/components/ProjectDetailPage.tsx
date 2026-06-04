import { useState } from 'react'
import type { Lang } from '../i18n/lang'
import type { PortfolioProject } from '../types'
import { formatDate } from '../lib/projects'
import { withSiteParams } from '../lib/lang-url'
import { getProjectPresentation } from '../data/projectPresentation'
import {
  getProjectDeployCommand,
  getProjectDeployDownloadSpec,
  getProjectDeployManifestUrl,
  triggerProjectDeployDownload,
} from '../lib/project-deploy'
import {
  formatProjectOfferCountdown,
  type ProjectOfferState,
} from '../lib/project-offers'

type ProjectDetailPageProps = {
  lang: Lang
  project: PortfolioProject
  lastUpdated: string
  unlocked: boolean
  offerState: ProjectOfferState
  shareToken?: string | null
  backLabel?: string
  onBack: () => void
}

const COPY = {
  zh: {
    back: '返回作品集',
    updated: '最近更新',
    worthSeeing: '为什么值得看',
    signals: '关键信号',
    preview: '项目预览',
    previewDetails: '更多界面细节',
    previewMissing: '暂无预览图',
    openProject: '打开项目页',
    openProjectFree: '打开公开版',
    openProjectFull: '打开完整体验',
    openLive: '打开线上版本',
    installNow: '一键安装',
    deployRemoteQuick: '远程部署',
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
    signalLocked: '公开版本',
    signalUnlocked: '完整体验',
    signalLive: '线上可访问',
    signalRunnable: '可本地运行',
    signalVerified: '带校验链路',
    signalDeployFree: '免费部署',
    availabilityProject: '项目页',
    availabilityLive: '线上',
    availabilityLocal: '本地运行',
    availabilityDeploy: '部署',
    offerCountdownPrefix: '限免剩余',
    deployTitle: '一键部署',
    deployIntro: '这里提供的是当前公开 deploy kit。现在可以直接下载当前系统安装器或远程部署脚本；下面保留原始命令作为备用。',
    deployNote: '当前公开自部署入口先发公共包。站内作品权限与自部署包版本还没有完全拆开。',
    deployMissing: '当前项目还没有公开 deploy kit。',
    deployLocalTitle: '当前机器',
    deployLocalBody: '点击就会下载当前系统安装器，下载后直接运行，不用自己抄命令。',
    deployRemoteTitle: '远程服务器',
    deployRemoteBody: '点击就会下载远程部署脚本。脚本运行时再填写服务器地址，然后通过 SSH 执行部署。',
    deployCommand: '备用命令',
    deployManifest: 'Manifest',
    deployDownloadLabel: (label: string) => `下载 ${label}`,
    deployDownloadLocalSuccess: (label: string) => `已开始下载 ${label}，下载后直接运行即可。`,
    deployDownloadRemoteSuccess: (label: string) => `已开始下载 ${label}，运行后填写服务器地址即可部署。`,
    deployDownloadFailed: '下载失败，请改用下面的备用命令。',
    deployRunHint: '安装后参考运行命令',
  },
  en: {
    back: 'Back to portfolio',
    updated: 'Updated',
    worthSeeing: 'Why this is worth seeing',
    signals: 'Useful signals',
    preview: 'Preview',
    previewDetails: 'More interface detail',
    previewMissing: 'No preview image',
    openProject: 'Open project page',
    openProjectFree: 'Open public edition',
    openProjectFull: 'Open full experience',
    openLive: 'Open live version',
    installNow: 'Install now',
    deployRemoteQuick: 'Remote deploy',
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
    signalLocked: 'Public edition',
    signalUnlocked: 'Full experience',
    signalLive: 'Live access',
    signalRunnable: 'Runs locally',
    signalVerified: 'Verification path',
    signalDeployFree: 'Free deploy',
    availabilityProject: 'Project page',
    availabilityLive: 'Live',
    availabilityLocal: 'Local run',
    availabilityDeploy: 'Deploy',
    offerCountdownPrefix: 'Free for',
    deployTitle: 'One-click deploy',
    deployIntro: 'This section exposes the current public deploy kit. You can download a local installer or a remote deploy script directly, with raw commands kept only as fallback.',
    deployNote: 'The public self-host package is shipped first. Site entitlement and self-host package tier are not fully split yet.',
    deployMissing: 'This project does not have a public deploy kit yet.',
    deployLocalTitle: 'Current machine',
    deployLocalBody: 'Click once to download an installer for this machine, then run it directly.',
    deployRemoteTitle: 'Remote server',
    deployRemoteBody: 'Click once to download a remote deploy script. The script will ask for user@host when it runs.',
    deployCommand: 'Fallback command',
    deployManifest: 'Manifest',
    deployDownloadLabel: (label: string) => `Download ${label}`,
    deployDownloadLocalSuccess: (label: string) => `${label} download started. Run it after the file arrives.`,
    deployDownloadRemoteSuccess: (label: string) => `${label} download started. Run it and enter the server address when prompted.`,
    deployDownloadFailed: 'Download failed. Use the fallback command below.',
    deployRunHint: 'Run hint after install',
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
  shareToken = null,
  backLabel,
  onBack,
}: ProjectDetailPageProps) {
  const copy = COPY[lang]
  const detail = project.detail
  const presentation = getProjectPresentation(project, lang)
  const [deployStatus, setDeployStatus] = useState('')
  const subdomainUrl = withSiteParams(project.subdomainUrl, { lang, shareToken })
  const formattedStatus = formatMappedValue(detail?.status, lang, STATUS_LABELS)
  const formattedType = formatMappedValue(detail?.type, lang, TYPE_LABELS)
  const formattedLanguage = formatLanguage(detail?.language)
  const lastProjectUpdated = formatDate(project.lastCommitAt)
  const headline = hasValue(presentation.tagline) ? presentation.tagline.trim() : hasValue(presentation.summary) ? presentation.summary.trim() : ''
  const summary = hasValue(presentation.summary) && presentation.summary.trim() !== headline ? presentation.summary.trim() : null
  const secondaryPreviewUrls = presentation.detailPreviewUrls.slice(1)
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
  const deployOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://wordm.us'
  const deployAvailable = Boolean(detail?.artifactName)
  const deployManifestUrl = deployAvailable ? getProjectDeployManifestUrl(project, deployOrigin) : null
  const localDeployCommand = deployAvailable ? getProjectDeployCommand(project, deployOrigin) : ''
  const remoteDeployCommand = deployAvailable
    ? getProjectDeployCommand(project, deployOrigin, { remoteHost: '<user@host>' })
    : ''
  const localDeployDownload = deployAvailable ? getProjectDeployDownloadSpec(project, deployOrigin, { target: 'local' }) : null
  const remoteDeployDownload = deployAvailable ? getProjectDeployDownloadSpec(project, deployOrigin, { target: 'remote' }) : null
  const offerCountdown = formatProjectOfferCountdown(offerState, lang)

  const heroSignals = uniq([
    deployAvailable ? copy.signalDeployFree : null,
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

  if (deployAvailable) {
    factCards.push({
      label: copy.deployTitle,
      value: `${copy.deployLocalTitle} · ${copy.deployRemoteTitle}`,
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

  function downloadDeployAsset(target: 'local' | 'remote') {
    const spec = target === 'local' ? localDeployDownload : remoteDeployDownload
    if (!spec) {
      return
    }

    try {
      triggerProjectDeployDownload(spec)
      setDeployStatus(
        target === 'local' ? copy.deployDownloadLocalSuccess(spec.label) : copy.deployDownloadRemoteSuccess(spec.label),
      )
    } catch {
      setDeployStatus(copy.deployDownloadFailed)
    }
  }

  return (
    <section id="project-detail" className="project-detail-page">
      <div className="project-detail-head">
        <button type="button" className="unlock-plan-btn project-detail-back" onClick={onBack}>
          {backLabel ?? copy.back}
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

          {actionLinks.length || deployAvailable ? (
            <div className="project-detail-action-list">
              {deployAvailable ? (
                <>
                  <button type="button" className="project-detail-action-link is-primary" onClick={() => downloadDeployAsset('local')}>
                    {copy.installNow}
                  </button>
                  <button type="button" className="project-detail-action-link" onClick={() => downloadDeployAsset('remote')}>
                    {copy.deployRemoteQuick}
                  </button>
                </>
              ) : null}
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
          {deployStatus ? <p className="project-detail-action-status">{deployStatus}</p> : null}
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
          {secondaryPreviewUrls.length ? (
            <div className="project-detail-preview-strip">
              <span className="project-detail-preview-strip-label mono">{copy.previewDetails}</span>
              <div className="project-detail-preview-grid">
                {secondaryPreviewUrls.slice(0, 2).map((imageUrl, index) => (
                  <div key={imageUrl} className="project-detail-preview-thumb">
                    <img src={imageUrl} alt={`${presentation.name} preview ${index + 2}`} loading="lazy" />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
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

      <section id="project-detail-deploy" className="project-detail-section project-detail-deploy-section">
        <div className="project-detail-section-head">
          <h3>{copy.deployTitle}</h3>
          {deployManifestUrl ? (
            <a className="deploy-link-btn mono" href={deployManifestUrl} target="_blank" rel="noreferrer">
              {copy.deployManifest}
            </a>
          ) : null}
        </div>

        {deployAvailable ? (
          <>
            <p className="project-detail-deploy-intro">{copy.deployIntro}</p>
            <div className="deploy-form-grid project-detail-deploy-grid">
              <article className="project-detail-story-card project-detail-deploy-card">
                <span className="mono project-detail-story-label">{copy.deployLocalTitle}</span>
                <p>{copy.deployLocalBody}</p>
                <span className="mono project-detail-deploy-label">{copy.deployCommand}</span>
                <div className="deploy-command-block">{localDeployCommand}</div>
                <div className="unlock-plan-actions">
                  <button type="button" className="unlock-plan-btn" onClick={() => downloadDeployAsset('local')}>
                    {copy.deployDownloadLabel(localDeployDownload?.label ?? copy.installNow)}
                  </button>
                </div>
              </article>

              <article className="project-detail-story-card project-detail-deploy-card">
                <span className="mono project-detail-story-label">{copy.deployRemoteTitle}</span>
                <p>{copy.deployRemoteBody}</p>
                <span className="mono project-detail-deploy-label">{copy.deployCommand}</span>
                <div className="deploy-command-block">{remoteDeployCommand}</div>
                <div className="unlock-plan-actions">
                  <button type="button" className="unlock-plan-btn" onClick={() => downloadDeployAsset('remote')}>
                    {copy.deployDownloadLabel(remoteDeployDownload?.label ?? copy.deployRemoteQuick)}
                  </button>
                </div>
              </article>
            </div>

            <p className="unlock-status-message">
              {copy.deployNote}
              {hasRun ? ` · ${copy.deployRunHint}: ${detail?.commands.run}` : ''}
            </p>
          </>
        ) : (
          <p className="project-detail-deploy-intro">{copy.deployMissing}</p>
        )}
      </section>
    </section>
  )
}
