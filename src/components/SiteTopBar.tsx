import type { Lang } from '../i18n/lang'

type SiteTopBarProps = {
  lang: Lang
  mode: 'blog' | 'portfolio'
  onLangChange: (lang: Lang) => void
  onModeChange: (mode: 'blog' | 'portfolio') => void
}

const COPY = {
  zh: {
    langAria: '语言切换',
    viewAria: '视图切换',
    zhLabel: '中文',
    enLabel: 'EN',
    blog: '博客',
    portfolio: '作品集',
  },
  en: {
    langAria: 'Language switch',
    viewAria: 'View switch',
    zhLabel: '中文',
    enLabel: 'EN',
    blog: 'Blog',
    portfolio: 'Portfolio',
  },
} as const

export function SiteTopBar({ lang, mode, onLangChange, onModeChange }: SiteTopBarProps) {
  const copy = COPY[lang]

  return (
    <header className="site-topbar">
      <div className="site-topbar-group" role="tablist" aria-label={copy.langAria}>
        <button type="button" className={`lang-btn ${lang === 'zh' ? 'active' : ''}`} onClick={() => onLangChange('zh')}>
          {copy.zhLabel}
        </button>
        <button type="button" className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => onLangChange('en')}>
          {copy.enLabel}
        </button>
      </div>

      <div className="site-topbar-group" role="tablist" aria-label={copy.viewAria}>
        <button type="button" className={`view-btn ${mode === 'blog' ? 'active' : ''}`} onClick={() => onModeChange('blog')}>
          {copy.blog}
        </button>
        <button type="button" className={`view-btn ${mode === 'portfolio' ? 'active' : ''}`} onClick={() => onModeChange('portfolio')}>
          {copy.portfolio}
        </button>
      </div>
    </header>
  )
}
