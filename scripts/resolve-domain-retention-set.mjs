import fs from 'node:fs'
import path from 'node:path'

const rootDir = path.resolve(import.meta.dirname, '..')
const snapshotPath = path.join(rootDir, 'src/data/projects.snapshot.json')

const fixedDomains = ['admin.wordm.us', 'cv.wordm.us', 'resume.wordm.us']

function readSnapshotProjects() {
  const payload = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'))
  return Array.isArray(payload.projects) ? payload.projects : []
}

function normalizeUrl(rawUrl) {
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return null
  }

  try {
    return new URL(rawUrl).toString()
  } catch {
    return rawUrl.trim()
  }
}

function isDirectExperienceProject(project) {
  return Boolean(normalizeUrl(project.productionUrl))
}

function isHighPriorityProject(project) {
  const activityScore = Number(project.activityScore || 0)
  const tags = Array.isArray(project.tags) ? project.tags : []
  return activityScore >= 75 || tags.includes('ready')
}

function addProjectDomain(set, project) {
  const subdomain = typeof project.subdomain === 'string' ? project.subdomain.trim() : ''
  if (!subdomain) {
    return
  }

  set.add(`${subdomain}.wordm.us`)
}

function buildRetentionSets(projects) {
  const directExperienceDomains = new Set(fixedDomains)
  const highPriorityDomains = new Set(fixedDomains)

  for (const project of projects) {
    if (isDirectExperienceProject(project)) {
      addProjectDomain(directExperienceDomains, project)
    }

    if (isHighPriorityProject(project)) {
      addProjectDomain(highPriorityDomains, project)
    }
  }

  return {
    fixedDomains: [...fixedDomains],
    directExperienceDomains: [...directExperienceDomains].sort((a, b) => a.localeCompare(b)),
    highPriorityDomains: [...highPriorityDomains].sort((a, b) => a.localeCompare(b)),
  }
}

function main() {
  const projects = readSnapshotProjects()
  const retentionSets = buildRetentionSets(projects)
  console.log(JSON.stringify(retentionSets, null, 2))
}

main()
