import type { PortfolioProject } from '../types'
import { formatDate } from '../lib/projects'

type SubdomainProjectViewProps = {
  project: PortfolioProject
  lastUpdated: string
}

export function SubdomainProjectView({ project, lastUpdated }: SubdomainProjectViewProps) {
  return (
    <div className="subdomain-page">
      <main className="subdomain-main">
        <p className="mono subdomain-tag">{project.subdomain}.wordm.us</p>
        <h1>{project.name}</h1>
        <p className="meta">Last Commit: {formatDate(project.lastCommitAt)} · Activity: {project.activityScore}</p>
        <p>{project.summary}</p>

        {project.techStack.length ? (
          <div className="abstract-block">
            <span className="abstract-label">Tech Stack</span>
            <p>{project.techStack.join(' · ')}</p>
          </div>
        ) : null}

        <div className="paper-links">
          {project.productionUrl ? (
            <a href={project.productionUrl} target="_blank" rel="noreferrer">
              Production
            </a>
          ) : null}
          {project.sourceUrl ? (
            <a href={project.sourceUrl} target="_blank" rel="noreferrer">
              Source
            </a>
          ) : null}
          <a href="https://wordm.us" target="_blank" rel="noreferrer">
            Back to Home
          </a>
        </div>

        <footer className="subdomain-footer">
          <div>Generated from center-control snapshot</div>
          <div>Updated: {lastUpdated}</div>
        </footer>
      </main>
    </div>
  )
}
