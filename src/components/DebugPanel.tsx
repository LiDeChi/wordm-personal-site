import type { PortfolioProject } from '../types'
import type { Lang } from '../i18n/lang'
import type { ShareLinkRecord, ShareScope } from '../lib/share-links'

type ShareFlagKey = 'allowPortfolio' | 'allowBlog' | 'allowDeploy' | 'allowResume' | 'allowAllProjects'

type DebugPanelProps = {
  lang: Lang
  allProjects: PortfolioProject[]
  selectedSlugs: string[]
  centerApi: string
  sourceLabel: string
  loadState: 'idle' | 'loading' | 'error'
  errorMessage: string
  canManageShares: boolean
  shareBusy: boolean
  shareStatusMessage: string
  shareLabel: string
  shareExpiresInDays: string
  shareScope: ShareScope
  shareLinks: ShareLinkRecord[]
  lastCreatedShareUrl: string
  onCenterApiChange: (value: string) => void
  onLoadLive: () => void
  onToggleProject: (slug: string) => void
  onSelectFeatured: () => void
  onSelectAll: () => void
  onShareLabelChange: (value: string) => void
  onShareExpiresInDaysChange: (value: string) => void
  onToggleShareFlag: (key: ShareFlagKey) => void
  onCreateShareLink: () => void
  onCopyLastShareLink: () => void
  onRevokeShareLink: (shareLinkId: string) => void
}

const DEBUG_COPY = {
  zh: {
    title: 'Debug 模式 / 展示控制',
    source: '当前数据源',
    resetDefault: '还原默认展示',
    selectAll: '展示全部项目',
    liveApi: '实时 API',
    loading: '加载中...',
    loadLive: '拉取实时项目',
    shareTitle: '免登录分享链接',
    shareLabel: '链接备注',
    shareLabelPlaceholder: '例如：给张三 3 天完整体验',
    shareDays: '有效天数',
    shareCurrentSelection: '仅分享当前勾选项目',
    shareCreate: '生成分享链接',
    shareCopyLatest: '复制最新链接',
    shareNoLatest: '还没有新生成的链接',
    shareListTitle: '已生成链接',
    shareEmpty: '暂无分享链接',
    shareRevoke: '撤销',
    shareScopePortfolio: '作品集',
    shareScopeBlog: '博客',
    shareScopeDeploy: '部署页',
    shareScopeResume: '简历页',
    shareScopeAllProjects: '全部项目子域',
    shareScopeSelectedProjects: '当前勾选项目',
    shareCreatedAt: '创建',
    shareExpiresAt: '到期',
    shareStatusActive: '生效中',
    shareStatusRevoked: '已撤销',
    shareStatusExpired: '已过期',
  },
  en: {
    title: 'Debug Mode / Showcase Control',
    source: 'Current source',
    resetDefault: 'Restore default selection',
    selectAll: 'Select all projects',
    liveApi: 'Live API',
    loading: 'Loading...',
    loadLive: 'Load live projects',
    shareTitle: 'Guest share links',
    shareLabel: 'Label',
    shareLabelPlaceholder: 'Example: Full experience for Alex, 3 days',
    shareDays: 'Valid days',
    shareCurrentSelection: 'Share only current selected projects',
    shareCreate: 'Create share link',
    shareCopyLatest: 'Copy latest link',
    shareNoLatest: 'No newly created link yet',
    shareListTitle: 'Issued links',
    shareEmpty: 'No share links yet',
    shareRevoke: 'Revoke',
    shareScopePortfolio: 'Portfolio',
    shareScopeBlog: 'Blog',
    shareScopeDeploy: 'Deploy',
    shareScopeResume: 'Resume',
    shareScopeAllProjects: 'All project subdomains',
    shareScopeSelectedProjects: 'Current selected projects',
    shareCreatedAt: 'Created',
    shareExpiresAt: 'Expires',
    shareStatusActive: 'Active',
    shareStatusRevoked: 'Revoked',
    shareStatusExpired: 'Expired',
  },
} as const

function formatMetaDate(value: string, lang: Lang) {
  const date = new Date(value)
  if (Number.isNaN(date.valueOf())) {
    return value
  }

  return new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function summarizeScope(copy: (typeof DEBUG_COPY)[Lang], scope: ShareScope, selectedCount: number) {
  const parts = []
  if (scope.allowPortfolio) {
    parts.push(copy.shareScopePortfolio)
  }
  if (scope.allowBlog) {
    parts.push(copy.shareScopeBlog)
  }
  if (scope.allowDeploy) {
    parts.push(copy.shareScopeDeploy)
  }
  if (scope.allowResume) {
    parts.push(copy.shareScopeResume)
  }
  if (scope.allowAllProjects) {
    parts.push(copy.shareScopeAllProjects)
  } else if (selectedCount > 0) {
    parts.push(`${copy.shareScopeSelectedProjects} (${selectedCount})`)
  }
  return parts.join(' · ')
}

function statusLabel(lang: Lang, status: ShareLinkRecord['status']) {
  const copy = DEBUG_COPY[lang]
  if (status === 'revoked') {
    return copy.shareStatusRevoked
  }
  if (status === 'expired') {
    return copy.shareStatusExpired
  }
  return copy.shareStatusActive
}

export function DebugPanel({
  lang,
  allProjects,
  selectedSlugs,
  centerApi,
  sourceLabel,
  loadState,
  errorMessage,
  canManageShares,
  shareBusy,
  shareStatusMessage,
  shareLabel,
  shareExpiresInDays,
  shareScope,
  shareLinks,
  lastCreatedShareUrl,
  onCenterApiChange,
  onLoadLive,
  onToggleProject,
  onSelectFeatured,
  onSelectAll,
  onShareLabelChange,
  onShareExpiresInDaysChange,
  onToggleShareFlag,
  onCreateShareLink,
  onCopyLastShareLink,
  onRevokeShareLink,
}: DebugPanelProps) {
  const copy = DEBUG_COPY[lang]

  return (
    <section className="debug-panel" id="debug">
      <h3>{copy.title}</h3>
      <p>
        {copy.source}: <span className="mono">{sourceLabel}</span>
      </p>

      <div className="debug-actions">
        <button type="button" onClick={onSelectFeatured}>
          {copy.resetDefault}
        </button>
        <button type="button" onClick={onSelectAll}>
          {copy.selectAll}
        </button>
      </div>

      <div className="debug-api">
        <label htmlFor="center-api" className="mono">
          {copy.liveApi}
        </label>
        <input
          id="center-api"
          value={centerApi}
          onChange={(event) => onCenterApiChange(event.target.value)}
          placeholder="https://center-control.example.com/api/portfolio/projects.json"
        />
        <button type="button" onClick={onLoadLive} disabled={loadState === 'loading'}>
          {loadState === 'loading' ? copy.loading : copy.loadLive}
        </button>
      </div>

      {loadState === 'error' ? <p className="debug-error">{errorMessage}</p> : null}

      <div className="debug-grid">
        {allProjects.map((project) => {
          const checked = selectedSlugs.includes(project.slug)

          return (
            <label key={project.id} className={`debug-item${checked ? ' checked' : ''}`}>
              <input type="checkbox" checked={checked} onChange={() => onToggleProject(project.slug)} />
              <span>{project.name}</span>
              <span className="mono">{project.subdomain}.wordm.us</span>
            </label>
          )
        })}
      </div>

      {canManageShares ? (
        <section className="debug-share-panel">
          <h3>{copy.shareTitle}</h3>

          <div className="debug-share-grid">
            <label className="debug-share-field">
              <span>{copy.shareLabel}</span>
              <input value={shareLabel} onChange={(event) => onShareLabelChange(event.target.value)} placeholder={copy.shareLabelPlaceholder} />
            </label>
            <label className="debug-share-field">
              <span>{copy.shareDays}</span>
              <input value={shareExpiresInDays} onChange={(event) => onShareExpiresInDaysChange(event.target.value)} inputMode="numeric" placeholder="3" />
            </label>
          </div>

          <div className="debug-share-toggles">
            <label className={`debug-share-toggle${shareScope.allowPortfolio ? ' checked' : ''}`}>
              <input type="checkbox" checked={shareScope.allowPortfolio} onChange={() => onToggleShareFlag('allowPortfolio')} />
              <span>{copy.shareScopePortfolio}</span>
            </label>
            <label className={`debug-share-toggle${shareScope.allowBlog ? ' checked' : ''}`}>
              <input type="checkbox" checked={shareScope.allowBlog} onChange={() => onToggleShareFlag('allowBlog')} />
              <span>{copy.shareScopeBlog}</span>
            </label>
            <label className={`debug-share-toggle${shareScope.allowDeploy ? ' checked' : ''}`}>
              <input type="checkbox" checked={shareScope.allowDeploy} onChange={() => onToggleShareFlag('allowDeploy')} />
              <span>{copy.shareScopeDeploy}</span>
            </label>
            <label className={`debug-share-toggle${shareScope.allowResume ? ' checked' : ''}`}>
              <input type="checkbox" checked={shareScope.allowResume} onChange={() => onToggleShareFlag('allowResume')} />
              <span>{copy.shareScopeResume}</span>
            </label>
            <label className={`debug-share-toggle${shareScope.allowAllProjects ? ' checked' : ''}`}>
              <input type="checkbox" checked={shareScope.allowAllProjects} onChange={() => onToggleShareFlag('allowAllProjects')} />
              <span>{shareScope.allowAllProjects ? copy.shareScopeAllProjects : `${copy.shareCurrentSelection} (${selectedSlugs.length})`}</span>
            </label>
          </div>

          <div className="debug-actions">
            <button type="button" onClick={onCreateShareLink} disabled={shareBusy}>
              {shareBusy ? copy.loading : copy.shareCreate}
            </button>
            <button type="button" onClick={onCopyLastShareLink} disabled={!lastCreatedShareUrl}>
              {copy.shareCopyLatest}
            </button>
          </div>

          {lastCreatedShareUrl ? <p className="debug-share-url mono">{lastCreatedShareUrl}</p> : <p className="debug-share-empty">{copy.shareNoLatest}</p>}
          {shareStatusMessage ? <p className="debug-error">{shareStatusMessage}</p> : null}

          <div className="debug-share-list">
            <h4>{copy.shareListTitle}</h4>
            {shareLinks.length === 0 ? <p className="debug-share-empty">{copy.shareEmpty}</p> : null}
            {shareLinks.map((shareLink) => (
              <article key={shareLink.id} className="debug-share-card">
                <div className="debug-share-card-head">
                  <div>
                    <strong>{shareLink.label || shareLink.id.slice(0, 8)}</strong>
                    <div className="mono debug-share-card-meta">{statusLabel(lang, shareLink.status)}</div>
                  </div>
                  <button type="button" onClick={() => onRevokeShareLink(shareLink.id)} disabled={shareBusy || shareLink.status !== 'active'}>
                    {copy.shareRevoke}
                  </button>
                </div>
                <p className="debug-share-card-scope">{summarizeScope(copy, shareLink.scope, shareLink.scope.allowedProjectSlugs.length)}</p>
                <p className="debug-share-card-meta">
                  {copy.shareCreatedAt}: {formatMetaDate(shareLink.createdAt, lang)} · {copy.shareExpiresAt}: {formatMetaDate(shareLink.expiresAt, lang)}
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  )
}
