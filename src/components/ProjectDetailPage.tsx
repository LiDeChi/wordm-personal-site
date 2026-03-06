import type { Lang } from '../i18n/lang'
import type { PortfolioProject } from '../types'
import { formatDate } from '../lib/projects'
import { withSiteParams } from '../lib/lang-url'

type ProjectDetailPageProps = {
  lang: Lang
  project: PortfolioProject
  lastUpdated: string
  unlocked: boolean
  canUseFreeUnlock: boolean
  unlockBusy: boolean
  statusMessage: string
  shareToken?: string | null
  onBack: () => void
  onUnlockSingle: (slug: string) => void
  onUnlockFree: (slug: string) => void
}

const COPY = {
  zh: {
    back: '返回作品集',
    overview: '项目概览',
    profile: '项目画像',
    commands: '运行命令',
    distribution: '分发与安装',
    install: '打开项目详情',
    source: '源码',
    production: '线上地址',
    orchestrationSource: '详情来自 orchestration deploy manifest',
    status: '状态',
    type: '类型',
    language: '语言',
    entry: '入口',
    packageName: '包/API',
    publisher: '发布者',
    trustMode: '信任模式',
    commandRun: '运行',
    commandTest: '测试',
    commandLint: '检查',
    commandBuild: '构建',
    commandDocs: '文档',
    distributionMode: '分发模式',
    verifyBeforeDeploy: '部署前校验',
    artifact: '制品',
    entrypoint: '入口脚本',
    installers: '安装器',
    actions: '推荐动作',
    yes: '是',
    no: '否',
    unlockSingle: '解锁此作品',
    freeUnlock: '免费解锁',
    freeUnlockUnavailable: '免费名额已用完',
    lockedHint: '查看详情不受限；进入实际项目页仍需要解锁。',
    updated: '快照更新',
  },
  en: {
    back: 'Back to portfolio',
    overview: 'Overview',
    profile: 'Project profile',
    commands: 'Commands',
    distribution: 'Distribution & install',
    install: 'Open project page',
    source: 'Source',
    production: 'Production',
    orchestrationSource: 'Detail source: orchestration deploy manifest',
    status: 'Status',
    type: 'Type',
    language: 'Language',
    entry: 'Entry',
    packageName: 'Package/API',
    publisher: 'Publisher',
    trustMode: 'Trust mode',
    commandRun: 'Run',
    commandTest: 'Test',
    commandLint: 'Lint',
    commandBuild: 'Build',
    commandDocs: 'Docs',
    distributionMode: 'Distribution mode',
    verifyBeforeDeploy: 'Verify before deploy',
    artifact: 'Artifact',
    entrypoint: 'Entrypoint',
    installers: 'Installers',
    actions: 'Recommended actions',
    yes: 'Yes',
    no: 'No',
    unlockSingle: 'Unlock this project',
    freeUnlock: 'Free unlock',
    freeUnlockUnavailable: 'No free unlock quota left',
    lockedHint: 'Reading the detail is open; entering the actual project page still requires unlock.',
    updated: 'Snapshot updated',
  },
} as const

function labelValue(value: string | null | undefined) {
  return value && value.trim() ? value : 'N/A'
}

export function ProjectDetailPage({
  lang,
  project,
  lastUpdated,
  unlocked,
  canUseFreeUnlock,
  unlockBusy,
  statusMessage,
  shareToken = null,
  onBack,
  onUnlockSingle,
  onUnlockFree,
}: ProjectDetailPageProps) {
  const copy = COPY[lang]
  const detail = project.detail
  const subdomainUrl = withSiteParams(project.subdomainUrl, { lang, shareToken })
  const commandRows = detail
    ? [
        { label: copy.commandRun, value: detail.commands.run },
        { label: copy.commandTest, value: detail.commands.test },
        { label: copy.commandLint, value: detail.commands.lint },
        { label: copy.commandBuild, value: detail.commands.build },
        { label: copy.commandDocs, value: detail.commands.docs },
      ]
    : []

  return (
    <section id="project-detail" className="project-detail-page">
      <div className="project-detail-head">
        <button type="button" className="unlock-plan-btn project-detail-back" onClick={onBack}>
          {copy.back}
        </button>
        <p className="mono project-detail-updated">{copy.updated}: {lastUpdated}</p>
      </div>

      <div className="paper-meta gallery-meta">
        <span>{formatDate(project.lastCommitAt)}</span>
        <span>{project.activityScore}</span>
        <span>{project.commitCount30d}</span>
      </div>
      <h2 className="project-detail-title">{project.name}</h2>
      <p className="meta project-detail-source">{copy.orchestrationSource}</p>

      <section className="abstract-block">
        <span className="abstract-label">{copy.overview}</span>
        <p>{project.summary}</p>
        {project.techStack.length ? <p><span className="mono">Tech:</span> {project.techStack.join(' · ')}</p> : null}
        {project.tags.length ? <p><span className="mono">Tags:</span> {project.tags.join(' · ')}</p> : null}
      </section>

      <section className="project-detail-section">
        <h3>{copy.profile}</h3>
        <div className="project-detail-grid">
          <div><span className="mono">{copy.status}</span><strong>{labelValue(detail?.status)}</strong></div>
          <div><span className="mono">{copy.type}</span><strong>{labelValue(detail?.type)}</strong></div>
          <div><span className="mono">{copy.language}</span><strong>{labelValue(detail?.language)}</strong></div>
          <div><span className="mono">{copy.entry}</span><strong>{labelValue(detail?.entry)}</strong></div>
          <div><span className="mono">{copy.packageName}</span><strong>{labelValue(detail?.apiOrPackage)}</strong></div>
          <div><span className="mono">{copy.publisher}</span><strong>{labelValue(detail?.publisherId)}</strong></div>
          <div><span className="mono">{copy.trustMode}</span><strong>{labelValue(detail?.trustMode)}</strong></div>
        </div>
      </section>

      {detail ? (
        <section className="project-detail-section">
          <h3>{copy.commands}</h3>
          <div className="project-detail-command-list">
            {commandRows.map((item) => (
              <div key={item.label} className="project-detail-command-row">
                <span className="mono">{item.label}</span>
                <code>{labelValue(item.value)}</code>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {detail ? (
        <section className="project-detail-section">
          <h3>{copy.distribution}</h3>
          <div className="project-detail-grid">
            <div><span className="mono">{copy.distributionMode}</span><strong>{labelValue(detail.distributionMode)}</strong></div>
            <div><span className="mono">{copy.verifyBeforeDeploy}</span><strong>{detail.verifyBeforeDeploy ? copy.yes : copy.no}</strong></div>
            <div><span className="mono">{copy.artifact}</span><strong>{labelValue(detail.artifactName)}</strong></div>
            <div><span className="mono">{copy.entrypoint}</span><strong>{labelValue(detail.executionEntrypoint)}</strong></div>
          </div>

          {detail.clickInstallers.length ? (
            <div className="project-detail-chip-list">
              {detail.clickInstallers.map((item) => (
                <span key={`${item.label}-${item.command}`} className="gallery-tag mono">
                  {item.label}: {item.command}
                </span>
              ))}
            </div>
          ) : null}

          {detail.recommendedActions.length ? (
            <div className="project-detail-command-list">
              {detail.recommendedActions.map((item) => (
                <div key={`${item.label}-${item.command}`} className="project-detail-command-row">
                  <span className="mono">{item.label}</span>
                  <code>{item.command}</code>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      <div className="paper-links project-detail-links">
        {unlocked ? (
          <a href={subdomainUrl} target="_blank" rel="noreferrer">
            {copy.install}
          </a>
        ) : null}
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

      {!unlocked ? (
        <section className="unlock-control-panel project-detail-unlock-panel">
          <p className="unlock-control-intro">{copy.lockedHint}</p>
          <div className="unlock-plan-actions">
            <button type="button" className="unlock-plan-btn" disabled={unlockBusy} onClick={() => onUnlockSingle(project.slug)}>
              {copy.unlockSingle}
            </button>
            <button type="button" className="unlock-plan-btn" disabled={!canUseFreeUnlock || unlockBusy} onClick={() => onUnlockFree(project.slug)}>
              {canUseFreeUnlock ? copy.freeUnlock : copy.freeUnlockUnavailable}
            </button>
          </div>
          {statusMessage ? <p className="unlock-status-message">{statusMessage}</p> : null}
        </section>
      ) : null}
    </section>
  )
}
