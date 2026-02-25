import type { PortfolioProject } from '../types'
import { formatMonth } from '../lib/projects'

type ProjectEntryProps = {
  project: PortfolioProject
}

export function ProjectEntry({ project }: ProjectEntryProps) {
  return (
    <article className="paper-entry" id={`project-${project.slug}`}>
      <div className="paper-meta">
        <span>{formatMonth(project.lastCommitAt)}</span>
        <span>ACTIVITY {project.activityScore}</span>
        <span>COMMITS/30D {project.commitCount30d}</span>
      </div>

      <a className="paper-title" href={project.subdomainUrl} target="_blank" rel="noreferrer">
        {project.name}
      </a>

      <div className="paper-authors">Portfolio Item · Scope: tracked · Relations: {project.relationCount}</div>

      <p className="paper-summary">{project.summary}</p>

      {project.techStack.length ? (
        <p className="paper-stack">
          <span className="mono">Stack:</span> {project.techStack.join(' · ')}
        </p>
      ) : null}

      <div className="paper-links">
        <a href={project.subdomainUrl} target="_blank" rel="noreferrer">
          Subdomain
        </a>
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
      </div>
    </article>
  )
}
