import fs from 'node:fs'
import path from 'node:path'

const DEFAULT_ORCHESTRATION_ROOT = '/Users/lidechi/Documents/Github/orchestration'
const DEFAULT_GITHUB_ROOT = '/Users/lidechi/Documents/Github'

const orchestrationRoot = process.env.ORCHESTRATION_ROOT || DEFAULT_ORCHESTRATION_ROOT
const githubRoot = process.env.GITHUB_ROOT || DEFAULT_GITHUB_ROOT
const deployIndexPath = path.join(orchestrationRoot, 'deploy', 'index.json')
const deployProjectsRoot = path.join(orchestrationRoot, 'deploy', 'projects')
const runtimeImageRoot = path.join(orchestrationRoot, 'reports', 'runtime_ui_gallery', 'images')
const outputPath = path.resolve(process.cwd(), 'src/data/projects.snapshot.json')
const publicThumbDir = path.resolve(process.cwd(), 'public/orchestration-gallery')

function safeSlug(slug, fallback) {
  const source = (slug || fallback || 'project').toLowerCase()
  const normalized = source
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')

  return normalized || 'project'
}

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

function toNullableString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function normalizeCommandMap(raw) {
  const value = raw && typeof raw === 'object' ? raw : {}
  return {
    run: toNullableString(value.run),
    test: toNullableString(value.test),
    lint: toNullableString(value.lint),
    build: toNullableString(value.build),
    docs: toNullableString(value.docs),
  }
}

function normalizeRecordEntries(raw) {
  if (!raw || typeof raw !== 'object') {
    return []
  }

  return Object.entries(raw)
    .map(([label, command]) => ({
      label,
      command: typeof command === 'string' && command.trim() ? command.trim() : '',
    }))
    .filter((entry) => entry.command)
}

function normalizeText(text) {
  if (!text || typeof text !== 'string') {
    return ''
  }

  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]+\]\([^)]*\)/g, '$1')
    .replace(/^#+\s+/gm, '')
    .replace(/^[-*]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\*\*/g, '')
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function pickReadmeParagraph(rawText, name) {
  const normalized = normalizeText(rawText)
  if (!normalized) {
    return `${name} 的项目介绍可在详情页查看。`
  }

  const paragraphs = normalized
    .split(/\n\n+/)
    .map((paragraph) => paragraph.replace(/\n/g, ' ').trim())
    .filter(Boolean)

  const ignoredStarts = [
    'Deploy Kit:',
    'One-click deploy/distribution wrapper',
    'gridnote is an application project',
    'openclaw-system is an application project',
  ]

  for (const paragraph of paragraphs) {
    if (paragraph.length < 24) {
      continue
    }
    if (ignoredStarts.some((prefix) => paragraph.startsWith(prefix))) {
      continue
    }
    return paragraph
  }

  return paragraphs[0] || `${name} 的项目介绍可在详情页查看。`
}

function firstSentence(text, fallback) {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (!normalized) {
    return fallback
  }

  const sentence = normalized.split(/(?<=[。.!?])\s+/u)[0] || normalized
  return sentence.slice(0, 88)
}

function buildTagline(paragraph, manifest, name) {
  const sentence = firstSentence(paragraph, '')
  if (sentence) {
    return sentence
  }

  const parts = [toNullableString(manifest.type), toNullableString(manifest.lang), toNullableString(manifest.status)].filter(Boolean)
  if (parts.length) {
    return `${name} · ${parts.join(' · ')}`
  }

  return `${name} 的项目说明可在详情页查看。`
}

function buildSummary(paragraph, name) {
  const normalized = paragraph.replace(/\s+/g, ' ').trim()
  if (!normalized) {
    return `${name} 的项目说明可在详情页查看。`
  }

  return normalized.slice(0, 260)
}

function runtimeImageCandidates(slug, manifestSlug, projectName) {
  return [...new Set([
    slug,
    manifestSlug,
    slug?.replace(/-/g, '_'),
    manifestSlug?.replace(/-/g, '_'),
    slug?.replace(/-/g, ''),
    manifestSlug?.replace(/-/g, ''),
    projectName?.toLowerCase(),
    projectName?.toLowerCase().replace(/\s+/g, '-'),
    projectName?.toLowerCase().replace(/\s+/g, '_'),
  ].filter(Boolean))]
}

function copyRuntimeImage(slug, manifestSlug, projectName) {
  if (!fs.existsSync(runtimeImageRoot)) {
    return null
  }

  fs.mkdirSync(publicThumbDir, { recursive: true })

  for (const candidate of runtimeImageCandidates(slug, manifestSlug, projectName)) {
    const sourcePath = path.join(runtimeImageRoot, `${candidate}.png`)
    if (!fs.existsSync(sourcePath)) {
      continue
    }

    const targetName = `${slug}.png`
    const targetPath = path.join(publicThumbDir, targetName)
    fs.copyFileSync(sourcePath, targetPath)
    return `/orchestration-gallery/${targetName}`
  }

  return null
}

function readProjectReadme(entryPath, manifestPath) {
  const entry = toNullableString(entryPath)
  if (!entry) {
    return ''
  }

  const rootCandidate = path.join(githubRoot, entry)
  if (fs.existsSync(rootCandidate)) {
    return fs.readFileSync(rootCandidate, 'utf8')
  }

  const manifestDir = path.dirname(manifestPath)
  const relativeCandidate = path.resolve(manifestDir, '..', '..', '..', '..', entry)
  if (fs.existsSync(relativeCandidate)) {
    return fs.readFileSync(relativeCandidate, 'utf8')
  }

  return ''
}

function readManifestDetail(manifest, manifestPath) {
  const artifact = Array.isArray(manifest.distribution?.artifacts) ? manifest.distribution.artifacts[0] || null : null
  return {
    source: 'orchestration-manifest',
    slug: safeSlug(manifest.slug, manifest.name),
    projectPath: toNullableString(manifest.path),
    status: toNullableString(manifest.status),
    type: toNullableString(manifest.type),
    language: toNullableString(manifest.lang),
    entry: toNullableString(manifest.entry),
    apiOrPackage: toNullableString(manifest.api_or_package),
    publisherId: toNullableString(manifest.publisher?.publisher_id),
    trustMode: toNullableString(manifest.publisher?.trust_mode),
    commands: normalizeCommandMap(manifest.commands),
    distributionMode: toNullableString(manifest.distribution?.mode),
    verifyBeforeDeploy: Boolean(manifest.distribution?.verify_before_deploy),
    defaultActions: Array.isArray(manifest.distribution?.default_actions)
      ? manifest.distribution.default_actions.filter((item) => typeof item === 'string')
      : [],
    artifactName: toNullableString(artifact?.name),
    artifactPath: toNullableString(artifact?.path),
    artifactSha256Snapshot: toNullableString(artifact?.sha256_snapshot),
    executionEntrypoint: toNullableString(manifest.execution?.entrypoint),
    clickInstallers: normalizeRecordEntries(manifest.click_installers),
    recommendedActions: normalizeRecordEntries(manifest.recommended_actions),
    manifestPath,
  }
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

if (!fs.existsSync(deployIndexPath)) {
  console.error(`[sync-center-control] orchestration deploy index not found: ${deployIndexPath}`)
  process.exit(1)
}

const rawIndex = JSON.parse(fs.readFileSync(deployIndexPath, 'utf8'))
const usedSubdomains = new Set()
const visibleStatuses = new Set(['ready', 'partial', 'docs_only'])

const projects = (rawIndex.projects || [])
  .filter((item) => visibleStatuses.has(String(item.status || '').toLowerCase()))
  .map((item) => {
    const manifestPath = path.resolve(githubRoot, item.manifest)
    if (!fs.existsSync(manifestPath)) {
      return null
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    const slug = safeSlug(item.slug || manifest.slug, item.name || manifest.name)
    const detail = readManifestDetail(manifest, manifestPath)
    const subdomain = buildSubdomain(slug, usedSubdomains)
    const sourceUrl = normalizeGithub(detail.apiOrPackage && detail.apiOrPackage.includes('/') ? detail.apiOrPackage : null)
    const readmeText = readProjectReadme(detail.entry, manifestPath)
    const paragraph = pickReadmeParagraph(readmeText, manifest.name || item.name || slug)
    const tagline = buildTagline(paragraph, manifest, manifest.name || item.name || slug)
    const summary = buildSummary(paragraph, manifest.name || item.name || slug)
    const thumbnailUrl = copyRuntimeImage(slug, detail.slug, manifest.name || item.name || slug)

    return {
      id: slug,
      name: manifest.name || item.name || slug,
      slug,
      summary,
      tagline,
      thumbnailUrl,
      techStack: [],
      tags: [detail.type, detail.language, detail.status].filter(Boolean),
      activityScore: detail.status === 'ready' ? 80 : detail.status === 'partial' ? 55 : 35,
      commitCount30d: 0,
      relationCount: 0,
      lastCommitAt: null,
      productionUrl: null,
      sourceUrl,
      subdomain,
      subdomainUrl: `https://${subdomain}.wordm.us`,
      detail: {
        source: detail.source,
        slug: detail.slug,
        projectPath: detail.projectPath,
        status: detail.status,
        type: detail.type,
        language: detail.language,
        entry: detail.entry,
        apiOrPackage: detail.apiOrPackage,
        publisherId: detail.publisherId,
        trustMode: detail.trustMode,
        commands: detail.commands,
        distributionMode: detail.distributionMode,
        verifyBeforeDeploy: detail.verifyBeforeDeploy,
        defaultActions: detail.defaultActions,
        artifactName: detail.artifactName,
        artifactPath: detail.artifactPath,
        artifactSha256Snapshot: detail.artifactSha256Snapshot,
        executionEntrypoint: detail.executionEntrypoint,
        clickInstallers: detail.clickInstallers,
        recommendedActions: detail.recommendedActions,
      },
    }
  })
  .filter(Boolean)
  .sort((a, b) => {
    const aHasThumb = a.thumbnailUrl ? 1 : 0
    const bHasThumb = b.thumbnailUrl ? 1 : 0
    if (bHasThumb !== aHasThumb) {
      return bHasThumb - aHasThumb
    }

    return a.name.localeCompare(b.name)
  })

const featured = projects.slice(0, 24).map((project) => project.slug)

const output = {
  generatedAt: new Date().toISOString(),
  sourcePath: deployIndexPath,
  centerControlGeneratedAt: null,
  domain: 'wordm.us',
  featured,
  projects,
}

fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8')
console.log(`[sync-center-control] wrote ${projects.length} projects from orchestration manager to ${outputPath}`)
