export type PortfolioProject = {
  id: string
  name: string
  slug: string
  summary: string
  techStack: string[]
  tags: string[]
  activityScore: number
  commitCount30d: number
  relationCount: number
  lastCommitAt: string | null
  productionUrl: string | null
  sourceUrl: string | null
  subdomain: string
  subdomainUrl: string
}

export type ProjectsSnapshot = {
  generatedAt: string
  sourcePath: string
  centerControlGeneratedAt: string | null
  domain: string
  featured: string[]
  projects: PortfolioProject[]
}
