import type { PortfolioProject } from '../types'

const ROOT_HOSTS = new Set(['wordm.us', 'www.wordm.us', 'localhost', '127.0.0.1'])

export function parseShowSlugs(raw: string | null): string[] {
  if (!raw) {
    return []
  }

  return raw
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
}

export function chooseProjects(allProjects: PortfolioProject[], slugs: string[]): PortfolioProject[] {
  if (!slugs.length) {
    return []
  }

  const map = new Map(allProjects.map((project) => [project.slug, project]))
  return slugs.map((slug) => map.get(slug)).filter((project): project is PortfolioProject => Boolean(project))
}

export function formatMonth(rawDate: string | null): string {
  if (!rawDate) {
    return 'N/A'
  }

  const date = new Date(rawDate)
  if (Number.isNaN(date.valueOf())) {
    return 'N/A'
  }

  const year = date.getUTCFullYear()
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0')
  return `${year}.${month}`
}

export function formatDate(rawDate: string | null): string {
  if (!rawDate) {
    return 'N/A'
  }

  const date = new Date(rawDate)
  if (Number.isNaN(date.valueOf())) {
    return 'N/A'
  }

  const year = date.getUTCFullYear()
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0')
  const day = `${date.getUTCDate()}`.padStart(2, '0')
  return `${year}.${month}.${day}`
}

export function resolveSubdomainView(
  allProjects: PortfolioProject[],
  hostname: string,
  forcedSubdomain: string | null,
): PortfolioProject | null {
  const normalizedHost = hostname.toLowerCase()

  if (forcedSubdomain) {
    const byQuery = allProjects.find((project) => project.subdomain === forcedSubdomain)
    if (byQuery) {
      return byQuery
    }
  }

  if (ROOT_HOSTS.has(normalizedHost)) {
    return null
  }

  if (!normalizedHost.endsWith('.wordm.us')) {
    return null
  }

  const subdomain = normalizedHost.replace(/\.wordm\.us$/, '')
  return allProjects.find((project) => project.subdomain === subdomain) || null
}

export async function fetchProjectsFromApi(apiUrl: string): Promise<PortfolioProject[]> {
  const response = await fetch(apiUrl)
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }

  const payload = (await response.json()) as { projects?: PortfolioProject[]; count?: number }
  if (!Array.isArray(payload.projects)) {
    throw new Error('API response missing projects array')
  }

  return payload.projects.map((project, index) => ({
    id: project.id || `live_${index}`,
    name: project.name,
    slug: project.slug,
    summary: project.summary || `${project.name} project`,
    tagline: project.tagline || project.summary || `${project.name} project`,
    thumbnailUrl: project.thumbnailUrl || null,
    techStack: Array.isArray(project.techStack) ? project.techStack : [],
    tags: Array.isArray(project.tags) ? project.tags : [],
    activityScore: Number(project.activityScore || 0),
    commitCount30d: Number(project.commitCount30d || 0),
    relationCount: Number(project.relationCount || 0),
    lastCommitAt: project.lastCommitAt || null,
    productionUrl: project.productionUrl || null,
    sourceUrl: project.sourceUrl || null,
    subdomain: project.subdomain || `p-${project.slug}`,
    subdomainUrl: project.subdomainUrl || `https://p-${project.slug}.wordm.us`,
    detail: project.detail || null,
  }))
}
