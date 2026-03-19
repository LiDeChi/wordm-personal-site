import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { AccountEntryCard } from './components/AccountEntryCard'
import { DebugPanel } from './components/DebugPanel'
import { LoginPage } from './components/LoginPage'
import { AdminPage } from './components/AdminPage'
import { ProjectDetailModal } from './components/ProjectDetailModal'
import { ProjectEntry } from './components/ProjectEntry'
import { ResumeAccessDenied } from './components/ResumeAccessDenied'
import { ShareAccessDenied } from './components/ShareAccessDenied'
import { ResumePage } from './components/ResumePage'
import { SubdomainProjectView } from './components/SubdomainProjectView'
import { BLOG_ARTICLES } from './data/blogArticles'
import { FEATURED_PROJECT_SLUGS, getProjectPresentation } from './data/projectPresentation'
import { type Lang, resolveInitialLang } from './i18n/lang'
import projectsSnapshotRaw from './data/projects.snapshot.json'
import { withSiteParams } from './lib/lang-url'
import { createUnlockCheckoutUrl, type UnlockCheckoutKind } from './lib/unlock-billing'
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
import {
  createAdminShareLink,
  listAdminShareLinks,
  purgeAdminShareLinks,
  revokeAdminShareLink,
} from './lib/admin-share'
import { applyUnlockGrantFromSupabase, fetchUnlockStateFromSupabase } from './lib/unlock-remote'
import {
  hasProjectPremiumAccess,
  loadUnlockStateForUser,
  saveUnlockStateForUser,
  type UserUnlockState,
} from './lib/unlock'
import {
  applyCheckoutProductFallbacks,
  DEFAULT_SITE_PRICING_CONFIG,
  getProjectOfferState,
  getProjectUnlockOptions,
  type ProjectOfferState,
  type SitePricingConfig,
} from './lib/project-offers'
import { fetchPricingConfigFromSupabase, savePricingConfigFromSupabase } from './lib/pricing-remote'
import {
  type AuthRoleRulesJson,
  type AuthRole,
  type AuthRoleRules,
  type AuthUserSummary,
  fetchSessionUser,
  isAuthConfigured,
  loginWithGoogle,
  loginWithPassword,
  logout,
  mergeRoleRules,
  normalizeAuthError,
  parseRoleEmailSet,
  resolveSafeAuthRedirectUrl,
  signupWithPassword,
  subscribeAuthState,
  toAuthUserSummary,
  toRoleRulesFromJson,
} from './lib/auth'
import {
  chooseProjects,
  fetchProjectsFromApi,
  formatDate,
  isProjectDefaultVisible,
  parseShowSlugs,
  resolveSubdomainView,
} from './lib/projects'
import type { PortfolioProject, ProjectsSnapshot } from './types'

type RootView = 'blog' | 'portfolio' | 'login'
type UnlockStorageMode = 'remote' | 'local' | 'loading' | 'idle'

const snapshot = projectsSnapshotRaw as ProjectsSnapshot
const PortfolioShowcase = lazy(() =>
  import('./components/PortfolioShowcase').then((module) => ({
    default: module.PortfolioShowcase,
  })),
)
const GOOGLE_OAUTH_PENDING_KEY = 'wordm-google-oauth-pending-v1'
const GOOGLE_OAUTH_PENDING_GRACE_MS = 1500

function SubstackIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M4 4.5h16v1.8H4zm0 4.1h16v1.8H4zm0 4.1h16V20H4z"
      />
    </svg>
  )
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M18.47 3h2.94l-6.42 7.34L22.55 21h-5.91l-4.63-6.07L6.7 21H3.75l6.87-7.85L1.36 3h6.06l4.18 5.52zm-1.04 16h1.63L6.54 4.9H4.8z"
      />
    </svg>
  )
}

function readGoogleOAuthPendingAt() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.sessionStorage.getItem(GOOGLE_OAUTH_PENDING_KEY)
    if (!raw) {
      return null
    }

    const value = Number(raw)
    return Number.isFinite(value) ? value : null
  } catch {
    return null
  }
}

function markGoogleOAuthPending() {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.sessionStorage.setItem(GOOGLE_OAUTH_PENDING_KEY, String(Date.now()))
  } catch {
    // Ignore storage write failures.
  }
}

function clearGoogleOAuthPending() {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.sessionStorage.removeItem(GOOGLE_OAUTH_PENDING_KEY)
  } catch {
    // Ignore storage removal failures.
  }
}

function applyRuntimePricingFallback(
  config: SitePricingConfig,
  fallback: { singleCheckoutProductId?: string | null; allAccessCheckoutProductId?: string | null },
) {
  if (config.updatedAt) {
    return config
  }

  return applyCheckoutProductFallbacks(config, fallback)
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
    tocBlog: '文章',
    tocDeploy: '部署',
    tocContact: '联系',
    portfolioTitle: '作品集',
    blogTitle: '文章',
    blogIntro: '把短帖和长文放在同一条时间线上，方便从一个地方连续读完。',
    blogSourceSite: '站内',
    blogSourceX: '归档自 X',
    blogSourceSubstack: '归档自 Substack',
    blogOriginalPrefix: '原始发布时间',
    blogReadSource: '查看原文',
    blogNextLabel: '下一篇',
    blogEndOfList: '已经到最后一篇。',
    contactTitle: '联系',
    copyright: '© 2026 Jian Yongjie. All rights reserved.',
    portfolioMode: 'wordm.us 作品集模式',
    cornerSubstack: 'Substack',
    cornerX: 'X',
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
    googleLoggingIn: '正在跳转到 Google 登录...',
    googleLoginFailed: 'Google 登录失败',
    googleLoginFallback: '请稍后重试，或检查 Supabase 的 Google 登录配置。',
    googleLoginCancelled: '已取消 Google 登录。',
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
    unlockPanelTitle: 'Center Control 一键部署',
    unlockPanelIntro: '所有用户都可直接部署免费版；登录并升级后，安装脚本会自动切到包含付费部分的完整版。',
    unlockPanelSummary: '作品访问权限和部署版本是两条独立规则：即使没登录或没升级，也能部署，只是默认得到免费版。',
    unlockPlanSingleLabel: '单作品解锁',
    unlockPlanAllAccess: '全部解锁，后续作品免费',
    unlockPlanUnavailable: '当前未开放这个解锁方式。',
    unlockNeedLogin: '请先登录后再解锁作品。',
    unlockActionFailed: '解锁失败，请稍后重试。',
    unlockAllAccessSuccess: '已完成全部解锁，后续作品也将免费。',
    unlockSingleSuccessPrefix: '已解锁作品',
    unlockBypassNotice: '当前身份可直接访问全部作品，无需解锁。',
    unlockStorageRemote: '部署版本: 默认免费版；如当前账号已有权益，会自动切到完整版',
    unlockStorageLocal: '部署版本: 默认免费版；本地仅缓存作品访问权限',
    unlockStorageLoading: '部署版本: 正在同步当前账号权益...',
    unlockStorageIdle: '部署版本: 默认免费版（登录并升级后切到完整版）',
    unlockRemoteFallback: 'Supabase 解锁服务暂不可用，当前仅可读取本地缓存的已解锁权限。',
    unlockPaidRequired: '该解锁需要付费权益，请先在 latti.wordm.us 完成订阅或购买。',
    unlockLifetimeRequired: '该解锁仅对终身权益用户开放。',
    unlockPaidServerRequired: '付费解锁服务暂不可用，请稍后再试。',
    unlockInstallHintPrefix: '安装脚本与说明：',
    unlockInstallHintLink: '打开安装指南',
    deployUpgradeAction: '升级到完整版',
    unlockCheckoutStarting: '正在跳转支付...',
    unlockCheckoutProductMissing: '未配置该解锁方案的商品，请先在 latti.wordm.us 完成升级。',
    unlockCheckoutFailed: '拉起支付失败，请稍后重试。',
    unlockCheckoutSuccess: '支付回调已返回。你可以直接使用下方自部署入口，或再次点击解锁按钮完成授权同步。',
    unlockCheckoutCanceled: '已取消支付。',
    pricingLoadFallback: '定价配置加载失败，当前使用前端回退配置。',
    pricingReloadSuccess: '已重新加载后台定价配置。',
    pricingSaveSuccess: '定价配置已保存。',
    pricingSaveFailed: '保存定价配置失败',
    pricingManageLogin: '请使用管理员或测试账号登录后再保存定价配置。',
    pricingUnavailable: '未配置 Supabase，无法保存后台定价配置。',
    deployTitle: 'Center Control 一键部署',
    deployIntro: '所有用户都可部署免费版；登录并升级后，会切换为包含付费部分的完整版。',
    deployAutoReady: '已识别到完整版权益，正在按完整版部署。',
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
    deployNeedLogin: '未登录或未升级时会部署免费版；登录并升级后才会切到完整版。',
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
    tocBlog: 'Articles',
    tocDeploy: 'Deploy',
    tocContact: 'Contact',
    portfolioTitle: 'Portfolio Gallery',
    blogTitle: 'Articles',
    blogIntro: 'Short notes and long-form pieces live on one timeline so the reading flow stays continuous.',
    blogSourceSite: 'On site',
    blogSourceX: 'Archived from X',
    blogSourceSubstack: 'Archived from Substack',
    blogOriginalPrefix: 'Originally posted',
    blogReadSource: 'Open source',
    blogNextLabel: 'Next',
    blogEndOfList: 'You are at the last article.',
    contactTitle: 'Contact',
    copyright: '© 2026 Jian Yongjie. All rights reserved.',
    portfolioMode: 'Portfolio mode on wordm.us',
    cornerSubstack: 'Substack',
    cornerX: 'X',
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
    googleLoggingIn: 'Redirecting to Google sign-in...',
    googleLoginFailed: 'Google sign-in failed',
    googleLoginFallback: 'Please try again, or check the Supabase Google provider configuration.',
    googleLoginCancelled: 'Google sign-in was canceled.',
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
    unlockPanelTitle: 'One-Click Center Control Deploy',
    unlockPanelIntro: 'Everyone can deploy the free edition directly. After sign-in and upgrade, the install script switches to the full edition with paid modules.',
    unlockPanelSummary: 'Project access rules and deployment edition are separate: even without login or upgrade, deployment still works and defaults to the free edition.',
    unlockPlanSingleLabel: 'Single project unlock',
    unlockPlanAllAccess: 'Unlock all projects, future projects included',
    unlockPlanUnavailable: 'This unlock path is not available right now.',
    unlockNeedLogin: 'Please log in before unlocking projects.',
    unlockActionFailed: 'Unlock failed. Please try again later.',
    unlockAllAccessSuccess: 'All projects are unlocked, including future ones.',
    unlockSingleSuccessPrefix: 'Unlocked project',
    unlockBypassNotice: 'Your role can access all projects without unlock limits.',
    unlockStorageRemote: 'Deployment tier: defaults to free, and auto-switches to full if this account already has entitlement',
    unlockStorageLocal: 'Deployment tier: defaults to free; local cache only affects project access state',
    unlockStorageLoading: 'Deployment tier: syncing current account entitlement...',
    unlockStorageIdle: 'Deployment tier: free by default (sign in and upgrade to switch to full)',
    unlockRemoteFallback: 'Supabase unlock service is unavailable. Only previously cached access can be read right now.',
    unlockPaidRequired: 'This unlock requires paid entitlement. Complete purchase on latti.wordm.us first.',
    unlockLifetimeRequired: 'This unlock is available for lifetime entitlement only.',
    unlockPaidServerRequired: 'Paid unlock service is unavailable. Please try again later.',
    unlockInstallHintPrefix: 'Install guide and script:',
    unlockInstallHintLink: 'Open install guide',
    deployUpgradeAction: 'Upgrade to full edition',
    unlockCheckoutStarting: 'Redirecting to checkout...',
    unlockCheckoutProductMissing: 'No product is configured for this unlock mode. Upgrade on latti.wordm.us first.',
    unlockCheckoutFailed: 'Failed to start checkout. Please try again later.',
    unlockCheckoutSuccess: 'Payment callback received. Use the self-host entry below, or click unlock again to sync entitlement.',
    unlockCheckoutCanceled: 'Checkout canceled.',
    pricingLoadFallback: 'Pricing config failed to load. Frontend fallback pricing is being used.',
    pricingReloadSuccess: 'Pricing config reloaded from the backend.',
    pricingSaveSuccess: 'Pricing config saved.',
    pricingSaveFailed: 'Failed to save pricing config',
    pricingManageLogin: 'Log in with an admin or tester account before saving pricing config.',
    pricingUnavailable: 'Supabase is not configured. Backend pricing cannot be saved.',
    deployTitle: 'One-Click Center Control Deploy',
    deployIntro: 'Everyone can deploy the free edition. Sign in and upgrade to switch deployment to the full edition with paid modules.',
    deployAutoReady: 'Full-edition entitlement detected. Preparing a full-edition deployment.',
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
    deployNeedLogin: 'Without sign-in or upgrade, deployment falls back to the free edition. Sign in and upgrade to switch to the full edition.',
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

function defaultSelection(projects: PortfolioProject[], preferred: readonly string[]): string[] {
  const defaultVisibleProjects = projects.filter(isProjectDefaultVisible)
  const selectionPool = defaultVisibleProjects.length ? defaultVisibleProjects : projects
  const preferredExisting = preferred.filter((slug) => selectionPool.some((project) => project.slug === slug))
  if (preferredExisting.length) {
    return [...preferredExisting]
  }

  return selectionPool.slice(0, 9).map((project) => project.slug)
}

function toRootView(raw: string | null, pathname: string): RootView {
  if (pathname === '/login' || pathname === '/login/') {
    return 'login'
  }

  if (raw === 'blog') {
    return 'blog'
  }
  if (raw === 'login') {
    return 'login'
  }
  if (raw === 'portfolio') {
    return 'portfolio'
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

function normalizeBlogArticleId(raw: string | null): string | null {
  if (!raw) {
    return null
  }

  const articleId = raw.trim().toLowerCase()
  if (!articleId) {
    return null
  }

  return BLOG_ARTICLES.some((article) => article.id === articleId) ? articleId : null
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

function relativeRootHref(view: RootView, lang: Lang) {
  const url = new URL('/', 'https://wordm.us')

  if (view === 'login') {
    url.searchParams.set('view', 'login')
  } else if (view === 'blog') {
    url.searchParams.set('view', 'blog')
  }

  if (lang === 'en') {
    url.searchParams.set('lang', 'en')
  }

  const search = url.searchParams.toString()
  return `${url.pathname}${search ? `?${search}` : ''}`
}

function withAuthReturnTo(href: string, returnTo: string | null) {
  const url = new URL(href, 'https://wordm.us')

  if (returnTo) {
    url.searchParams.set('return_to', returnTo)
  } else {
    url.searchParams.delete('return_to')
  }

  const search = url.searchParams.toString()
  return `${url.pathname}${search ? `?${search}` : ''}`
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
  const isAdminHost = hostname === 'admin.wordm.us' || params.get('page') === 'admin'
  const debugMode = params.get('debug') === '1' || import.meta.env.DEV
  const forcedSubdomain = params.get('subdomain')
  const forcedPage = params.get('page')
  const initialApi = params.get('centerApi') || import.meta.env.VITE_CENTER_CONTROL_API || ''
  const initialShowSlugs = parseShowSlugs(params.get('show'))
  const initialRootView = toRootView(params.get('view'), window.location.pathname)
  const initialBlogArticleId = normalizeBlogArticleId(params.get('article')) ?? BLOG_ARTICLES[0]?.id ?? null
  const initialProjectSlug = normalizeSlug(params.get('project'))
  const initialAuthReturnTo = resolveSafeAuthRedirectUrl(params.get('return_to'))
  const initialUnlockSlug = normalizeSlug(params.get('unlock'))
  const initialCheckoutSlug = normalizeSlug(params.get('checkout_slug'))
  const initialShareToken = params.get('share')?.trim() || null
  const initialPurchaseSuccess = params.get('purchase_success') === '1'
  const initialPurchaseCanceled = params.get('purchase_cancel') === '1'
  const initialLang = resolveInitialLang(window.location)

  const [lang, setLang] = useState<Lang>(initialLang)
  const [offerNow, setOfferNow] = useState(() => Date.now())
  const copy = APP_COPY[lang]
  const envPricingFallback = useMemo(
    () =>
      applyCheckoutProductFallbacks(DEFAULT_SITE_PRICING_CONFIG, {
        singleCheckoutProductId: import.meta.env.VITE_UNLOCK_PRODUCT_SINGLE || 'prod_4eDxmaC52vCKWPjGqfqIqy',
        allAccessCheckoutProductId:
          import.meta.env.VITE_UNLOCK_PRODUCT_ALL_ACCESS ||
          import.meta.env.VITE_UNLOCK_PRODUCT_ALL_CURRENT_PLUS_YEAR ||
          import.meta.env.VITE_UNLOCK_PRODUCT_ALL_CURRENT ||
          'prod_3WVufccMdH37WNdEVvSL6',
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
  const [pricingConfig, setPricingConfig] = useState<SitePricingConfig>(envPricingFallback)
  const [pricingStatusMessage, setPricingStatusMessage] = useState('')
  const [pricingBusy, setPricingBusy] = useState(false)
  const [adminPricingConfig, setAdminPricingConfig] = useState<SitePricingConfig>(envPricingFallback)
  const [activeBlogArticleId, setActiveBlogArticleId] = useState<string | null>(initialBlogArticleId)
  const [selectedProjectSlug, setSelectedProjectSlug] = useState<string | null>(initialProjectSlug)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [unlockTargetSlug, setUnlockTargetSlug] = useState<string | null>(initialUnlockSlug)
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

    return defaultSelection(snapshot.projects, FEATURED_PROJECT_SLUGS)
  })

  const sourceLabel = sourceType === 'live' && centerApi ? `${copy.sourceLivePrefix}: ${centerApi}` : copy.sourceSnapshot
  const contactEmail = 'parsonjian@gmail.com'
  const defaultHomeHref = new URL(relativeRootHref('portfolio', lang), 'https://wordm.us').toString()
  const authReturnHref = initialAuthReturnTo ?? defaultHomeHref
  const currentLocationForAuth =
    typeof window !== 'undefined'
      ? (() => {
          const next = new URL(window.location.href)
          next.searchParams.delete('return_to')
          return next.toString()
        })()
      : null
  const loginHref = withAuthReturnTo(relativeRootHref('login', lang), rootView === 'login' ? authReturnHref : resolveSafeAuthRedirectUrl(currentLocationForAuth))
  const homeHref = authReturnHref

  const primaryUpdatedAt = snapshot.centerControlGeneratedAt || snapshot.generatedAt
  const lastUpdated = formatDate(primaryUpdatedAt)

  useEffect(() => {
    const next = new URL(window.location.href)
    next.pathname = '/'

    if (rootView === 'login') {
      next.searchParams.set('view', 'login')
    } else if (rootView === 'blog') {
      next.searchParams.set('view', 'blog')
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

    if (activeBlogArticleId && rootView === 'blog') {
      next.searchParams.set('article', activeBlogArticleId)
    } else {
      next.searchParams.delete('article')
    }

    if (unlockTargetSlug && rootView !== 'login') {
      next.searchParams.set('unlock', unlockTargetSlug)
    } else {
      next.searchParams.delete('unlock')
    }

    if (shareToken) {
      next.searchParams.set('share', shareToken)
    } else {
      next.searchParams.delete('share')
    }

    if (rootView === 'login' && initialAuthReturnTo) {
      next.searchParams.set('return_to', initialAuthReturnTo)
    } else {
      next.searchParams.delete('return_to')
    }

    window.history.replaceState({}, '', next)
  }, [rootView, lang, selectedProjectSlug, activeBlogArticleId, unlockTargetSlug, shareToken, initialAuthReturnTo])

  useEffect(() => {
    if (!initialPurchaseSuccess && !initialPurchaseCanceled) {
      return
    }

    if (initialCheckoutSlug) {
      setUnlockTargetSlug(initialCheckoutSlug)
      setSelectedProjectSlug(initialCheckoutSlug)
    }

    if (initialPurchaseSuccess) {
      setRootView('portfolio')
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
    copy.unlockCheckoutCanceled,
    copy.unlockCheckoutSuccess,
    initialCheckoutSlug,
    initialPurchaseCanceled,
    initialPurchaseSuccess,
  ])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setOfferNow(Date.now())
    }, 60_000)

    return () => {
      window.clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    let active = true

    if (!authConfig.supabaseUrl) {
      setPricingConfig(envPricingFallback)
      setAdminPricingConfig(envPricingFallback)
      setPricingStatusMessage('')
      return
    }

    void fetchPricingConfigFromSupabase(authConfig)
      .then((remoteConfig) => {
        if (!active) {
          return
        }

        const nextConfig = applyRuntimePricingFallback(remoteConfig, {
          singleCheckoutProductId: envPricingFallback.singleUnlock.defaultCheckoutProductId,
          allAccessCheckoutProductId: envPricingFallback.allAccess.checkoutProductId,
        })
        setPricingConfig(nextConfig)
        setAdminPricingConfig(nextConfig)
        setPricingStatusMessage('')
      })
      .catch(() => {
        if (!active) {
          return
        }

        setPricingConfig(envPricingFallback)
        setAdminPricingConfig(envPricingFallback)
        setPricingStatusMessage(copy.pricingLoadFallback)
      })

    return () => {
      active = false
    }
  }, [authConfig, copy.pricingLoadFallback, envPricingFallback])


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
    if (rootView !== 'blog' || !initialBlogArticleId) {
      return
    }

    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById(`blog-article-${initialBlogArticleId}`)
      if (target) {
        target.scrollIntoView({ behavior: 'auto', block: 'start' })
      }
    })

    return () => window.cancelAnimationFrame(frame)
  }, [initialBlogArticleId, rootView])

  useEffect(() => {
    if (!BLOG_ARTICLES.length) {
      setActiveBlogArticleId(null)
      return
    }

    setActiveBlogArticleId((current) =>
      current && BLOG_ARTICLES.some((article) => article.id === current) ? current : BLOG_ARTICLES[0].id,
    )
  }, [])

  useEffect(() => {
    if (rootView !== 'blog' || !BLOG_ARTICLES.length) {
      return
    }

    const articleIds = BLOG_ARTICLES.map((article) => article.id)
    const articleNodes = articleIds
      .map((articleId) => document.getElementById(`blog-article-${articleId}`))
      .filter((node): node is HTMLElement => Boolean(node))

    if (!articleNodes.length) {
      return
    }

    const updateActiveArticle = () => {
      let nextArticleId = articleIds[0]
      const threshold = window.innerHeight * 0.28

      for (const node of articleNodes) {
        const top = node.getBoundingClientRect().top
        if (top <= threshold) {
          nextArticleId = node.dataset.articleId || nextArticleId
          continue
        }
        break
      }

      setActiveBlogArticleId((current) => (current === nextArticleId ? current : nextArticleId))
    }

    updateActiveArticle()
    window.addEventListener('scroll', updateActiveArticle, { passive: true })
    window.addEventListener('resize', updateActiveArticle)

    return () => {
      window.removeEventListener('scroll', updateActiveArticle)
      window.removeEventListener('resize', updateActiveArticle)
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
      clearGoogleOAuthPending()
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
    if (!authEnabled) {
      clearGoogleOAuthPending()
      return
    }

    if (authUser) {
      clearGoogleOAuthPending()
      setAuthBusy(false)
      return
    }

    if (authLoading || typeof window === 'undefined' || typeof document === 'undefined') {
      return
    }

    const maybeResetGoogleLogin = () => {
      const pendingAt = readGoogleOAuthPendingAt()
      if (!pendingAt) {
        return
      }

      if (document.visibilityState === 'hidden') {
        return
      }

      if (Date.now() - pendingAt < GOOGLE_OAUTH_PENDING_GRACE_MS) {
        return
      }

      clearGoogleOAuthPending()
      setAuthBusy(false)
      setAuthStatusMessage((current) =>
        !current || current === copy.googleLoggingIn ? copy.googleLoginCancelled : current,
      )
    }

    maybeResetGoogleLogin()
    window.addEventListener('pageshow', maybeResetGoogleLogin)
    window.addEventListener('focus', maybeResetGoogleLogin)
    document.addEventListener('visibilitychange', maybeResetGoogleLogin)

    return () => {
      window.removeEventListener('pageshow', maybeResetGoogleLogin)
      window.removeEventListener('focus', maybeResetGoogleLogin)
      document.removeEventListener('visibilitychange', maybeResetGoogleLogin)
    }
  }, [authEnabled, authLoading, authUser, copy.googleLoggingIn, copy.googleLoginCancelled])

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
    let active = true

    async function loadShareLinks() {
      try {
        if (isAdminHost) {
          const links = await listAdminShareLinks()
          if (active) {
            setShareLinks(links)
          }
          return
        }

        if (!authUser || (authUser.role !== 'admin' && authUser.role !== 'tester')) {
          if (active) {
            setShareLinks([])
          }
          return
        }

        const links = await listOwnShareLinks(authConfig)
        if (active) {
          setShareLinks(links)
        }
      } catch {
        if (active) {
          setShareManageStatusMessage(copy.shareListLoadFailed)
        }
      }
    }

    void loadShareLinks()

    return () => {
      active = false
    }
  }, [authConfig, authUser, copy.shareListLoadFailed, isAdminHost])

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

        return defaultSelection(liveProjects, FEATURED_PROJECT_SLUGS)
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

  function isPaymentRequiredError(error: unknown): boolean {
    return unlockErrorCode(error).includes('PAYMENT_REQUIRED')
  }

  function isLifetimeRequiredError(error: unknown): boolean {
    return unlockErrorCode(error).includes('LIFETIME_REQUIRED')
  }

  function isBusinessUnlockError(error: unknown): boolean {
    const code = unlockErrorCode(error)
    return (
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
      next.searchParams.set('project', normalizedSlug)
    } else {
      next.searchParams.delete('checkout_slug')
      next.searchParams.delete('project')
    }

    next.searchParams.set('view', 'portfolio')
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
      next.searchParams.set('project', normalizedSlug)
    } else {
      next.searchParams.delete('checkout_slug')
      next.searchParams.delete('project')
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

    const unlockOptions = projectSlug ? getUnlockOptionsBySlug(projectSlug) : null
    const kindEnabled =
      kind === 'single'
        ? Boolean(unlockOptions?.singleEnabled)
        : Boolean(unlockOptions?.allAccessEnabled ?? pricingConfig.allAccess.enabled)
    if (!kindEnabled) {
      setUnlockStatusMessage(copy.unlockPlanUnavailable)
      return false
    }

    const productId =
      kind === 'single'
        ? unlockOptions?.singleCheckoutProductId ?? null
        : unlockOptions?.allAccessCheckoutProductId ?? pricingConfig.allAccess.checkoutProductId

    setCheckoutBusyKind(kind)
    setUnlockStatusMessage(copy.unlockCheckoutStarting)

    try {
      const checkoutUrl = await createUnlockCheckoutUrl(authConfig, {
        productId: productId ?? '',
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

  async function reloadPricingConfig(showSuccessMessage = false) {
    if (!authConfig.supabaseUrl) {
      setPricingConfig(envPricingFallback)
      setAdminPricingConfig(envPricingFallback)
      setPricingStatusMessage(copy.pricingUnavailable)
      return
    }

    setPricingBusy(true)

    try {
      const remoteConfig = await fetchPricingConfigFromSupabase(authConfig)
      const nextConfig = applyRuntimePricingFallback(remoteConfig, {
        singleCheckoutProductId: envPricingFallback.singleUnlock.defaultCheckoutProductId,
        allAccessCheckoutProductId: envPricingFallback.allAccess.checkoutProductId,
      })
      setPricingConfig(nextConfig)
      setAdminPricingConfig(nextConfig)
      setPricingStatusMessage(showSuccessMessage ? copy.pricingReloadSuccess : '')
    } catch (error) {
      const detail = normalizeAuthError(error, copy.pricingLoadFallback)
      setPricingStatusMessage(withDetail(copy.pricingLoadFallback, detail))
    } finally {
      setPricingBusy(false)
    }
  }

  async function handleSavePricingConfig() {
    if (!authConfig.supabaseUrl) {
      setPricingStatusMessage(copy.pricingUnavailable)
      return
    }

    if (!canManagePricing || !authUser) {
      setPricingStatusMessage(copy.pricingManageLogin)
      return
    }

    setPricingBusy(true)

    try {
      const savedConfig = await savePricingConfigFromSupabase(authConfig, adminPricingConfig)
      setPricingConfig(savedConfig)
      setAdminPricingConfig(savedConfig)
      setPricingStatusMessage(copy.pricingSaveSuccess)
    } catch (error) {
      const detail = normalizeAuthError(error, copy.pricingSaveFailed)
      setPricingStatusMessage(withDetail(copy.pricingSaveFailed, detail))
    } finally {
      setPricingBusy(false)
    }
  }

  async function createManagedShareLink(options: {
    label: string
    expiresInDays: number
    scope: ShareScope
    entryUrlBuilder?: ((token: string) => string) | null
    copyAfterCreate?: boolean
  }) {
    if (!authUser && !isAdminHost) {
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
      const created = isAdminHost
        ? await createAdminShareLink({
            label: options.label,
            expiresInDays: options.expiresInDays,
            scope,
          })
        : await createShareLink(authConfig, {
            label: options.label,
            expiresInDays: options.expiresInDays,
            scope,
          })
      const fallbackUrl = buildShareEntryUrl(created.token, lang, created.scope, projects)
      const shareUrl = options.entryUrlBuilder ? options.entryUrlBuilder(created.token) : fallbackUrl
      setLastCreatedShareId(created.id)
      setLastCreatedShareUrl(shareUrl)
      setShareLinks(isAdminHost ? await listAdminShareLinks() : await listOwnShareLinks(authConfig))

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
      label: `${getProjectPresentation(project, lang).name} · ${lang === 'zh' ? '详情分享' : 'detail share'}`,
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
      label: `${getProjectPresentation(project, lang).name} · ${lang === 'zh' ? '子域分享' : 'subdomain share'}`,
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
      if (isAdminHost) {
        await revokeAdminShareLink(shareLinkId)
      } else {
        await revokeShareLink(authConfig, shareLinkId)
      }
      const nextLinks = isAdminHost ? await listAdminShareLinks() : await listOwnShareLinks(authConfig)
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
      const deletedCount = isAdminHost ? await purgeAdminShareLinks() : await purgeShareLinks(authConfig)
      setShareLinks(isAdminHost ? await listAdminShareLinks() : await listOwnShareLinks(authConfig))
      setShareManageStatusMessage(`${copy.shareRevokeSuccess} (${deletedCount})`)
    } catch {
      setShareManageStatusMessage(copy.shareRevokeFailed)
    } finally {
      setShareBusy(false)
    }
  }

  function redirectAfterDedicatedLogin() {
    if (rootView !== 'login' || typeof window === 'undefined') {
      return false
    }

    const target = resolveSafeAuthRedirectUrl(authReturnHref) ?? defaultHomeHref
    const current = resolveSafeAuthRedirectUrl(window.location.href)

    if (current === target) {
      return false
    }

    window.location.assign(target)
    return true
  }

  async function handleAuthLogin(email: string, password: string) {
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

      redirectAfterDedicatedLogin()
    } catch (loginError) {
      const detail = normalizeAuthError(loginError, copy.loginFallback)
      setAuthStatusMessage(withDetail(copy.loginFailed, detail))
    } finally {
      setAuthBusy(false)
    }
  }

  async function handleAuthSignup(email: string, password: string) {
    if (!authEnabled) {
      setAuthStatusMessage(copy.authUnavailable)
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

      redirectAfterDedicatedLogin()
    } catch (signupError) {
      const detail = normalizeAuthError(signupError, copy.signupFallback)
      setAuthStatusMessage(withDetail(copy.signupFailed, detail))
    } finally {
      setAuthBusy(false)
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

  async function handleGoogleLogin(redirectTo?: string | null) {
    if (!authEnabled) {
      setAuthStatusMessage(copy.authUnavailable)
      return
    }

    markGoogleOAuthPending()
    setAuthBusy(true)
    setAuthStatusMessage(copy.googleLoggingIn)

    try {
      const redirected = await loginWithGoogle(authConfig, redirectTo)

      if (!redirected) {
        clearGoogleOAuthPending()
        setAuthBusy(false)
      }
    } catch (error) {
      clearGoogleOAuthPending()
      const detail = normalizeAuthError(error, copy.googleLoginFallback)
      setAuthStatusMessage(withDetail(copy.googleLoginFailed, detail))
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

    const fallbackSlugs = defaultSelection(projects, FEATURED_PROJECT_SLUGS)
    return chooseProjects(projects, fallbackSlugs)
  }, [projects, selectedSlugs])

  const visibleProjects = useMemo(() => {
    if (shareToken && shareAccess?.scope.allowAllProjects) {
      return projects
    }

    const baseProjects = featuredProjects

    if (!shareToken || !shareAccess) {
      return baseProjects
    }

    const filtered = baseProjects.filter((project) => canShareAccessProject(project.slug, shareAccess))
    if (filtered.length) {
      return filtered
    }

    return projects.filter((project) => canShareAccessProject(project.slug, shareAccess))
  }, [featuredProjects, projects, shareAccess, shareToken])

  const selectedProject = useMemo(() => {
    if (!selectedProjectSlug) {
      return null
    }

    return projects.find((project) => project.slug === selectedProjectSlug) ?? null
  }, [projects, selectedProjectSlug])
  const selectedVisibleProjectIndex = useMemo(() => {
    if (!selectedProject) {
      return -1
    }

    return visibleProjects.findIndex((project) => project.slug === selectedProject.slug)
  }, [selectedProject, visibleProjects])
  const blogArticles = useMemo(() => BLOG_ARTICLES, [])
  const activeBlogArticle = useMemo(
    () =>
      blogArticles.find((article) => article.id === activeBlogArticleId) ??
      blogArticles[0] ??
      null,
    [activeBlogArticleId, blogArticles],
  )
  const activeBlogIndex = useMemo(
    () => (activeBlogArticle ? blogArticles.findIndex((article) => article.id === activeBlogArticle.id) : -1),
    [activeBlogArticle, blogArticles],
  )
  const nextBlogArticle =
    activeBlogIndex >= 0 && activeBlogIndex + 1 < blogArticles.length ? blogArticles[activeBlogIndex + 1] : null

  const subdomainProject = useMemo(
    () => resolveSubdomainView(projects, window.location.hostname, forcedSubdomain),
    [projects, forcedSubdomain],
  )
  const isResumeView = forcedPage === 'resume' || hostname === 'resume.wordm.us' || hostname === 'cv.wordm.us'
  const isAdminView = forcedPage === 'admin' || hostname === 'admin.wordm.us'

  const authRole: AuthRole = authUser?.role ?? 'guest'
  const projectOfferStates = useMemo(() => {
    const next = new Map<string, ProjectOfferState>()
    for (const project of projects) {
      next.set(project.slug, getProjectOfferState(project, pricingConfig, offerNow))
    }
    return next
  }, [offerNow, pricingConfig, projects])
  const canManageShares = isAdminHost || authRole === 'admin' || authRole === 'tester'
  const canManagePricing = authRole === 'admin' || authRole === 'tester'
  const shareEntryUrl = shareToken && shareAccess ? buildShareEntryUrl(shareToken, lang, shareAccess.scope, projects) : null
  const canAccessResume = canManageShares || canShareAccessView('resume', shareAccess)
  const projectCatalogSlugs = useMemo(() => projects.map((project) => project.slug), [projects])
  const unlockActionDisabled = unlockBusy || checkoutBusyKind !== null || unlockStorageMode === 'loading'
  const subdomainProjectPaidAccess = subdomainProject
    ? hasProjectPremiumAccess(subdomainProject.slug, authRole, unlockState) ||
      canShareAccessProject(subdomainProject.slug, shareAccess)
    : false
  const portfolioShareDeniedStatus = resolveShareDeniedStatus({
    shareToken,
    shareResolveStatus,
    allowedByShare: canShareAccessView('portfolio', shareAccess),
    bypass: Boolean(authUser),
  })
  const blogShareDeniedStatus = resolveShareDeniedStatus({
    shareToken,
    shareResolveStatus,
    allowedByShare: canShareAccessView('blog', shareAccess),
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
    bypass: subdomainProject ? hasProjectPremiumAccess(subdomainProject.slug, authRole, unlockState) : false,
  })
  const projectDetailShareDeniedStatus = resolveShareDeniedStatus({
    shareToken,
    shareResolveStatus,
    allowedByShare: selectedProject ? canShareAccessView('portfolio', shareAccess) && canShareAccessProject(selectedProject.slug, shareAccess) : false,
    bypass:
      selectedProject ? hasProjectPremiumAccess(selectedProject.slug, authRole, unlockState) || canManageShares : false,
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
    onGoogleLogin: handleGoogleLogin,
    onLogout: handleLogout,
  }
  const projectModalOpen = rootView === 'portfolio' && Boolean(selectedProject)

  useEffect(() => {
    if (typeof document === 'undefined' || !projectModalOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [projectModalOpen])

  useEffect(() => {
    if (typeof window === 'undefined' || !projectModalOpen) {
      return
    }

    function handleProjectModalKeydown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setSelectedProjectSlug(null)
        return
      }

      if (selectedVisibleProjectIndex < 0 || visibleProjects.length < 2) {
        return
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        const nextIndex = (selectedVisibleProjectIndex - 1 + visibleProjects.length) % visibleProjects.length
        setSelectedProjectSlug(visibleProjects[nextIndex]?.slug ?? null)
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault()
        const nextIndex = (selectedVisibleProjectIndex + 1) % visibleProjects.length
        setSelectedProjectSlug(visibleProjects[nextIndex]?.slug ?? null)
      }
    }

    window.addEventListener('keydown', handleProjectModalKeydown)
    return () => {
      window.removeEventListener('keydown', handleProjectModalKeydown)
    }
  }, [projectModalOpen, selectedVisibleProjectIndex, visibleProjects])

  function selectAdjacentVisibleProject(step: number) {
    if (selectedVisibleProjectIndex < 0 || !visibleProjects.length) {
      return
    }

    const nextIndex = (selectedVisibleProjectIndex + step + visibleProjects.length) % visibleProjects.length
    setSelectedProjectSlug(visibleProjects[nextIndex]?.slug ?? null)
  }

  function scrollToBlogArticle(articleId: string, behavior: ScrollBehavior = 'smooth') {
    const target = document.getElementById(`blog-article-${articleId}`)
    if (!target) {
      return
    }

    setActiveBlogArticleId(articleId)
    target.scrollIntoView({ behavior, block: 'start' })
  }

  function getProjectNameBySlug(slug: string) {
    return projects.find((project) => project.slug === slug)?.name || slug
  }

  function getOfferStateBySlug(slug: string): ProjectOfferState {
    return projectOfferStates.get(slug) ?? getProjectOfferState({ slug }, pricingConfig, offerNow)
  }

  function getUnlockOptionsBySlug(slug: string) {
    return getProjectUnlockOptions(slug, pricingConfig, lang)
  }

  function isProjectUnlocked(slug: string) {
    return hasProjectPremiumAccess(slug, authRole, unlockState) || canShareAccessProject(slug, shareAccess)
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

  async function applyUnlockGrant(kind: 'single' | 'all_access', projectSlug?: string): Promise<UserUnlockState> {
    if (unlockStorageMode === 'remote') {
      try {
        return await applyUnlockGrantFromSupabase(authConfig, {
          kind,
          projectSlug: projectSlug ?? null,
          catalogSlugs: kind === 'all_access' ? projectCatalogSlugs : null,
        })
      } catch (error) {
        if (isBusinessUnlockError(error)) {
          throw error
        }

        setUnlockStorageMode('local')
        setUnlockStatusMessage(copy.unlockRemoteFallback)
        throw new Error('PAYMENT_BACKEND_REQUIRED')
      }
    }

    throw new Error('PAYMENT_BACKEND_REQUIRED')
  }

  async function handleUnlockSingle(projectSlug: string) {
    const normalizedSlug = normalizeSlug(projectSlug)
    if (!normalizedSlug) {
      return
    }

    const unlockOptions = getUnlockOptionsBySlug(normalizedSlug)
    if (!unlockOptions.singleEnabled) {
      setUnlockStatusMessage(copy.unlockPlanUnavailable)
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
        await startUnlockCheckout('all_access', normalizedSlug)
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

  async function handleUnlockAllAccess() {
    if (!pricingConfig.allAccess.enabled) {
      setUnlockStatusMessage(copy.unlockPlanUnavailable)
      return
    }

    if (!ensureCanUnlock()) {
      return
    }

    setUnlockBusy(true)
    try {
      const nextState = await applyUnlockGrant('all_access')
      setUnlockState(nextState)
      setUnlockStatusMessage(copy.unlockAllAccessSuccess)
    } catch (error) {
      if (isLifetimeRequiredError(error)) {
        await startUnlockCheckout('all_access')
        return
      }

      if (isPaymentRequiredError(error)) {
        await startUnlockCheckout('all_access')
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

    return (
      <SubdomainProjectView
        lang={lang}
        project={subdomainProject}
        lastUpdated={lastUpdated}
        shareToken={shareToken}
        authPanel={authPanelProps}
        paidAccess={subdomainProjectPaidAccess}
        offerState={getOfferStateBySlug(subdomainProject.slug)}
        unlockOptions={getUnlockOptionsBySlug(subdomainProject.slug)}
        unlockBusy={unlockActionDisabled}
        statusMessage={unlockStatusMessage}
        onUnlockSingle={(slug) => void handleUnlockSingle(slug)}
        onUnlockAllAccess={() => void handleUnlockAllAccess()}
      />
    )
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
        canManagePricing={canManagePricing}
        pricingBusy={pricingBusy}
        pricingStatusMessage={pricingStatusMessage}
        pricingConfig={adminPricingConfig}
        onToggleProject={(slug) => {
          setSelectedSlugs((prev) => {
            if (prev.includes(slug)) {
              return prev.filter((item) => item !== slug)
            }

            return [...prev, slug]
          })
        }}
        onSelectFeatured={() => setSelectedSlugs(defaultSelection(projects, FEATURED_PROJECT_SLUGS))}
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
        onPricingConfigChange={setAdminPricingConfig}
        onPricingReload={() => void reloadPricingConfig(true)}
        onPricingSave={() => void handleSavePricingConfig()}
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

  if (rootView === 'login') {
    return (
      <LoginPage
        lang={lang}
        enabled={authEnabled}
        loading={authLoading}
        busy={authBusy}
        userEmail={authUser?.email ?? null}
        userRole={authRole}
        statusMessage={authStatusMessage}
        homeHref={homeHref}
        onLangChange={setLang}
        onLogin={handleAuthLogin}
        onSignup={handleAuthSignup}
        onGoogleLogin={() => handleGoogleLogin(authReturnHref)}
        onLogout={handleLogout}
      />
    )
  }

  if (rootView === 'blog' && blogShareDeniedStatus) {
    return <ShareAccessDenied lang={lang} status={blogShareDeniedStatus} authPanel={authPanelProps} fallbackSharedUrl={shareEntryUrl} />
  }

  if (rootView === 'portfolio' && portfolioShareDeniedStatus) {
    return <ShareAccessDenied lang={lang} status={portfolioShareDeniedStatus} authPanel={authPanelProps} fallbackSharedUrl={shareEntryUrl} />
  }

  return (
    <div className="page-container">
      <main className={`main-content portfolio-main-content${rootView === 'blog' ? ' blog-main' : ''}`}>
        <div className="site-topbar">
          <div className="site-topbar-primary">
            <nav className="collection-switch-tabs site-topbar-tabs" aria-label={lang === 'zh' ? '内容切换' : 'Content switch'}>
              <button
                type="button"
                className={`collection-switch-tab${rootView === 'portfolio' ? ' active' : ''}`}
                onClick={() => setRootView('portfolio')}
              >
                {copy.tocProjects}
              </button>
              <button
                type="button"
                className={`collection-switch-tab${rootView === 'blog' ? ' active' : ''}`}
                onClick={() => setRootView('blog')}
              >
                {copy.tocBlog}
              </button>
            </nav>
          </div>

          <div className="site-topbar-secondary">
            <label className="site-topbar-lang">
              <span className="mono">{lang === 'zh' ? '语言' : 'Language'}</span>
              <select value={lang} onChange={(event) => setLang(event.target.value as Lang)}>
                <option value="zh">中文</option>
                <option value="en">EN</option>
              </select>
            </label>

            <div className="collection-corner-links site-topbar-links">
              <a
                className="topbar-social-link"
                href="https://substack.com/@parson1"
                target="_blank"
                rel="noreferrer"
                aria-label={copy.cornerSubstack}
                title={copy.cornerSubstack}
              >
                <SubstackIcon />
              </a>
              <a
                className="topbar-social-link"
                href="https://x.com/parsonjian"
                target="_blank"
                rel="noreferrer"
                aria-label={copy.cornerX}
                title={copy.cornerX}
              >
                <XIcon />
              </a>
            </div>

            <div className="site-topbar-account">
              <AccountEntryCard {...authPanelProps} loginHref={loginHref} className="topbar-account-entry" variant="topbar" />
            </div>
          </div>
        </div>
		        <section id="collection" className="main-collection-shell">
              {rootView === 'blog' ? <p className="visual-intro collection-switch-intro">{copy.blogIntro}</p> : null}

	          {debugMode && rootView === 'portfolio' ? (
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
              onSelectFeatured={() => setSelectedSlugs(defaultSelection(projects, FEATURED_PROJECT_SLUGS))}
              onSelectAll={() => setSelectedSlugs(projects.map((project) => project.slug))}
            />
          ) : null}

          {rootView === 'blog' ? (
            <div className="blog-page">
              <aside className="blog-sidebar">
                <ul className="nav-list">
                  {blogArticles.map((article) => (
                    <li key={article.id} className="nav-item">
                      <button
                        type="button"
                        className={`nav-link sidebar-nav-button${activeBlogArticle?.id === article.id ? ' active' : ''}`}
                        onClick={() => scrollToBlogArticle(article.id)}
                      >
                        {article.title[lang]}
                        <span className="toc-meta">
                          {article.date} · {article.category[lang]}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </aside>

              <div className="blog-article-list">
                {blogArticles.map((article) => (
                  <article
                    key={article.id}
                    id={`blog-article-${article.id}`}
                    data-article-id={article.id}
                    className={`blog-article${activeBlogArticle?.id === article.id ? ' blog-article-active' : ''}`}
                  >
                    <div className="paper-meta">
                      <span>{article.date}</span>
                      <span>{article.category[lang]}</span>
                      {article.originalPublishedAt ? <span>{copy.blogOriginalPrefix}: {article.originalPublishedAt}</span> : null}
                    </div>
                    <h3 className="blog-article-title">{article.title[lang]}</h3>
	                    <p className="blog-article-summary">{article.summary[lang]}</p>
	                    {article.note[lang].trim() ? <p className="blog-article-note">{article.note[lang]}</p> : null}
	                    {article.paragraphs.map((paragraph, index) => (
	                      <p key={`${article.id}-${index}`}>{paragraph[lang]}</p>
	                    ))}
	                  </article>
	                ))}
	              </div>
            </div>
          ) : (
            <>
	              <Suspense fallback={<div className="portfolio-showcase-loading" aria-hidden="true" />}>
	                <PortfolioShowcase
                    lang={lang}
                    projects={visibleProjects}
                    onSelectProject={(slug) => setSelectedProjectSlug(slug)}
                  />
	              </Suspense>
	              <div className="portfolio-gallery">
		                {visibleProjects.map((project) => (
	                  <ProjectEntry
                    key={project.id}
                    lang={lang}
                    project={project}
                    accessible={isProjectUnlocked(project.slug)}
                    offerState={getOfferStateBySlug(project.slug)}
                    focused={unlockTargetSlug === project.slug}
                    onSelectProject={(slug) => setSelectedProjectSlug(slug)}
                  />
	                ))}
	              </div>
                {selectedProject
                  ? projectDetailShareDeniedStatus
                    ? (
                        <div
                          className="project-detail-modal"
                          role="dialog"
                          aria-modal="true"
                          aria-label={lang === 'zh' ? '项目访问受限' : 'Project access denied'}
                          onClick={() => setSelectedProjectSlug(null)}
                        >
                          <div className="project-detail-modal-shell" onClick={(event) => event.stopPropagation()}>
                            <div className="project-detail-modal-sheet project-detail-modal-sheet-share">
                              <ShareAccessDenied
                                lang={lang}
                                status={projectDetailShareDeniedStatus}
                                authPanel={authPanelProps}
                                fallbackSharedUrl={shareEntryUrl}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    : (
                        <ProjectDetailModal
                          lang={lang}
                          project={selectedProject}
                          lastUpdated={lastUpdated}
                          unlocked={isProjectUnlocked(selectedProject.slug)}
                          offerState={getOfferStateBySlug(selectedProject.slug)}
                          unlockOptions={getUnlockOptionsBySlug(selectedProject.slug)}
                          unlockBusy={unlockActionDisabled}
                          statusMessage={unlockStatusMessage}
                          shareToken={shareToken}
                          indexLabel={
                            selectedVisibleProjectIndex >= 0
                              ? `${String(selectedVisibleProjectIndex + 1).padStart(2, '0')}/${String(visibleProjects.length).padStart(2, '0')}`
                              : null
                          }
                          hasPrevious={selectedVisibleProjectIndex >= 0 && visibleProjects.length > 1}
                          hasNext={selectedVisibleProjectIndex >= 0 && visibleProjects.length > 1}
                          onClose={() => setSelectedProjectSlug(null)}
                          onPrevious={() => selectAdjacentVisibleProject(-1)}
                          onNext={() => selectAdjacentVisibleProject(1)}
                          onUnlockSingle={(slug) => void handleUnlockSingle(slug)}
                          onUnlockAllAccess={() => void handleUnlockAllAccess()}
                        />
                      )
                  : null}
            </>
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
      {rootView === 'blog'
        ? nextBlogArticle
          ? (
              <div className="blog-next-fixed-wrap">
                <button type="button" className="blog-next-fixed-btn" onClick={() => scrollToBlogArticle(nextBlogArticle.id)}>
                  <span className="blog-next-fixed-label">{copy.blogNextLabel}</span>
                  <span className="blog-next-fixed-text">{nextBlogArticle.title[lang]}</span>
                </button>
              </div>
            )
          : (
              <div className="blog-next-fixed-wrap">
                <button type="button" className="blog-next-fixed-btn" disabled>
                  <span className="blog-next-fixed-label">{copy.blogNextLabel}</span>
                  <span className="blog-next-fixed-text">{copy.blogEndOfList}</span>
                </button>
              </div>
            )
        : null}
      {showScrollTop ? (
        <button type="button" className="scroll-top-btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          TOP
        </button>
      ) : null}
    </div>
  )
}

export default App
