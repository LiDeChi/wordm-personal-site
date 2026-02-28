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
import { applyUnlockGrantFromSupabase, fetchUnlockStateFromSupabase } from './lib/unlock-remote'
import {
  canAccessProject,
  getFreeOfferStatus,
  grantAllCurrentPlusYearUnlock,
  grantAllCurrentUnlock,
  grantFreeProjectUnlock,
  grantSingleProjectUnlock,
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

type RootView = 'blog' | 'portfolio'
type UnlockStorageMode = 'remote' | 'local' | 'loading' | 'idle'

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
  return raw === 'blog' ? 'blog' : 'portfolio'
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
  const initialLang = resolveInitialLang(window.location)

  const [lang, setLang] = useState<Lang>(initialLang)
  const copy = APP_COPY[lang]
  const rootHomeUrl = withLangParam('https://wordm.us', lang)
  const resumeHomeUrl = withLangParam('https://resume.wordm.us', lang)

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
  const [unlockStatusMessage, setUnlockStatusMessage] = useState('')
  const [unlockTargetSlug, setUnlockTargetSlug] = useState<string | null>(initialUnlockSlug)
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
  const unlockActionDisabled = unlockBusy || unlockStorageMode === 'loading'
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
    const currentState = unlockState ?? EMPTY_UNLOCK_STATE

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
      } catch {
        setUnlockStorageMode('local')
        setUnlockStatusMessage(copy.unlockRemoteFallback)
      }
    }

    if (kind === 'single') {
      if (!projectSlug) {
        throw new Error('PROJECT_SLUG_REQUIRED')
      }
      return grantSingleProjectUnlock(currentState, projectSlug, new Date())
    }

    if (kind === 'all_current') {
      return grantAllCurrentUnlock(currentState, projectCatalogSlugs, new Date())
    }

    if (kind === 'all_current_plus_year') {
      return grantAllCurrentPlusYearUnlock(currentState, projectCatalogSlugs, new Date())
    }

    if (!projectSlug) {
      throw new Error('PROJECT_SLUG_REQUIRED')
    }

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
    } catch {
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
    } catch {
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
    } catch {
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
