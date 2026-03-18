import type { Lang } from '../i18n/lang'

type SidebarProps = {
  lang: Lang
  onLangChange: (lang: Lang) => void
}

const SIDEBAR_COPY = {
  zh: {
    langLabel: '语言',
    zhLabel: '中文',
    enLabel: 'EN',
  },
  en: {
    langLabel: 'Language',
    zhLabel: '中文',
    enLabel: 'EN',
  },
} as const

export function Sidebar({ lang, onLangChange }: SidebarProps) {
  const copy = SIDEBAR_COPY[lang]

  return (
    <aside className="sidebar">
      <div className="sidebar-select-stack">
        <label className="sidebar-select-field">
          <span className="mono">{copy.langLabel}</span>
          <select value={lang} onChange={(event) => onLangChange(event.target.value as Lang)}>
            <option value="zh">{copy.zhLabel}</option>
            <option value="en">{copy.enLabel}</option>
          </select>
        </label>
      </div>
    </aside>
  )
}
