import { useState, type FormEvent } from 'react'
import type { AuthRole } from '../lib/auth'
import type { Lang } from '../i18n/lang'
import { roleLabel } from '../i18n/roles'

export type AccountTier = 'free' | 'single' | 'all_current' | 'all_access' | 'privileged'

type LoginPageProps = {
  lang: Lang
  enabled: boolean
  loading: boolean
  busy: boolean
  userEmail: string | null
  userRole: AuthRole
  statusMessage: string
  homeHref: string
  accountTier: AccountTier
  unlockedProjectCount: number
  singleUpgradeHref: string
  singleUpgradeEnabled: boolean
  singleUpgradePriceLabel: string | null
  allAccessEnabled: boolean
  allAccessPriceLabel: string | null
  upgradeBusy: boolean
  upgradeStatusMessage: string
  onLangChange: (lang: Lang) => void
  onLogin: (email: string, password: string) => Promise<void> | void
  onSignup: (email: string, password: string) => Promise<void> | void
  onGoogleLogin: () => Promise<void> | void
  onLogout: () => Promise<void> | void
  onUpgradeAllAccess: () => Promise<void> | void
}

type LoginMode = 'login' | 'signup'

const LOGIN_COPY = {
  zh: {
    kicker: 'Fount Account',
    title: '登录你的 Fount',
    subtitle: '一个账号承接身份、权限、同步和购买状态。进入 Field、下载版本和管理访问都从这里开始。',
    loginMode: '登录',
    signupMode: '创建',
    emailLabel: '邮箱',
    passwordLabel: '密码',
    emailPlaceholder: 'you@example.com',
    passwordPlaceholder: '至少 6 位',
    loginAction: '进入 Fount',
    signupAction: '创建 Fount 账号',
    googleAction: '使用 Google 继续',
    processing: '处理中...',
    disabled: '账号系统暂不可用。请先配置 Supabase 后再登录。',
    restoring: '正在恢复 Fount 会话...',
    backHome: '返回 Fount',
    currentRole: '当前身份',
    currentLevel: '当前级别',
    unlockedProjects: '已解锁作品',
    upgradeTitle: '账号升级',
    currentBadge: '当前',
    nextBadge: '下一档',
    includedBadge: '已包含',
    logout: '退出',
    signedInTitle: 'Fount 已连接',
    signedInBody: '这个账号会承接你的 Field 权限、下载状态和后续同步。',
    freeTierName: '免费版',
    freeTierBody: '保留账号身份、公开内容和默认免费部署。',
    singleTierName: '单作品解锁',
    singleTierBody: '按作品打开完整访问，适合先升级一个正在使用的项目。',
    allCurrentTierName: '当前全部作品',
    allCurrentTierBody: '已覆盖当前目录内的作品；下一档可包含后续新增作品。',
    allAccessTierName: '全部解锁',
    allAccessTierBody: '当前与后续作品都进入完整访问。',
    privilegedTierName: '管理/测试权限',
    privilegedTierBody: '当前身份已可访问全部作品，无需额外升级。',
    chooseProjectAction: '选择作品',
    upgradeAllAction: '升级全部',
    unavailableAction: '暂未开放',
    highestHint: '已经是最高级别。',
    noPrice: '价格待配置',
  },
  en: {
    kicker: 'Fount Account',
    title: 'Sign in to Fount',
    subtitle: 'One account carries identity, permissions, sync, purchases, Field access, and release downloads.',
    loginMode: 'Sign in',
    signupMode: 'Create',
    emailLabel: 'Email',
    passwordLabel: 'Password',
    emailPlaceholder: 'you@example.com',
    passwordPlaceholder: 'At least 6 characters',
    loginAction: 'Enter Fount',
    signupAction: 'Create Fount account',
    googleAction: 'Continue with Google',
    processing: 'Processing...',
    disabled: 'Account access is unavailable until Supabase is configured.',
    restoring: 'Restoring Fount session...',
    backHome: 'Back to Fount',
    currentRole: 'Current role',
    currentLevel: 'Current level',
    unlockedProjects: 'Unlocked projects',
    upgradeTitle: 'Account upgrades',
    currentBadge: 'Current',
    nextBadge: 'Next tier',
    includedBadge: 'Included',
    logout: 'Log out',
    signedInTitle: 'Fount is connected',
    signedInBody: 'This account now carries your Field permissions, download state, and future sync.',
    freeTierName: 'Free',
    freeTierBody: 'Keeps account identity, public content, and default free deploy.',
    singleTierName: 'Single project',
    singleTierBody: 'Unlock one project at a time when you know what you want to use.',
    allCurrentTierName: 'Current catalog',
    allCurrentTierBody: 'Covers the current project catalog; upgrade once more to include future projects.',
    allAccessTierName: 'All access',
    allAccessTierBody: 'Full access for current and future projects.',
    privilegedTierName: 'Admin / tester',
    privilegedTierBody: 'This role already has full project access and does not need an upgrade.',
    chooseProjectAction: 'Choose project',
    upgradeAllAction: 'Upgrade all',
    unavailableAction: 'Unavailable',
    highestHint: 'You are already on the highest tier.',
    noPrice: 'Price pending',
  },
} as const

function priceText(priceLabel: string | null, fallback: string) {
  return priceLabel?.trim() || fallback
}

export function LoginPage({
  lang,
  enabled,
  loading,
  busy,
  userEmail,
  userRole,
  statusMessage,
  homeHref,
  accountTier,
  unlockedProjectCount,
  singleUpgradeHref,
  singleUpgradeEnabled,
  singleUpgradePriceLabel,
  allAccessEnabled,
  allAccessPriceLabel,
  upgradeBusy,
  upgradeStatusMessage,
  onLangChange,
  onLogin,
  onSignup,
  onGoogleLogin,
  onLogout,
  onUpgradeAllAccess,
}: LoginPageProps) {
  const copy = LOGIN_COPY[lang]
  const [mode, setMode] = useState<LoginMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const currentTierName = accountTier === 'privileged'
    ? copy.privilegedTierName
    : accountTier === 'all_access'
      ? copy.allAccessTierName
      : accountTier === 'all_current'
        ? copy.allCurrentTierName
        : accountTier === 'single'
          ? copy.singleTierName
          : copy.freeTierName
  const nextTier = accountTier === 'free' ? 'single' : accountTier === 'single' || accountTier === 'all_current' ? 'all_access' : null
  const isHighestTier = !nextTier
  const upgradeCards = [
    {
      key: 'free' as const,
      title: copy.freeTierName,
      body: copy.freeTierBody,
      price: lang === 'zh' ? '永久免费' : 'Free forever',
      current: accountTier === 'free',
      next: false,
    },
    {
      key: 'single' as const,
      title: copy.singleTierName,
      body: copy.singleTierBody,
      price: priceText(singleUpgradePriceLabel, lang === 'zh' ? '按作品价格' : 'Per-project price'),
      current: accountTier === 'single',
      next: nextTier === 'single',
    },
    ...(accountTier === 'all_current'
      ? [
          {
            key: 'all_current' as const,
            title: copy.allCurrentTierName,
            body: copy.allCurrentTierBody,
            price: copy.includedBadge,
            current: true,
            next: false,
          },
        ]
      : []),
    {
      key: 'all_access' as const,
      title: accountTier === 'privileged' ? copy.privilegedTierName : copy.allAccessTierName,
      body: accountTier === 'privileged' ? copy.privilegedTierBody : copy.allAccessTierBody,
      price: accountTier === 'privileged' || accountTier === 'all_access' ? copy.includedBadge : priceText(allAccessPriceLabel, copy.noPrice),
      current: accountTier === 'all_access' || accountTier === 'privileged',
      next: nextTier === 'all_access',
    },
  ]

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalizedEmail = email.trim()
    if (!normalizedEmail || !password) {
      return
    }

    if (mode === 'login') {
      void onLogin(normalizedEmail, password)
      return
    }

    void onSignup(normalizedEmail, password)
  }

  return (
    <div className="login-page-shell fount-login-page" data-lang={lang}>
      <div className="login-page-topbar">
        <a className="login-back-link" href={homeHref}>
          <span className="login-brand-mark" aria-hidden="true">F</span>
          <span>{copy.backHome}</span>
        </a>
        <div className="login-lang-switch" role="group" aria-label="Language">
          <button type="button" className={lang === 'zh' ? 'active' : ''} onClick={() => onLangChange('zh')}>
            中文
          </button>
          <button type="button" className={lang === 'en' ? 'active' : ''} onClick={() => onLangChange('en')}>
            EN
          </button>
        </div>
      </div>

      <main className={`login-page-main${userEmail ? ' account-page-main' : ''}`}>
        <section className="login-page-copy">
          <p className="mono login-page-kicker">{copy.kicker}</p>
          <h1>{copy.title}</h1>
          <p className="login-page-subtitle">{copy.subtitle}</p>
        </section>

        <section className="login-page-card">
          {!enabled ? <p className="auth-muted">{copy.disabled}</p> : null}
          {enabled && loading ? <p className="auth-muted">{copy.restoring}</p> : null}

          {enabled && !loading && userEmail ? (
            <div className="login-signed-in-card">
              <h2>{copy.signedInTitle}</h2>
              <p className="login-page-subtitle">{copy.signedInBody}</p>
              <div className="account-overview-grid">
                <div className="account-overview-item account-overview-item-wide">
                  <span>{copy.emailLabel}</span>
                  <strong title={userEmail}>{userEmail}</strong>
                </div>
                <div className="account-overview-item">
                  <span>{copy.currentRole}</span>
                  <strong>{roleLabel(userRole, lang)}</strong>
                </div>
                <div className="account-overview-item">
                  <span>{copy.currentLevel}</span>
                  <strong>{currentTierName}</strong>
                </div>
                <div className="account-overview-item">
                  <span>{copy.unlockedProjects}</span>
                  <strong>{unlockedProjectCount}</strong>
                </div>
              </div>

              <section className="account-upgrade-panel" aria-label={copy.upgradeTitle}>
                <div className="account-upgrade-head">
                  <h3>{copy.upgradeTitle}</h3>
                  {isHighestTier ? <p>{copy.highestHint}</p> : null}
                </div>
                <div className="account-tier-grid">
                  {upgradeCards.map((tier) => (
                    <article
                      className={[
                        'account-tier-card',
                        tier.current ? 'current' : '',
                        tier.next ? 'next' : '',
                      ].filter(Boolean).join(' ')}
                      key={tier.key}
                    >
                      <div className="account-tier-card-head">
                        <h4>{tier.title}</h4>
                        {tier.current ? <span>{copy.currentBadge}</span> : null}
                        {!tier.current && tier.next ? <span>{copy.nextBadge}</span> : null}
                      </div>
                      <p>{tier.body}</p>
                      <strong className="account-tier-price">{tier.price}</strong>
                      {tier.key === 'single' && !tier.current && !isHighestTier ? (
                        <a
                          className="auth-primary-btn account-tier-action"
                          href={singleUpgradeEnabled ? singleUpgradeHref : undefined}
                          aria-disabled={!singleUpgradeEnabled}
                          onClick={(event) => {
                            if (!singleUpgradeEnabled) {
                              event.preventDefault()
                            }
                          }}
                        >
                          {singleUpgradeEnabled ? copy.chooseProjectAction : copy.unavailableAction}
                        </a>
                      ) : null}
                      {tier.key === 'all_access' && !tier.current && accountTier !== 'privileged' ? (
                        <button
                          type="button"
                          className="auth-primary-btn account-tier-action"
                          disabled={!allAccessEnabled || upgradeBusy}
                          onClick={() => void onUpgradeAllAccess()}
                        >
                          {allAccessEnabled ? upgradeBusy ? copy.processing : copy.upgradeAllAction : copy.unavailableAction}
                        </button>
                      ) : null}
                    </article>
                  ))}
                </div>
                {upgradeStatusMessage ? <p className="auth-status account-upgrade-status">{upgradeStatusMessage}</p> : null}
              </section>
              <div className="login-page-actions">
                <a className="auth-primary-btn" href={homeHref}>
                  {copy.backHome}
                </a>
                <button type="button" className="auth-primary-btn" disabled={busy} onClick={() => void onLogout()}>
                  {busy ? copy.processing : copy.logout}
                </button>
              </div>
            </div>
          ) : null}

          {enabled && !loading && !userEmail ? (
            <>
              <div className="login-mode-switch" role="tablist" aria-label={copy.kicker}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'login'}
                  className={mode === 'login' ? 'active' : ''}
                  onClick={() => setMode('login')}
                >
                  {copy.loginMode}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'signup'}
                  className={mode === 'signup' ? 'active' : ''}
                  onClick={() => setMode('signup')}
                >
                  {copy.signupMode}
                </button>
              </div>

              <form className="login-page-form" onSubmit={handleSubmit}>
                <label className="login-page-field">
                  <span>{copy.emailLabel}</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder={copy.emailPlaceholder}
                    autoComplete="email"
                    required
                  />
                </label>

                <label className="login-page-field">
                  <span>{copy.passwordLabel}</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={copy.passwordPlaceholder}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    minLength={6}
                    required
                  />
                </label>

                <div className="login-page-actions">
                  <button type="submit" className="auth-primary-btn" disabled={busy}>
                    {busy ? copy.processing : mode === 'login' ? copy.loginAction : copy.signupAction}
                  </button>
                  <button type="button" className="auth-primary-btn auth-google-btn" disabled={busy} onClick={() => void onGoogleLogin()}>
                    {busy ? copy.processing : copy.googleAction}
                  </button>
                </div>
              </form>
            </>
          ) : null}

          {statusMessage ? <p className="auth-status">{statusMessage}</p> : null}
        </section>
      </main>
    </div>
  )
}
