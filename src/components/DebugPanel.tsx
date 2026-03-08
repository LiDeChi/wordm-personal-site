import type { PortfolioProject } from '../types'
import type { Lang } from '../i18n/lang'

type DebugPanelProps = {
  lang: Lang
  allProjects: PortfolioProject[]
  selectedSlugs: string[]
  centerApi: string
  sourceLabel: string
  loadState: 'idle' | 'loading' | 'error'
  errorMessage: string
  onCenterApiChange: (value: string) => void
  onLoadLive: () => void
  onToggleProject: (slug: string) => void
  onSelectFeatured: () => void
  onSelectAll: () => void
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
  },
  en: {
    title: 'Debug Mode / Showcase Control',
    source: 'Current source',
    resetDefault: 'Restore default selection',
    selectAll: 'Select all projects',
    liveApi: 'Live API',
    loading: 'Loading...',
    loadLive: 'Load live projects',
  },
} as const

export function DebugPanel({
  lang,
  allProjects,
  selectedSlugs,
  centerApi,
  sourceLabel,
  loadState,
  errorMessage,
  onCenterApiChange,
  onLoadLive,
  onToggleProject,
  onSelectFeatured,
  onSelectAll,
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
    </section>
  )
}
