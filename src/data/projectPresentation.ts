import type { Lang } from '../i18n/lang'
import type { PortfolioProject } from '../types'

type LocalizedText = Record<Lang, string>

type ProjectClipStepOverride = {
  label: LocalizedText
  x: number
  y: number
}

type ProjectPresentationOverride = {
  name: LocalizedText
  tagline: LocalizedText
  summary: LocalizedText
  reelKicker: LocalizedText
  reelLine: LocalizedText
  clipSteps?: ProjectClipStepOverride[]
  thumbnailUrl?: string
  reelImageUrl?: string
  detailPreviewUrls?: string[]
  accent: string
}

export type ProjectPresentationClipStep = {
  label: string
  x: number
  y: number
}

export type ProjectPresentation = {
  slug: string
  name: string
  tagline: string
  summary: string
  reelKicker: string
  reelLine: string
  clipSteps: ProjectPresentationClipStep[]
  thumbnailUrl: string | null
  reelImageUrl: string | null
  detailPreviewUrls: string[]
  accent: string
}

export const FEATURED_PROJECT_SLUGS = [
  'book-ingest',
  'focusor',
  'gridnote',
  'ai-stroke-writer',
  'apple-notes-webclipper',
] as const

const PROJECT_PRESENTATION_OVERRIDES: Record<string, ProjectPresentationOverride> = {
  'book-ingest': {
    name: {
      zh: 'Book Ingest',
      en: 'Book Ingest',
    },
    tagline: {
      zh: '用场景化改造中',
      en: 'Shifting toward scenario-led reading',
    },
    summary: {
      zh: '把 PDF 上传、解析和按章推进放在同一条阅读动线上，而不是只做一个被动的导入队列。',
      en: 'Turns PDF upload, parsing, and chapter-based progress into one guided reading flow instead of a passive ingest queue.',
    },
    reelKicker: {
      zh: '阅读场景',
      en: 'Reading flow',
    },
    reelLine: {
      zh: '上传、解析、按章阅读',
      en: 'Upload, parse, read by chapter',
    },
    clipSteps: [
      {
        label: {
          zh: '上传 PDF',
          en: 'Upload PDF',
        },
        x: 18,
        y: 18,
      },
      {
        label: {
          zh: '解析章节',
          en: 'Parse chapters',
        },
        x: 54,
        y: 34,
      },
      {
        label: {
          zh: '进入阅读流',
          en: 'Enter reading flow',
        },
        x: 79,
        y: 74,
      },
    ],
    thumbnailUrl: '/showcase/book-ingest-reader-shot.png',
    reelImageUrl: '/showcase/book-ingest-reader-shot.png',
    detailPreviewUrls: ['/showcase/book-ingest-reader-shot.png', '/orchestration-gallery/book-ingest.png'],
    accent: '#0d6a61',
  },
  'auto-test-1': {
    name: {
      zh: 'Auto-test-1',
      en: 'Auto-test-1',
    },
    tagline: {
      zh: '自动验收系统',
      en: 'Automated acceptance system',
    },
    summary: {
      zh: '把 RED→GREEN→REFACTOR 和验收证据产出绑定成一条闭环流水线，避免测试只停留在口头描述。',
      en: 'Binds RED, GREEN, REFACTOR, and evidence capture into one closed-loop pipeline so testing does not stop at verbal claims.',
    },
    reelKicker: {
      zh: '闭环验收',
      en: 'Closed-loop QA',
    },
    reelLine: {
      zh: 'TDD、验收、证据链',
      en: 'TDD, acceptance, evidence',
    },
    clipSteps: [
      {
        label: {
          zh: '选择任务',
          en: 'Pick task',
        },
        x: 17,
        y: 21,
      },
      {
        label: {
          zh: '运行验收',
          en: 'Run acceptance',
        },
        x: 53,
        y: 38,
      },
      {
        label: {
          zh: '产出证据',
          en: 'Capture evidence',
        },
        x: 82,
        y: 74,
      },
    ],
    thumbnailUrl: '/showcase/auto-test-1-shot.png',
    reelImageUrl: '/showcase/auto-test-1-shot.png',
    accent: '#141414',
  },
  'center-control': {
    name: {
      zh: 'Center Control',
      en: 'Center Control',
    },
    tagline: {
      zh: '控制中枢',
      en: 'Control hub',
    },
    summary: {
      zh: '把跨项目的监控、展示、同步和分发放回同一个中枢，减少信息散落在各处的管理成本。',
      en: 'Puts monitoring, presentation, sync, and distribution for multiple projects back into one hub instead of scattering them everywhere.',
    },
    reelKicker: {
      zh: '中枢面板',
      en: 'Control panel',
    },
    reelLine: {
      zh: '监控、展示、分发',
      en: 'Monitor, present, distribute',
    },
    clipSteps: [
      {
        label: {
          zh: '看全局面板',
          en: 'Read global board',
        },
        x: 21,
        y: 25,
      },
      {
        label: {
          zh: '切换控制区',
          en: 'Switch control area',
        },
        x: 59,
        y: 37,
      },
      {
        label: {
          zh: '追踪状态',
          en: 'Track status',
        },
        x: 81,
        y: 18,
      },
    ],
    thumbnailUrl: '/orchestration-gallery/center-control.png',
    reelImageUrl: '/orchestration-gallery/center-control.png',
    accent: '#3b6e79',
  },
  focusor: {
    name: {
      zh: 'Focusor',
      en: 'Focusor',
    },
    tagline: {
      zh: '快速阅览网页并给出交互指示',
      en: 'Quick web reading with next-step guidance',
    },
    summary: {
      zh: '先把网页内容压缩成可快速扫读的概览，再明确告诉用户下一步应该点哪里、怎么继续。',
      en: 'Compresses a page into a quick-read overview, then tells the user exactly what to click next and how to proceed.',
    },
    reelKicker: {
      zh: '网页指引',
      en: 'Web guidance',
    },
    reelLine: {
      zh: '概览、提示、下一步',
      en: 'Overview, hints, next step',
    },
    clipSteps: [
      {
        label: {
          zh: '压缩页面',
          en: 'Compress page',
        },
        x: 27,
        y: 24,
      },
      {
        label: {
          zh: '给出提示',
          en: 'Show guidance',
        },
        x: 71,
        y: 41,
      },
      {
        label: {
          zh: '执行下一步',
          en: 'Take next step',
        },
        x: 77,
        y: 76,
      },
    ],
    thumbnailUrl: '/showcase/focusor-overlay-shot.png',
    reelImageUrl: '/showcase/focusor-overlay-shot.png',
    detailPreviewUrls: ['/showcase/focusor-overlay-shot.png', '/showcase/focusor-options-shot.png'],
    accent: '#846248',
  },
  gridnote: {
    name: {
      zh: 'Gridnote',
      en: 'Gridnote',
    },
    tagline: {
      zh: '格子笔记，一字一格，学习中文的好工具',
      en: 'Grid notes for learning Chinese one character at a time',
    },
    summary: {
      zh: '把书写、拆字和记忆重新放回格子里，适合中文学习、临摹和慢速输入训练。',
      en: 'Places writing, character breakdown, and memory back into a grid, making it useful for Chinese learning, tracing, and deliberate input.',
    },
    reelKicker: {
      zh: '格子笔记',
      en: 'Grid notebook',
    },
    reelLine: {
      zh: '一字一格、书写、学中文',
      en: 'One grid, one character',
    },
    clipSteps: [
      {
        label: {
          zh: '选字',
          en: 'Pick character',
        },
        x: 22,
        y: 21,
      },
      {
        label: {
          zh: '进入格子练写',
          en: 'Write in grid',
        },
        x: 56,
        y: 58,
      },
      {
        label: {
          zh: '查看结果',
          en: 'Review result',
        },
        x: 84,
        y: 24,
      },
    ],
    thumbnailUrl: '/showcase/gridnote-workspace-shot.png',
    reelImageUrl: '/showcase/gridnote-workspace-shot.png',
    detailPreviewUrls: ['/showcase/gridnote-workspace-shot.png', '/showcase/gridnote-fileyard-shot.png'],
    accent: '#5f7c4d',
  },
  'ai-stroke-writer': {
    name: {
      zh: 'AI Stroke Writer',
      en: 'AI Stroke Writer',
    },
    tagline: {
      zh: '把文本和 LaTeX 变成一笔一划的书写计划',
      en: 'Turn text and LaTeX into stroke-by-stroke writing plans',
    },
    summary: {
      zh: '从纯文本到笔画路径，给手写生成、讲解和排版一个统一接口，不只是单次导出工具。',
      en: 'Gives handwriting generation, explanation, and layout a shared interface from plain text to stroke paths instead of a one-off export tool.',
    },
    reelKicker: {
      zh: '书写生成',
      en: 'Writing generation',
    },
    reelLine: {
      zh: '文本、LaTeX、笔画路径',
      en: 'Text, LaTeX, stroke paths',
    },
    clipSteps: [
      {
        label: {
          zh: '输入文本 / LaTeX',
          en: 'Input text / LaTeX',
        },
        x: 18,
        y: 20,
      },
      {
        label: {
          zh: '生成笔画',
          en: 'Generate strokes',
        },
        x: 58,
        y: 36,
      },
      {
        label: {
          zh: '预览书写',
          en: 'Preview writing',
        },
        x: 78,
        y: 72,
      },
    ],
    thumbnailUrl: '/showcase/ai-stroke-prism-shot.png',
    reelImageUrl: '/showcase/ai-stroke-prism-shot.png',
    detailPreviewUrls: ['/showcase/ai-stroke-prism-shot.png', '/showcase/ai-stroke-runtime-shot.png'],
    accent: '#5b7092',
  },
  'apple-notes-webclipper': {
    name: {
      zh: 'iNotes',
      en: 'iNotes',
    },
    tagline: {
      zh: '把备忘录提升为项目管理器',
      en: 'Turn notes into a project manager',
    },
    summary: {
      zh: '把网页内容以 Markdown 结构送进 Apple Notes，让备忘录从收藏夹变成可继续整理和推进的项目入口。',
      en: 'Sends web content into Apple Notes as structured Markdown so notes become a place to continue organizing and pushing work forward.',
    },
    reelKicker: {
      zh: '备忘录升级',
      en: 'Notes upgraded',
    },
    reelLine: {
      zh: '抓取、Markdown、项目推进',
      en: 'Capture, Markdown, follow-through',
    },
    clipSteps: [
      {
        label: {
          zh: '抓取页面',
          en: 'Capture page',
        },
        x: 18,
        y: 18,
      },
      {
        label: {
          zh: '清理 Markdown',
          en: 'Clean Markdown',
        },
        x: 56,
        y: 38,
      },
      {
        label: {
          zh: '送入 Notes',
          en: 'Send to Notes',
        },
        x: 81,
        y: 74,
      },
    ],
    thumbnailUrl: '/showcase/apple-notes-webclipper-shot.png',
    reelImageUrl: '/showcase/apple-notes-webclipper-shot.png',
    detailPreviewUrls: ['/showcase/apple-notes-webclipper-shot.png'],
    accent: '#73737e',
  },
}

function fallbackKicker(project: PortfolioProject, lang: Lang) {
  if (lang === 'zh') {
    return project.detail?.status === 'ready' ? '可展示项目' : '进行中的项目'
  }

  return project.detail?.status === 'ready' ? 'Ready project' : 'In-progress project'
}

function fallbackLine(project: PortfolioProject, lang: Lang) {
  const stack = project.techStack.slice(0, 3).join(', ')
  if (stack) {
    return stack
  }

  return lang === 'zh' ? '项目展示中' : 'In showcase'
}

export function getProjectPresentation(project: PortfolioProject, lang: Lang): ProjectPresentation {
  const override = PROJECT_PRESENTATION_OVERRIDES[project.slug]
  const clipSteps =
    override?.clipSteps?.map((step) => ({
      label: step.label[lang],
      x: step.x,
      y: step.y,
    })) ?? [
      {
        label: override?.reelLine[lang] ?? fallbackLine(project, lang),
        x: 50,
        y: 56,
      },
    ]

  return {
    slug: project.slug,
    name: override?.name[lang] ?? project.name,
    tagline: override?.tagline[lang] ?? project.tagline,
    summary: override?.summary[lang] ?? project.summary,
    reelKicker: override?.reelKicker[lang] ?? fallbackKicker(project, lang),
    reelLine: override?.reelLine[lang] ?? fallbackLine(project, lang),
    clipSteps,
    thumbnailUrl: override?.thumbnailUrl ?? project.thumbnailUrl,
    reelImageUrl: override?.reelImageUrl ?? override?.thumbnailUrl ?? project.thumbnailUrl,
    detailPreviewUrls: override?.detailPreviewUrls ?? [override?.thumbnailUrl ?? project.thumbnailUrl].filter((item): item is string => Boolean(item)),
    accent: override?.accent ?? '#4d4d4d',
  }
}

export function getFeaturedProjectSlugs(projects: PortfolioProject[]) {
  return FEATURED_PROJECT_SLUGS.filter((slug) => projects.some((project) => project.slug === slug))
}
