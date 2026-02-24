import type { PortfolioProject } from '../types'

type DebugPanelProps = {
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

export function DebugPanel({
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
  return (
    <section className="debug-panel" id="debug">
      <h3>Debug Mode / 展示控制</h3>
      <p>
        当前数据源：<span className="mono">{sourceLabel}</span>
      </p>

      <div className="debug-actions">
        <button type="button" onClick={onSelectFeatured}>
          还原默认展示
        </button>
        <button type="button" onClick={onSelectAll}>
          展示全部项目
        </button>
      </div>

      <div className="debug-api">
        <label htmlFor="center-api" className="mono">
          Live API
        </label>
        <input
          id="center-api"
          value={centerApi}
          onChange={(event) => onCenterApiChange(event.target.value)}
          placeholder="https://center-control.example.com/api/portfolio/projects.json"
        />
        <button type="button" onClick={onLoadLive} disabled={loadState === 'loading'}>
          {loadState === 'loading' ? 'Loading...' : '拉取实时项目'}
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
