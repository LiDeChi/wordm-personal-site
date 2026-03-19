import { useMemo, useState } from 'react'
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
                const steps = item.clipSteps.slice(0, 3)
                const itemCountLabel = `${String(index + 1).padStart(2, '0')}/${String(items.length).padStart(2, '0')}`

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
                        className="portfolio-showcase-slide-image"
                        src={item.reelImageUrl}
                        alt={item.name}
                        loading={index === activeIndex ? 'eager' : 'lazy'}
                      />

                      <div className="portfolio-showcase-slide-scrim" aria-hidden="true" />

                      <div className="portfolio-showcase-slide-topline">
                        <span className="mono portfolio-showcase-counter">{itemCountLabel}</span>
                        <span className="mono portfolio-showcase-kicker">{item.reelKicker}</span>
                      </div>

                      <div className="portfolio-showcase-slide-copy">
                        <div className="portfolio-showcase-slide-copy-body">
                          <h3 className="portfolio-showcase-slide-title">{item.name}</h3>
                          <p className="portfolio-showcase-slide-tagline">{item.tagline || item.summary || item.reelLine}</p>
                          {steps.length ? (
                            <div className="portfolio-showcase-step-list">
                              {steps.map((step, stepIndex) => (
                                <div key={`${item.slug}-${step.label}`} className="portfolio-showcase-step-item">
                                  <span className="mono portfolio-showcase-step-index">{String(stepIndex + 1).padStart(2, '0')}</span>
                                  <span className="portfolio-showcase-step-label">{step.label}</span>
                                </div>
                              ))}
                            </div>
                          ) : null}
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
          <span>{activeItem.reelLine}</span>
        </div>
      </div>
    </section>
  )
}
