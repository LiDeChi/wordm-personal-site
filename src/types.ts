export type ProjectCommandMap = {
  run: string | null
  test: string | null
  lint: string | null
  build: string | null
  docs: string | null
}

export type ProjectDetail = {
  source: 'orchestration-manifest'
  slug: string
  projectPath: string | null
  status: string | null
  type: string | null
  language: string | null
  entry: string | null
  apiOrPackage: string | null
  publisherId: string | null
  trustMode: string | null
  commands: ProjectCommandMap
  distributionMode: string | null
  verifyBeforeDeploy: boolean
  defaultActions: string[]
  artifactName: string | null
  artifactPath: string | null
  artifactSha256Snapshot: string | null
  executionEntrypoint: string | null
  clickInstallers: Array<{ label: string; command: string }>
  recommendedActions: Array<{ label: string; command: string }>
}

export type PortfolioProject = {
  id: string
  name: string
  slug: string
  summary: string
  tagline: string
  thumbnailUrl: string | null
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
  detail: ProjectDetail | null
}

export type ProjectsSnapshot = {
  generatedAt: string
  sourcePath: string
  centerControlGeneratedAt: string | null
  domain: string
  featured: string[]
  projects: PortfolioProject[]
}
