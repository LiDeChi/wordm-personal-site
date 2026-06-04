import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { getProjectPresentation } from '../data/projectPresentation'
import type { Lang } from '../i18n/lang'
import type { PortfolioProject } from '../types'
import type { PortfolioShowreelItem } from './PortfolioShowreelVideo'

type PortfolioShowcaseProps = {
  lang: Lang
  projects: PortfolioProject[]
  onSelectProject: (projectSlug: string) => void
}

type ShowcaseItem = PortfolioShowreelItem & {
  summary: string
  flowPreviewUrls: string[]
}

const COPY = {
  zh: {
    ariaLabel: '重点项目轮播',
    openHint: '点击查看项目弹窗',
    previous: '上一个项目',
    next: '下一个项目',
    projectCountLabel: '项目轮播',
  },
  en: {
    ariaLabel: 'Featured project carousel',
    openHint: 'Open project modal',
    previous: 'Previous project',
    next: 'Next project',
    projectCountLabel: 'Project carousel',
  },
} as const

function wrapIndex(index: number, total: number) {
  return (index + total) % total
}

function ArrowIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      {direction === 'left' ? (
        <path d="M11.8 4.6 6.4 10l5.4 5.4-1.4 1.4L3.6 10l6.8-6.8 1.4 1.4Z" />
      ) : (
        <path d="m8.2 4.6 1.4-1.4L16.4 10l-6.8 6.8-1.4-1.4 5.4-5.4-5.4-5.4Z" />
      )}
    </svg>
  )
}

export function PortfolioShowcase({ lang, projects, onSelectProject }: PortfolioShowcaseProps) {
  const copy = COPY[lang]
  const items = useMemo<ShowcaseItem[]>(() => {
    return projects
      .map((project) => {
        const presentation = getProjectPresentation(project, lang)
        const imageUrl = presentation.reelImageUrl || presentation.thumbnailUrl
        if (!imageUrl) {
          return null
        }

        return {
          slug: project.slug,
          name: presentation.name,
          tagline: presentation.tagline,
          summary: presentation.summary,
          reelKicker: presentation.reelKicker,
          reelLine: presentation.reelLine,
          clipSteps: presentation.clipSteps,
          reelImageUrl: imageUrl,
          flowPreviewUrls: presentation.flowPreviewUrls,
          accent: presentation.accent,
        }
      })
      .filter((item): item is ShowcaseItem => Boolean(item))
  }, [lang, projects])
  const [activeIndex, setActiveIndex] = useState(0)
  const safeActiveIndex = activeIndex < items.length ? activeIndex : 0

  if (!items.length) {
    return null
  }

  const activeItem = items[safeActiveIndex] ?? items[0]
  const activeSteps = activeItem.clipSteps.slice(0, 3)

  function jumpTo(index: number) {
    setActiveIndex(wrapIndex(index, items.length))
  }

  function moveBy(step: number) {
    setActiveIndex((current) => wrapIndex(current + step, items.length))
  }

  return (
    <section className="portfolio-showcase" aria-label={copy.ariaLabel}>
      <div className="portfolio-showcase-stage">
        <div className="portfolio-showcase-carousel">
          <div className="portfolio-showcase-viewport">
            {items.length > 1 ? (
              <button
                type="button"
                className="portfolio-showcase-nav portfolio-showcase-nav-prev"
                onClick={() => moveBy(-1)}
                aria-label={copy.previous}
              >
                <ArrowIcon direction="left" />
              </button>
            ) : null}

            <div className="portfolio-showcase-track" style={{ transform: `translateX(-${safeActiveIndex * 100}%)` }}>
              {items.map((item, index) => {
                const itemCountLabel = `${String(index + 1).padStart(2, '0')}/${String(items.length).padStart(2, '0')}`
                const primaryPreviewUrl = item.flowPreviewUrls[0] || item.reelImageUrl
                const fallbackSteps = [
                  { label: item.reelLine, x: 28, y: 26 },
                  { label: item.reelLine, x: 56, y: 42 },
                  { label: item.reelLine, x: 76, y: 70 },
                ]
                const stageCount = Math.max(2, Math.min(3, item.clipSteps.length || item.flowPreviewUrls.length || 1))
                const flowStages = Array.from({ length: stageCount }, (_, stageIndex) => {
                  const step = item.clipSteps[stageIndex] ?? item.clipSteps[item.clipSteps.length - 1] ?? fallbackSteps[stageIndex]
                  const previewUrl = item.flowPreviewUrls[Math.min(stageIndex, item.flowPreviewUrls.length - 1)] || primaryPreviewUrl

                  return {
                    key: `${item.slug}-${stageIndex + 1}`,
                    index: stageIndex + 1,
                    label: step.label,
                    previewUrl,
                    focusX: step.x,
                    focusY: step.y,
                  }
                })

                return (
                  <article key={item.slug} className="portfolio-showcase-slide" aria-hidden={index !== safeActiveIndex}>
                    <button
                      type="button"
                      className="portfolio-showcase-slide-button"
                      onClick={() => onSelectProject(item.slug)}
                      tabIndex={index === safeActiveIndex ? 0 : -1}
                      aria-label={`${item.name} · ${copy.openHint}`}
                    >
                      <img
                        className="portfolio-showcase-slide-backdrop"
                        src={primaryPreviewUrl}
                        alt=""
                        aria-hidden="true"
                        loading={index === activeIndex ? 'eager' : 'lazy'}
                      />

                      <div className="portfolio-showcase-slide-scrim" aria-hidden="true" />

                      <div className="portfolio-showcase-slide-frame">
                        <div className="portfolio-showcase-slide-topline">
                          <span className="mono portfolio-showcase-counter">{itemCountLabel}</span>
                          <span className="mono portfolio-showcase-kicker">{item.reelKicker}</span>
                        </div>

                        <div className={`portfolio-showcase-flow-board flow-count-${flowStages.length}`}>
                          {flowStages.length > 1 ? <span className="portfolio-showcase-flow-connector connector-1" aria-hidden="true" /> : null}
                          {flowStages.length > 2 ? <span className="portfolio-showcase-flow-connector connector-2" aria-hidden="true" /> : null}

                          {flowStages.map((stage) => (
                            <div
                              key={stage.key}
                              className={`portfolio-showcase-flow-card stage-${stage.index}`}
                              style={
                                {
                                  '--flow-focus-x': `${stage.focusX}%`,
                                  '--flow-focus-y': `${stage.focusY}%`,
                                } as CSSProperties
                              }
                            >
                              <div className="portfolio-showcase-flow-card-head">
                                <span className="mono portfolio-showcase-flow-stage-index">{String(stage.index).padStart(2, '0')}</span>
                                <span className="portfolio-showcase-flow-stage-label">{stage.label}</span>
                              </div>
                              <div className="portfolio-showcase-flow-image-shell">
                                <img
                                  className="portfolio-showcase-flow-image"
                                  src={stage.previewUrl}
                                  alt=""
                                  loading={index === activeIndex ? 'eager' : 'lazy'}
                                />
                              </div>
                            </div>
                          ))}
                        </div>

                        <span className="mono portfolio-showcase-open-hint">{copy.openHint}</span>
                      </div>
                    </button>
                  </article>
                )
              })}
            </div>

            {items.length > 1 ? (
              <button
                type="button"
                className="portfolio-showcase-nav portfolio-showcase-nav-next"
                onClick={() => moveBy(1)}
                aria-label={copy.next}
              >
                <ArrowIcon direction="right" />
              </button>
            ) : null}
          </div>
        </div>

        {items.length > 1 ? (
          <div className="portfolio-showcase-pagination" role="tablist" aria-label={copy.ariaLabel}>
            {items.map((item, index) => {
              const isActive = index === safeActiveIndex

              return (
                <button
                  key={item.slug}
                  type="button"
                  className={`portfolio-showcase-dot${isActive ? ' is-active' : ''}`}
                  onClick={() => jumpTo(index)}
                  aria-label={item.name}
                  aria-selected={isActive}
                  role="tab"
                />
              )
            })}
          </div>
        ) : null}

        <div className="portfolio-showcase-caption">
          <strong>{activeItem.name}</strong>
          <span>{activeItem.tagline || activeItem.reelLine}</span>
          <p>{activeItem.summary || activeItem.reelLine}</p>
          {activeSteps.length ? <div className="portfolio-showcase-caption-line">{activeSteps.map((step) => step.label).join('  ·  ')}</div> : null}
        </div>
      </div>
    </section>
  )
}
