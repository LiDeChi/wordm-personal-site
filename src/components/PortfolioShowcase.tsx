import { Player } from '@remotion/player'
import { useMemo } from 'react'
import { getProjectPresentation } from '../data/projectPresentation'
import type { Lang } from '../i18n/lang'
import type { PortfolioProject } from '../types'
import { PortfolioShowreelVideo, type PortfolioShowreelItem } from './PortfolioShowreelVideo'

const SHOWREEL_SLIDE_FRAMES = 96

type PortfolioShowcaseProps = {
  lang: Lang
  projects: PortfolioProject[]
}

const COPY = {
  zh: {
    kicker: 'interface clips',
    title: '先看每个项目自己的界面和一两个关键动作。',
    summary: '这里不再重复列一遍项目入口，只把 7 个核心项目各自做成短 clip。下面的卡片再负责进入详情。',
  },
  en: {
    kicker: 'interface clips',
    title: 'Start from each project interface and one or two key actions.',
    summary: 'This area no longer repeats the project list. It turns the 7 core projects into short clips, while the cards below remain the detail entry point.',
  },
} as const

export function PortfolioShowcase({ lang, projects }: PortfolioShowcaseProps) {
  const copy = COPY[lang]
  const items = useMemo<PortfolioShowreelItem[]>(() => {
    return projects
      .map((project) => {
        const presentation = getProjectPresentation(project, lang)
        if (!presentation.reelImageUrl) {
          return null
        }

        return {
          slug: project.slug,
          name: presentation.name,
          tagline: presentation.tagline,
          reelKicker: presentation.reelKicker,
          reelLine: presentation.reelLine,
          clipSteps: presentation.clipSteps,
          reelImageUrl: presentation.reelImageUrl,
          accent: presentation.accent,
        }
      })
      .filter((item): item is PortfolioShowreelItem => Boolean(item))
  }, [lang, projects])

  if (!items.length) {
    return null
  }

  return (
    <section className="portfolio-showcase" aria-label={lang === 'zh' ? '重点项目演示' : 'Featured project showreel'}>
      <div className="portfolio-showcase-stage">
        <div className="portfolio-showcase-copy">
          <p className="mono portfolio-showcase-kicker">{copy.kicker}</p>
          <h3 className="portfolio-showcase-title">{copy.title}</h3>
          <p className="portfolio-showcase-summary">{copy.summary}</p>
        </div>

        <div className="portfolio-showcase-player-shell">
          <div className="portfolio-showcase-player-frame">
            <Player
              component={PortfolioShowreelVideo}
              inputProps={{ items }}
              durationInFrames={Math.max(items.length * SHOWREEL_SLIDE_FRAMES, SHOWREEL_SLIDE_FRAMES)}
              compositionWidth={1440}
              compositionHeight={900}
              fps={30}
              autoPlay
              loop
              controls={false}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
