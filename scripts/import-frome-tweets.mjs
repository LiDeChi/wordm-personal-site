import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const sourceDir = path.resolve(projectRoot, '..', '..', 'oneagent-operation', 'docs', 'FroMe_2个月长推文_新版')
const outputPath = path.resolve(projectRoot, 'src', 'data', 'fromeTweets.ts')

function normalizeText(text) {
  return text
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .trim()
}

function truncate(text, maxLength) {
  if (text.length <= maxLength) {
    return text
  }

  return `${text.slice(0, maxLength).trimEnd()}...`
}

function extractBody(markdown) {
  const normalized = normalizeText(markdown)
  const bodyMatch = normalized.match(/##\s*推文正文\s*\n+([\s\S]*)$/)
  const body = bodyMatch ? bodyMatch[1] : normalized
  return body
    .split(/\n{2,}/)
    .map((part) => part.replace(/\n+/g, ' ').trim())
    .filter(Boolean)
}

function extractTitle(markdown, fallbackTitle) {
  const normalized = normalizeText(markdown)
  const match = normalized.match(/^#\s+(.+)$/m)
  return match?.[1]?.trim() || fallbackTitle
}

function extractPublishedAt(markdown, fallbackTimestamp) {
  const normalized = normalizeText(markdown)
  const match = normalized.match(/^发布时间：(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})$/m)
  if (!match) {
    return fallbackTimestamp
  }

  return `${match[1]} ${match[2]}`
}

function toBilingual(value) {
  return `{ zh: ${JSON.stringify(value)}, en: ${JSON.stringify(value)} }`
}

const filePattern = /^(\d{4}-\d{2}-\d{2})_(\d{2})-(\d{2})_(.+)\.md$/

const articles = readdirSync(sourceDir)
  .filter((filename) => filename.endsWith('.md') && !filename.startsWith('00_'))
  .map((filename) => {
    const match = filename.match(filePattern)
    if (!match) {
      throw new Error(`Unexpected FroMe article filename: ${filename}`)
    }

    const [, date, hour, minute, rawTitle] = match
    const markdown = readFileSync(path.join(sourceDir, filename), 'utf8')
    const fallbackTitle = rawTitle.replace(/_/g, ' ').trim()
    const paragraphs = extractBody(markdown)
    const title = extractTitle(markdown, fallbackTitle)
    const timestamp = extractPublishedAt(markdown, `${date} ${hour}:${minute}`)

    return {
      id: `frome-${date}-${hour}-${minute}`,
      sortKey: `${date}T${hour}:${minute}:00`,
      date: `${date.replaceAll('-', '.')} ${hour}:${minute}`,
      title,
      summary: {
        zh: '',
        en: '',
      },
      timestamp,
      paragraphs,
    }
  })
  .sort((a, b) => b.sortKey.localeCompare(a.sortKey))

const content = `import type { BlogArticle } from './blogArticles'

export const FROME_TWEET_ARTICLES: BlogArticle[] = [
${articles
  .map((article) => {
    const paragraphs = article.paragraphs.map((paragraph) => `      ${toBilingual(paragraph)},`).join('\n')

    return `  {
    id: ${JSON.stringify(article.id)},
    title: ${toBilingual(article.title)},
    date: ${JSON.stringify(article.date)},
    category: { zh: 'FroMe', en: 'FroMe' },
    summary: { zh: ${JSON.stringify(article.summary.zh)}, en: ${JSON.stringify(article.summary.en)} },
    note: { zh: '', en: '' },
    source: 'x',
    sourceUrl: null,
    originalPublishedAt: ${JSON.stringify(article.timestamp)},
    paragraphs: [
${paragraphs}
    ],
  },`
  })
  .join('\n')}
]
`

writeFileSync(outputPath, content, 'utf8')
console.log(`Imported ${articles.length} FroMe articles into ${path.relative(projectRoot, outputPath)}`)
