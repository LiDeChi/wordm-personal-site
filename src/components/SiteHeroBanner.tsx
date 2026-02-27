import type { Lang } from '../i18n/lang'

type SiteHeroBannerProps = {
  lang?: Lang
  className?: string
}

export function SiteHeroBanner({ lang = 'zh', className }: SiteHeroBannerProps) {
  const rootClassName = className ? `site-hero-banner ${className}` : 'site-hero-banner'
  const alt = lang === 'zh' ? '站点顶图' : 'Site hero banner'

  return (
    <img
      className={rootClassName}
      src="/site-hero-banner.svg"
      alt={alt}
      loading="eager"
      decoding="async"
    />
  )
}
