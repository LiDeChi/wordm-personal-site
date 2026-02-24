import fs from 'node:fs'
import path from 'node:path'

const DEFAULT_SOURCE =
  '/Users/lidechi/Documents/Github/center-control/data/exports/projects.json'

const sourcePath = process.env.CENTER_CONTROL_EXPORT || DEFAULT_SOURCE
const outputPath = path.resolve(process.cwd(), 'src/data/projects.snapshot.json')

function normalizeGithub(url) {
  if (!url || typeof url !== 'string') {
    return null
  }

  const trimmed = url.trim()
  const sshMatch = trimmed.match(/^git@github\.com:([^\s]+?)(?:\.git)?$/)
  if (sshMatch) {
    return `https://github.com/${sshMatch[1]}`
  }

  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return null
  }

  return trimmed.endsWith('.git') ? trimmed.slice(0, -4) : trimmed
}

function normalizeProduction(url) {
  if (!url || typeof url !== 'string') {
    return null
  }

  const trimmed = url.trim()
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return null
  }

  const blockedFragments = ['REPLACE_WITH_PROJECT_ID', '/v1/chat/completions', 'ark.cn-beijing.volces.com/api/coding']
  if (blockedFragments.some((fragment) => trimmed.includes(fragment))) {
    return null
  }

  return trimmed
}

function stripMarkdown(text) {
  if (!text || typeof text !== 'string') {
    return ''
  }

  return text
    .replace(/<img[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/`+/g, '')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function pickSummary(summary, name) {
  const cleaned = stripMarkdown(summary)
  if (
    !cleaned ||
    cleaned.includes('REPLACE_WITH_PROJECT_ID') ||
    cleaned.toLowerCase().startsWith('url: https://lovable.dev/projects/')
  ) {
    return `${name} 项目详情可查看项目页与源码。`
  }

  const sentence = cleaned.split(/(?<=[。.!?])\s+/u)[0] || cleaned
  return sentence.slice(0, 180)
}

function safeSlug(slug, fallback) {
  const source = (slug || fallback || 'project').toLowerCase()
  const normalized = source
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')

  return normalized || 'project'
}

function buildSubdomain(slug, used) {
  const root = `p-${safeSlug(slug, 'project')}`.slice(0, 36)
  let candidate = root
  let index = 2

  while (used.has(candidate)) {
    candidate = `${root}-${index}`
    index += 1
  }

  used.add(candidate)
  return candidate
}

if (!fs.existsSync(sourcePath)) {
  console.error(`[sync-center-control] source not found: ${sourcePath}`)
  process.exit(1)
}

const raw = JSON.parse(fs.readFileSync(sourcePath, 'utf8'))
const usedSubdomains = new Set()

const projects = (raw.projects || [])
  .filter((project) => project.scope === 'tracked')
  .map((project) => {
    const slug = safeSlug(project.slug, project.name)
    const subdomain = buildSubdomain(slug, usedSubdomains)
    const productionUrl = normalizeProduction(project.productionUrl)
    const sourceUrl = normalizeGithub(project.sourceUrl || project.remoteUrl)

    return {
      id: project.id,
      name: project.name,
      slug,
      summary: pickSummary(project.summary || project.readmePreview, project.name),
      techStack: Array.isArray(project.techStack) ? project.techStack.slice(0, 8) : [],
      tags: Array.isArray(project.tags) ? project.tags.slice(0, 8) : [],
      activityScore: Number(project.activityScore || 0),
      commitCount30d: Number(project.commitCount30d || 0),
      relationCount: Number(project.relationCount || 0),
      lastCommitAt: project.lastCommitAt || null,
      productionUrl,
      sourceUrl,
      subdomain,
      subdomainUrl: `https://${subdomain}.wordm.us`,
    }
  })
  .sort((a, b) => {
    if (b.activityScore !== a.activityScore) {
      return b.activityScore - a.activityScore
    }

    return (b.lastCommitAt || '').localeCompare(a.lastCommitAt || '')
  })

const preferredFeatured = [
  'page-glance-extension',
  'apple-notes-webclipper',
  'personalinflationbasket',
  'llm-layer',
  'focusor',
  'code-agent-demo',
  'open-deep-research',
  'dynamic-delegate-2',
]

const featured = [
  ...preferredFeatured.filter((slug) => projects.some((project) => project.slug === slug)),
  ...projects
    .filter((project) => project.productionUrl || project.sourceUrl)
    .map((project) => project.slug),
]
  .filter((slug, index, list) => list.indexOf(slug) === index)
  .slice(0, 8)

const output = {
  generatedAt: new Date().toISOString(),
  sourcePath,
  centerControlGeneratedAt: raw.generatedAt || null,
  domain: 'wordm.us',
  featured,
  projects,
}

fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8')
console.log(`[sync-center-control] wrote ${projects.length} projects to ${outputPath}`)
