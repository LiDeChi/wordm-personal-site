import { AbsoluteFill, Easing, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'

export type PortfolioShowreelStep = {
  label: string
  x: number
  y: number
}

export type PortfolioShowreelItem = {
  slug: string
  name: string
  tagline: string
  reelKicker: string
  reelLine: string
  clipSteps: PortfolioShowreelStep[]
  reelImageUrl: string
  accent: string
}

type PortfolioShowreelVideoProps = {
  items: PortfolioShowreelItem[]
}

const SLIDE_FRAMES = 96

function toStaticAssetPath(path: string) {
  return path.replace(/^\/+/, '')
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function ShowcaseSlide({ item, index, total }: { item: PortfolioShowreelItem; index: number; total: number }) {
  const frame = useCurrentFrame()
  const { durationInFrames, fps } = useVideoConfig()
  const fadeInFrames = 12
  const fadeOutFrames = 12
  const steps = item.clipSteps.length ? item.clipSteps : [{ label: item.reelLine, x: 50, y: 56 }]
  const stepCount = steps.length
  const segmentFrames = durationInFrames / stepCount
  const safeFrame = Math.min(frame, durationInFrames - 1)
  const activeStepIndex = Math.min(stepCount - 1, Math.floor(safeFrame / segmentFrames))
  const activeStep = steps[activeStepIndex]
  const nextStep = steps[Math.min(activeStepIndex + 1, stepCount - 1)]
  const segmentFrame = safeFrame - activeStepIndex * segmentFrames
  const moveProgress =
    activeStepIndex >= stepCount - 1
      ? 0
      : interpolate(segmentFrame, [0, segmentFrames * 0.34, segmentFrames], [0, 0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.bezier(0.22, 1, 0.36, 1),
        })

  const cursorX = interpolate(moveProgress, [0, 1], [activeStep.x, nextStep.x], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const cursorY = interpolate(moveProgress, [0, 1], [activeStep.y, nextStep.y], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const opacity = interpolate(frame, [0, fadeInFrames, durationInFrames - fadeOutFrames, durationInFrames], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  })
  const panelLift = interpolate(frame, [0, durationInFrames], [18, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  })
  const copyScale = spring({
    frame,
    fps,
    config: {
      damping: 16,
      stiffness: 90,
      mass: 0.9,
    },
  })
  const pulseScale = spring({
    frame: segmentFrame,
    fps,
    config: {
      damping: 14,
      stiffness: 120,
      mass: 0.7,
    },
  })
  const imageScale = interpolate(frame, [0, durationInFrames], [1.1, 1.03], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const imageTranslateX = interpolate(cursorX, [0, 100], [26, -24], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const imageTranslateY = interpolate(cursorY, [0, 100], [20, -20], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const cursorDriftX = interpolate(segmentFrame, [0, segmentFrames], [-20, 12], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const cursorDriftY = interpolate(segmentFrame, [0, segmentFrames], [-14, 8], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const tooltipLeft = clamp(activeStep.x + (activeStep.x > 70 ? -27 : 4), 6, 70)
  const tooltipTop = clamp(activeStep.y + (activeStep.y > 66 ? -18 : 5), 6, 78)

  return (
    <AbsoluteFill
      style={{
        opacity,
        background: `radial-gradient(circle at 12% 16%, ${item.accent}22 0%, transparent 42%), linear-gradient(135deg, #f8f6f1 0%, #ece7de 100%)`,
        color: '#181818',
      }}
    >
      <AbsoluteFill
        style={{
          padding: 54,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 0.88fr) minmax(0, 1.55fr)',
          gap: 24,
        }}
      >
        <div
          style={{
            display: 'grid',
            alignContent: 'space-between',
            gap: 18,
            border: '1px solid rgba(24, 24, 24, 0.08)',
            borderRadius: 30,
            background: 'rgba(255, 255, 255, 0.76)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08)',
            padding: '34px 30px 30px',
            transform: `translateY(${panelLift}px) scale(${0.96 + copyScale * 0.04})`,
          }}
        >
          <div style={{ display: 'grid', gap: 20 }}>
            <div style={{ display: 'grid', gap: 12 }}>
              <div
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 22,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#6d675f',
                }}
              >
                {item.reelKicker}
              </div>
              <div
                style={{
                  fontFamily: '"Noto Serif SC", "Noto Serif", serif',
                  fontSize: 70,
                  fontWeight: 700,
                  lineHeight: 1.03,
                  letterSpacing: '-0.04em',
                }}
              >
                {item.name}
              </div>
            </div>

            <div
              style={{
                fontFamily: '"Noto Serif SC", "Noto Serif", serif',
                fontSize: 30,
                lineHeight: 1.4,
                color: '#3a3834',
              }}
            >
              {item.tagline}
            </div>
          </div>

          <div style={{ display: 'grid', gap: 16 }}>
            <div
              style={{
                width: 82,
                height: 4,
                borderRadius: 999,
                background: item.accent,
              }}
            />

            <div
              style={{
                display: 'grid',
                gap: 10,
              }}
            >
              {steps.map((step, stepIndex) => (
                <div
                  key={`${item.slug}-${step.label}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto minmax(0, 1fr)',
                    gap: 10,
                    alignItems: 'center',
                    padding: '10px 12px',
                    borderRadius: 18,
                    border: `1px solid ${stepIndex === activeStepIndex ? `${item.accent}55` : 'rgba(24, 24, 24, 0.08)'}`,
                    background: stepIndex === activeStepIndex ? `${item.accent}14` : 'rgba(255, 255, 255, 0.58)',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 18,
                      color: stepIndex === activeStepIndex ? '#1d1d1d' : '#7a746d',
                    }}
                  >
                    {String(stepIndex + 1).padStart(2, '0')}
                  </span>
                  <span
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 20,
                      lineHeight: 1.35,
                      color: stepIndex === activeStepIndex ? '#26231f' : '#625d57',
                    }}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 34,
            border: '1px solid rgba(24, 24, 24, 0.08)',
            background: '#f2eee7',
            boxShadow: '0 24px 70px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Img
            src={staticFile(toStaticAssetPath(item.reelImageUrl))}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: `translate(${imageTranslateX}px, ${imageTranslateY}px) scale(${imageScale})`,
            }}
          />

          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(circle at ${cursorX}% ${cursorY}%, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.08) 8%, rgba(18, 18, 18, 0) 24%), linear-gradient(180deg, rgba(17, 17, 17, 0.06) 0%, rgba(17, 17, 17, 0.02) 38%, rgba(17, 17, 17, 0.14) 100%)`,
            }}
          />

          <div
            style={{
              position: 'absolute',
              left: 24,
              top: 24,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              borderRadius: 999,
              border: '1px solid rgba(255, 255, 255, 0.28)',
              background: 'rgba(255, 255, 255, 0.78)',
              padding: '8px 14px',
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.08)',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 18,
              color: '#433e38',
            }}
          >
            <span>{`${String(index + 1).padStart(2, '0')}/${String(total).padStart(2, '0')}`}</span>
            <span>wordm.us</span>
          </div>

          <div
            style={{
              position: 'absolute',
              left: `calc(${activeStep.x}% - 24px)`,
              top: `calc(${activeStep.y}% - 24px)`,
              width: 48,
              height: 48,
              borderRadius: 999,
              border: `2px solid ${item.accent}`,
              background: `${item.accent}18`,
              boxShadow: `0 0 0 ${18 * pulseScale}px ${item.accent}20`,
            }}
          />

          <div
            style={{
              position: 'absolute',
              left: `calc(${tooltipLeft}% - 4px)`,
              top: `calc(${tooltipTop}% - 4px)`,
              maxWidth: '38%',
              borderRadius: 18,
              border: '1px solid rgba(255, 255, 255, 0.22)',
              background: 'rgba(18, 18, 18, 0.72)',
              color: '#fff',
              padding: '11px 14px',
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.16)',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 18,
              lineHeight: 1.35,
            }}
          >
            {activeStep.label}
          </div>

          <div
            style={{
              position: 'absolute',
              left: `calc(${cursorX}% - 13px + ${cursorDriftX}px)`,
              top: `calc(${cursorY}% - 13px + ${cursorDriftY}px)`,
              width: 28,
              height: 28,
              filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.28))',
            }}
          >
            <svg viewBox="0 0 28 28" width="28" height="28" fill="none">
              <path d="M5.5 3.5L20.7 14.2L13.7 16.5L17.3 24.5L13.6 26.1L10 18L4.7 23.5L5.5 3.5Z" fill="#ffffff" />
              <path
                d="M5.5 3.5L20.7 14.2L13.7 16.5L17.3 24.5L13.6 26.1L10 18L4.7 23.5L5.5 3.5Z"
                stroke="rgba(22,22,22,0.72)"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

export function PortfolioShowreelVideo({ items }: PortfolioShowreelVideoProps) {
  return (
    <AbsoluteFill>
      {items.map((item, index) => (
        <Sequence key={item.slug} from={index * SLIDE_FRAMES} durationInFrames={SLIDE_FRAMES}>
          <ShowcaseSlide item={item} index={index} total={items.length} />
        </Sequence>
      ))}
    </AbsoluteFill>
  )
}
