import { useMemo, useState } from 'react'
import { AuthPanel, type AuthPanelProps } from './AuthPanel'
import type { PortfolioProject } from '../types'
import type { Lang } from '../i18n/lang'
import type { ShareLinkRecord, ShareScope } from '../lib/share-links'
import { formatDate } from '../lib/projects'
import { withSiteParams } from '../lib/lang-url'

type ShareFlagKey = 'allowPortfolio' | 'allowBlog' | 'allowDeploy' | 'allowResume' | 'allowAllProjects'

type AdminPageProps = {
  lang: Lang
  lastUpdated: string
  projects: PortfolioProject[]
  selectedSlugs: string[]
  authPanel: Omit<AuthPanelProps, 'className'>
  canManageShares: boolean
  shareBusy: boolean
  shareStatusMessage: string
  shareLabel: string
  shareExpiresInDays: string
  shareScope: ShareScope
  shareLinks: ShareLinkRecord[]
  lastCreatedShareUrl: string
  onToggleProject: (slug: string) => void
  onSelectFeatured: () => void
  onSelectAll: () => void
  onShareLabelChange: (value: string) => void
  onShareExpiresInDaysChange: (value: string) => void
  onToggleShareFlag: (key: ShareFlagKey) => void
  onCreateShareLink: () => void
  onCreateFullExperienceShareLink: () => void
  onCreateSevenDayShareLink: () => void
  onCreateThirtyDayShareLink: () => void
  onCreateProjectDetailShareLink: (projectSlug: string) => void
  onCreateProjectSubdomainShareLink: (projectSlug: string) => void
  onCopyLastShareLink: () => void
  onPurgeInactiveShareLinks: () => void
  onRevokeShareLink: (shareLinkId: string) => void
}

const COPY = {
  zh: {
    title: '后台系统',
    subtitle: 'admin.wordm.us 受管理员认证保护，用于管理站点入口、项目分发与分享链接。',
    projectCount: '项目总数',
    featuredCount: '详情已接入',
    updated: '快照更新',
    protected: '访问方式',
    protectedValue: 'HTTP Basic Auth',
    quickLinks: '快捷入口',
    rootPortfolio: '根域作品集',
    resume: '简历子域',
    debug: '根域 Debug',
    projects: '项目管理',
    detail: '查看详情',
    subdomain: '项目子域',
    source: '源码',
    production: '线上地址',
    commandRun: '运行',
    commandBuild: '构建',
    commandEntry: '入口',
    noCommand: 'N/A',
    shareTitle: '免登录分享链接',
    shareHint: '在此登录管理员/测试账号后，可创建免注册的临时完整体验链接。',
    shareNeedLogin: '当前还没有登录具备权限的账号，因此暂不能生成分享链接。',
    shareLabel: '链接备注',
    shareLabelPlaceholder: '例如：给张三 3 天完整体验',
    shareDays: '有效天数',
    shareCurrentSelection: '仅分享当前勾选项目',
    shareCreate: '生成分享链接',
    shareTemplateFull: '3 天完整体验',
    shareTemplateSeven: '7 天完整体验',
    shareTemplateThirty: '30 天完整体验',
    shareSearchLabel: '搜索分享链接',
    shareSearchPlaceholder: '按备注或状态筛选',
    projectSearchLabel: '搜索项目',
    projectSearchPlaceholder: '按项目名或 slug 筛选',
    shareProjectDetail: '详情分享',
    shareProjectSubdomain: '子域分享',
    shareCopyLatest: '复制最新链接',
    sharePurgeInactive: '清理失效链接',
    shareVisits: '访问次数',
    shareLastAccessed: '最后访问',
    shareNoLatest: '还没有新生成的链接',
    shareListTitle: '已生成链接',
    shareEmpty: '暂无分享链接',
    shareRevoke: '撤销',
    shareScopePortfolio: '作品集',
    shareScopeDeploy: '部署页',
    shareScopeResume: '简历页',
    shareScopeAllProjects: '全部项目子域',
    shareScopeSelectedProjects: '当前勾选项目',
    shareCreatedAt: '创建',
    shareExpiresAt: '到期',
    shareStatusActive: '生效中',
    shareStatusRevoked: '已撤销',
    shareStatusExpired: '已过期',
    resetDefault: '还原默认项目',
    selectAll: '勾选全部项目',
  },
  en: {
    title: 'Admin Backend',
    subtitle: 'admin.wordm.us is protected by administrator authentication and manages site entry points, project distribution, and guest share links.',
    projectCount: 'Projects',
    featuredCount: 'With details',
    updated: 'Snapshot updated',
    protected: 'Access mode',
    protectedValue: 'HTTP Basic Auth',
    quickLinks: 'Quick links',
    rootPortfolio: 'Root portfolio',
    resume: 'Resume subdomain',
    debug: 'Root debug',
    projects: 'Project management',
    detail: 'View detail',
    subdomain: 'Project subdomain',
    source: 'Source',
    production: 'Production',
    commandRun: 'Run',
    commandBuild: 'Build',
    commandEntry: 'Entry',
    noCommand: 'N/A',
    shareTitle: 'Guest share links',
    shareHint: 'Log in with an admin/tester account here to create temporary no-signup full-experience links.',
    shareNeedLogin: 'No authorized account is signed in yet, so guest share links are unavailable for now.',
    shareLabel: 'Label',
    shareLabelPlaceholder: 'Example: Full experience for Alex, 3 days',
    shareDays: 'Valid days',
    shareCurrentSelection: 'Share only current selected projects',
    shareCreate: 'Create share link',
    shareTemplateFull: '3-day full access',
    shareTemplateSeven: '7-day full access',
    shareTemplateThirty: '30-day full access',
    shareSearchLabel: 'Search share links',
    shareSearchPlaceholder: 'Filter by label or status',
    projectSearchLabel: 'Search projects',
    projectSearchPlaceholder: 'Filter by project name or slug',
    shareProjectDetail: 'Detail share',
    shareProjectSubdomain: 'Subdomain share',
    shareCopyLatest: 'Copy latest link',
    sharePurgeInactive: 'Purge inactive links',
    shareVisits: 'Visits',
    shareLastAccessed: 'Last access',
    shareNoLatest: 'No newly created link yet',
    shareListTitle: 'Issued links',
    shareEmpty: 'No share links yet',
    shareRevoke: 'Revoke',
    shareScopePortfolio: 'Portfolio',
    shareScopeDeploy: 'Deploy',
    shareScopeResume: 'Resume',
    shareScopeAllProjects: 'All project subdomains',
    shareScopeSelectedProjects: 'Current selected projects',
    shareCreatedAt: 'Created',
    shareExpiresAt: 'Expires',
    shareStatusActive: 'Active',
    shareStatusRevoked: 'Revoked',
    shareStatusExpired: 'Expired',
    resetDefault: 'Restore default projects',
    selectAll: 'Select all projects',
  },
} as const

function commandValue(value: string | null | undefined, fallback: string) {
  return value && value.trim() ? value : fallback
}

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

function summarizeScope(copy: (typeof COPY)[Lang], scope: ShareScope, selectedCount: number) {
  const parts = []
  if (scope.allowPortfolio) {
    parts.push(copy.shareScopePortfolio)
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
  const copy = COPY[lang]
  if (status === 'revoked') {
    return copy.shareStatusRevoked
  }
  if (status === 'expired') {
    return copy.shareStatusExpired
  }
  return copy.shareStatusActive
}

export function AdminPage({
  lang,
  lastUpdated,
  projects,
  selectedSlugs,
  authPanel,
  canManageShares,
  shareBusy,
  shareStatusMessage,
  shareLabel,
  shareExpiresInDays,
  shareScope,
  shareLinks,
  lastCreatedShareUrl,
  onToggleProject,
  onSelectFeatured,
  onSelectAll,
  onShareLabelChange,
  onShareExpiresInDaysChange,
  onToggleShareFlag,
  onCreateShareLink,
  onCreateFullExperienceShareLink,
  onCreateSevenDayShareLink,
  onCreateThirtyDayShareLink,
  onCreateProjectDetailShareLink,
  onCreateProjectSubdomainShareLink,
  onCopyLastShareLink,
  onPurgeInactiveShareLinks,
  onRevokeShareLink,
}: AdminPageProps) {
  const copy = COPY[lang]
  const [shareSearch, setShareSearch] = useState('')
  const [projectSearch, setProjectSearch] = useState('')
  const detailedCount = projects.filter((project) => project.detail).length
  const rootPortfolioUrl = withSiteParams('https://wordm.us', { lang })
  const debugUrl = withSiteParams('https://wordm.us?debug=1', { lang })
  const resumeUrl = withSiteParams('https://resume.wordm.us', { lang })
  const normalizedShareSearch = shareSearch.trim().toLowerCase()
  const normalizedProjectSearch = projectSearch.trim().toLowerCase()
  const filteredShareLinks = useMemo(() => {
    if (!normalizedShareSearch) {
      return shareLinks
    }

    return shareLinks.filter((shareLink) => {
      const label = (shareLink.label || '').toLowerCase()
      const status = shareLink.status.toLowerCase()
      return label.includes(normalizedShareSearch) || status.includes(normalizedShareSearch) || shareLink.id.toLowerCase().includes(normalizedShareSearch)
    })
  }, [normalizedShareSearch, shareLinks])
  const filteredProjects = useMemo(() => {
    if (!normalizedProjectSearch) {
      return projects
    }

    return projects.filter((project) => {
      const haystack = `${project.name} ${project.slug}`.toLowerCase()
      return haystack.includes(normalizedProjectSearch)
    })
  }, [normalizedProjectSearch, projects])

  return (
    <div className="subdomain-page admin-page-shell">
      <main className="subdomain-main admin-main">
        <p className="mono subdomain-tag">admin.wordm.us</p>
        <h1>{copy.title}</h1>
        <p>{copy.subtitle}</p>

        <section className="admin-overview-grid">
          <div className="admin-overview-card">
            <span className="mono">{copy.projectCount}</span>
            <strong>{projects.length}</strong>
          </div>
          <div className="admin-overview-card">
            <span className="mono">{copy.featuredCount}</span>
            <strong>{detailedCount}</strong>
          </div>
          <div className="admin-overview-card">
            <span className="mono">{copy.updated}</span>
            <strong>{lastUpdated}</strong>
          </div>
          <div className="admin-overview-card">
            <span className="mono">{copy.protected}</span>
            <strong>{copy.protectedValue}</strong>
          </div>
        </section>

        <section className="project-detail-section">
          <h2>{copy.quickLinks}</h2>
          <div className="paper-links admin-quick-links">
            <a href={rootPortfolioUrl} target="_blank" rel="noreferrer">{copy.rootPortfolio}</a>
            <a href={resumeUrl} target="_blank" rel="noreferrer">{copy.resume}</a>
            <a href={debugUrl} target="_blank" rel="noreferrer">{copy.debug}</a>
          </div>
        </section>

        <section className="project-detail-section">
          <h2>{copy.shareTitle}</h2>
          <p>{copy.shareHint}</p>
          <div className="admin-auth-wrap">
            <AuthPanel {...authPanel} className="admin-auth-panel" compact />
          </div>
          {!canManageShares ? <p className="unlock-status-message">{copy.shareNeedLogin}</p> : null}

          {canManageShares ? (
            <>
              <div className="debug-share-grid admin-share-grid">
                <label className="debug-share-field">
                  <span>{copy.shareLabel}</span>
                  <input value={shareLabel} onChange={(event) => onShareLabelChange(event.target.value)} placeholder={copy.shareLabelPlaceholder} />
                </label>
                <label className="debug-share-field">
                  <span>{copy.shareDays}</span>
                  <input value={shareExpiresInDays} onChange={(event) => onShareExpiresInDaysChange(event.target.value)} inputMode="numeric" placeholder="3" />
                </label>
              </div>

              <div className="debug-share-toggles admin-share-toggles">
                <label className={`debug-share-toggle${shareScope.allowPortfolio ? ' checked' : ''}`}>
                  <input type="checkbox" checked={shareScope.allowPortfolio} onChange={() => onToggleShareFlag('allowPortfolio')} />
                  <span>{copy.shareScopePortfolio}</span>
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
                <button type="button" onClick={onSelectFeatured}>{copy.resetDefault}</button>
                <button type="button" onClick={onSelectAll}>{copy.selectAll}</button>
              </div>

              <div className="debug-grid admin-project-picker">
                {filteredProjects.map((project) => {
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

              <div className="debug-actions admin-share-actions">
                <button type="button" onClick={onCreateShareLink} disabled={shareBusy}>
                  {copy.shareCreate}
                </button>
                <button type="button" onClick={onCreateFullExperienceShareLink} disabled={shareBusy}>
                  {copy.shareTemplateFull}
                </button>
                <button type="button" onClick={onCreateSevenDayShareLink} disabled={shareBusy}>
                  {copy.shareTemplateSeven}
                </button>
                <button type="button" onClick={onCreateThirtyDayShareLink} disabled={shareBusy}>
                  {copy.shareTemplateThirty}
                </button>
                <button type="button" onClick={onCopyLastShareLink} disabled={!lastCreatedShareUrl}>
                  {copy.shareCopyLatest}
                </button>
                <button type="button" onClick={onPurgeInactiveShareLinks} disabled={shareBusy}>
                  {copy.sharePurgeInactive}
                </button>
              </div>

              <div className="admin-filter-grid">
                <label className="debug-share-field">
                  <span>{copy.shareSearchLabel}</span>
                  <input value={shareSearch} onChange={(event) => setShareSearch(event.target.value)} placeholder={copy.shareSearchPlaceholder} />
                </label>
                <label className="debug-share-field">
                  <span>{copy.projectSearchLabel}</span>
                  <input value={projectSearch} onChange={(event) => setProjectSearch(event.target.value)} placeholder={copy.projectSearchPlaceholder} />
                </label>
              </div>

              {lastCreatedShareUrl ? <p className="debug-share-url mono">{lastCreatedShareUrl}</p> : null}
              {shareStatusMessage ? <p className="debug-error">{shareStatusMessage}</p> : null}

              <div className="debug-share-list">
                <h3>{copy.shareListTitle}</h3>
                {filteredShareLinks.length === 0 ? <p className="debug-share-empty">{copy.shareEmpty}</p> : null}
                {filteredShareLinks.map((shareLink) => (
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
                    <p className="debug-share-card-meta">
                      {copy.shareVisits}: {shareLink.visitCount} · {copy.shareLastAccessed}: {shareLink.lastAccessedAt ? formatMetaDate(shareLink.lastAccessedAt, lang) : copy.noCommand}
                    </p>
                  </article>
                ))}
              </div>
            </>
          ) : null}
        </section>

        <section className="project-detail-section">
          <h2>{copy.projects}</h2>
          <div className="admin-project-list">
            {filteredProjects.map((project) => {
              const detailUrl = withSiteParams(`https://wordm.us?view=portfolio&project=${encodeURIComponent(project.slug)}`, { lang })
              const subdomainUrl = withSiteParams(project.subdomainUrl, { lang })
              return (
                <article key={project.id} className="admin-project-card">
                  <div className="admin-project-head">
                    <div>
                      <h3>{project.name}</h3>
                      <p className="meta">{formatDate(project.lastCommitAt)} · {project.slug}</p>
                    </div>
                    <div className="paper-links">
                      <a href={detailUrl} target="_blank" rel="noreferrer">{copy.detail}</a>
                      <a href={subdomainUrl} target="_blank" rel="noreferrer">{copy.subdomain}</a>
                      <button type="button" className="admin-link-btn" onClick={() => onCreateProjectDetailShareLink(project.slug)} disabled={shareBusy}>
                        {copy.shareProjectDetail}
                      </button>
                      <button type="button" className="admin-link-btn" onClick={() => onCreateProjectSubdomainShareLink(project.slug)} disabled={shareBusy}>
                        {copy.shareProjectSubdomain}
                      </button>
                      {project.productionUrl ? <a href={project.productionUrl} target="_blank" rel="noreferrer">{copy.production}</a> : null}
                      {project.sourceUrl ? <a href={project.sourceUrl} target="_blank" rel="noreferrer">{copy.source}</a> : null}
                    </div>
                  </div>
                  <p>{project.summary}</p>
                  {project.detail ? (
                    <div className="admin-project-meta-grid">
                      <div>
                        <span className="mono">{copy.commandRun}</span>
                        <code>{commandValue(project.detail.commands.run, copy.noCommand)}</code>
                      </div>
                      <div>
                        <span className="mono">{copy.commandBuild}</span>
                        <code>{commandValue(project.detail.commands.build, copy.noCommand)}</code>
                      </div>
                      <div>
                        <span className="mono">{copy.commandEntry}</span>
                        <code>{commandValue(project.detail.entry, copy.noCommand)}</code>
                      </div>
                    </div>
                  ) : null}
                </article>
              )
            })}
          </div>
        </section>
      </main>
    </div>
  )
}
