import { useEffect, useMemo, useState } from 'react'
import { DebugPanel } from './components/DebugPanel'
import { ProjectEntry } from './components/ProjectEntry'
import { ResumeAccessDenied } from './components/ResumeAccessDenied'
import { ResumePage } from './components/ResumePage'
import { Sidebar } from './components/Sidebar'
import { SiteHeroBanner } from './components/SiteHeroBanner'
import { SubdomainProjectLocked } from './components/SubdomainProjectLocked'
import { SubdomainProjectView } from './components/SubdomainProjectView'
import { BLOG_ARTICLES } from './data/blogArticles'
import { type Lang, resolveInitialLang } from './i18n/lang'
import projectsSnapshotRaw from './data/projects.snapshot.json'
import { withLangParam } from './lib/lang-url'
import { createUnlockCheckoutUrl, type UnlockCheckoutKind } from './lib/unlock-billing'
import { applyUnlockGrantFromSupabase, fetchUnlockStateFromSupabase } from './lib/unlock-remote'
import {
  canAccessProject,
  getFreeOfferStatus,
  grantFreeProjectUnlock,
  loadUnlockStateForUser,
  saveUnlockStateForUser,
  type UserUnlockState,
} from './lib/unlock'
import {
  type AuthRoleRulesJson,
  type AuthRole,
  type AuthRoleRules,
  type AuthUserSummary,
  fetchSessionUser,
  isAuthConfigured,
  loginWithPassword,
  logout,
  mergeRoleRules,
  normalizeAuthError,
  parseRoleEmailSet,
  signupWithPassword,
  subscribeAuthState,
  toAuthUserSummary,
  toRoleRulesFromJson,
} from './lib/auth'
import {
  chooseProjects,
  fetchProjectsFromApi,
  formatDate,
  parseShowSlugs,
  resolveSubdomainView,
} from './lib/projects'
import type { PortfolioProject, ProjectsSnapshot } from './types'

type RootView = 'blog' | 'portfolio' | 'deploy'
type UnlockStorageMode = 'remote' | 'local' | 'loading' | 'idle'
type DeployTarget = 'local' | 'remote'

const snapshot = projectsSnapshotRaw as ProjectsSnapshot
const portfolioSectionIds = ['home', 'projects', 'visual', 'contact']
const EMPTY_UNLOCK_STATE: UserUnlockState = {
  grants: [],
  freeOfferTotal: null,
  freePickedSlugs: [],
}

const APP_COPY = {
  zh: {
    sourceSnapshot: '项目快照',
    sourceLivePrefix: '实时 API',
    sourceLoadFailed: '加载失败，请稍后重试。',
    apiRequired: '请先填写项目 API 地址。',
    profileLine1: '产品策略与构建者',
    profileLine2: 'AI + Design + Engineering',
    profileLine3: 'Base: New York / Beijing',
    tocHome: '首页',
    tocProjects: '项目',
    tocDeploy: '部署',
    tocVisual: '图示',
    tocContact: '联系',
    portfolioTitle: '作品集',
    portfolioIntro: '以 gallery 形式展示项目卡片，点击任一卡片可进入对应子域名详情页。',
    visualTitle: '可视化',
    visualIntro: '从博客洞察到作品证据，每个项目都能通过独立子域名访问。',
    contactTitle: '联系',
    rootDomain: '站点主域名',
    resumeDomain: '简历子域名',
    projectDomain: '项目子域名',
    projectDomainDesc: '按作品独立分配，可在 debug 模式手动控制展示。',
    copyright: '© 2026 Jian Yongjie. All rights reserved.',
    blogMode: 'wordm.us 博客模式',
    portfolioMode: 'wordm.us 作品集模式',
    nextLabel: 'NEXT',
    nextPrefix: '跳到下一篇',
    nextTitlePrefix: '下一篇',
    nextAriaPrefix: '跳转到下一篇',
    noNext: '已经是最后一篇',
    sessionRestoreFailed: '会话恢复失败',
    pleaseRelogin: '请重新登录。',
    loginUnavailable: '未配置 Supabase，无法登录。',
    signupUnavailable: '未配置 Supabase，无法注册。',
    authUnavailable: '未配置 Supabase。',
    emailPasswordRequired: '请输入邮箱和密码。',
    loggingIn: '登录中...',
    loginSuccess: '登录成功',
    loginFailed: '登录失败',
    loginFallback: '请检查邮箱或密码。',
    signingUp: '注册中...',
    emailExists: '该邮箱已注册，请直接登录。',
    confirmEmail: '注册成功，请先到邮箱点击确认链接，再回来登录。',
    signupSuccess: '注册成功',
    signupAndLoginSuccess: '注册并登录成功',
    signupFailed: '注册失败',
    signupFallback: '请稍后重试。',
    loggingOut: '退出中...',
    logoutSuccess: '已退出登录。',
    logoutFailed: '退出失败',
    logoutFallback: '请稍后重试。',
    unlockPanelTitle: '作品解锁与安装',
    unlockPanelIntro: '解锁后可进入项目子域名并一键安装到本地设备。',
    unlockPlanSingleLabel: '单作品解锁',
    unlockPlanAllCurrent: '解锁当前全部作品',
    unlockPlanAllCurrentPlusYear: '解锁当前作品 + 一年内新作品',
    unlockNeedLogin: '请先登录后再解锁作品。',
    unlockActionFailed: '解锁失败，请稍后重试。',
    unlockAllCurrentSuccess: '已解锁当前全部作品。',
    unlockAllCurrentPlusYearSuccess: '已解锁当前作品，并开启一年新作品解锁。',
    unlockSingleSuccessPrefix: '已解锁作品',
    unlockFreeSuccessPrefix: '已使用免费名额解锁',
    unlockFreeEmpty: '免费解锁名额已用完。',
    unlockFreeQuotaPrefix: '免费解锁额度',
    unlockQuotaFormatPrefix: '总额度',
    unlockQuotaUsed: '已用',
    unlockQuotaRemaining: '剩余',
    unlockBypassNotice: '当前身份可直接访问全部作品，无需解锁。',
    unlockStorageRemote: '权限存储: Supabase',
    unlockStorageLocal: '权限存储: 本地回退',
    unlockStorageLoading: '权限存储: 同步中...',
    unlockStorageIdle: '权限存储: 登录后可用',
    unlockRemoteFallback: 'Supabase 解锁服务不可用，已切换到本地模式。',
    unlockPaidRequired: '该解锁需要付费权益，请先在 latti.wordm.us 完成订阅或购买。',
    unlockLifetimeRequired: '该解锁仅对终身权益用户开放。',
    unlockPaidServerRequired: '付费校验服务暂不可用，当前仅支持免费名额解锁。',
    unlockBillingHintPrefix: '付费解锁权益与 latti 账号体系打通：',
    unlockBillingHintLink: '前往 latti.wordm.us',
    unlockInstallHintPrefix: '付费后可一键自部署：',
    unlockInstallHintLink: '打开安装指南',
    unlockCheckoutStarting: '正在跳转支付...',
    unlockCheckoutProductMissing: '未配置该解锁方案的商品，请先在 latti.wordm.us 完成升级。',
    unlockCheckoutFailed: '拉起支付失败，请稍后重试。',
    unlockCheckoutSuccess: '支付回调已返回。你可以直接使用下方自部署入口，或再次点击解锁按钮完成授权同步。',
    unlockCheckoutCanceled: '已取消支付。',
    deployTitle: '一键自部署',
    deployIntro: '付费后可将 Latti 一键部署到你的机器或你自己的服务器。',
    deployAutoReady: '已完成支付，正在引导你部署。',
    deployMachineLocal: '当前机器（默认）',
    deployMachineRemote: '远程服务器',
    deployMachineLocalDesc: '在当前机器终端执行下面命令，约 1~3 分钟可用。',
    deployMachineRemoteDesc: '填写目标服务器 SSH 地址后，在当前机器执行命令触发远程部署。',
    deployPortLabel: '服务端口',
    deployRemoteHostLabel: '服务器地址（user@host）',
    deployRemoteHostPlaceholder: '例如 root@1.2.3.4',
    deployRemoteHostRequired: '请先填写服务器地址（user@host）。',
    deployCopyCommand: '复制部署命令',
    deployCopySuccess: '部署命令已复制，请到终端粘贴执行。',
    deployCopyFailed: '复制失败，请手动复制命令。',
    deployOpenGuide: '查看安装说明',
    deployOpenScript: '打开安装脚本',
    deployAfterDone: '部署完成后，访问 http://localhost:端口（或你的服务器地址）即可使用。',
    deployBackPortfolio: '返回作品集',
    deployOpenUnlockedProject: '打开已解锁项目',
    deployWindowsHint: 'Windows 建议在 WSL / Git Bash 中执行命令。',
  },
  en: {
    sourceSnapshot: 'Project snapshot',
    sourceLivePrefix: 'Live API',
    sourceLoadFailed: 'Load failed. Please try again.',
    apiRequired: 'Please provide the project API URL first.',
    profileLine1: 'Product Strategist & Builder',
    profileLine2: 'AI + Design + Engineering',
    profileLine3: 'Base: New York / Beijing',
    tocHome: 'Home',
    tocProjects: 'Projects',
    tocDeploy: 'Deploy',
    tocVisual: 'Visual',
    tocContact: 'Contact',
    portfolioTitle: 'Portfolio Gallery',
    portfolioIntro: 'Project cards in a gallery layout. Click any card to open its dedicated subdomain page.',
    visualTitle: 'Visualizations',
    visualIntro: 'From blog insights to portfolio evidence, each project is accessible via its own subdomain.',
    contactTitle: 'Contact',
    rootDomain: 'Primary domain',
    resumeDomain: 'Resume subdomain',
    projectDomain: 'Project subdomains',
    projectDomainDesc: 'Each showcased project has an independent subdomain and can be controlled in debug mode.',
    copyright: '© 2026 Jian Yongjie. All rights reserved.',
    blogMode: 'Blog mode on wordm.us',
    portfolioMode: 'Portfolio mode on wordm.us',
    nextLabel: 'NEXT',
    nextPrefix: 'Jump to next',
    nextTitlePrefix: 'Next',
    nextAriaPrefix: 'Jump to next article',
    noNext: 'This is the last article',
    sessionRestoreFailed: 'Session restore failed',
    pleaseRelogin: 'Please log in again.',
    loginUnavailable: 'Supabase is not configured. Login is unavailable.',
    signupUnavailable: 'Supabase is not configured. Sign-up is unavailable.',
    authUnavailable: 'Supabase is not configured.',
    emailPasswordRequired: 'Please enter email and password.',
    loggingIn: 'Signing in...',
    loginSuccess: 'Login successful',
    loginFailed: 'Login failed',
    loginFallback: 'Please check your email and password.',
    signingUp: 'Creating account...',
    emailExists: 'This email already exists. Please log in directly.',
    confirmEmail: 'Sign-up successful. Confirm your email first, then log in.',
    signupSuccess: 'Sign-up successful',
    signupAndLoginSuccess: 'Sign-up and login successful',
    signupFailed: 'Sign-up failed',
    signupFallback: 'Please try again later.',
    loggingOut: 'Signing out...',
    logoutSuccess: 'Logged out.',
    logoutFailed: 'Logout failed',
    logoutFallback: 'Please try again later.',
    unlockPanelTitle: 'Unlock & Install',
    unlockPanelIntro: 'Unlock to access project subdomains and one-click install to your device.',
    unlockPlanSingleLabel: 'Single project unlock',
    unlockPlanAllCurrent: 'Unlock all current projects',
    unlockPlanAllCurrentPlusYear: 'Unlock current + 1-year new projects',
    unlockNeedLogin: 'Please log in before unlocking projects.',
    unlockActionFailed: 'Unlock failed. Please try again later.',
    unlockAllCurrentSuccess: 'All current projects are now unlocked.',
    unlockAllCurrentPlusYearSuccess: 'Current projects unlocked, plus one-year new project access enabled.',
    unlockSingleSuccessPrefix: 'Unlocked project',
    unlockFreeSuccessPrefix: 'Free unlock used for',
    unlockFreeEmpty: 'No free unlock quota left.',
    unlockFreeQuotaPrefix: 'Free unlock quota',
    unlockQuotaFormatPrefix: 'total',
    unlockQuotaUsed: 'used',
    unlockQuotaRemaining: 'remaining',
    unlockBypassNotice: 'Your role can access all projects without unlock limits.',
    unlockStorageRemote: 'Storage: Supabase',
    unlockStorageLocal: 'Storage: Local fallback',
    unlockStorageLoading: 'Storage: syncing...',
    unlockStorageIdle: 'Storage: available after login',
    unlockRemoteFallback: 'Supabase unlock service unavailable. Switched to local fallback mode.',
    unlockPaidRequired: 'This unlock requires paid entitlement. Complete purchase on latti.wordm.us first.',
    unlockLifetimeRequired: 'This unlock is available for lifetime entitlement only.',
    unlockPaidServerRequired: 'Paid verification service is unavailable. Only free-pick unlock is available now.',
    unlockBillingHintPrefix: 'Paid entitlements are shared with latti account system:',
    unlockBillingHintLink: 'Go to latti.wordm.us',
    unlockInstallHintPrefix: 'After payment, one-click self-host is available here:',
    unlockInstallHintLink: 'Open install guide',
    unlockCheckoutStarting: 'Redirecting to checkout...',
    unlockCheckoutProductMissing: 'No product is configured for this unlock mode. Upgrade on latti.wordm.us first.',
    unlockCheckoutFailed: 'Failed to start checkout. Please try again later.',
    unlockCheckoutSuccess: 'Payment callback received. Use the self-host entry below, or click unlock again to sync entitlement.',
    unlockCheckoutCanceled: 'Checkout canceled.',
    deployTitle: 'One-Click Self-Host',
    deployIntro: 'After payment, deploy Latti to your current machine or your own server.',
    deployAutoReady: 'Payment confirmed. Redirecting you to deployment.',
    deployMachineLocal: 'Current machine (default)',
    deployMachineRemote: 'Remote server',
    deployMachineLocalDesc: 'Run the command below in your current machine terminal. Usually ready in 1-3 minutes.',
    deployMachineRemoteDesc: 'Fill in your target SSH host, then run the command locally to trigger remote deployment.',
    deployPortLabel: 'Service port',
    deployRemoteHostLabel: 'Server address (user@host)',
    deployRemoteHostPlaceholder: 'Example: root@1.2.3.4',
    deployRemoteHostRequired: 'Please provide the server address (user@host) first.',
    deployCopyCommand: 'Copy deploy command',
    deployCopySuccess: 'Deploy command copied. Paste it in your terminal.',
    deployCopyFailed: 'Copy failed. Please copy the command manually.',
    deployOpenGuide: 'Open install guide',
    deployOpenScript: 'Open install script',
    deployAfterDone: 'After deployment, open http://localhost:port (or your server host:port) to start using it.',
    deployBackPortfolio: 'Back to portfolio',
    deployOpenUnlockedProject: 'Open unlocked project',
    deployWindowsHint: 'On Windows, use WSL or Git Bash to run the command.',
  },
} as const

function defaultSelection(projects: PortfolioProject[], preferred: string[]): string[] {
  const preferredExisting = preferred.filter((slug) => projects.some((project) => project.slug === slug))
  if (preferredExisting.length) {
    return preferredExisting
  }

  return projects.slice(0, 8).map((project) => project.slug)
}

function toRootView(raw: string | null): RootView {
  if (raw === 'blog') {
    return 'blog'
  }

  if (raw === 'deploy') {
    return 'deploy'
  }

  return 'portfolio'
}

function normalizeSlug(raw: string | null): string | null {
  if (!raw) {
    return null
  }

  const slug = raw.trim().toLowerCase()
  return slug || null
}

function withDetail(prefix: string, detail: string) {
  return `${prefix}: ${detail}`
}

function withEmail(prefix: string, email: string) {
  return `${prefix}: ${email}`
}

function withDone(text: string, lang: Lang) {
  return lang === 'zh' ? `${text}。` : `${text}.`
}

function detectLikelyOs(): 'windows' | 'mac' | 'linux' | 'other' {
  if (typeof navigator === 'undefined') {
    return 'other'
  }

  const value = `${navigator.platform} ${navigator.userAgent}`.toLowerCase()
  if (value.includes('win')) {
    return 'windows'
  }
  if (value.includes('mac')) {
    return 'mac'
  }
  if (value.includes('linux')) {
    return 'linux'
  }
  return 'other'
}

async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Continue to fallback below.
    }
  }

  if (typeof document === 'undefined') {
    return false
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', 'true')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()

  let copied = false
  try {
    copied = document.execCommand('copy')
  } catch {
    copied = false
  } finally {
    document.body.removeChild(textarea)
  }

  return copied
}

function App() {
  const params = new URLSearchParams(window.location.search)
  const hostname = window.location.hostname.toLowerCase()
  const debugMode = params.get('debug') === '1' || import.meta.env.DEV
  const forcedSubdomain = params.get('subdomain')
  const forcedPage = params.get('page')
  const initialApi = params.get('centerApi') || import.meta.env.VITE_CENTER_CONTROL_API || ''
  const initialShowSlugs = parseShowSlugs(params.get('show'))
  const initialRootView = toRootView(params.get('view'))
  const initialUnlockSlug = normalizeSlug(params.get('unlock'))
  const initialCheckoutSlug = normalizeSlug(params.get('checkout_slug'))
  const initialPurchaseSuccess = params.get('purchase_success') === '1'
  const initialPurchaseCanceled = params.get('purchase_cancel') === '1'
  const initialLang = resolveInitialLang(window.location)

  const [lang, setLang] = useState<Lang>(initialLang)
  const copy = APP_COPY[lang]
  const rootHomeUrl = withLangParam('https://wordm.us', lang)
  const resumeHomeUrl = withLangParam('https://resume.wordm.us', lang)
  const billingHomeUrl = withLangParam('https://latti.wordm.us', lang)
  const selfHostInstallGuideUrl =
    import.meta.env.VITE_SELFHOST_INSTALL_URL || 'https://github.com/LiDeChi/latti/blob/main/docs/selfhost-one-click.md'
  const selfHostInstallScriptUrl =
    import.meta.env.VITE_SELFHOST_INSTALL_SCRIPT_URL ||
    'https://raw.githubusercontent.com/LiDeChi/latti/main/scripts/selfhost-install.sh'
  const clientOs = useMemo(() => detectLikelyOs(), [])
  const unlockCheckoutProducts = useMemo(
    () => ({
      single: import.meta.env.VITE_UNLOCK_PRODUCT_SINGLE || 'prod_4eDxmaC52vCKWPjGqfqIqy',
      allCurrent: import.meta.env.VITE_UNLOCK_PRODUCT_ALL_CURRENT || 'prod_omAVm07vFxto9HGfmfJ9q',
      allCurrentPlusYear: import.meta.env.VITE_UNLOCK_PRODUCT_ALL_CURRENT_PLUS_YEAR || 'prod_3WVufccMdH37WNdEVvSL6',
    }),
    [],
  )

  const authConfig = useMemo(
    () => ({
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
      supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    }),
    [],
  )

  const envRoleRules = useMemo<AuthRoleRules>(
    () => ({
      adminEmails: parseRoleEmailSet(import.meta.env.VITE_AUTH_ADMIN_EMAILS || import.meta.env.VITE_ADMIN_EMAILS || ''),
      testerEmails: parseRoleEmailSet(import.meta.env.VITE_AUTH_TEST_EMAILS || import.meta.env.VITE_TEST_EMAILS || ''),
    }),
    [],
  )

  const [authRoleRules, setAuthRoleRules] = useState<AuthRoleRules>(envRoleRules)
  const authEnabled = isAuthConfigured(authConfig)

  const [rootView, setRootView] = useState<RootView>(initialRootView)
  const [projects, setProjects] = useState<PortfolioProject[]>(snapshot.projects)
  const [activeSection, setActiveSection] = useState('home')
  const [activeArticleId, setActiveArticleId] = useState(BLOG_ARTICLES[0]?.id || '')
  const [centerApi, setCenterApi] = useState(initialApi)
  const [sourceType, setSourceType] = useState<'snapshot' | 'live'>('snapshot')
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [authUser, setAuthUser] = useState<AuthUserSummary | null>(null)
  const [authLoading, setAuthLoading] = useState(authEnabled)
  const [authBusy, setAuthBusy] = useState(false)
  const [authStatusMessage, setAuthStatusMessage] = useState('')
  const [unlockState, setUnlockState] = useState<UserUnlockState | null>(null)
  const [unlockStorageMode, setUnlockStorageMode] = useState<UnlockStorageMode>('idle')
  const [unlockBusy, setUnlockBusy] = useState(false)
  const [checkoutBusyKind, setCheckoutBusyKind] = useState<UnlockCheckoutKind | null>(null)
  const [unlockStatusMessage, setUnlockStatusMessage] = useState('')
  const [unlockTargetSlug, setUnlockTargetSlug] = useState<string | null>(initialUnlockSlug)
  const [deployTarget, setDeployTarget] = useState<DeployTarget>('local')
  const [deployPort, setDeployPort] = useState('8080')
  const [deployRemoteHost, setDeployRemoteHost] = useState('')
  const [deployStatusMessage, setDeployStatusMessage] = useState('')
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(() => {
    if (initialShowSlugs.length) {
      return initialShowSlugs
    }

    return defaultSelection(snapshot.projects, snapshot.featured)
  })

  const sourceLabel = sourceType === 'live' && centerApi ? `${copy.sourceLivePrefix}: ${centerApi}` : copy.sourceSnapshot

  const primaryUpdatedAt = snapshot.centerControlGeneratedAt || snapshot.generatedAt
  const lastUpdated = formatDate(primaryUpdatedAt)

  useEffect(() => {
    const next = new URL(window.location.href)
    if (rootView === 'blog') {
      next.searchParams.set('view', 'blog')
    } else if (rootView === 'deploy') {
      next.searchParams.set('view', 'deploy')
    } else {
      next.searchParams.delete('view')
    }

    if (lang === 'en') {
      next.searchParams.set('lang', 'en')
    } else {
      next.searchParams.delete('lang')
    }

    if (unlockTargetSlug) {
      next.searchParams.set('unlock', unlockTargetSlug)
    } else {
      next.searchParams.delete('unlock')
    }

    window.history.replaceState({}, '', next)
  }, [rootView, lang, unlockTargetSlug])

  useEffect(() => {
    if (!initialPurchaseSuccess && !initialPurchaseCanceled) {
      return
    }

    if (initialCheckoutSlug) {
      setUnlockTargetSlug(initialCheckoutSlug)
    }

    if (initialPurchaseSuccess) {
      setRootView('deploy')
      setDeployTarget('local')
      setDeployStatusMessage(copy.deployAutoReady)
      setUnlockStatusMessage(copy.unlockCheckoutSuccess)
    } else {
      setUnlockStatusMessage(copy.unlockCheckoutCanceled)
    }

    const next = new URL(window.location.href)
    next.searchParams.delete('purchase_success')
    next.searchParams.delete('purchase_cancel')
    next.searchParams.delete('checkout_kind')
    next.searchParams.delete('checkout_slug')
    window.history.replaceState({}, '', next)
  }, [
    copy.deployAutoReady,
    copy.unlockCheckoutCanceled,
    copy.unlockCheckoutSuccess,
    initialCheckoutSlug,
    initialPurchaseCanceled,
    initialPurchaseSuccess,
  ])

  useEffect(() => {
    if (rootView === 'deploy') {
      setActiveSection('deploy')
      return
    }

    if (rootView === 'portfolio') {
      setActiveSection('home')
    }
  }, [rootView])

  useEffect(() => {
    if (rootView !== 'portfolio') {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)

        if (visible[0]) {
          setActiveSection(visible[0].target.id)
        }
      },
      {
        rootMargin: '-25% 0px -60% 0px',
        threshold: [0.2, 0.5, 0.8],
      },
    )

    portfolioSectionIds.forEach((id) => {
      const node = document.getElementById(id)
      if (node) {
        observer.observe(node)
      }
    })

    return () => observer.disconnect()
  }, [rootView])

  useEffect(() => {
    if (rootView !== 'blog') {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)

        if (visible[0]) {
          setActiveArticleId(visible[0].target.id)
        }
      },
      {
        rootMargin: '-30% 0px -55% 0px',
        threshold: [0.2, 0.45, 0.7],
      },
    )

    BLOG_ARTICLES.forEach((article) => {
      const node = document.getElementById(article.id)
      if (node) {
        observer.observe(node)
      }
    })

    return () => observer.disconnect()
  }, [rootView])

  useEffect(() => {
    if (!debugMode || rootView !== 'portfolio') {
      return
    }

    const next = new URL(window.location.href)

    if (selectedSlugs.length) {
      next.searchParams.set('show', selectedSlugs.join(','))
    } else {
      next.searchParams.delete('show')
    }

    if (centerApi) {
      next.searchParams.set('centerApi', centerApi)
    } else {
      next.searchParams.delete('centerApi')
    }

    next.searchParams.set('debug', '1')
    window.history.replaceState({}, '', next)
  }, [debugMode, rootView, selectedSlugs, centerApi])

  useEffect(() => {
    let active = true

    async function loadRoleRulesFromPublicFile() {
      try {
        const response = await fetch('/auth-role-rules.json', {
          cache: 'no-store',
        })

        if (!response.ok) {
          throw new Error(`role rules file not found (${response.status})`)
        }

        const payload = (await response.json()) as AuthRoleRulesJson
        const fileRules = toRoleRulesFromJson(payload)

        if (!active) {
          return
        }

        setAuthRoleRules(mergeRoleRules(envRoleRules, fileRules))
      } catch {
        if (!active) {
          return
        }

        setAuthRoleRules(envRoleRules)
      }
    }

    void loadRoleRulesFromPublicFile()

    return () => {
      active = false
    }
  }, [envRoleRules])

  useEffect(() => {
    if (!authEnabled) {
      setAuthLoading(false)
      setAuthUser(null)
      return
    }

    let active = true
    setAuthLoading(true)

    void fetchSessionUser(authConfig)
      .then((user) => {
        if (!active) {
          return
        }

        setAuthUser(toAuthUserSummary(user, authRoleRules))
      })
      .catch((error) => {
        if (!active) {
          return
        }

        const detail = normalizeAuthError(error, copy.pleaseRelogin)
        setAuthStatusMessage(withDetail(copy.sessionRestoreFailed, detail))
      })
      .finally(() => {
        if (active) {
          setAuthLoading(false)
        }
      })

    const unsubscribe = subscribeAuthState(authConfig, (user) => {
      if (!active) {
        return
      }

      setAuthUser(toAuthUserSummary(user, authRoleRules))
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [authConfig, authEnabled, authRoleRules, copy.pleaseRelogin, copy.sessionRestoreFailed])

  useEffect(() => {
    if (!authUser) {
      setUnlockState(null)
      setUnlockStorageMode('idle')
      setUnlockStatusMessage('')
      return
    }

    const authUserId = authUser.id
    let active = true
    setUnlockStorageMode('loading')

    async function loadUnlockState() {
      try {
        const remoteState = await fetchUnlockStateFromSupabase(authConfig)
        if (!active) {
          return
        }

        setUnlockState(remoteState)
        setUnlockStorageMode('remote')
      } catch {
        if (!active) {
          return
        }

        setUnlockState(loadUnlockStateForUser(authUserId))
        setUnlockStorageMode('local')
        setUnlockStatusMessage(copy.unlockRemoteFallback)
      }
    }

    void loadUnlockState()

    return () => {
      active = false
    }
  }, [authConfig, authUser, copy.unlockRemoteFallback])

  useEffect(() => {
    if (!authUser || !unlockState) {
      return
    }

    saveUnlockStateForUser(authUser.id, unlockState)
  }, [authUser, unlockState])

  useEffect(() => {
    if (!unlockTargetSlug) {
      return
    }

    setSelectedSlugs((prev) => {
      if (prev.includes(unlockTargetSlug)) {
        return prev
      }
      if (!projects.some((project) => project.slug === unlockTargetSlug)) {
        return prev
      }

      return [...prev, unlockTargetSlug]
    })
  }, [projects, unlockTargetSlug])

  async function loadLiveProjects() {
    if (!centerApi) {
      setLoadState('error')
      setErrorMessage(copy.apiRequired)
      return
    }

    setLoadState('loading')
    setErrorMessage('')

    try {
      const liveProjects = await fetchProjectsFromApi(centerApi)
      setProjects(liveProjects)
      setSelectedSlugs((prev) => {
        const available = new Set(liveProjects.map((project) => project.slug))
        const filtered = prev.filter((slug) => available.has(slug))
        if (filtered.length) {
          return filtered
        }

        return defaultSelection(liveProjects, snapshot.featured)
      })
      setSourceType('live')
      setLoadState('idle')
    } catch (error) {
      setLoadState('error')
      setErrorMessage(error instanceof Error && error.message ? error.message : copy.sourceLoadFailed)
    }
  }

  function unlockErrorCode(error: unknown): string {
    const detail = normalizeAuthError(error, '')
    return detail.toUpperCase()
  }

  function isFreeOfferExhaustedError(error: unknown): boolean {
    return unlockErrorCode(error).includes('FREE_OFFER_EXHAUSTED')
  }

  function isPaymentRequiredError(error: unknown): boolean {
    return unlockErrorCode(error).includes('PAYMENT_REQUIRED')
  }

  function isLifetimeRequiredError(error: unknown): boolean {
    return unlockErrorCode(error).includes('LIFETIME_REQUIRED')
  }

  function isBusinessUnlockError(error: unknown): boolean {
    const code = unlockErrorCode(error)
    return (
      code.includes('FREE_OFFER_EXHAUSTED') ||
      code.includes('PROJECT_SLUG_REQUIRED') ||
      code.includes('CATALOG_SLUGS_REQUIRED') ||
      code.includes('INVALID_UNLOCK_KIND') ||
      code.includes('PAYMENT_REQUIRED') ||
      code.includes('LIFETIME_REQUIRED') ||
      code.includes('UNAUTHENTICATED')
    )
  }

  function buildCheckoutReturnUrl(kind: UnlockCheckoutKind, projectSlug: string | null = null) {
    const next = new URL(window.location.href)
    next.searchParams.set('purchase_success', '1')
    next.searchParams.set('checkout_kind', kind)

    const normalizedSlug = normalizeSlug(projectSlug)
    if (normalizedSlug) {
      next.searchParams.set('checkout_slug', normalizedSlug)
      next.searchParams.set('unlock', normalizedSlug)
    } else {
      next.searchParams.delete('checkout_slug')
    }

    next.searchParams.set('view', 'deploy')
    if (lang === 'en') {
      next.searchParams.set('lang', 'en')
    } else {
      next.searchParams.delete('lang')
    }
    return next.toString()
  }

  function buildCheckoutCancelUrl(projectSlug: string | null = null) {
    const next = new URL(window.location.href)
    next.searchParams.set('purchase_cancel', '1')

    const normalizedSlug = normalizeSlug(projectSlug)
    if (normalizedSlug) {
      next.searchParams.set('checkout_slug', normalizedSlug)
      next.searchParams.set('unlock', normalizedSlug)
    } else {
      next.searchParams.delete('checkout_slug')
    }

    next.searchParams.set('view', 'portfolio')
    if (lang === 'en') {
      next.searchParams.set('lang', 'en')
    } else {
      next.searchParams.delete('lang')
    }
    return next.toString()
  }

  async function startUnlockCheckout(kind: UnlockCheckoutKind, projectSlug: string | null = null) {
    if (!authEnabled || !authUser) {
      setUnlockStatusMessage(copy.unlockNeedLogin)
      return false
    }

    setCheckoutBusyKind(kind)
    setUnlockStatusMessage(copy.unlockCheckoutStarting)

    try {
      const checkoutUrl = await createUnlockCheckoutUrl(authConfig, {
        kind,
        products: unlockCheckoutProducts,
        successUrl: buildCheckoutReturnUrl(kind, projectSlug),
        cancelUrl: buildCheckoutCancelUrl(projectSlug),
      })

      window.location.assign(checkoutUrl)
      return true
    } catch (error) {
      const code = unlockErrorCode(error)
      if (code.includes('CHECKOUT_PRODUCT_MISSING')) {
        setUnlockStatusMessage(copy.unlockCheckoutProductMissing)
        return false
      }

      if (code.includes('UNAUTHENTICATED')) {
        setUnlockStatusMessage(copy.unlockNeedLogin)
        return false
      }

      setUnlockStatusMessage(copy.unlockCheckoutFailed)
      return false
    } finally {
      setCheckoutBusyKind(null)
    }
  }

  async function handleCopyDeployCommand() {
    if (deployTarget === 'remote' && !deployRemoteHost.trim()) {
      setDeployStatusMessage(copy.deployRemoteHostRequired)
      return
    }

    if (!activeDeployCommand) {
      setDeployStatusMessage(copy.deployCopyFailed)
      return
    }

    const copied = await copyTextToClipboard(activeDeployCommand)
    setDeployStatusMessage(copied ? copy.deployCopySuccess : copy.deployCopyFailed)
  }

  async function handleLogin(email: string, password: string) {
    if (!authEnabled) {
      setAuthStatusMessage(copy.loginUnavailable)
      return
    }

    if (!email || !password) {
      setAuthStatusMessage(copy.emailPasswordRequired)
      return
    }

    setAuthBusy(true)
    setAuthStatusMessage(copy.loggingIn)

    try {
      const user = await loginWithPassword(authConfig, email, password)
      const normalizedUser = toAuthUserSummary(user, authRoleRules)
      setAuthUser(normalizedUser)
      setAuthStatusMessage(
        normalizedUser?.email
          ? withEmail(copy.loginSuccess, normalizedUser.email)
          : withDone(copy.loginSuccess, lang),
      )
    } catch (error) {
      const detail = normalizeAuthError(error, copy.loginFallback)
      setAuthStatusMessage(withDetail(copy.loginFailed, detail))
    } finally {
      setAuthBusy(false)
    }
  }

  async function handleSignup(email: string, password: string) {
    if (!authEnabled) {
      setAuthStatusMessage(copy.signupUnavailable)
      return
    }

    if (!email || !password) {
      setAuthStatusMessage(copy.emailPasswordRequired)
      return
    }

    setAuthBusy(true)
    setAuthStatusMessage(copy.signingUp)

    try {
      const result = await signupWithPassword(authConfig, email, password)

      if (result.outcome === 'exists') {
        setAuthStatusMessage(copy.emailExists)
        return
      }

      if (result.outcome === 'confirm') {
        setAuthStatusMessage(copy.confirmEmail)
        return
      }

      const normalizedUser = toAuthUserSummary(result.user, authRoleRules)
      setAuthUser(normalizedUser)
      setAuthStatusMessage(
        normalizedUser?.email
          ? withEmail(copy.signupAndLoginSuccess, normalizedUser.email)
          : withDone(copy.signupSuccess, lang),
      )
    } catch (error) {
      const detail = normalizeAuthError(error, copy.signupFallback)
      setAuthStatusMessage(withDetail(copy.signupFailed, detail))
    } finally {
      setAuthBusy(false)
    }
  }

  async function handleLogout() {
    if (!authEnabled) {
      setAuthStatusMessage(copy.authUnavailable)
      return
    }

    setAuthBusy(true)
    setAuthStatusMessage(copy.loggingOut)

    try {
      await logout(authConfig)
      setAuthUser(null)
      setAuthStatusMessage(copy.logoutSuccess)
    } catch (error) {
      const detail = normalizeAuthError(error, copy.logoutFallback)
      setAuthStatusMessage(withDetail(copy.logoutFailed, detail))
    } finally {
      setAuthBusy(false)
    }
  }

  const featuredProjects = useMemo(() => {
    const chosen = chooseProjects(projects, selectedSlugs)
    if (chosen.length) {
      return chosen
    }

    const fallbackSlugs = defaultSelection(projects, snapshot.featured)
    return chooseProjects(projects, fallbackSlugs)
  }, [projects, selectedSlugs])

  const highlightedProjects = featuredProjects.slice(0, 3)

  const subdomainProject = useMemo(
    () => resolveSubdomainView(projects, window.location.hostname, forcedSubdomain),
    [projects, forcedSubdomain],
  )
  const isResumeView = forcedPage === 'resume' || hostname === 'resume.wordm.us' || hostname === 'cv.wordm.us'

  const activeArticleIndex = Math.max(
    0,
    BLOG_ARTICLES.findIndex((article) => article.id === activeArticleId),
  )
  const activeArticle = BLOG_ARTICLES[activeArticleIndex] || BLOG_ARTICLES[0]
  const nextArticle = BLOG_ARTICLES[activeArticleIndex + 1] || null
  const authRole: AuthRole = authUser?.role ?? 'guest'
  const canAccessResume = authRole === 'admin' || authRole === 'tester'
  const projectCatalogSlugs = useMemo(() => projects.map((project) => project.slug), [projects])
  const freeOfferStatus = useMemo(
    () => getFreeOfferStatus(unlockState ?? EMPTY_UNLOCK_STATE, authUser?.createdAt ?? null),
    [authUser?.createdAt, unlockState],
  )
  const unlockActionDisabled = unlockBusy || checkoutBusyKind !== null || unlockStorageMode === 'loading'
  const canUseFreeUnlock = authRole !== 'guest' && freeOfferStatus.remaining > 0 && !unlockActionDisabled
  const unlockQuotaText = `${copy.unlockQuotaFormatPrefix} ${freeOfferStatus.total} · ${copy.unlockQuotaUsed} ${freeOfferStatus.used} · ${copy.unlockQuotaRemaining} ${freeOfferStatus.remaining}`
  const unlockStorageLabel =
    unlockStorageMode === 'remote'
      ? copy.unlockStorageRemote
      : unlockStorageMode === 'local'
        ? copy.unlockStorageLocal
        : unlockStorageMode === 'loading'
          ? copy.unlockStorageLoading
          : copy.unlockStorageIdle
  const normalizedDeployPort = useMemo(() => {
    const value = deployPort.trim()
    return value || '8080'
  }, [deployPort])
  const localDeployCommand = useMemo(
    () => `curl -fsSL ${selfHostInstallScriptUrl} | bash -s -- --port ${normalizedDeployPort}`,
    [normalizedDeployPort, selfHostInstallScriptUrl],
  )
  const remoteDeployCommand = useMemo(() => {
    const host = deployRemoteHost.trim()
    if (!host) {
      return ''
    }

    return `ssh ${host} 'curl -fsSL ${selfHostInstallScriptUrl} | bash -s -- --port ${normalizedDeployPort}'`
  }, [deployRemoteHost, normalizedDeployPort, selfHostInstallScriptUrl])
  const activeDeployCommand = deployTarget === 'local' ? localDeployCommand : remoteDeployCommand
  const subdomainProjectUnlocked = subdomainProject
    ? canAccessProject(subdomainProject.slug, authRole, unlockState)
    : false
  const authPanelProps = {
    lang,
    enabled: authEnabled,
    loading: authLoading,
    busy: authBusy,
    userEmail: authUser?.email ?? null,
    userRole: authRole,
    statusMessage: authStatusMessage,
    onLogin: handleLogin,
    onSignup: handleSignup,
    onLogout: handleLogout,
  }

  function getProjectNameBySlug(slug: string) {
    return projects.find((project) => project.slug === slug)?.name || slug
  }

  function isProjectUnlocked(slug: string) {
    return canAccessProject(slug, authRole, unlockState)
  }

  function ensureCanUnlock() {
    if (unlockStorageMode === 'loading') {
      setUnlockStatusMessage(copy.unlockStorageLoading)
      return false
    }

    if (unlockBusy) {
      return false
    }

    if (authRole === 'admin' || authRole === 'tester') {
      setUnlockStatusMessage(copy.unlockBypassNotice)
      return false
    }

    if (authRole === 'guest' || !authUser) {
      setUnlockStatusMessage(copy.unlockNeedLogin)
      return false
    }

    return true
  }

  async function applyUnlockGrant(
    kind: 'single' | 'all_current' | 'all_current_plus_year' | 'free_pick',
    projectSlug?: string,
  ): Promise<UserUnlockState> {
    if (unlockStorageMode === 'remote') {
      try {
        return await applyUnlockGrantFromSupabase(authConfig, {
          kind,
          projectSlug: projectSlug ?? null,
          catalogSlugs:
            kind === 'all_current' || kind === 'all_current_plus_year'
              ? projectCatalogSlugs
              : null,
        })
      } catch (error) {
        if (isBusinessUnlockError(error)) {
          throw error
        }

        if (kind !== 'free_pick') {
          throw new Error('PAYMENT_BACKEND_REQUIRED')
        }

        setUnlockStorageMode('local')
        setUnlockStatusMessage(copy.unlockRemoteFallback)
      }
    }

    if (kind !== 'free_pick') {
      throw new Error('PAYMENT_BACKEND_REQUIRED')
    }

    if (!projectSlug) {
      throw new Error('PROJECT_SLUG_REQUIRED')
    }

    const currentState = unlockState ?? EMPTY_UNLOCK_STATE
    return grantFreeProjectUnlock(currentState, projectSlug, authUser?.createdAt ?? null, new Date())
  }

  async function handleUnlockSingle(projectSlug: string) {
    const normalizedSlug = normalizeSlug(projectSlug)
    if (!normalizedSlug) {
      return
    }

    setUnlockTargetSlug(normalizedSlug)
    if (!ensureCanUnlock()) {
      return
    }

    setUnlockBusy(true)
    try {
      const nextState = await applyUnlockGrant('single', normalizedSlug)
      setUnlockState(nextState)
      setUnlockStatusMessage(`${copy.unlockSingleSuccessPrefix}: ${getProjectNameBySlug(normalizedSlug)}`)
    } catch (error) {
      if (isPaymentRequiredError(error)) {
        await startUnlockCheckout('single', normalizedSlug)
        return
      }

      if (isLifetimeRequiredError(error)) {
        await startUnlockCheckout('all_current_plus_year', normalizedSlug)
        return
      }

      if (unlockErrorCode(error).includes('PAYMENT_BACKEND_REQUIRED')) {
        setUnlockStatusMessage(copy.unlockPaidServerRequired)
        return
      }

      setUnlockStatusMessage(copy.unlockActionFailed)
    } finally {
      setUnlockBusy(false)
    }
  }

  async function handleUnlockAllCurrent() {
    if (!ensureCanUnlock()) {
      return
    }

    setUnlockBusy(true)
    try {
      const nextState = await applyUnlockGrant('all_current')
      setUnlockState(nextState)
      setUnlockStatusMessage(copy.unlockAllCurrentSuccess)
    } catch (error) {
      if (isPaymentRequiredError(error)) {
        await startUnlockCheckout('all_current')
        return
      }

      if (unlockErrorCode(error).includes('PAYMENT_BACKEND_REQUIRED')) {
        setUnlockStatusMessage(copy.unlockPaidServerRequired)
        return
      }

      setUnlockStatusMessage(copy.unlockActionFailed)
    } finally {
      setUnlockBusy(false)
    }
  }

  async function handleUnlockAllCurrentPlusYear() {
    if (!ensureCanUnlock()) {
      return
    }

    setUnlockBusy(true)
    try {
      const nextState = await applyUnlockGrant('all_current_plus_year')
      setUnlockState(nextState)
      setUnlockStatusMessage(copy.unlockAllCurrentPlusYearSuccess)
    } catch (error) {
      if (isLifetimeRequiredError(error)) {
        await startUnlockCheckout('all_current_plus_year')
        return
      }

      if (isPaymentRequiredError(error)) {
        await startUnlockCheckout('all_current_plus_year')
        return
      }

      if (unlockErrorCode(error).includes('PAYMENT_BACKEND_REQUIRED')) {
        setUnlockStatusMessage(copy.unlockPaidServerRequired)
        return
      }

      setUnlockStatusMessage(copy.unlockActionFailed)
    } finally {
      setUnlockBusy(false)
    }
  }

  async function handleUnlockFree(projectSlug: string) {
    const normalizedSlug = normalizeSlug(projectSlug)
    if (!normalizedSlug) {
      return
    }

    setUnlockTargetSlug(normalizedSlug)
    if (!ensureCanUnlock()) {
      return
    }

    setUnlockBusy(true)
    try {
      const nextState = await applyUnlockGrant('free_pick', normalizedSlug)
      setUnlockState(nextState)
      setUnlockStatusMessage(`${copy.unlockFreeSuccessPrefix}: ${getProjectNameBySlug(normalizedSlug)}`)
    } catch (error) {
      if (isFreeOfferExhaustedError(error)) {
        setUnlockStatusMessage(copy.unlockFreeEmpty)
        return
      }

      setUnlockStatusMessage(copy.unlockActionFailed)
    } finally {
      setUnlockBusy(false)
    }
  }

  useEffect(() => {
    if (rootView !== 'portfolio' || !unlockTargetSlug) {
      return
    }

    const target = document.getElementById(`project-${unlockTargetSlug}`)
    if (!target) {
      return
    }

    target.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [rootView, unlockTargetSlug])

  function jumpToArticle(id: string) {
    setActiveArticleId(id)
    const target = document.getElementById(id)
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  if (subdomainProject) {
    if (!subdomainProjectUnlocked) {
      return (
        <SubdomainProjectLocked
          lang={lang}
          role={authRole}
          project={subdomainProject}
          statusMessage={unlockStatusMessage}
          canUseFreeUnlock={canUseFreeUnlock}
          unlockBusy={unlockActionDisabled}
          freeRemaining={freeOfferStatus.remaining}
          authPanel={authPanelProps}
          onUnlockSingle={(slug) => void handleUnlockSingle(slug)}
          onUnlockFree={(slug) => void handleUnlockFree(slug)}
        />
      )
    }

    return <SubdomainProjectView lang={lang} project={subdomainProject} lastUpdated={lastUpdated} authPanel={authPanelProps} />
  }

  if (isResumeView) {
    if (!canAccessResume) {
      return <ResumeAccessDenied lang={lang} role={authRole} authPanel={authPanelProps} />
    }
    return <ResumePage lang={lang} lastUpdated={lastUpdated} authPanel={authPanelProps} />
  }

  if (rootView === 'blog') {
    return (
      <div className="page-container blog-page">
        <Sidebar
          lang={lang}
          mode="blog"
          activeKey={activeArticle.id}
          lastUpdated={lastUpdated}
          onLangChange={setLang}
          onModeChange={setRootView}
          onNavigate={jumpToArticle}
          tocItems={BLOG_ARTICLES.map((article) => ({
            id: article.id,
            label: article.title[lang],
            meta: article.date,
          }))}
          authPanel={authPanelProps}
        />

        <main className="main-content blog-main">
          <section id="home" className="site-home-head">
            <SiteHeroBanner lang={lang} className="blog-hero-banner" />
            <div className="site-home-profile">
              <div className="profile-title">简永杰</div>
              <div className="profile-title profile-title-en">Jian Yongjie</div>
              <div className="profile-affil">
                {copy.profileLine1}
                <br />
                {copy.profileLine2}
                <br />
                {copy.profileLine3}
              </div>
            </div>
          </section>

          {BLOG_ARTICLES.map((article) => (
            <article key={article.id} id={article.id} className="blog-article">
              <div className="paper-meta">
                <span>{article.date}</span>
                <span>{article.category[lang]}</span>
              </div>
              <h2 className="blog-article-title">{article.title[lang]}</h2>
              <p className="meta">{article.summary[lang]}</p>
              {article.paragraphs.map((paragraph, index) => (
                <p key={`${article.id}-${index}`}>{paragraph[lang]}</p>
              ))}
            </article>
          ))}

          <footer>
            <div>{copy.copyright}</div>
            <div>{copy.blogMode}</div>
          </footer>
        </main>
        <div className="blog-next-fixed-wrap" aria-live="polite">
          <button
            type="button"
            className="blog-next-fixed-btn"
            onClick={() => {
              if (!nextArticle) {
                return
              }
              jumpToArticle(nextArticle.id)
            }}
            disabled={!nextArticle}
            title={nextArticle ? `${copy.nextTitlePrefix}: ${nextArticle.title[lang]}` : copy.noNext}
            aria-label={nextArticle ? `${copy.nextAriaPrefix}: ${nextArticle.title[lang]}` : copy.noNext}
          >
            <span className="mono blog-next-fixed-label">{copy.nextLabel}</span>
            <span className="blog-next-fixed-text">
              {nextArticle ? `${copy.nextPrefix}: ${nextArticle.title[lang]}` : copy.noNext}
            </span>
          </button>
        </div>
      </div>
    )
  }

  if (rootView === 'deploy') {
    return (
      <div className="page-container">
        <Sidebar
          lang={lang}
          mode="portfolio"
          activeKey={activeSection}
          lastUpdated={lastUpdated}
          onLangChange={setLang}
          onModeChange={setRootView}
          onNavigate={(id) => {
            setActiveSection(id)
            const target = document.getElementById(id)
            if (target) {
              target.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
          }}
          tocItems={[
            { id: 'home', label: copy.tocHome },
            { id: 'deploy', label: copy.tocDeploy },
            { id: 'contact', label: copy.tocContact },
          ]}
          authPanel={authPanelProps}
        />

        <main className="main-content portfolio-main-content">
          <section id="home">
            <div className="site-home-head">
              <SiteHeroBanner lang={lang} className="blog-hero-banner" />
              <div className="site-home-profile">
                <div className="profile-title">简永杰</div>
                <div className="profile-title profile-title-en">Jian Yongjie</div>
                <div className="profile-affil">
                  {copy.profileLine1}
                  <br />
                  {copy.profileLine2}
                  <br />
                  {copy.profileLine3}
                </div>
              </div>
            </div>
          </section>

          <section id="deploy">
            <h2>{copy.deployTitle}</h2>
            <p className="visual-intro">{copy.deployIntro}</p>
            <section className="unlock-control-panel" aria-live="polite">
              <div className="unlock-plan-actions">
                <button
                  type="button"
                  className={`unlock-plan-btn ${deployTarget === 'local' ? 'active' : ''}`}
                  onClick={() => setDeployTarget('local')}
                >
                  {copy.deployMachineLocal}
                </button>
                <button
                  type="button"
                  className={`unlock-plan-btn ${deployTarget === 'remote' ? 'active' : ''}`}
                  onClick={() => setDeployTarget('remote')}
                >
                  {copy.deployMachineRemote}
                </button>
              </div>

              <p className="unlock-control-intro">
                {deployTarget === 'local' ? copy.deployMachineLocalDesc : copy.deployMachineRemoteDesc}
              </p>
              {clientOs === 'windows' ? <p className="unlock-status-message">{copy.deployWindowsHint}</p> : null}

              <div className="deploy-form-grid">
                <label className="deploy-field">
                  <span>{copy.deployPortLabel}</span>
                  <input
                    className="deploy-input"
                    value={deployPort}
                    onChange={(event) => setDeployPort(event.target.value)}
                    inputMode="numeric"
                    placeholder="8080"
                  />
                </label>
                {deployTarget === 'remote' ? (
                  <label className="deploy-field">
                    <span>{copy.deployRemoteHostLabel}</span>
                    <input
                      className="deploy-input"
                      value={deployRemoteHost}
                      onChange={(event) => setDeployRemoteHost(event.target.value)}
                      placeholder={copy.deployRemoteHostPlaceholder}
                    />
                  </label>
                ) : null}
              </div>

              <pre className="deploy-command-block">
                <code>{activeDeployCommand || copy.deployRemoteHostRequired}</code>
              </pre>

              <div className="unlock-plan-actions">
                <button type="button" className="unlock-plan-btn" onClick={() => void handleCopyDeployCommand()}>
                  {copy.deployCopyCommand}
                </button>
                <a className="unlock-plan-btn deploy-link-btn" href={selfHostInstallGuideUrl} target="_blank" rel="noreferrer">
                  {copy.deployOpenGuide}
                </a>
                <a className="unlock-plan-btn deploy-link-btn" href={selfHostInstallScriptUrl} target="_blank" rel="noreferrer">
                  {copy.deployOpenScript}
                </a>
              </div>

              {deployStatusMessage ? <p className="unlock-status-message">{deployStatusMessage}</p> : null}
              <p className="unlock-control-intro">{copy.deployAfterDone}</p>

              <div className="unlock-plan-actions">
                <button type="button" className="unlock-plan-btn" onClick={() => setRootView('portfolio')}>
                  {copy.deployBackPortfolio}
                </button>
                {unlockTargetSlug ? (
                  <a
                    className="unlock-plan-btn deploy-link-btn"
                    href={withLangParam(`https://${unlockTargetSlug}.wordm.us`, lang)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {copy.deployOpenUnlockedProject}
                  </a>
                ) : null}
              </div>
            </section>
          </section>

          <section id="contact">
            <h2>{copy.contactTitle}</h2>
            <div className="formula">deploy(host) = wordm.us + {'{'}resume.wordm.us + p-*.wordm.us{'}'}</div>
            <p>
              {copy.rootDomain}: <a href={rootHomeUrl}>wordm.us</a>
              <br />
              {copy.resumeDomain}: <a href={resumeHomeUrl}>resume.wordm.us</a>
              <br />
              {copy.projectDomain}: {copy.projectDomainDesc}
            </p>
          </section>

          <footer>
            <div>{copy.copyright}</div>
            <div>{copy.portfolioMode}</div>
          </footer>
        </main>
      </div>
    )
  }

  return (
    <div className="page-container">
      <Sidebar
        lang={lang}
        mode="portfolio"
        activeKey={activeSection}
        lastUpdated={lastUpdated}
        onLangChange={setLang}
        onModeChange={setRootView}
        onNavigate={(id) => setActiveSection(id)}
        tocItems={[
          { id: 'home', label: copy.tocHome },
          { id: 'projects', label: copy.tocProjects },
          { id: 'visual', label: copy.tocVisual },
          { id: 'contact', label: copy.tocContact },
        ]}
        authPanel={authPanelProps}
      />

      <main className="main-content portfolio-main-content">
        <section id="home">
          <div className="site-home-head">
            <SiteHeroBanner lang={lang} className="blog-hero-banner" />
            <div className="site-home-profile">
              <div className="profile-title">简永杰</div>
              <div className="profile-title profile-title-en">Jian Yongjie</div>
              <div className="profile-affil">
                {copy.profileLine1}
                <br />
                {copy.profileLine2}
                <br />
                {copy.profileLine3}
              </div>
            </div>
          </div>
        </section>

        <section id="projects">
          {debugMode ? (
            <DebugPanel
              lang={lang}
              allProjects={projects}
              selectedSlugs={selectedSlugs}
              centerApi={centerApi}
              sourceLabel={sourceLabel}
              loadState={loadState}
              errorMessage={errorMessage}
              onCenterApiChange={setCenterApi}
              onLoadLive={loadLiveProjects}
              onToggleProject={(slug) => {
                setSelectedSlugs((prev) => {
                  if (prev.includes(slug)) {
                    return prev.filter((item) => item !== slug)
                  }

                  return [...prev, slug]
                })
              }}
              onSelectFeatured={() => setSelectedSlugs(defaultSelection(projects, snapshot.featured))}
              onSelectAll={() => setSelectedSlugs(projects.map((project) => project.slug))}
            />
          ) : null}

          <h2>{copy.portfolioTitle}</h2>
          <p className="visual-intro">{copy.portfolioIntro}</p>
          <section className="unlock-control-panel" aria-live="polite">
            <div className="paper-meta unlock-control-meta">
              <span>{copy.unlockPanelTitle}</span>
              <span>
                {copy.unlockFreeQuotaPrefix}: {unlockQuotaText}
              </span>
              <span>{unlockStorageLabel}</span>
            </div>
            <p className="unlock-control-intro">{copy.unlockPanelIntro}</p>
            <p className="unlock-plan-summary">
              {copy.unlockPlanSingleLabel} (card) · {copy.unlockPlanAllCurrent} · {copy.unlockPlanAllCurrentPlusYear}
            </p>
            <p className="unlock-control-intro">
              {copy.unlockBillingHintPrefix}{' '}
              <a href={billingHomeUrl} target="_blank" rel="noreferrer">
                {copy.unlockBillingHintLink}
              </a>
            </p>
            <p className="unlock-control-intro">
              {copy.unlockInstallHintPrefix}{' '}
              <a href={selfHostInstallGuideUrl} target="_blank" rel="noreferrer">
                {copy.unlockInstallHintLink}
              </a>
            </p>

            {authRole === 'admin' || authRole === 'tester' ? (
              <p className="unlock-status-message">{copy.unlockBypassNotice}</p>
            ) : (
              <div className="unlock-plan-actions">
                <button
                  type="button"
                  className="unlock-plan-btn"
                  disabled={unlockActionDisabled}
                  onClick={() => void handleUnlockAllCurrent()}
                >
                  {copy.unlockPlanAllCurrent}
                </button>
                <button
                  type="button"
                  className="unlock-plan-btn"
                  disabled={unlockActionDisabled}
                  onClick={() => void handleUnlockAllCurrentPlusYear()}
                >
                  {copy.unlockPlanAllCurrentPlusYear}
                </button>
              </div>
            )}

            {unlockStatusMessage ? <p className="unlock-status-message">{unlockStatusMessage}</p> : null}
          </section>

          <div className="portfolio-gallery">
            {featuredProjects.map((project) => (
              <ProjectEntry
                lang={lang}
                key={project.id}
                project={project}
                unlocked={isProjectUnlocked(project.slug)}
                focused={unlockTargetSlug === project.slug}
                canUseFreeUnlock={canUseFreeUnlock}
                unlockBusy={unlockActionDisabled}
                onUnlockSingle={(slug) => void handleUnlockSingle(slug)}
                onUnlockFree={(slug) => void handleUnlockFree(slug)}
              />
            ))}
          </div>
        </section>

        <section id="visual">
          <h2>{copy.visualTitle}</h2>
          <p className="visual-intro">{copy.visualIntro}</p>

          <div className="visual-grid">
            {highlightedProjects.map((project, index) => (
              <div key={`visual-${project.id}`}>
                <div className="grid-item">
                  <svg width="100%" height="100%" viewBox="0 0 100 100" aria-hidden="true">
                    <rect x="8" y="8" width="84" height="84" fill="none" stroke="#cdcdcd" strokeWidth="1" />
                    <line x1="16" y1="84" x2="84" y2="16" stroke="#222" strokeWidth="1.2" />
                    <line x1="16" y1="16" x2="84" y2="84" stroke="#555" strokeWidth="0.8" strokeDasharray="3 2" />
                    <circle cx={30 + index * 20} cy={40 + index * 8} r="5" fill="#111" />
                    <path d="M 18 70 Q 50 20 82 70" stroke="#111" fill="none" strokeWidth="1" />
                  </svg>
                </div>
                <div className="grid-caption">{project.name}</div>
              </div>
            ))}
          </div>
        </section>

        <section id="contact">
          <h2>{copy.contactTitle}</h2>
          <div className="formula">deploy(host) = wordm.us + {'{'}resume.wordm.us + p-*.wordm.us{'}'}</div>
          <p>
            {copy.rootDomain}: <a href={rootHomeUrl}>wordm.us</a>
            <br />
            {copy.resumeDomain}: <a href={resumeHomeUrl}>resume.wordm.us</a>
            <br />
            {copy.projectDomain}: {copy.projectDomainDesc}
          </p>
        </section>

        <footer>
          <div>{copy.copyright}</div>
          <div>{copy.portfolioMode}</div>
        </footer>
      </main>
    </div>
  )
}

export default App
