import { type AuthPanelProps } from './AuthPanel'
import { AccountEntryCard } from './AccountEntryCard'
import type { Lang } from '../i18n/lang'

type SidebarProps = {
  lang: Lang
  onLangChange: (lang: Lang) => void
  authPanel: Omit<AuthPanelProps, 'className'>
  loginHref: string
  unlockPanel?: {
    title: string
    storageLabel: string
    intro: string
    summary: string
    installHintPrefix: string
    installHintLinkLabel: string
    installGuideUrl: string
    bypassNotice: string | null
    statusMessage: string
    actionsDisabled: boolean
    primaryActionLabel: string | null
    onPrimaryAction?: (() => void) | null
    secondaryActionLabel?: string
    onSecondaryAction?: (() => void) | null
  } | null
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

export function Sidebar({ lang, onLangChange, authPanel, loginHref, unlockPanel = null }: SidebarProps) {
  const copy = SIDEBAR_COPY[lang]

  return (
    <aside className="sidebar">
      <AccountEntryCard {...authPanel} loginHref={loginHref} />

      <div className="sidebar-select-stack">
        <label className="sidebar-select-field">
          <span className="mono">{copy.langLabel}</span>
          <select value={lang} onChange={(event) => onLangChange(event.target.value as Lang)}>
            <option value="zh">{copy.zhLabel}</option>
            <option value="en">{copy.enLabel}</option>
          </select>
        </label>
      </div>

      {unlockPanel ? (
        <section className="unlock-control-panel sidebar-unlock-panel" aria-live="polite">
          <div className="sidebar-unlock-head">
            <span className="mono">{unlockPanel.title}</span>
          </div>

          <div className="sidebar-unlock-meta-list">
            <p className="sidebar-unlock-meta">{unlockPanel.storageLabel}</p>
          </div>

          <p className="unlock-control-intro sidebar-unlock-intro">{unlockPanel.intro}</p>
          <p className="unlock-plan-summary sidebar-unlock-summary">{unlockPanel.summary}</p>
          <p className="unlock-control-intro sidebar-unlock-intro">
            {unlockPanel.installHintPrefix}{' '}
            <a href={unlockPanel.installGuideUrl} target="_blank" rel="noreferrer">
              {unlockPanel.installHintLinkLabel}
            </a>
          </p>

          {unlockPanel.bypassNotice ? (
            <p className="unlock-status-message">{unlockPanel.bypassNotice}</p>
          ) : (
            <div className="unlock-plan-actions sidebar-unlock-actions">
              {unlockPanel.primaryActionLabel && unlockPanel.onPrimaryAction ? (
                <button
                  type="button"
                  className="unlock-plan-btn"
                  disabled={unlockPanel.actionsDisabled}
                  onClick={unlockPanel.onPrimaryAction}
                >
                  {unlockPanel.primaryActionLabel}
                </button>
              ) : null}
              {unlockPanel.secondaryActionLabel && unlockPanel.onSecondaryAction ? (
                <button
                  type="button"
                  className="unlock-plan-btn"
                  disabled={unlockPanel.actionsDisabled}
                  onClick={unlockPanel.onSecondaryAction}
                >
                  {unlockPanel.secondaryActionLabel}
                </button>
              ) : null}
            </div>
          )}

          {unlockPanel.statusMessage ? <p className="unlock-status-message">{unlockPanel.statusMessage}</p> : null}
        </section>
      ) : null}
    </aside>
  )
}
