type SiteHeroBannerProps = {
  className?: string
}

export function SiteHeroBanner({ className }: SiteHeroBannerProps) {
  const rootClassName = className ? `site-hero-banner ${className}` : 'site-hero-banner'

  return (
    <img
      className={rootClassName}
      src="/site-hero-banner.svg"
      alt="Site wide hero banner"
      loading="eager"
      decoding="async"
    />
  )
}
