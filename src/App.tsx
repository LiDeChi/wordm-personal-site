import { useEffect, useMemo, useState } from 'react'
import { DebugPanel } from './components/DebugPanel'
import { ProjectDetailPage } from './components/ProjectDetailPage'
import { AdminPage } from './components/AdminPage'
import { ProjectEntry } from './components/ProjectEntry'
import { ResumeAccessDenied } from './components/ResumeAccessDenied'
import { ShareAccessDenied } from './components/ShareAccessDenied'
import { ResumePage } from './components/ResumePage'
import { Sidebar } from './components/Sidebar'
import { SubdomainProjectLocked } from './components/SubdomainProjectLocked'
import { SubdomainProjectView } from './components/SubdomainProjectView'
import { type Lang, resolveInitialLang } from './i18n/lang'
import projectsSnapshotRaw from './data/projects.snapshot.json'
import { withSiteParams } from './lib/lang-url'
import { createUnlockCheckoutUrl, type UnlockCheckoutKind } from './lib/unlock-billing'
import { createDeployTicket } from './lib/deploy-ticket'
import {
  buildShareEntryUrl,
  canShareAccessProject,
  canShareAccessView,
  createShareLink,
  listOwnShareLinks,
  resolveShareLink,
  purgeShareLinks,
  revokeShareLink,
  type ShareAccess,
  type ShareLinkRecord,
  type ShareResolveStatus,
  type ShareScope,
} from './lib/share-links'
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
    tocProjects: '项目',
    tocDeploy: '部署',
    tocContact: '联系',
    portfolioTitle: '作品集',
    contactTitle: '联系',
    copyright: '© 2026 Jian Yongjie. All rights reserved.',
    portfolioMode: 'wordm.us 作品集模式',
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
    unlockInstallHintPrefix: '付费后可一键自部署：',
    unlockInstallHintLink: '打开安装指南',
    unlockCheckoutStarting: '正在跳转支付...',
    unlockCheckoutProductMissing: '未配置该解锁方案的商品，请先在 latti.wordm.us 完成升级。',
    unlockCheckoutFailed: '拉起支付失败，请稍后重试。',
    unlockCheckoutSuccess: '支付回调已返回。你可以直接使用下方自部署入口，或再次点击解锁按钮完成授权同步。',
    unlockCheckoutCanceled: '已取消支付。',
    deployTitle: 'Center Control 一键部署',
    deployIntro: '付费后可将 Center Control 一键部署到你的机器或你自己的服务器。',
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
    deployGeneratingTicket: '正在生成一次性部署凭证...',
    deployNeedLogin: '请先登录并确保账号具备付费权益。',
    deployTicketFailed: '生成部署凭证失败，请稍后重试。',
    deployCopySuccess: '部署命令已复制，请到终端粘贴执行。',
    deployCopyFailed: '复制失败，请手动复制命令。',
    deployOpenGuide: '查看安装说明',
    deployOpenScript: '打开安装脚本',
    deployAfterDone: '部署完成后，访问 http://localhost:端口（或你的服务器地址）即可使用。',
    deployBackPortfolio: '返回作品集',
    deployOpenUnlockedProject: '打开已解锁项目',
    deployWindowsHint: 'Windows 建议在 WSL / Git Bash 中执行命令。',
    shareChecking: '正在验证分享链接...',
    shareCreateSuccess: '分享链接已生成。',
    shareCreateFailed: '生成分享链接失败，请稍后重试。',
    shareCopySuccess: '分享链接已复制。',
    shareCopyFailed: '复制分享链接失败，请手动复制。',
    shareRevokeSuccess: '分享链接已撤销。',
    shareRevokeFailed: '撤销分享链接失败，请稍后重试。',
    shareNeedProjects: '当前未勾选任何项目，请先勾选要分享的项目，或切换为全部项目子域。',
    shareEntitlementRequired: '当前账号暂无分享权限，请先使用有权限的账号登录。',
    shareResumeRestricted: '简历页仅允许管理员或测试账号加入分享链接。',
    shareListLoadFailed: '加载分享链接失败，请稍后重试。',
    shareInvalid: '分享链接无效。',
    shareExpired: '分享链接已过期。',
    shareRevoked: '分享链接已撤销。',
    shareRestricted: '当前分享链接未开放此页面或项目。',
  },
  en: {
    sourceSnapshot: 'Project snapshot',
    sourceLivePrefix: 'Live API',
    sourceLoadFailed: 'Load failed. Please try again.',
    apiRequired: 'Please provide the project API URL first.',
    profileLine1: 'Product Strategist & Builder',
    profileLine2: 'AI + Design + Engineering',
    profileLine3: 'Base: New York / Beijing',
    tocProjects: 'Projects',
    tocDeploy: 'Deploy',
    tocContact: 'Contact',
    portfolioTitle: 'Portfolio Gallery',
    contactTitle: 'Contact',
    copyright: '© 2026 Jian Yongjie. All rights reserved.',
    portfolioMode: 'Portfolio mode on wordm.us',
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
    unlockInstallHintPrefix: 'After payment, one-click self-host is available here:',
    unlockInstallHintLink: 'Open install guide',
    unlockCheckoutStarting: 'Redirecting to checkout...',
    unlockCheckoutProductMissing: 'No product is configured for this unlock mode. Upgrade on latti.wordm.us first.',
    unlockCheckoutFailed: 'Failed to start checkout. Please try again later.',
    unlockCheckoutSuccess: 'Payment callback received. Use the self-host entry below, or click unlock again to sync entitlement.',
    unlockCheckoutCanceled: 'Checkout canceled.',
    deployTitle: 'One-Click Center Control Deploy',
    deployIntro: 'After payment, deploy Center Control to your current machine or your own server.',
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
    deployGeneratingTicket: 'Generating one-time deploy ticket...',
    deployNeedLogin: 'Please log in and make sure your account has paid entitlement.',
    deployTicketFailed: 'Failed to generate deploy ticket. Please try again later.',
    deployCopySuccess: 'Deploy command copied. Paste it in your terminal.',
    deployCopyFailed: 'Copy failed. Please copy the command manually.',
    deployOpenGuide: 'Open install guide',
    deployOpenScript: 'Open install script',
    deployAfterDone: 'After deployment, open http://localhost:port (or your server host:port) to start using it.',
    deployBackPortfolio: 'Back to portfolio',
    deployOpenUnlockedProject: 'Open unlocked project',
    deployWindowsHint: 'On Windows, use WSL or Git Bash to run the command.',
    shareChecking: 'Validating share link...',
    shareCreateSuccess: 'Share link created.',
    shareCreateFailed: 'Failed to create share link. Please try again later.',
    shareCopySuccess: 'Share link copied.',
    shareCopyFailed: 'Failed to copy share link. Please copy it manually.',
    shareRevokeSuccess: 'Share link revoked.',
    shareRevokeFailed: 'Failed to revoke share link. Please try again later.',
    shareNeedProjects: 'No project is selected. Select projects first, or switch to all project subdomains.',
    shareEntitlementRequired: 'This account cannot create share links. Log in with an authorized account first.',
    shareResumeRestricted: 'Resume access can only be included by admin or tester accounts.',
    shareListLoadFailed: 'Failed to load share links. Please try again later.',
    shareInvalid: 'Share link is invalid.',
    shareExpired: 'Share link has expired.',
    shareRevoked: 'Share link has been revoked.',
    shareRestricted: 'This share link does not include this page or project.',
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

function shellQuote(raw: string): string {
  return `'${raw.replace(/'/g, `'"'"'`)}'`
}

function defaultShareScope(): ShareScope {
  return {
    allowPortfolio: true,
    allowBlog: true,
    allowDeploy: true,
    allowResume: true,
    allowAllProjects: true,
    allowedProjectSlugs: [],
  }
}

function resolveShareStatusFromError(error: unknown): Exclude<ShareResolveStatus, 'idle' | 'loading' | 'active'> {
  const detail = normalizeAuthError(error, '').toUpperCase()
  if (detail.includes('EXPIRED')) {
    return 'expired'
  }
  if (detail.includes('REVOKED')) {
    return 'revoked'
  }
  if (detail.includes('INVALID')) {
    return 'invalid'
  }
  return 'error'
}

function resolveShareDeniedStatus(options: {
  shareToken: string | null
  shareResolveStatus: ShareResolveStatus
  allowedByShare: boolean
  bypass: boolean
}): ShareResolveStatus | null {
  if (!options.shareToken || options.bypass) {
    return null
  }

  if (options.shareResolveStatus === 'loading') {
    return 'loading'
  }

  if (options.shareResolveStatus === 'active') {
    return options.allowedByShare ? null : 'active'
  }

  if (options.shareResolveStatus === 'idle') {
    return 'invalid'
  }

  return options.shareResolveStatus
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
  const initialProjectSlug = normalizeSlug(params.get('project'))
  const initialUnlockSlug = normalizeSlug(params.get('unlock'))
  const initialCheckoutSlug = normalizeSlug(params.get('checkout_slug'))
  const initialShareToken = params.get('share')?.trim() || null
  const initialPurchaseSuccess = params.get('purchase_success') === '1'
  const initialPurchaseCanceled = params.get('purchase_cancel') === '1'
  const initialLang = resolveInitialLang(window.location)

  const [lang, setLang] = useState<Lang>(initialLang)
  const copy = APP_COPY[lang]
  const selfHostInstallGuideUrl =
    import.meta.env.VITE_SELFHOST_INSTALL_URL || 'https://github.com/LiDeChi/center-control#付费用户一键安装deploy-ticket'
  const selfHostInstallScriptUrl =
    import.meta.env.VITE_SELFHOST_INSTALL_SCRIPT_URL ||
    'https://raw.githubusercontent.com/LiDeChi/center-control/main/scripts/install-center-control.sh'
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
  const [selectedProjectSlug, setSelectedProjectSlug] = useState<string | null>(initialProjectSlug)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [unlockTargetSlug, setUnlockTargetSlug] = useState<string | null>(initialUnlockSlug)
  const [deployTarget, setDeployTarget] = useState<DeployTarget>('local')
  const [deployPort, setDeployPort] = useState('8080')
  const [deployRemoteHost, setDeployRemoteHost] = useState('')
  const [deployStatusMessage, setDeployStatusMessage] = useState('')
  const [shareToken] = useState<string | null>(initialShareToken)
  const [shareAccess, setShareAccess] = useState<ShareAccess | null>(null)
  const [shareResolveStatus, setShareResolveStatus] = useState<ShareResolveStatus>(initialShareToken ? 'loading' : 'idle')
  const [shareBusy, setShareBusy] = useState(false)
  const [shareManageStatusMessage, setShareManageStatusMessage] = useState('')
  const [shareLabel, setShareLabel] = useState('')
  const [shareExpiresInDays, setShareExpiresInDays] = useState('3')
  const [shareScope, setShareScope] = useState<ShareScope>(() => defaultShareScope())
  const [shareLinks, setShareLinks] = useState<ShareLinkRecord[]>([])
  const [lastCreatedShareUrl, setLastCreatedShareUrl] = useState('')
  const [lastCreatedShareId, setLastCreatedShareId] = useState<string | null>(null)
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(() => {
    if (initialShowSlugs.length) {
      return initialShowSlugs
    }

    return defaultSelection(snapshot.projects, snapshot.featured)
  })

  const sourceLabel = sourceType === 'live' && centerApi ? `${copy.sourceLivePrefix}: ${centerApi}` : copy.sourceSnapshot
  const contactEmail = 'parsonjian@gmail.com'

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

    if (selectedProjectSlug && rootView === 'portfolio') {
      next.searchParams.set('project', selectedProjectSlug)
    } else {
      next.searchParams.delete('project')
    }

    if (unlockTargetSlug) {
      next.searchParams.set('unlock', unlockTargetSlug)
    } else {
      next.searchParams.delete('unlock')
    }

    if (shareToken) {
      next.searchParams.set('share', shareToken)
    } else {
      next.searchParams.delete('share')
    }

    window.history.replaceState({}, '', next)
  }, [rootView, lang, selectedProjectSlug, unlockTargetSlug, shareToken])

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
    if (!shareToken) {
      setShareAccess(null)
      setShareResolveStatus('idle')
      return
    }

    if (!authConfig.supabaseUrl) {
      setShareAccess(null)
      setShareResolveStatus('error')
      return
    }

    let active = true
    setShareResolveStatus('loading')

    void resolveShareLink(authConfig.supabaseUrl, shareToken)
      .then((access) => {
        if (!active) {
          return
        }

        setShareAccess(access)
        setShareResolveStatus('active')
      })
      .catch((error) => {
        if (!active) {
          return
        }

        setShareAccess(null)
        setShareResolveStatus(resolveShareStatusFromError(error))
      })

    return () => {
      active = false
    }
  }, [authConfig.supabaseUrl, shareToken])

  useEffect(() => {
    if (rootView !== 'portfolio') {
      setSelectedProjectSlug(null)
    }
  }, [rootView])

  useEffect(() => {
    function syncScrollTopVisibility() {
      setShowScrollTop(window.scrollY > 540)
    }

    syncScrollTopVisibility()
    window.addEventListener('scroll', syncScrollTopVisibility, { passive: true })
    return () => window.removeEventListener('scroll', syncScrollTopVisibility)
  }, [])



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
    if (!authUser || (authUser.role !== 'admin' && authUser.role !== 'tester')) {
      setShareLinks([])
      return
    }

    let active = true
    void listOwnShareLinks(authConfig)
      .then((links) => {
        if (!active) {
          return
        }
        setShareLinks(links)
      })
      .catch(() => {
        if (!active) {
          return
        }
        setShareManageStatusMessage(copy.shareListLoadFailed)
      })

    return () => {
      active = false
    }
  }, [authConfig, authUser, copy.shareListLoadFailed])

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
    const remoteHost = deployRemoteHost.trim()
    if (deployTarget === 'remote' && !remoteHost) {
      setDeployStatusMessage(copy.deployRemoteHostRequired)
      return
    }

    const canUseShareDeploy = Boolean(shareToken && shareResolveStatus === 'active' && canShareAccessView('deploy', shareAccess))
    if ((!authEnabled || !authUser) && !canUseShareDeploy) {
      setDeployStatusMessage(copy.deployNeedLogin)
      return
    }

    setDeployStatusMessage(copy.deployGeneratingTicket)

    try {
      const deployTicket = await createDeployTicket(authConfig, {
        scope: 'center_control_personal',
        target: deployTarget,
        expiresInSec: 600,
        shareToken: !authUser && canUseShareDeploy ? shareToken : null,
      })

      const installScriptUrl = deployTicket.installScriptUrl || selfHostInstallScriptUrl
      const localCommand = `curl -fsSL ${shellQuote(installScriptUrl)} | bash -s -- --ticket ${shellQuote(deployTicket.ticket)} --resolve-endpoint ${shellQuote(deployTicket.resolveEndpoint)} --port ${normalizedDeployPort}`
      const command = deployTarget === 'remote' ? `ssh ${remoteHost} ${shellQuote(localCommand)}` : localCommand

      const copied = await copyTextToClipboard(command)
      setDeployStatusMessage(copied ? copy.deployCopySuccess : copy.deployCopyFailed)
    } catch (error) {
      const code = unlockErrorCode(error)
      if (code.includes('UNAUTHENTICATED') || code.includes('DEPLOY_ENTITLEMENT_REQUIRED')) {
        setDeployStatusMessage(copy.deployNeedLogin)
        return
      }
      if (code.includes('DEPLOY_SHARE_')) {
        setDeployStatusMessage(shareNoticeForStatus(resolveShareStatusFromError(error)))
        return
      }

      setDeployStatusMessage(copy.deployTicketFailed)
    }
  }

  function shareNoticeForStatus(status: ShareResolveStatus) {
    if (status === 'expired') {
      return copy.shareExpired
    }
    if (status === 'revoked') {
      return copy.shareRevoked
    }
    if (status === 'active') {
      return copy.shareRestricted
    }
    return copy.shareInvalid
  }

  async function createManagedShareLink(options: {
    label: string
    expiresInDays: number
    scope: ShareScope
    entryUrlBuilder?: ((token: string) => string) | null
    copyAfterCreate?: boolean
  }) {
    if (!authUser) {
      setShareManageStatusMessage(copy.shareEntitlementRequired)
      return null
    }

    const scope = {
      ...options.scope,
      allowedProjectSlugs: options.scope.allowAllProjects ? [] : options.scope.allowedProjectSlugs,
    }

    if (
      !scope.allowPortfolio &&
      !scope.allowBlog &&
      !scope.allowDeploy &&
      !scope.allowResume &&
      !scope.allowAllProjects &&
      scope.allowedProjectSlugs.length === 0
    ) {
      setShareManageStatusMessage(copy.shareNeedProjects)
      return null
    }

    setShareBusy(true)
    try {
      const created = await createShareLink(authConfig, {
        label: options.label,
        expiresInDays: options.expiresInDays,
        scope,
      })
      const fallbackUrl = buildShareEntryUrl(created.token, lang, created.scope, projects)
      const shareUrl = options.entryUrlBuilder ? options.entryUrlBuilder(created.token) : fallbackUrl
      setLastCreatedShareId(created.id)
      setLastCreatedShareUrl(shareUrl)
      setShareLinks(await listOwnShareLinks(authConfig))

      if (options.copyAfterCreate) {
        const copied = await copyTextToClipboard(shareUrl)
        setShareManageStatusMessage(copied ? copy.shareCopySuccess : copy.shareCopyFailed)
      } else {
        setShareManageStatusMessage(copy.shareCreateSuccess)
      }

      return created
    } catch (error) {
      const code = unlockErrorCode(error)
      if (code.includes('SHARE_SCOPE_EMPTY')) {
        setShareManageStatusMessage(copy.shareNeedProjects)
        return null
      }
      if (code.includes('SHARE_RESUME_RESTRICTED')) {
        setShareManageStatusMessage(copy.shareResumeRestricted)
        return null
      }
      if (code.includes('SHARE_ENTITLEMENT_REQUIRED') || code.includes('UNAUTHENTICATED')) {
        setShareManageStatusMessage(copy.shareEntitlementRequired)
        return null
      }
      setShareManageStatusMessage(copy.shareCreateFailed)
      return null
    } finally {
      setShareBusy(false)
    }
  }

  async function handleCreateShareLink() {
    const normalizedDays = Number(shareExpiresInDays.trim() || '3')
    const selectedProjectSlugs = shareScope.allowAllProjects ? [] : selectedSlugs

    await createManagedShareLink({
      label: shareLabel,
      expiresInDays: normalizedDays,
      scope: {
        ...shareScope,
        allowedProjectSlugs: selectedProjectSlugs,
      },
    })
  }

  async function handleCreateFullExperienceShareLink() {
    await createManagedShareLink({
      label: shareLabel || (lang === 'zh' ? '3 天完整体验' : '3-day full experience'),
      expiresInDays: 3,
      scope: {
        allowPortfolio: true,
        allowBlog: false,
        allowDeploy: true,
        allowResume: authRole === 'admin' || authRole === 'tester',
        allowAllProjects: true,
        allowedProjectSlugs: [],
      },
      copyAfterCreate: true,
    })
  }

  async function handleCreateSevenDayShareLink() {
    await createManagedShareLink({
      label: shareLabel || (lang === 'zh' ? '7 天完整体验' : '7-day full experience'),
      expiresInDays: 7,
      scope: {
        allowPortfolio: true,
        allowBlog: false,
        allowDeploy: true,
        allowResume: authRole === 'admin' || authRole === 'tester',
        allowAllProjects: true,
        allowedProjectSlugs: [],
      },
      copyAfterCreate: true,
    })
  }

  async function handleCreateThirtyDayShareLink() {
    await createManagedShareLink({
      label: shareLabel || (lang === 'zh' ? '30 天完整体验' : '30-day full experience'),
      expiresInDays: 30,
      scope: {
        allowPortfolio: true,
        allowBlog: false,
        allowDeploy: true,
        allowResume: authRole === 'admin' || authRole === 'tester',
        allowAllProjects: true,
        allowedProjectSlugs: [],
      },
      copyAfterCreate: true,
    })
  }

  async function handleCreateProjectDetailShareLink(projectSlug: string) {
    const normalizedSlug = normalizeSlug(projectSlug)
    const project = normalizedSlug ? projects.find((item) => item.slug === normalizedSlug) ?? null : null
    if (!normalizedSlug || !project) {
      return
    }

    await createManagedShareLink({
      label: `${project.name} · ${lang === 'zh' ? '详情分享' : 'detail share'}`,
      expiresInDays: 3,
      scope: {
        allowPortfolio: true,
        allowBlog: false,
        allowDeploy: false,
        allowResume: false,
        allowAllProjects: false,
        allowedProjectSlugs: [normalizedSlug],
      },
      entryUrlBuilder: (token) =>
        withSiteParams(`https://wordm.us?view=portfolio&project=${encodeURIComponent(normalizedSlug)}`, {
          lang,
          shareToken: token,
        }),
      copyAfterCreate: true,
    })
  }

  async function handleCreateProjectSubdomainShareLink(projectSlug: string) {
    const normalizedSlug = normalizeSlug(projectSlug)
    const project = normalizedSlug ? projects.find((item) => item.slug === normalizedSlug) ?? null : null
    if (!normalizedSlug || !project) {
      return
    }

    const created = await createManagedShareLink({
      label: `${project.name} · ${lang === 'zh' ? '子域分享' : 'subdomain share'}`,
      expiresInDays: 3,
      scope: {
        allowPortfolio: false,
        allowBlog: false,
        allowDeploy: false,
        allowResume: false,
        allowAllProjects: false,
        allowedProjectSlugs: [normalizedSlug],
      },
    })

    if (!created) {
      return
    }

    const shareUrl = withSiteParams(project.subdomainUrl, { lang, shareToken: created.token })
    setLastCreatedShareUrl(shareUrl)
    const copied = await copyTextToClipboard(shareUrl)
    setShareManageStatusMessage(copied ? copy.shareCopySuccess : copy.shareCopyFailed)
  }

  async function handleCopyLastShareLink() {
    if (!lastCreatedShareUrl) {
      setShareManageStatusMessage(copy.shareCopyFailed)
      return
    }

    const copied = await copyTextToClipboard(lastCreatedShareUrl)
    setShareManageStatusMessage(copied ? copy.shareCopySuccess : copy.shareCopyFailed)
  }

  async function handleRevokeShareLink(shareLinkId: string) {
    setShareBusy(true)
    try {
      await revokeShareLink(authConfig, shareLinkId)
      const nextLinks = await listOwnShareLinks(authConfig)
      setShareLinks(nextLinks)
      if (lastCreatedShareId === shareLinkId) {
        setLastCreatedShareId(null)
        setLastCreatedShareUrl('')
      }
      setShareManageStatusMessage(copy.shareRevokeSuccess)
    } catch {
      setShareManageStatusMessage(copy.shareRevokeFailed)
    } finally {
      setShareBusy(false)
    }
  }


  async function handlePurgeInactiveShareLinks() {
    setShareBusy(true)
    try {
      const deletedCount = await purgeShareLinks(authConfig)
      setShareLinks(await listOwnShareLinks(authConfig))
      setShareManageStatusMessage(`${copy.shareRevokeSuccess} (${deletedCount})`)
    } catch {
      setShareManageStatusMessage(copy.shareRevokeFailed)
    } finally {
      setShareBusy(false)
    }
  }

  async function handleAuthSubmit(email: string, password: string) {
    if (!authEnabled) {
      setAuthStatusMessage(copy.authUnavailable)
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
    } catch (loginError) {
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
      } catch {
        const detail = normalizeAuthError(loginError, copy.loginFallback)
        setAuthStatusMessage(withDetail(copy.loginFailed, detail))
      }
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

  const visibleProjects = useMemo(() => {
    const baseProjects = debugMode ? featuredProjects : projects

    if (!shareToken || !shareAccess || shareAccess.scope.allowAllProjects) {
      return baseProjects
    }

    const filtered = baseProjects.filter((project) => canShareAccessProject(project.slug, shareAccess))
    if (filtered.length) {
      return filtered
    }

    return projects.filter((project) => canShareAccessProject(project.slug, shareAccess))
  }, [debugMode, featuredProjects, projects, shareAccess, shareToken])

  const selectedProject = useMemo(() => {
    if (!selectedProjectSlug) {
      return null
    }

    return projects.find((project) => project.slug === selectedProjectSlug) ?? null
  }, [projects, selectedProjectSlug])

  const subdomainProject = useMemo(
    () => resolveSubdomainView(projects, window.location.hostname, forcedSubdomain),
    [projects, forcedSubdomain],
  )
  const isResumeView = forcedPage === 'resume' || hostname === 'resume.wordm.us' || hostname === 'cv.wordm.us'
  const isAdminView = forcedPage === 'admin' || hostname === 'admin.wordm.us'

  const authRole: AuthRole = authUser?.role ?? 'guest'
  const canManageShares = authRole === 'admin' || authRole === 'tester'
  const shareEntryUrl = shareToken && shareAccess ? buildShareEntryUrl(shareToken, lang, shareAccess.scope, projects) : null
  const canAccessResume = canManageShares || canShareAccessView('resume', shareAccess)
  const projectCatalogSlugs = useMemo(() => projects.map((project) => project.slug), [projects])
  const deployTargetProject = useMemo(
    () => (unlockTargetSlug ? projects.find((project) => project.slug === unlockTargetSlug) ?? null : null),
    [projects, unlockTargetSlug],
  )
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
  const deployCommandPreview = useMemo(() => {
    if (deployTarget === 'remote' && !deployRemoteHost.trim()) {
      return copy.deployRemoteHostRequired
    }

    const quotedScriptUrl = shellQuote(selfHostInstallScriptUrl)

    if (deployTarget === 'remote') {
      return `ssh ${deployRemoteHost.trim()} 'curl -fsSL ${quotedScriptUrl} | bash -s -- --ticket <generated-on-copy> --resolve-endpoint <resolve-endpoint> --port ${normalizedDeployPort}'`
    }

    return `curl -fsSL ${quotedScriptUrl} | bash -s -- --ticket <generated-on-copy> --resolve-endpoint <resolve-endpoint> --port ${normalizedDeployPort}`
  }, [
    copy.deployRemoteHostRequired,
    deployRemoteHost,
    deployTarget,
    normalizedDeployPort,
    selfHostInstallScriptUrl,
  ])
  const deployProjectUrl = deployTargetProject ? withSiteParams(deployTargetProject.subdomainUrl, { lang, shareToken }) : null
  const subdomainProjectUnlocked = subdomainProject
    ? canAccessProject(subdomainProject.slug, authRole, unlockState) || canShareAccessProject(subdomainProject.slug, shareAccess)
    : false
  const portfolioShareDeniedStatus = resolveShareDeniedStatus({
    shareToken,
    shareResolveStatus,
    allowedByShare: canShareAccessView('portfolio', shareAccess),
    bypass: Boolean(authUser),
  })
  const deployShareDeniedStatus = resolveShareDeniedStatus({
    shareToken,
    shareResolveStatus,
    allowedByShare: canShareAccessView('deploy', shareAccess),
    bypass: Boolean(authUser),
  })
  const resumeShareDeniedStatus = resolveShareDeniedStatus({
    shareToken,
    shareResolveStatus,
    allowedByShare: canShareAccessView('resume', shareAccess),
    bypass: authRole === 'admin' || authRole === 'tester',
  })
  const subdomainShareDeniedStatus = resolveShareDeniedStatus({
    shareToken,
    shareResolveStatus,
    allowedByShare: subdomainProject ? canShareAccessProject(subdomainProject.slug, shareAccess) : false,
    bypass: subdomainProject ? canAccessProject(subdomainProject.slug, authRole, unlockState) : false,
  })
  const projectDetailShareDeniedStatus = resolveShareDeniedStatus({
    shareToken,
    shareResolveStatus,
    allowedByShare: selectedProject ? canShareAccessView('portfolio', shareAccess) && canShareAccessProject(selectedProject.slug, shareAccess) : false,
    bypass: selectedProject ? canAccessProject(selectedProject.slug, authRole, unlockState) || canManageShares : false,
  })
  const authPanelProps = {
    lang,
    enabled: authEnabled,
    loading: authLoading,
    busy: authBusy,
    userEmail: authUser?.email ?? null,
    userRole: authRole,
    statusMessage: authStatusMessage,
    onLogin: handleAuthSubmit,
    onSignup: handleAuthSubmit,
    onLogout: handleLogout,
  }

  function getProjectNameBySlug(slug: string) {
    return projects.find((project) => project.slug === slug)?.name || slug
  }

  function isProjectUnlocked(slug: string) {
    return canAccessProject(slug, authRole, unlockState) || canShareAccessProject(slug, shareAccess)
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


  if (subdomainProject) {
    if (subdomainShareDeniedStatus) {
      return <ShareAccessDenied lang={lang} status={subdomainShareDeniedStatus} authPanel={authPanelProps} fallbackSharedUrl={shareEntryUrl} />
    }

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
          shareToken={shareToken}
          authPanel={authPanelProps}
          onUnlockSingle={(slug) => void handleUnlockSingle(slug)}
          onUnlockFree={(slug) => void handleUnlockFree(slug)}
        />
      )
    }

    return <SubdomainProjectView lang={lang} project={subdomainProject} lastUpdated={lastUpdated} shareToken={shareToken} authPanel={authPanelProps} />
  }

  if (isAdminView) {
    return (
      <AdminPage
        lang={lang}
        lastUpdated={lastUpdated}
        projects={projects}
        selectedSlugs={selectedSlugs}
        authPanel={authPanelProps}
        canManageShares={canManageShares}
        shareBusy={shareBusy}
        shareStatusMessage={shareManageStatusMessage}
        shareLabel={shareLabel}
        shareExpiresInDays={shareExpiresInDays}
        shareScope={shareScope}
        shareLinks={shareLinks}
        lastCreatedShareUrl={lastCreatedShareUrl}
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
        onShareLabelChange={setShareLabel}
        onShareExpiresInDaysChange={setShareExpiresInDays}
        onToggleShareFlag={(key) => {
          setShareScope((prev) => ({
            ...prev,
            [key]: !prev[key],
          }))
        }}
        onCreateShareLink={() => void handleCreateShareLink()}
        onCreateFullExperienceShareLink={() => void handleCreateFullExperienceShareLink()}
        onCreateSevenDayShareLink={() => void handleCreateSevenDayShareLink()}
        onCreateThirtyDayShareLink={() => void handleCreateThirtyDayShareLink()}
        onCreateProjectDetailShareLink={(slug) => void handleCreateProjectDetailShareLink(slug)}
        onCreateProjectSubdomainShareLink={(slug) => void handleCreateProjectSubdomainShareLink(slug)}
        onCopyLastShareLink={() => void handleCopyLastShareLink()}
        onPurgeInactiveShareLinks={() => void handlePurgeInactiveShareLinks()}
        onRevokeShareLink={(shareLinkId) => void handleRevokeShareLink(shareLinkId)}
      />
    )
  }

  if (isResumeView) {
    if (resumeShareDeniedStatus) {
      return <ShareAccessDenied lang={lang} status={resumeShareDeniedStatus} authPanel={authPanelProps} fallbackSharedUrl={shareEntryUrl} />
    }

    if (!canAccessResume) {
      return <ResumeAccessDenied lang={lang} role={authRole} shareToken={shareToken} authPanel={authPanelProps} />
    }
    return <ResumePage lang={lang} lastUpdated={lastUpdated} shareToken={shareToken} authPanel={authPanelProps} />
  }

  if (rootView === 'deploy') {
    if (deployShareDeniedStatus) {
      return <ShareAccessDenied lang={lang} status={deployShareDeniedStatus} authPanel={authPanelProps} fallbackSharedUrl={shareEntryUrl} />
    }

    return (
      <div className="page-container">
        <Sidebar
          lang={lang}
          onLangChange={setLang}
          authPanel={authPanelProps}
        />

        <main className="main-content portfolio-main-content">
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
                <code>{deployCommandPreview}</code>
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
                {deployTargetProject && deployProjectUrl && isProjectUnlocked(deployTargetProject.slug) ? (
                  <a className="unlock-plan-btn deploy-link-btn" href={deployProjectUrl} target="_blank" rel="noreferrer">
                    {copy.deployOpenUnlockedProject}
                  </a>
                ) : null}
              </div>
            </section>
          </section>

          <footer id="contact">
            <div className="footer-contact-inline">
              {copy.contactTitle}: 简永杰 / Jian Yongjie · {copy.profileLine1} ·{' '}
              <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
            </div>
            <div className="footer-meta-row">
              <div>{copy.copyright}</div>
              <div>{copy.portfolioMode}</div>
            </div>
          </footer>
        </main>
        {showScrollTop ? (
          <button type="button" className="scroll-top-btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            TOP
          </button>
        ) : null}
      </div>
    )
  }

  if (portfolioShareDeniedStatus) {
    return <ShareAccessDenied lang={lang} status={portfolioShareDeniedStatus} authPanel={authPanelProps} fallbackSharedUrl={shareEntryUrl} />
  }

  return (
    <div className="page-container">
      <Sidebar
        lang={lang}
        onLangChange={setLang}
        authPanel={authPanelProps}
      />

      <main className="main-content portfolio-main-content">
        <section id={selectedProject ? 'project-detail' : 'projects'}>
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

          {selectedProject ? (
            projectDetailShareDeniedStatus ? (
              <ShareAccessDenied lang={lang} status={projectDetailShareDeniedStatus} authPanel={authPanelProps} fallbackSharedUrl={shareEntryUrl} />
            ) : (
              <ProjectDetailPage
                lang={lang}
                project={selectedProject}
                lastUpdated={lastUpdated}
                unlocked={isProjectUnlocked(selectedProject.slug)}
                canUseFreeUnlock={canUseFreeUnlock}
                unlockBusy={unlockActionDisabled}
                statusMessage={unlockStatusMessage}
                onBack={() => setSelectedProjectSlug(null)}
                onUnlockSingle={(slug) => void handleUnlockSingle(slug)}
                onUnlockFree={(slug) => void handleUnlockFree(slug)}
              />
            )
          ) : (
            <div className="portfolio-gallery">
              {visibleProjects.map((project) => (
                <ProjectEntry
                  lang={lang}
                  key={project.id}
                  project={project}
                  unlocked={isProjectUnlocked(project.slug)}
                  focused={unlockTargetSlug === project.slug}
                    unlockBusy={unlockActionDisabled}
                    onSelectProject={(slug) => setSelectedProjectSlug(slug)}
                  onUnlockSingle={(slug) => void handleUnlockSingle(slug)}
                  />
              ))}
            </div>
          )}
        </section>

        <footer id="contact">
          <div className="footer-contact-inline">
            {copy.contactTitle}: 简永杰 / Jian Yongjie · {copy.profileLine1} ·{' '}
            <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
          </div>
          <div className="footer-meta-row">
            <div>{copy.copyright}</div>
            <div>{copy.portfolioMode}</div>
          </div>
        </footer>
      </main>
      {showScrollTop ? (
        <button type="button" className="scroll-top-btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          TOP
        </button>
      ) : null}
    </div>
  )
}

export default App