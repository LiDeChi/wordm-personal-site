import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
} from "react";
import { AccountEntryCard } from "./components/AccountEntryCard";
import { LoginPage, type AccountTier } from "./components/LoginPage";
import { AdminPage } from "./components/AdminPage";
import {
  FountHomePage,
  FountPrimaryNav,
} from "./components/FountHomePage";
import { OneAgentProductPage } from "./components/OneAgentProductPage";
import { ProjectDetailModal } from "./components/ProjectDetailModal";
import { ProjectEntry } from "./components/ProjectEntry";
import { ShareAccessDenied } from "./components/ShareAccessDenied";
import { SiteAiChat } from "./components/SiteAiChat";
import { SocialLinks } from "./components/SocialLinks";
import { SubdomainProjectView } from "./components/SubdomainProjectView";
import { ThemeModeIcon } from "./components/ThemeModeIcon";
import { BLOG_ARTICLES, type BlogContentBlock } from "./data/blogArticles";
import {
  FEATURED_PROJECT_SLUGS,
  getProjectPresentation,
} from "./data/projectPresentation";
import { MANUAL_PROJECTS } from "./data/manualProjects";
import { type Lang, resolveInitialLang } from "./i18n/lang";
import projectsSnapshotRaw from "./data/projects.snapshot.json";
import { withSiteParams } from "./lib/lang-url";
import {
  createUnlockCheckoutUrl,
  type UnlockCheckoutKind,
} from "./lib/unlock-billing";
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
} from "./lib/share-links";
import {
  createAdminShareLink,
  listAdminShareLinks,
  purgeAdminShareLinks,
  revokeAdminShareLink,
} from "./lib/admin-share";
import {
  applyUnlockGrantFromSupabase,
  fetchUnlockStateFromSupabase,
} from "./lib/unlock-remote";
import {
  hasProjectPremiumAccess,
  loadUnlockStateForUser,
  saveUnlockStateForUser,
  type UserUnlockState,
} from "./lib/unlock";
import {
  applyCheckoutProductFallbacks,
  DEFAULT_SITE_PRICING_CONFIG,
  getProjectOfferState,
  getProjectUnlockOptions,
  type ProjectOfferState,
  type SitePricingConfig,
} from "./lib/project-offers";
import {
  fetchPricingConfigFromSupabase,
  savePricingConfigFromSupabase,
} from "./lib/pricing-remote";
import {
  fetchSiteAnalyticsEvents,
  isDownloadHref,
  trackSiteEvent,
  type SiteAnalyticsRecord,
} from "./lib/site-analytics";
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
} from "./lib/auth";
import {
  chooseProjects,
  formatDate,
  isProjectDefaultVisible,
  parseShowSlugs,
  resolveSubdomainView,
} from "./lib/projects";
import type { PortfolioProject, ProjectsSnapshot } from "./types";

type RootView =
  | "home"
  | "blog"
  | "portfolio"
  | "login"
  | "about"
  | "pricing"
  | "partners"
  | "updates"
  | "fields"
  | "docs";
type UnlockStorageMode = "remote" | "local" | "loading" | "idle";
type ThemeMode = "day" | "night";
type HomeProject = {
  key: string;
  unlockSlug?: string;
  name: string;
  href: string;
  previewUrl: string;
  coverUrl: string;
  coverAlt: Record<Lang, string>;
  summary: Record<Lang, string>;
};
const BLOG_INITIAL_RENDER_COUNT = 18;
const BLOG_RENDER_BATCH_SIZE = 18;
const THEME_STORAGE_KEY = "wordm-theme-mode-v1";

const snapshot = projectsSnapshotRaw as ProjectsSnapshot;
const initialProjects = mergeProjectLists(snapshot.projects, MANUAL_PROJECTS);
const PortfolioShowcase = lazy(() =>
  import("./components/PortfolioShowcase").then((module) => ({
    default: module.PortfolioShowcase,
  })),
);
const GOOGLE_OAUTH_PENDING_KEY = "wordm-google-oauth-pending-v1";
const GOOGLE_OAUTH_PENDING_GRACE_MS = 1500;
const SYSTEM_SITE_URL = "https://system.wordm.us";

const HOME_PROJECTS: HomeProject[] = [
  {
    key: "flipook",
    name: "Flipook",
    href: "https://flipook.wordm.us",
    previewUrl: "flipook.wordm.us",
    coverUrl: "/home/flipook-reader.png",
    coverAlt: {
      zh: "Flipook 3D 阅读器封面",
      en: "Flipook 3D reader cover",
    },
    summary: {
      zh: "把一本书变成可以进入、回看和继续生长的空间化阅读世界。",
      en: "Turns a book into a spatial reading world you can enter, revisit, and keep growing.",
    },
  },
  {
    key: "arc3",
    name: "ARC3",
    href: "https://arc3.wordm.us",
    previewUrl: "arc3.wordm.us",
    coverUrl: "/home/arc3-cockpit.svg",
    coverAlt: {
      zh: "ARC3 cockpit 网格封面",
      en: "ARC3 cockpit grid cover",
    },
    summary: {
      zh: "围绕 ARC-AGI-3 的世界模型 agent、想象 rollout 和自调训练 cockpit。",
      en: "A world-model agent cockpit for ARC-AGI-3, imagined rollouts, and self-tuning training.",
    },
  },
  {
    key: "forge",
    name: "Forge",
    href: "https://agent.wordm.us",
    previewUrl: "agent.wordm.us",
    coverUrl: "/home/forge-orchard.png",
    coverAlt: {
      zh: "Forge 粘土风 agent 工作台封面",
      en: "Forge clay-style agent workspace cover",
    },
    summary: {
      zh: "把项目、资源、分支、审核和 agent 实时活动放进同一个可观察工作台。",
      en: "Keeps projects, resources, branches, review, and live agent activity inside one observable workspace.",
    },
  },
  {
    key: "agent-core",
    unlockSlug: "agent-core",
    name: "Wordm System",
    href: SYSTEM_SITE_URL,
    previewUrl: "system.wordm.us",
    coverUrl: "/home/wordm-system-architecture.jpg",
    coverAlt: {
      zh: "Wordm System 架构与开源 Core 封面",
      en: "Wordm System architecture and open Core cover",
    },
    summary: {
      zh: "系统架构、Core / WCP / Apps 的关系，以及开源 Core 源码入口。",
      en: "The architecture map for Core, WCP, Apps, and the open Core source entry.",
    },
  },
  {
    key: "town",
    unlockSlug: "town",
    name: "Town Agents",
    href: "/?view=about&show=town&project=town",
    previewUrl: "wordm.us/town-agents",
    coverUrl: "/home/town-agents.svg",
    coverAlt: {
      zh: "Town Agents 程序化城镇封面",
      en: "Town Agents procedural town cover",
    },
    summary: {
      zh: "先给 Godot 城镇项目留入口位，后续接上可运行的居民、任务、关系和 debug 体验。",
      en: "A reserved slot for the Godot town project, ready for the resident, task, relationship, and debug experience.",
    },
  },
];

function mergeProjectLists(
  baseProjects: PortfolioProject[],
  manualProjects: PortfolioProject[],
): PortfolioProject[] {
  const merged = [...baseProjects];

  for (const manualProject of manualProjects) {
    const existingIndex = merged.findIndex(
      (project) => project.slug === manualProject.slug,
    );

    if (existingIndex >= 0) {
      merged[existingIndex] = manualProject;
    } else {
      merged.push(manualProject);
    }
  }

  return merged;
}

function renderBlogContentBlock(
  articleId: string,
  block: BlogContentBlock,
  index: number,
  lang: Lang,
) {
  const key = `${articleId}-block-${index}`;

  if (block.type === "heading") {
    return (
      <h4 key={key} className="blog-block-heading">
        {block.text[lang]}
      </h4>
    );
  }

  if (block.type === "callout") {
    return (
      <p key={key} className="blog-block-callout">
        {block.text[lang]}
      </p>
    );
  }

  if (block.type === "list") {
    return (
      <ul key={key} className="blog-article-list-block">
        {block.items.map((item, itemIndex) => (
          <li key={`${key}-${itemIndex}`}>{item[lang]}</li>
        ))}
      </ul>
    );
  }

  if (block.type === "figure") {
    return (
      <figure key={key} className="blog-article-figure">
        <img src={block.src} alt={block.alt[lang]} loading="lazy" />
        {block.caption[lang].trim() ? (
          <figcaption>{block.caption[lang]}</figcaption>
        ) : null}
      </figure>
    );
  }

  return <p key={key}>{block.text[lang]}</p>;
}

function readGoogleOAuthPendingAt() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(GOOGLE_OAUTH_PENDING_KEY);
    if (!raw) {
      return null;
    }

    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

function markGoogleOAuthPending() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(GOOGLE_OAUTH_PENDING_KEY, String(Date.now()));
  } catch {
    // Ignore storage write failures.
  }
}

function clearGoogleOAuthPending() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(GOOGLE_OAUTH_PENDING_KEY);
  } catch {
    // Ignore storage removal failures.
  }
}

function readInitialThemeMode(): ThemeMode {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);

    if (stored === "day" || stored === "night") {
      return stored;
    }

    if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
      return "night";
    }
  } catch {
    // Ignore storage/media lookup failures and use the light default.
  }

  return "day";
}

const CURSOR_REACTIVE_SELECTOR = [
  ".fount-header",
  ".fount-outline-nav a",
  ".fount-site-nav a",
  ".fount-hero-visual",
  ".fount-dashboard",
  ".fount-visual-card",
  ".fount-concept-strip article",
  ".fount-thick-card",
  ".fount-field-world",
  ".fount-layer-grid span",
  ".fount-field-card",
  ".fount-forge-columns article",
  ".fount-flow-step",
  ".fount-foundry-card",
  ".fount-sdk-diagram",
  ".fount-sdk-capabilities",
  ".fount-loop-node",
  ".fount-pricing-card",
  ".fount-voices-image",
  ".fount-account-image",
  ".fount-blog-card",
  ".fount-final-cta",
  ".site-topbar",
  ".system-cover-portal",
  ".home-project-card",
  ".blog-sidebar",
  ".blog-article",
  ".home-download-bar",
].join(",");

function useCursorReactiveSurfaces() {
  useEffect(() => {
    const root = document.documentElement;
    const coarsePointer = window.matchMedia?.("(pointer: coarse)").matches;

    if (coarsePointer) {
      return;
    }

    let activeSurface: HTMLElement | null = null;
    let latestEvent: PointerEvent | null = null;
    let animationFrame = 0;

    const clearActiveSurface = () => {
      if (!activeSurface) {
        return;
      }

      activeSurface.removeAttribute("data-cursor-active");
      activeSurface = null;
    };

    const updateCursor = () => {
      animationFrame = 0;

      if (!latestEvent) {
        return;
      }

      root.style.setProperty("--cursor-page-x", `${latestEvent.clientX}px`);
      root.style.setProperty("--cursor-page-y", `${latestEvent.clientY}px`);

      const target =
        latestEvent.target instanceof Element
          ? latestEvent.target.closest<HTMLElement>(CURSOR_REACTIVE_SELECTOR)
          : null;

      if (!target) {
        clearActiveSurface();
        return;
      }

      const rect = target.getBoundingClientRect();
      const localX = latestEvent.clientX - rect.left;
      const localY = latestEvent.clientY - rect.top;

      if (activeSurface && activeSurface !== target) {
        activeSurface.removeAttribute("data-cursor-active");
      }

      activeSurface = target;
      activeSurface.dataset.cursorActive = "true";
      activeSurface.style.setProperty("--cursor-x", `${localX}px`);
      activeSurface.style.setProperty("--cursor-y", `${localY}px`);
    };

    const handlePointerMove = (event: PointerEvent) => {
      latestEvent = event;

      if (!animationFrame) {
        animationFrame = window.requestAnimationFrame(updateCursor);
      }
    };

    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    window.addEventListener("pointerleave", clearActiveSurface, {
      passive: true,
    });
    window.addEventListener("blur", clearActiveSurface);

    return () => {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }

      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", clearActiveSurface);
      window.removeEventListener("blur", clearActiveSurface);
      clearActiveSurface();
    };
  }, []);
}

function applyRuntimePricingFallback(
  config: SitePricingConfig,
  fallback: {
    singleCheckoutProductId?: string | null;
    allAccessCheckoutProductId?: string | null;
  },
) {
  if (config.updatedAt) {
    return config;
  }

  return applyCheckoutProductFallbacks(config, fallback);
}

const APP_COPY = {
  zh: {
    sourceSnapshot: "项目快照",
    sourceLivePrefix: "实时 API",
    sourceLoadFailed: "加载失败，请稍后重试。",
    apiRequired: "请先填写项目 API 地址。",
    profileLine1: "产品策略与构建者",
    profileLine2: "AI + Design + Engineering",
    profileLine3: "Base: New York / Beijing",
    tocHome: "主页",
    tocProjects: "项目",
    tocBlog: "博客",
    tocDeploy: "部署",
    tocContact: "联系",
    themeNight: "夜间",
    themeDay: "日间",
    themeToNightAria: "切换到黑夜模式",
    themeToDayAria: "切换到日间模式",
    aboutTitle: "关于我",
    aboutIntro:
      "这里暂时保留旧项目展示与归档，项目页顶部先留成黑色，等待下一步具体指示。",
    aboutArchiveTitle: "项目归档",
    aboutEntryText: "关于我",
    portfolioTitle: "作品集",
    blogTitle: "博客",
    blogIntro: "把短帖和长文放在同一条时间线上，方便从一个地方连续读完。",
    blogSourceSite: "站内",
    blogSourceX: "归档自 X",
    blogSourceSubstack: "归档自 Substack",
    blogOriginalPrefix: "原始发布时间",
    blogReadSource: "查看原文",
    blogNextLabel: "下一篇",
    blogEndOfList: "已经到最后一篇博客。",
    blogLoadMore: "继续加载博客",
    homeProjectsMeta: "Featured Projects",
    homeProjectsTitle: "进入 wordm.us 生态",
    homeProjectsIntro:
      "这里汇总目前公开可进入的产品与实验：System 说明底座，Agent 承接个人工作台，Flipook、ARC3 和 Town Agents 保留各自的使用现场。",
    systemCoverDomain: "system.wordm.us",
    systemCoverTitle: "System",
    systemCoverSubtitle: "架构图、Core / WCP / Apps 关系，以及开源 Core 源码入口都在这里。",
    systemCoverCta: "进入 System",
    homeProjectsCta: "进入产品页",
    homeProjectsPreview: "预览页面",
    homeProjectsPreviewOpen: "打开",
    homeProjectsSelectAria: "选择用于批量下载",
    homeProjectsDownloadCount: "已选择",
    homeProjectsDownloadClear: "取消",
    homeProjectsDownloadButton: "下载",
    homeProjectsDownloadPickHint: "点击项目卡片选择要下载的入口。",
    homeProjectsDownloadEmpty: "请先选择至少一个项目。",
    homeProjectsDownloadSelected: "下载",
    homeProjectsDownloadStatus: "已下载所选产品入口清单。",
    systemHeroTitle: "wordm.us 的公开入口",
    systemHeroIntro:
      "这里集中呈现 Jian Yongjie 正在构建的产品、写作和 Agent 系统。愿景是让工具拥有可沉淀的经验；定位是公开的项目地图与进展记录；近况会通过产品入口、博客和 System 说明持续更新。",
    systemHeroCta: "阅读 System 说明",
    systemHeroRead: "查看产品近况",
    systemHeroNodeHuman: "愿景",
    systemHeroNodeHumanDetail: "工具积累经验",
    systemHeroNodeEnvironment: "定位",
    systemHeroNodeEnvironmentDetail: "公开项目地图",
    systemHeroNodeSystem: "wordm.us",
    systemHeroNodeSystemDetail: "产品 / 博客 / System",
    systemHeroNodeLoop: "近况",
    systemHeroNodeLoopDetail: "入口持续整理",
    systemHeroNodeHistory: "Core",
    systemHeroNodeHistoryDetail: "源码与架构",
    systemHeroNodeTools: "Apps",
    systemHeroNodeToolsDetail: "进入使用现场",
    coreDownloadKicker: "近况 / System 与 Core",
    coreDownloadTitle: "近况会集中在主站与 System 站持续更新。",
    coreDownloadIntro:
      "主站展示可进入的产品、博客与实验；System 站解释 Core、WCP、Apps 的关系，并链接到开源 Core、文档和后续接入说明。",
    coreDownloadCta: "进入 System",
    coreManifestCta: "查看源码",
    coreReleaseNote:
      "Core Host 是未来可能出现的本机启动壳；当前公开入口是 GitHub 源码和架构说明。",
    coreReleaseLocal: "Local test build",
    coreReleaseSigned: "Developer ID signed",
    coreReleaseMissing: "Manifest 暂时不可用",
    contactTitle: "联系",
    copyright: "© 2026 Jian Yongjie. All rights reserved.",
    portfolioMode: "wordm.us 生态入口",
    cornerSubstack: "Substack",
    cornerX: "X",
    socialLinksAria: "社交渠道",
    sessionRestoreFailed: "会话恢复失败",
    pleaseRelogin: "请重新登录。",
    loginUnavailable: "未配置 Supabase，无法登录。",
    signupUnavailable: "未配置 Supabase，无法注册。",
    authUnavailable: "未配置 Supabase。",
    emailPasswordRequired: "请输入邮箱和密码。",
    loggingIn: "登录中...",
    loginSuccess: "登录成功",
    loginFailed: "登录失败",
    loginFallback: "请检查邮箱或密码。",
    googleLoggingIn: "正在跳转到 Google 登录...",
    googleLoginFailed: "Google 登录失败",
    googleLoginFallback: "请稍后重试，或检查 Supabase 的 Google 登录配置。",
    googleLoginCancelled: "已取消 Google 登录。",
    signingUp: "注册中...",
    emailExists: "该邮箱已注册，请直接登录。",
    confirmEmail: "注册成功，请先到邮箱点击确认链接，再回来登录。",
    signupSuccess: "注册成功",
    signupAndLoginSuccess: "注册并登录成功",
    signupFailed: "注册失败",
    signupFallback: "请稍后重试。",
    loggingOut: "退出中...",
    logoutSuccess: "已退出登录。",
    logoutFailed: "退出失败",
    logoutFallback: "请稍后重试。",
    unlockPanelTitle: "Center Control 一键部署",
    unlockPanelIntro:
      "所有用户都可直接部署免费版；登录并升级后，安装脚本会自动切到包含付费部分的完整版。",
    unlockPanelSummary:
      "作品访问权限和部署版本是两条独立规则：即使没登录或没升级，也能部署，只是默认得到免费版。",
    unlockPlanSingleLabel: "单作品解锁",
    unlockPlanAllAccess: "全部解锁，后续作品免费",
    unlockPlanUnavailable: "当前未开放这个解锁方式。",
    unlockNeedLogin: "请先登录后再解锁作品。",
    unlockActionFailed: "解锁失败，请稍后重试。",
    unlockAllAccessSuccess: "已完成全部解锁，后续作品也将免费。",
    unlockSingleSuccessPrefix: "已解锁作品",
    unlockBypassNotice: "当前身份可直接访问全部作品，无需解锁。",
    unlockStorageRemote:
      "部署版本: 默认免费版；如当前账号已有权益，会自动切到完整版",
    unlockStorageLocal: "部署版本: 默认免费版；本地仅缓存作品访问权限",
    unlockStorageLoading: "部署版本: 正在同步当前账号权益...",
    unlockStorageIdle: "部署版本: 默认免费版（登录并升级后切到完整版）",
    unlockRemoteFallback:
      "Supabase 解锁服务暂不可用，当前仅可读取本地缓存的已解锁权限。",
    unlockPaidRequired:
      "该解锁需要付费权益，请先在 latti.wordm.us 完成订阅或购买。",
    unlockLifetimeRequired: "该解锁仅对终身权益用户开放。",
    unlockPaidServerRequired: "付费解锁服务暂不可用，请稍后再试。",
    unlockInstallHintPrefix: "安装脚本与说明：",
    unlockInstallHintLink: "打开安装指南",
    deployUpgradeAction: "升级到完整版",
    unlockCheckoutStarting: "正在打开体验入口...",
    unlockCheckoutProductMissing:
      "未配置该解锁方案的商品，请先在 latti.wordm.us 完成升级。",
    unlockCheckoutFailed: "打开体验入口失败，请稍后重试。",
    unlockCheckoutSuccess:
      "体验入口已返回。你可以直接使用下方自部署入口，或再次点击解锁按钮完成授权同步。",
    unlockCheckoutCanceled: "已取消打开体验入口。",
    pricingLoadFallback: "定价配置加载失败，当前使用前端回退配置。",
    pricingReloadSuccess: "已重新加载后台定价配置。",
    pricingSaveSuccess: "定价配置已保存。",
    pricingSaveFailed: "保存定价配置失败",
    pricingManageLogin: "请使用管理员或测试账号登录后再保存定价配置。",
    pricingUnavailable: "未配置 Supabase，无法保存后台定价配置。",
    deployTitle: "Center Control 一键部署",
    deployIntro:
      "所有用户都可部署免费版；登录并升级后，会切换为包含付费部分的完整版。",
    deployAutoReady: "已识别到完整版权益，正在按完整版部署。",
    deployMachineLocal: "当前机器（默认）",
    deployMachineRemote: "远程服务器",
    deployMachineLocalDesc: "在当前机器终端执行下面命令，约 1~3 分钟可用。",
    deployMachineRemoteDesc:
      "填写目标服务器 SSH 地址后，在当前机器执行命令触发远程部署。",
    deployPortLabel: "服务端口",
    deployRemoteHostLabel: "服务器地址（user@host）",
    deployRemoteHostPlaceholder: "例如 root@1.2.3.4",
    deployRemoteHostRequired: "请先填写服务器地址（user@host）。",
    deployCopyCommand: "复制部署命令",
    deployGeneratingTicket: "正在生成一次性部署凭证...",
    deployNeedLogin:
      "未登录或未升级时会部署免费版；登录并升级后才会切到完整版。",
    deployTicketFailed: "生成部署凭证失败，请稍后重试。",
    deployCopySuccess: "部署命令已复制，请到终端粘贴执行。",
    deployCopyFailed: "复制失败，请手动复制命令。",
    deployOpenGuide: "查看安装说明",
    deployOpenScript: "打开安装脚本",
    deployAfterDone:
      "部署完成后，访问 http://localhost:端口（或你的服务器地址）即可使用。",
    deployBackPortfolio: "返回作品集",
    deployOpenUnlockedProject: "打开已解锁项目",
    deployWindowsHint: "Windows 建议在 WSL / Git Bash 中执行命令。",
    shareChecking: "正在验证分享链接...",
    shareCreateSuccess: "分享链接已生成。",
    shareCreateFailed: "生成分享链接失败，请稍后重试。",
    shareCopySuccess: "分享链接已复制。",
    shareCopyFailed: "复制分享链接失败，请手动复制。",
    shareRevokeSuccess: "分享链接已撤销。",
    shareRevokeFailed: "撤销分享链接失败，请稍后重试。",
    shareNeedProjects:
      "当前未勾选任何项目，请先勾选要分享的项目，或切换为全部项目子域。",
    shareEntitlementRequired:
      "当前账号暂无分享权限，请先使用有权限的账号登录。",
    shareResumeRestricted: "简历页仅允许管理员或测试账号加入分享链接。",
    shareListLoadFailed: "加载分享链接失败，请稍后重试。",
    shareInvalid: "分享链接无效。",
    shareExpired: "分享链接已过期。",
    shareRevoked: "分享链接已撤销。",
    shareRestricted: "当前分享链接未开放此页面或项目。",
  },
  en: {
    sourceSnapshot: "Project snapshot",
    sourceLivePrefix: "Live API",
    sourceLoadFailed: "Load failed. Please try again.",
    apiRequired: "Please provide the project API URL first.",
    profileLine1: "Product Strategist & Builder",
    profileLine2: "AI + Design + Engineering",
    profileLine3: "Base: New York / Beijing",
    tocHome: "Home",
    tocProjects: "Projects",
    tocBlog: "Blog",
    tocDeploy: "Deploy",
    tocContact: "Contact",
    themeNight: "Night",
    themeDay: "Day",
    themeToNightAria: "Switch to night mode",
    themeToDayAria: "Switch to day mode",
    aboutTitle: "About",
    aboutIntro:
      "The previous project gallery is kept here as an archive while the Projects tab starts as a black field for the next direction.",
    aboutArchiveTitle: "Project archive",
    aboutEntryText: "About",
    portfolioTitle: "Portfolio Gallery",
    blogTitle: "Blog",
    blogIntro:
      "Short notes and long-form pieces live on one timeline so the reading flow stays continuous.",
    blogSourceSite: "On site",
    blogSourceX: "Archived from X",
    blogSourceSubstack: "Archived from Substack",
    blogOriginalPrefix: "Originally posted",
    blogReadSource: "Open source",
    blogNextLabel: "Next",
    blogEndOfList: "You are at the last blog post.",
    blogLoadMore: "Load more posts",
    homeProjectsMeta: "Featured Projects",
    homeProjectsTitle: "Enter the wordm.us ecosystem",
    homeProjectsIntro:
      "This gathers the public product and experiment entries available now: System explains the base layer, Agent holds the personal workspace, while Flipook, ARC3, and Town Agents keep their own fields.",
    systemCoverDomain: "system.wordm.us",
    systemCoverTitle: "System",
    systemCoverSubtitle:
      "Architecture, Core / WCP / Apps, and the open Core source live here.",
    systemCoverCta: "Enter System",
    homeProjectsCta: "Open product page",
    homeProjectsPreview: "Page preview",
    homeProjectsPreviewOpen: "Open",
    homeProjectsSelectAria: "Select for bulk download",
    homeProjectsDownloadCount: "Selected",
    homeProjectsDownloadClear: "Cancel",
    homeProjectsDownloadButton: "Download",
    homeProjectsDownloadPickHint: "Click project cards to choose entries.",
    homeProjectsDownloadEmpty: "Select at least one project first.",
    homeProjectsDownloadSelected: "Download",
    homeProjectsDownloadStatus: "Downloaded the selected product entry list.",
    systemHeroTitle: "The public entrance to wordm.us",
    systemHeroIntro:
      "This site presents the products, writing, and agent system Jian Yongjie is building. The vision is to let tools retain useful experience; the positioning is a public project map and progress record; current updates arrive through product entries, the blog, and System notes.",
    systemHeroCta: "Read System notes",
    systemHeroRead: "View current products",
    systemHeroNodeHuman: "Vision",
    systemHeroNodeHumanDetail: "Tools learn experience",
    systemHeroNodeEnvironment: "Positioning",
    systemHeroNodeEnvironmentDetail: "Public project map",
    systemHeroNodeSystem: "wordm.us",
    systemHeroNodeSystemDetail: "Products / Blog / System",
    systemHeroNodeLoop: "Current",
    systemHeroNodeLoopDetail: "Entries organized",
    systemHeroNodeHistory: "Core",
    systemHeroNodeHistoryDetail: "Source and architecture",
    systemHeroNodeTools: "Apps",
    systemHeroNodeToolsDetail: "Live product fields",
    coreDownloadKicker: "Current / System and Core",
    coreDownloadTitle: "Current updates are collected on the main site and the System site.",
    coreDownloadIntro:
      "The main site shows product, writing, and experiment entries. The System site explains Core, WCP, Apps, and links to the open Core source, docs, and future onboarding notes.",
    coreDownloadCta: "Enter System",
    coreManifestCta: "Open source",
    coreReleaseNote:
      "Core Host may become the local launch shell later. For now, the public entry is the GitHub source and architecture notes.",
    coreReleaseLocal: "Local test build",
    coreReleaseSigned: "Developer ID signed",
    coreReleaseMissing: "Manifest is temporarily unavailable",
    contactTitle: "Contact",
    copyright: "© 2026 Jian Yongjie. All rights reserved.",
    portfolioMode: "Ecology entry on wordm.us",
    cornerSubstack: "Substack",
    cornerX: "X",
    socialLinksAria: "Social channels",
    sessionRestoreFailed: "Session restore failed",
    pleaseRelogin: "Please log in again.",
    loginUnavailable: "Supabase is not configured. Login is unavailable.",
    signupUnavailable: "Supabase is not configured. Sign-up is unavailable.",
    authUnavailable: "Supabase is not configured.",
    emailPasswordRequired: "Please enter email and password.",
    loggingIn: "Signing in...",
    loginSuccess: "Login successful",
    loginFailed: "Login failed",
    loginFallback: "Please check your email and password.",
    googleLoggingIn: "Redirecting to Google sign-in...",
    googleLoginFailed: "Google sign-in failed",
    googleLoginFallback:
      "Please try again, or check the Supabase Google provider configuration.",
    googleLoginCancelled: "Google sign-in was canceled.",
    signingUp: "Creating account...",
    emailExists: "This email already exists. Please log in directly.",
    confirmEmail: "Sign-up successful. Confirm your email first, then log in.",
    signupSuccess: "Sign-up successful",
    signupAndLoginSuccess: "Sign-up and login successful",
    signupFailed: "Sign-up failed",
    signupFallback: "Please try again later.",
    loggingOut: "Signing out...",
    logoutSuccess: "Logged out.",
    logoutFailed: "Logout failed",
    logoutFallback: "Please try again later.",
    unlockPanelTitle: "One-Click Center Control Deploy",
    unlockPanelIntro:
      "Everyone can deploy the free edition directly. After sign-in and upgrade, the install script switches to the full edition with paid modules.",
    unlockPanelSummary:
      "Project access rules and deployment edition are separate: even without login or upgrade, deployment still works and defaults to the free edition.",
    unlockPlanSingleLabel: "Single project unlock",
    unlockPlanAllAccess: "Unlock all projects, future projects included",
    unlockPlanUnavailable: "This unlock path is not available right now.",
    unlockNeedLogin: "Please log in before unlocking projects.",
    unlockActionFailed: "Unlock failed. Please try again later.",
    unlockAllAccessSuccess: "All projects are unlocked, including future ones.",
    unlockSingleSuccessPrefix: "Unlocked project",
    unlockBypassNotice:
      "Your role can access all projects without unlock limits.",
    unlockStorageRemote:
      "Deployment tier: defaults to free, and auto-switches to full if this account already has entitlement",
    unlockStorageLocal:
      "Deployment tier: defaults to free; local cache only affects project access state",
    unlockStorageLoading:
      "Deployment tier: syncing current account entitlement...",
    unlockStorageIdle:
      "Deployment tier: free by default (sign in and upgrade to switch to full)",
    unlockRemoteFallback:
      "Supabase unlock service is unavailable. Only previously cached access can be read right now.",
    unlockPaidRequired:
      "This unlock requires paid entitlement. Complete purchase on latti.wordm.us first.",
    unlockLifetimeRequired:
      "This unlock is available for lifetime entitlement only.",
    unlockPaidServerRequired:
      "Paid unlock service is unavailable. Please try again later.",
    unlockInstallHintPrefix: "Install guide and script:",
    unlockInstallHintLink: "Open install guide",
    deployUpgradeAction: "Upgrade to full edition",
    unlockCheckoutStarting: "Opening experience entry...",
    unlockCheckoutProductMissing:
      "No product is configured for this unlock mode. Upgrade on latti.wordm.us first.",
    unlockCheckoutFailed:
      "Failed to open the experience entry. Please try again later.",
    unlockCheckoutSuccess:
      "Experience entry returned. Use the self-host entry below, or click unlock again to sync entitlement.",
    unlockCheckoutCanceled: "Experience entry canceled.",
    pricingLoadFallback:
      "Pricing config failed to load. Frontend fallback pricing is being used.",
    pricingReloadSuccess: "Pricing config reloaded from the backend.",
    pricingSaveSuccess: "Pricing config saved.",
    pricingSaveFailed: "Failed to save pricing config",
    pricingManageLogin:
      "Log in with an admin or tester account before saving pricing config.",
    pricingUnavailable:
      "Supabase is not configured. Backend pricing cannot be saved.",
    deployTitle: "One-Click Center Control Deploy",
    deployIntro:
      "Everyone can deploy the free edition. Sign in and upgrade to switch deployment to the full edition with paid modules.",
    deployAutoReady:
      "Full-edition entitlement detected. Preparing a full-edition deployment.",
    deployMachineLocal: "Current machine (default)",
    deployMachineRemote: "Remote server",
    deployMachineLocalDesc:
      "Run the command below in your current machine terminal. Usually ready in 1-3 minutes.",
    deployMachineRemoteDesc:
      "Fill in your target SSH host, then run the command locally to trigger remote deployment.",
    deployPortLabel: "Service port",
    deployRemoteHostLabel: "Server address (user@host)",
    deployRemoteHostPlaceholder: "Example: root@1.2.3.4",
    deployRemoteHostRequired:
      "Please provide the server address (user@host) first.",
    deployCopyCommand: "Copy deploy command",
    deployGeneratingTicket: "Generating one-time deploy ticket...",
    deployNeedLogin:
      "Without sign-in or upgrade, deployment falls back to the free edition. Sign in and upgrade to switch to the full edition.",
    deployTicketFailed:
      "Failed to generate deploy ticket. Please try again later.",
    deployCopySuccess: "Deploy command copied. Paste it in your terminal.",
    deployCopyFailed: "Copy failed. Please copy the command manually.",
    deployOpenGuide: "Open install guide",
    deployOpenScript: "Open install script",
    deployAfterDone:
      "After deployment, open http://localhost:port (or your server host:port) to start using it.",
    deployBackPortfolio: "Back to portfolio",
    deployOpenUnlockedProject: "Open unlocked project",
    deployWindowsHint: "On Windows, use WSL or Git Bash to run the command.",
    shareChecking: "Validating share link...",
    shareCreateSuccess: "Share link created.",
    shareCreateFailed: "Failed to create share link. Please try again later.",
    shareCopySuccess: "Share link copied.",
    shareCopyFailed: "Failed to copy share link. Please copy it manually.",
    shareRevokeSuccess: "Share link revoked.",
    shareRevokeFailed: "Failed to revoke share link. Please try again later.",
    shareNeedProjects:
      "No project is selected. Select projects first, or switch to all project subdomains.",
    shareEntitlementRequired:
      "This account cannot create share links. Log in with an authorized account first.",
    shareResumeRestricted:
      "Resume access can only be included by admin or tester accounts.",
    shareListLoadFailed: "Failed to load share links. Please try again later.",
    shareInvalid: "Share link is invalid.",
    shareExpired: "Share link has expired.",
    shareRevoked: "Share link has been revoked.",
    shareRestricted: "This share link does not include this page or project.",
  },
} as const;

function defaultSelection(
  projects: PortfolioProject[],
  preferred: readonly string[],
): string[] {
  const defaultVisibleProjects = projects.filter(isProjectDefaultVisible);
  const selectionPool = defaultVisibleProjects.length
    ? defaultVisibleProjects
    : projects;
  const preferredExisting = preferred.filter((slug) =>
    selectionPool.some((project) => project.slug === slug),
  );
  if (preferredExisting.length) {
    return [...preferredExisting];
  }

  return selectionPool.slice(0, 9).map((project) => project.slug);
}

function toRootView(raw: string | null, pathname: string): RootView {
  if (pathname === "/blog" || pathname === "/blog/") {
    return "blog";
  }
  if (pathname === "/login" || pathname === "/login/") {
    return "login";
  }
  if (pathname === "/pricing" || pathname === "/pricing/") {
    return "pricing";
  }
  if (
    pathname === "/partners" ||
    pathname === "/partners/" ||
    pathname === "/affiliate" ||
    pathname === "/affiliate/" ||
    pathname === "/partner-program" ||
    pathname === "/partner-program/"
  ) {
    return "partners";
  }
  if (pathname === "/updates" || pathname === "/updates/") {
    return "updates";
  }
  if (pathname === "/fields" || pathname === "/fields/") {
    return "fields";
  }
  if (pathname === "/docs" || pathname === "/docs/") {
    return "docs";
  }

  if (raw === "home") {
    return "home";
  }
  if (raw === "updates") {
    return "updates";
  }
  if (raw === "fields" || raw === "field") {
    return "fields";
  }
  if (raw === "docs" || raw === "documentation") {
    return "docs";
  }
  if (raw === "pricing") {
    return "pricing";
  }
  if (raw === "partners" || raw === "affiliate" || raw === "partner-program") {
    return "partners";
  }
  if (raw === "blog") {
    return "blog";
  }
  if (raw === "login") {
    return "login";
  }
  if (raw === "about") {
    return "about";
  }
  if (raw === "portfolio") {
    return "portfolio";
  }
  if (raw === "projects") {
    return "portfolio";
  }

  return "home";
}

function normalizeSlug(raw: string | null): string | null {
  if (!raw) {
    return null;
  }

  const slug = raw.trim().toLowerCase();
  return slug || null;
}

function normalizeBlogArticleId(raw: string | null): string | null {
  if (!raw) {
    return null;
  }

  const articleId = raw.trim().toLowerCase();
  if (!articleId) {
    return null;
  }

  return BLOG_ARTICLES.some((article) => article.id === articleId)
    ? articleId
    : null;
}

function withDetail(prefix: string, detail: string) {
  return `${prefix}: ${detail}`;
}

function withEmail(prefix: string, email: string) {
  return `${prefix}: ${email}`;
}

function withDone(text: string, lang: Lang) {
  return lang === "zh" ? `${text}。` : `${text}.`;
}

function relativeRootHref(view: RootView, lang: Lang) {
  const url = new URL("/", "https://wordm.us");

  if (view === "login") {
    url.searchParams.set("view", "login");
  } else if (view === "portfolio") {
    url.searchParams.set("view", "portfolio");
  } else if (view === "blog") {
    url.pathname = "/blog";
  } else if (view === "about") {
    url.searchParams.set("view", "about");
  } else if (view === "pricing") {
    url.searchParams.set("view", "pricing");
  } else if (view === "partners") {
    url.pathname = "/partners";
  } else if (view === "updates") {
    url.searchParams.set("view", "updates");
  } else if (view === "fields") {
    url.pathname = "/fields";
  } else if (view === "docs") {
    url.pathname = "/docs";
  }

  url.searchParams.set("lang", lang);

  const search = url.searchParams.toString();
  return `${url.pathname}${search ? `?${search}` : ""}`;
}

async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Continue to fallback below.
    }
  }

  if (typeof document === "undefined") {
    return false;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  } finally {
    document.body.removeChild(textarea);
  }

  return copied;
}
function defaultShareScope(): ShareScope {
  return {
    allowPortfolio: true,
    allowBlog: true,
    allowDeploy: true,
    allowResume: false,
    allowAllProjects: true,
    allowedProjectSlugs: [],
  };
}

function resolveShareStatusFromError(
  error: unknown,
): Exclude<ShareResolveStatus, "idle" | "loading" | "active"> {
  const detail = normalizeAuthError(error, "").toUpperCase();
  if (detail.includes("EXPIRED")) {
    return "expired";
  }
  if (detail.includes("REVOKED")) {
    return "revoked";
  }
  if (detail.includes("INVALID")) {
    return "invalid";
  }
  return "error";
}

function resolveShareDeniedStatus(options: {
  shareToken: string | null;
  shareResolveStatus: ShareResolveStatus;
  allowedByShare: boolean;
  bypass: boolean;
}): ShareResolveStatus | null {
  if (!options.shareToken || options.bypass) {
    return null;
  }

  if (options.shareResolveStatus === "loading") {
    return "loading";
  }

  if (options.shareResolveStatus === "active") {
    return options.allowedByShare ? null : "active";
  }

  if (options.shareResolveStatus === "idle") {
    return "invalid";
  }

  return options.shareResolveStatus;
}

function App() {
  useCursorReactiveSurfaces();

  const params = new URLSearchParams(window.location.search);
  const hostname = window.location.hostname.toLowerCase();
  const isAdminHost =
    hostname === "admin.wordm.us" || params.get("page") === "admin";
  const forcedSubdomain = params.get("subdomain");
  const forcedPage = params.get("page");
  const initialShowSlugs = parseShowSlugs(params.get("show"));
  const hashRootView =
    !params.has("view") && window.location.hash === "#updates"
      ? "updates"
      : null;
  const initialRootView = initialShowSlugs.length
    ? "portfolio"
    : hashRootView ?? toRootView(params.get("view"), window.location.pathname);
  const initialBlogArticleId =
    normalizeBlogArticleId(params.get("article")) ??
    BLOG_ARTICLES[0]?.id ??
    null;
  const initialProjectSlug = normalizeSlug(params.get("project"));
  const initialUnlockSlug = normalizeSlug(params.get("unlock"));
  const initialCheckoutSlug = normalizeSlug(params.get("checkout_slug"));
  const initialShareToken = params.get("share")?.trim() || null;
  const initialAuthReturnTo = resolveSafeAuthRedirectUrl(
    params.get("returnTo") ?? params.get("return_to"),
  );
  const initialPurchaseSuccess = params.get("purchase_success") === "1";
  const initialPurchaseCanceled = params.get("purchase_cancel") === "1";
  const initialLang = resolveInitialLang(window.location);
  const initialThemeMode = readInitialThemeMode();
  const blogLoadMoreRef = useRef<HTMLDivElement | null>(null);

  const [lang, setLang] = useState<Lang>(initialLang);
  const [themeMode, setThemeMode] = useState<ThemeMode>(initialThemeMode);
  const [offerNow, setOfferNow] = useState(() => Date.now());
  const copy = APP_COPY[lang];
  const envPricingFallback = useMemo(
    () =>
      applyCheckoutProductFallbacks(DEFAULT_SITE_PRICING_CONFIG, {
        singleCheckoutProductId:
          import.meta.env.VITE_UNLOCK_PRODUCT_SINGLE ||
          "prod_4eDxmaC52vCKWPjGqfqIqy",
        allAccessCheckoutProductId:
          import.meta.env.VITE_UNLOCK_PRODUCT_ALL_ACCESS ||
          import.meta.env.VITE_UNLOCK_PRODUCT_ALL_CURRENT_PLUS_YEAR ||
          import.meta.env.VITE_UNLOCK_PRODUCT_ALL_CURRENT ||
          "prod_3WVufccMdH37WNdEVvSL6",
      }),
    [],
  );

  const authConfig = useMemo(
    () => ({
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL || "",
      supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
    }),
    [],
  );

  const envRoleRules = useMemo<AuthRoleRules>(
    () => ({
      adminEmails: parseRoleEmailSet(
        import.meta.env.VITE_AUTH_ADMIN_EMAILS ||
          import.meta.env.VITE_ADMIN_EMAILS ||
          "",
      ),
      testerEmails: parseRoleEmailSet(
        import.meta.env.VITE_AUTH_TEST_EMAILS ||
          import.meta.env.VITE_TEST_EMAILS ||
          "",
      ),
    }),
    [],
  );

  const [authRoleRules, setAuthRoleRules] =
    useState<AuthRoleRules>(envRoleRules);
  const authEnabled = isAuthConfigured(authConfig);

  const [rootView, setRootView] = useState<RootView>(initialRootView);
  const [projects] = useState<PortfolioProject[]>(initialProjects);
  const [authUser, setAuthUser] = useState<AuthUserSummary | null>(null);
  const [authLoading, setAuthLoading] = useState(authEnabled);
  const [authBusy, setAuthBusy] = useState(false);
  const [authStatusMessage, setAuthStatusMessage] = useState("");
  const [unlockState, setUnlockState] = useState<UserUnlockState | null>(null);
  const [unlockStorageMode, setUnlockStorageMode] =
    useState<UnlockStorageMode>("idle");
  const [unlockBusy, setUnlockBusy] = useState(false);
  const [checkoutBusyKind, setCheckoutBusyKind] =
    useState<UnlockCheckoutKind | null>(null);
  const [unlockStatusMessage, setUnlockStatusMessage] = useState("");
  const [pricingConfig, setPricingConfig] =
    useState<SitePricingConfig>(envPricingFallback);
  const [pricingStatusMessage, setPricingStatusMessage] = useState("");
  const [pricingBusy, setPricingBusy] = useState(false);
  const [adminPricingConfig, setAdminPricingConfig] =
    useState<SitePricingConfig>(envPricingFallback);
  const [activeBlogArticleId, setActiveBlogArticleId] = useState<string | null>(
    initialBlogArticleId,
  );
  const [visibleBlogCount, setVisibleBlogCount] = useState(
    BLOG_INITIAL_RENDER_COUNT,
  );
  const [selectedProjectSlug, setSelectedProjectSlug] = useState<string | null>(
    initialProjectSlug,
  );
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [unlockTargetSlug, setUnlockTargetSlug] = useState<string | null>(
    initialUnlockSlug,
  );
  const [selectedHomeProductKeys, setSelectedHomeProductKeys] = useState<
    string[]
  >([]);
  const [homeProductSelectionMode, setHomeProductSelectionMode] =
    useState(false);
  const [homeDownloadStatusMessage, setHomeDownloadStatusMessage] =
    useState("");
  const [shareToken] = useState<string | null>(initialShareToken);
  const [shareAccess, setShareAccess] = useState<ShareAccess | null>(null);
  const [shareResolveStatus, setShareResolveStatus] =
    useState<ShareResolveStatus>(initialShareToken ? "loading" : "idle");
  const [shareBusy, setShareBusy] = useState(false);
  const [shareManageStatusMessage, setShareManageStatusMessage] = useState("");
  const [shareLabel, setShareLabel] = useState("");
  const [shareExpiresInDays, setShareExpiresInDays] = useState("3");
  const [shareScope, setShareScope] = useState<ShareScope>(() =>
    defaultShareScope(),
  );
  const [shareLinks, setShareLinks] = useState<ShareLinkRecord[]>([]);
  const [lastCreatedShareUrl, setLastCreatedShareUrl] = useState("");
  const [lastCreatedShareId, setLastCreatedShareId] = useState<string | null>(
    null,
  );
  const [analyticsEvents, setAnalyticsEvents] = useState<
    SiteAnalyticsRecord[]
  >([]);
  const [analyticsBusy, setAnalyticsBusy] = useState(false);
  const [analyticsStatusMessage, setAnalyticsStatusMessage] = useState("");
  const analyticsPageStartedAtRef = useRef(Date.now());
  const analyticsPageKeyRef = useRef<string | null>(null);
  const analyticsPageMetadataRef = useRef<Record<string, unknown>>({});
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(() => {
    if (initialShowSlugs.length) {
      return initialShowSlugs;
    }

    return defaultSelection(initialProjects, FEATURED_PROJECT_SLUGS);
  });
  const blogArticles = useMemo(() => BLOG_ARTICLES, []);
  const renderedBlogArticles = useMemo(
    () =>
      blogArticles.slice(0, Math.min(visibleBlogCount, blogArticles.length)),
    [blogArticles, visibleBlogCount],
  );
  const hasMoreBlogArticles = renderedBlogArticles.length < blogArticles.length;
  const activeBlogArticle = useMemo(
    () =>
      blogArticles.find((article) => article.id === activeBlogArticleId) ??
      blogArticles[0] ??
      null,
    [activeBlogArticleId, blogArticles],
  );
  const activeBlogIndex = useMemo(
    () =>
      activeBlogArticle
        ? blogArticles.findIndex(
            (article) => article.id === activeBlogArticle.id,
          )
        : -1,
    [activeBlogArticle, blogArticles],
  );
  const nextBlogArticle =
    activeBlogIndex >= 0 && activeBlogIndex + 1 < blogArticles.length
      ? blogArticles[activeBlogIndex + 1]
      : null;
  const isOneAgentProductPage =
    window.location.hostname === "oneagent.wordm.us" ||
    window.location.pathname === "/oneagent" ||
    window.location.pathname === "/oneagent/";

  const contactEmail = "parsonjian@gmail.com";
  const defaultHomeHref = new URL(
    relativeRootHref("home", lang),
    "https://wordm.us",
  ).toString();
  const accountHref = relativeRootHref("login", lang);
  const loginHref = accountHref;
  const homeHref = defaultHomeHref;

  const primaryUpdatedAt =
    snapshot.centerControlGeneratedAt || snapshot.generatedAt;
  const lastUpdated = formatDate(primaryUpdatedAt);

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    document.documentElement.style.colorScheme =
      themeMode === "night" ? "dark" : "light";

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    } catch {
      // Ignore storage failures; the in-memory theme still applies.
    }
  }, [themeMode]);

  useEffect(() => {
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  }, [lang]);

  useEffect(() => {
    if (rootView === "blog") {
      document.title = lang === "zh" ? "Fount 博客 | Notes" : "Fount Blog | Notes";
    }
  }, [lang, rootView]);

  useEffect(() => {
    if (isOneAgentProductPage) {
      return;
    }

    const next = new URL(window.location.href);
    next.pathname =
      rootView === "blog"
        ? "/blog"
        : rootView === "partners"
          ? "/partners"
          : rootView === "fields"
            ? "/fields"
            : rootView === "docs"
              ? "/docs"
              : "/";

    if (rootView === "login") {
      next.searchParams.set("view", "login");
    } else if (rootView === "portfolio") {
      next.searchParams.set("view", "portfolio");
    } else if (rootView === "blog") {
      next.searchParams.delete("view");
    } else if (rootView === "about") {
      next.searchParams.set("view", "about");
    } else if (rootView === "pricing") {
      next.searchParams.set("view", "pricing");
    } else if (rootView === "partners") {
      next.searchParams.delete("view");
    } else if (rootView === "updates") {
      next.searchParams.set("view", "updates");
    } else if (rootView === "fields") {
      next.searchParams.delete("view");
    } else if (rootView === "docs") {
      next.searchParams.delete("view");
    } else {
      next.searchParams.delete("view");
    }

    next.searchParams.set("lang", lang);

    if (selectedProjectSlug && (rootView === "portfolio" || rootView === "about")) {
      next.searchParams.set("project", selectedProjectSlug);
    } else {
      next.searchParams.delete("project");
    }

    if (activeBlogArticleId && rootView === "blog") {
      next.searchParams.set("article", activeBlogArticleId);
    } else {
      next.searchParams.delete("article");
    }

    if (unlockTargetSlug && rootView !== "login") {
      next.searchParams.set("unlock", unlockTargetSlug);
    } else {
      next.searchParams.delete("unlock");
    }

    if (shareToken) {
      next.searchParams.set("share", shareToken);
    } else {
      next.searchParams.delete("share");
    }

    next.searchParams.delete("return_to");
    if (rootView === "login" && initialAuthReturnTo) {
      next.searchParams.set("returnTo", initialAuthReturnTo);
    } else {
      next.searchParams.delete("returnTo");
    }

    window.history.replaceState({}, "", next);
  }, [
    rootView,
    lang,
    selectedProjectSlug,
    activeBlogArticleId,
    unlockTargetSlug,
    shareToken,
    isOneAgentProductPage,
    initialAuthReturnTo,
  ]);

  useEffect(() => {
    const activeLangButton = document.querySelector<HTMLElement>(
      ".site-topbar-lang button.active",
    );
    const langRail = activeLangButton?.parentElement;

    if (!activeLangButton || !langRail) {
      return;
    }

    langRail.scrollLeft =
      activeLangButton.offsetLeft -
      (langRail.clientWidth - activeLangButton.clientWidth) / 2;
  }, [lang]);

  useEffect(() => {
    if (!initialPurchaseSuccess && !initialPurchaseCanceled) {
      return;
    }

    if (initialCheckoutSlug) {
      setUnlockTargetSlug(initialCheckoutSlug);
      setSelectedProjectSlug(initialCheckoutSlug);
    }

    if (initialPurchaseSuccess) {
      setRootView("portfolio");
      setUnlockStatusMessage(copy.unlockCheckoutSuccess);
    } else {
      setUnlockStatusMessage(copy.unlockCheckoutCanceled);
    }

    const next = new URL(window.location.href);
    next.searchParams.delete("purchase_success");
    next.searchParams.delete("purchase_cancel");
    next.searchParams.delete("checkout_kind");
    next.searchParams.delete("checkout_slug");
    window.history.replaceState({}, "", next);
  }, [
    copy.unlockCheckoutCanceled,
    copy.unlockCheckoutSuccess,
    initialCheckoutSlug,
    initialPurchaseCanceled,
    initialPurchaseSuccess,
  ]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setOfferNow(Date.now());
    }, 60_000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    let active = true;

    if (!authConfig.supabaseUrl) {
      setPricingConfig(envPricingFallback);
      setAdminPricingConfig(envPricingFallback);
      setPricingStatusMessage("");
      return;
    }

    void fetchPricingConfigFromSupabase(authConfig)
      .then((remoteConfig) => {
        if (!active) {
          return;
        }

        const nextConfig = applyRuntimePricingFallback(remoteConfig, {
          singleCheckoutProductId:
            envPricingFallback.singleUnlock.defaultCheckoutProductId,
          allAccessCheckoutProductId:
            envPricingFallback.allAccess.checkoutProductId,
        });
        setPricingConfig(nextConfig);
        setAdminPricingConfig(nextConfig);
        setPricingStatusMessage("");
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setPricingConfig(envPricingFallback);
        setAdminPricingConfig(envPricingFallback);
        setPricingStatusMessage(copy.pricingLoadFallback);
      });

    return () => {
      active = false;
    };
  }, [authConfig, copy.pricingLoadFallback, envPricingFallback]);

  useEffect(() => {
    if (!shareToken) {
      setShareAccess(null);
      setShareResolveStatus("idle");
      return;
    }

    if (!authConfig.supabaseUrl) {
      setShareAccess(null);
      setShareResolveStatus("error");
      return;
    }

    let active = true;
    setShareResolveStatus("loading");

    void resolveShareLink(authConfig.supabaseUrl, shareToken)
      .then((access) => {
        if (!active) {
          return;
        }

        setShareAccess(access);
        setShareResolveStatus("active");
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        setShareAccess(null);
        setShareResolveStatus(resolveShareStatusFromError(error));
      });

    return () => {
      active = false;
    };
  }, [authConfig.supabaseUrl, shareToken]);

  useEffect(() => {
    if (rootView !== "blog" || !initialBlogArticleId) {
      return;
    }

    const articleIndex = BLOG_ARTICLES.findIndex(
      (article) => article.id === initialBlogArticleId,
    );
    if (articleIndex >= BLOG_INITIAL_RENDER_COUNT) {
      setVisibleBlogCount(
        Math.min(BLOG_ARTICLES.length, articleIndex + BLOG_RENDER_BATCH_SIZE),
      );
    }

    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById(
        `blog-article-${initialBlogArticleId}`,
      );
      if (target) {
        target.scrollIntoView({ behavior: "auto", block: "start" });
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [initialBlogArticleId, rootView]);

  useEffect(() => {
    if (rootView !== "blog") {
      return;
    }

    if (!BLOG_ARTICLES.length) {
      setActiveBlogArticleId(null);
      return;
    }

    setActiveBlogArticleId((current) =>
      current && BLOG_ARTICLES.some((article) => article.id === current)
        ? current
        : BLOG_ARTICLES[0].id,
    );
  }, [rootView]);

  useEffect(() => {
    if (rootView === "blog") {
      setVisibleBlogCount((current) =>
        Math.max(current, BLOG_INITIAL_RENDER_COUNT),
      );
    }
  }, [rootView]);

  useEffect(() => {
    if (rootView !== "blog" || !renderedBlogArticles.length) {
      return;
    }

    const articleIds = renderedBlogArticles.map((article) => article.id);
    const articleNodes = articleIds
      .map((articleId) => document.getElementById(`blog-article-${articleId}`))
      .filter((node): node is HTMLElement => Boolean(node));

    if (!articleNodes.length) {
      return;
    }

    let frameId = 0;
    const updateActiveArticle = () => {
      if (frameId) {
        return;
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        let nextArticleId = articleIds[0];
        const threshold = window.innerHeight * 0.28;

        for (const node of articleNodes) {
          const top = node.getBoundingClientRect().top;
          if (top <= threshold) {
            nextArticleId = node.dataset.articleId || nextArticleId;
            continue;
          }
          break;
        }

        setActiveBlogArticleId((current) =>
          current === nextArticleId ? current : nextArticleId,
        );
      });
    };

    updateActiveArticle();
    window.addEventListener("scroll", updateActiveArticle, { passive: true });
    window.addEventListener("resize", updateActiveArticle);

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener("scroll", updateActiveArticle);
      window.removeEventListener("resize", updateActiveArticle);
    };
  }, [renderedBlogArticles, rootView]);

  useEffect(() => {
    if (
      rootView !== "blog" ||
      !hasMoreBlogArticles ||
      !blogLoadMoreRef.current
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) {
          return;
        }
        // Use functional update; lower rootMargin to avoid aggressive batch inserts during fast scroll (which could cause blanking reflow)
        setVisibleBlogCount((current) =>
          Math.min(blogArticles.length, current + BLOG_RENDER_BATCH_SIZE),
        );
      },
      { rootMargin: "320px 0px" },
    );

    observer.observe(blogLoadMoreRef.current);
    return () => observer.disconnect();
  }, [blogArticles.length, hasMoreBlogArticles, rootView]);

  useEffect(() => {
    function syncScrollTopVisibility() {
      setShowScrollTop(window.scrollY > 540);
    }

    syncScrollTopVisibility();
    window.addEventListener("scroll", syncScrollTopVisibility, {
      passive: true,
    });
    return () => window.removeEventListener("scroll", syncScrollTopVisibility);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadRoleRulesFromPublicFile() {
      try {
        const response = await fetch("/auth-role-rules.json", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`role rules file not found (${response.status})`);
        }

        const payload = (await response.json()) as AuthRoleRulesJson;
        const fileRules = toRoleRulesFromJson(payload);

        if (!active) {
          return;
        }

        setAuthRoleRules(mergeRoleRules(envRoleRules, fileRules));
      } catch {
        if (!active) {
          return;
        }

        setAuthRoleRules(envRoleRules);
      }
    }

    void loadRoleRulesFromPublicFile();

    return () => {
      active = false;
    };
  }, [envRoleRules]);

  useEffect(() => {
    if (!authEnabled) {
      setAuthLoading(false);
      setAuthUser(null);
      clearGoogleOAuthPending();
      return;
    }

    let active = true;
    setAuthLoading(true);

    void fetchSessionUser(authConfig)
      .then((user) => {
        if (!active) {
          return;
        }

        setAuthUser(toAuthUserSummary(user, authRoleRules));
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        const detail = normalizeAuthError(error, copy.pleaseRelogin);
        setAuthStatusMessage(withDetail(copy.sessionRestoreFailed, detail));
      })
      .finally(() => {
        if (active) {
          setAuthLoading(false);
        }
      });

    const unsubscribe = subscribeAuthState(authConfig, (user) => {
      if (!active) {
        return;
      }

      setAuthUser(toAuthUserSummary(user, authRoleRules));
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [
    authConfig,
    authEnabled,
    authRoleRules,
    copy.pleaseRelogin,
    copy.sessionRestoreFailed,
  ]);

  useEffect(() => {
    if (!authEnabled) {
      clearGoogleOAuthPending();
      return;
    }

    if (authUser) {
      const pendingAt = readGoogleOAuthPendingAt();
      if (pendingAt) {
        void trackSiteEvent(authConfig, {
          eventType: "login",
          userRole: authUser.role,
          metadata: {
            rootView,
            lang,
            selectedProjectSlug,
            activeBlogArticleId,
            shareMode: Boolean(shareToken),
            method: "google",
            outcome: "success",
            pendingMs: Date.now() - pendingAt,
          },
        });
      }
      clearGoogleOAuthPending();
      setAuthBusy(false);
      return;
    }

    if (
      authLoading ||
      typeof window === "undefined" ||
      typeof document === "undefined"
    ) {
      return;
    }

    const maybeResetGoogleLogin = () => {
      const pendingAt = readGoogleOAuthPendingAt();
      if (!pendingAt) {
        return;
      }

      if (document.visibilityState === "hidden") {
        return;
      }

      if (Date.now() - pendingAt < GOOGLE_OAUTH_PENDING_GRACE_MS) {
        return;
      }

      clearGoogleOAuthPending();
      setAuthBusy(false);
      setAuthStatusMessage((current) =>
        !current || current === copy.googleLoggingIn
          ? copy.googleLoginCancelled
          : current,
      );
    };

    maybeResetGoogleLogin();
    window.addEventListener("pageshow", maybeResetGoogleLogin);
    window.addEventListener("focus", maybeResetGoogleLogin);
    document.addEventListener("visibilitychange", maybeResetGoogleLogin);

    return () => {
      window.removeEventListener("pageshow", maybeResetGoogleLogin);
      window.removeEventListener("focus", maybeResetGoogleLogin);
      document.removeEventListener("visibilitychange", maybeResetGoogleLogin);
    };
  }, [
    authEnabled,
    authLoading,
    authUser,
    authConfig,
    activeBlogArticleId,
    copy.googleLoggingIn,
    copy.googleLoginCancelled,
    lang,
    rootView,
    selectedProjectSlug,
    shareToken,
  ]);

  useEffect(() => {
    if (!authUser) {
      setUnlockState(null);
      setUnlockStorageMode("idle");
      setUnlockStatusMessage("");
      return;
    }

    const authUserId = authUser.id;
    let active = true;
    setUnlockStorageMode("loading");

    async function loadUnlockState() {
      try {
        const remoteState = await fetchUnlockStateFromSupabase(authConfig);
        if (!active) {
          return;
        }

        setUnlockState(remoteState);
        setUnlockStorageMode("remote");
      } catch {
        if (!active) {
          return;
        }

        setUnlockState(loadUnlockStateForUser(authUserId));
        setUnlockStorageMode("local");
        setUnlockStatusMessage(copy.unlockRemoteFallback);
      }
    }

    void loadUnlockState();

    return () => {
      active = false;
    };
  }, [authConfig, authUser, copy.unlockRemoteFallback]);

  useEffect(() => {
    if (!authUser || !unlockState) {
      return;
    }

    saveUnlockStateForUser(authUser.id, unlockState);
  }, [authUser, unlockState]);

  useEffect(() => {
    let active = true;

    async function loadShareLinks() {
      try {
        if (isAdminHost) {
          const links = await listAdminShareLinks();
          if (active) {
            setShareLinks(links);
          }
          return;
        }

        if (
          !authUser ||
          (authUser.role !== "admin" && authUser.role !== "tester")
        ) {
          if (active) {
            setShareLinks([]);
          }
          return;
        }

        const links = await listOwnShareLinks(authConfig);
        if (active) {
          setShareLinks(links);
        }
      } catch {
        if (active) {
          setShareManageStatusMessage(copy.shareListLoadFailed);
        }
      }
    }

    void loadShareLinks();

    return () => {
      active = false;
    };
  }, [authConfig, authUser, copy.shareListLoadFailed, isAdminHost]);

  useEffect(() => {
    if (!unlockTargetSlug) {
      return;
    }

    setSelectedSlugs((prev) => {
      if (prev.includes(unlockTargetSlug)) {
        return prev;
      }
      if (!projects.some((project) => project.slug === unlockTargetSlug)) {
        return prev;
      }

      return [...prev, unlockTargetSlug];
    });
  }, [projects, unlockTargetSlug]);

  function unlockErrorCode(error: unknown): string {
    const detail = normalizeAuthError(error, "");
    return detail.toUpperCase();
  }

  function isPaymentRequiredError(error: unknown): boolean {
    return unlockErrorCode(error).includes("PAYMENT_REQUIRED");
  }

  function isLifetimeRequiredError(error: unknown): boolean {
    return unlockErrorCode(error).includes("LIFETIME_REQUIRED");
  }

  function isBusinessUnlockError(error: unknown): boolean {
    const code = unlockErrorCode(error);
    return (
      code.includes("PROJECT_SLUG_REQUIRED") ||
      code.includes("CATALOG_SLUGS_REQUIRED") ||
      code.includes("INVALID_UNLOCK_KIND") ||
      code.includes("PAYMENT_REQUIRED") ||
      code.includes("LIFETIME_REQUIRED") ||
      code.includes("UNAUTHENTICATED")
    );
  }

  function buildCheckoutReturnUrl(
    kind: UnlockCheckoutKind,
    projectSlug: string | null = null,
  ) {
    const next = new URL(window.location.href);
    next.searchParams.set("purchase_success", "1");
    next.searchParams.set("checkout_kind", kind);

    const normalizedSlug = normalizeSlug(projectSlug);
    if (normalizedSlug) {
      next.searchParams.set("checkout_slug", normalizedSlug);
      next.searchParams.set("unlock", normalizedSlug);
      next.searchParams.set("project", normalizedSlug);
    } else {
      next.searchParams.delete("checkout_slug");
      next.searchParams.delete("project");
    }

    next.searchParams.set("view", "portfolio");
    next.searchParams.set("lang", lang);
    return next.toString();
  }

  function buildCheckoutCancelUrl(projectSlug: string | null = null) {
    const next = new URL(window.location.href);
    next.searchParams.set("purchase_cancel", "1");

    const normalizedSlug = normalizeSlug(projectSlug);
    if (normalizedSlug) {
      next.searchParams.set("checkout_slug", normalizedSlug);
      next.searchParams.set("unlock", normalizedSlug);
      next.searchParams.set("project", normalizedSlug);
    } else {
      next.searchParams.delete("checkout_slug");
      next.searchParams.delete("project");
    }

    next.searchParams.set("view", "portfolio");
    next.searchParams.set("lang", lang);
    return next.toString();
  }

  async function startUnlockCheckout(
    kind: UnlockCheckoutKind,
    projectSlug: string | null = null,
  ) {
    if (!authEnabled || !authUser) {
      setUnlockStatusMessage(copy.unlockNeedLogin);
      return false;
    }

    const unlockOptions = projectSlug
      ? getUnlockOptionsBySlug(projectSlug)
      : null;
    const kindEnabled =
      kind === "single"
        ? Boolean(unlockOptions?.singleEnabled)
        : Boolean(
            unlockOptions?.allAccessEnabled ?? pricingConfig.allAccess.enabled,
          );
    if (!kindEnabled) {
      setUnlockStatusMessage(copy.unlockPlanUnavailable);
      return false;
    }

    const productId =
      kind === "single"
        ? (unlockOptions?.singleCheckoutProductId ?? null)
        : (unlockOptions?.allAccessCheckoutProductId ??
          pricingConfig.allAccess.checkoutProductId);

    setCheckoutBusyKind(kind);
    setUnlockStatusMessage(copy.unlockCheckoutStarting);

    try {
      const checkoutUrl = await createUnlockCheckoutUrl(authConfig, {
        productId: productId ?? "",
        successUrl: buildCheckoutReturnUrl(kind, projectSlug),
        cancelUrl: buildCheckoutCancelUrl(projectSlug),
      });

      window.location.assign(checkoutUrl);
      return true;
    } catch (error) {
      const code = unlockErrorCode(error);
      if (code.includes("CHECKOUT_PRODUCT_MISSING")) {
        setUnlockStatusMessage(copy.unlockCheckoutProductMissing);
        return false;
      }

      if (code.includes("UNAUTHENTICATED")) {
        setUnlockStatusMessage(copy.unlockNeedLogin);
        return false;
      }

      setUnlockStatusMessage(copy.unlockCheckoutFailed);
      return false;
    } finally {
      setCheckoutBusyKind(null);
    }
  }

  async function reloadPricingConfig(showSuccessMessage = false) {
    if (!authConfig.supabaseUrl) {
      setPricingConfig(envPricingFallback);
      setAdminPricingConfig(envPricingFallback);
      setPricingStatusMessage(copy.pricingUnavailable);
      return;
    }

    setPricingBusy(true);

    try {
      const remoteConfig = await fetchPricingConfigFromSupabase(authConfig);
      const nextConfig = applyRuntimePricingFallback(remoteConfig, {
        singleCheckoutProductId:
          envPricingFallback.singleUnlock.defaultCheckoutProductId,
        allAccessCheckoutProductId:
          envPricingFallback.allAccess.checkoutProductId,
      });
      setPricingConfig(nextConfig);
      setAdminPricingConfig(nextConfig);
      setPricingStatusMessage(
        showSuccessMessage ? copy.pricingReloadSuccess : "",
      );
    } catch (error) {
      const detail = normalizeAuthError(error, copy.pricingLoadFallback);
      setPricingStatusMessage(withDetail(copy.pricingLoadFallback, detail));
    } finally {
      setPricingBusy(false);
    }
  }

  async function handleSavePricingConfig() {
    if (!authConfig.supabaseUrl) {
      setPricingStatusMessage(copy.pricingUnavailable);
      return;
    }

    if (!canManagePricing || !authUser) {
      setPricingStatusMessage(copy.pricingManageLogin);
      return;
    }

    setPricingBusy(true);

    try {
      const savedConfig = await savePricingConfigFromSupabase(
        authConfig,
        adminPricingConfig,
      );
      setPricingConfig(savedConfig);
      setAdminPricingConfig(savedConfig);
      setPricingStatusMessage(copy.pricingSaveSuccess);
    } catch (error) {
      const detail = normalizeAuthError(error, copy.pricingSaveFailed);
      setPricingStatusMessage(withDetail(copy.pricingSaveFailed, detail));
    } finally {
      setPricingBusy(false);
    }
  }

  async function createManagedShareLink(options: {
    label: string;
    expiresInDays: number;
    scope: ShareScope;
    entryUrlBuilder?: ((token: string) => string) | null;
    copyAfterCreate?: boolean;
  }) {
    if (!authUser && !isAdminHost) {
      setShareManageStatusMessage(copy.shareEntitlementRequired);
      return null;
    }

    const scope = {
      ...options.scope,
      allowResume: false,
      allowedProjectSlugs: options.scope.allowAllProjects
        ? []
        : options.scope.allowedProjectSlugs,
    };

    if (
      !scope.allowPortfolio &&
      !scope.allowBlog &&
      !scope.allowDeploy &&
      !scope.allowResume &&
      !scope.allowAllProjects &&
      scope.allowedProjectSlugs.length === 0
    ) {
      setShareManageStatusMessage(copy.shareNeedProjects);
      return null;
    }

    setShareBusy(true);
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
          });
      const fallbackUrl = buildShareEntryUrl(
        created.token,
        lang,
        created.scope,
        projects,
      );
      const shareUrl = options.entryUrlBuilder
        ? options.entryUrlBuilder(created.token)
        : fallbackUrl;
      setLastCreatedShareId(created.id);
      setLastCreatedShareUrl(shareUrl);
      setShareLinks(
        isAdminHost
          ? await listAdminShareLinks()
          : await listOwnShareLinks(authConfig),
      );

      if (options.copyAfterCreate) {
        const copied = await copyTextToClipboard(shareUrl);
        setShareManageStatusMessage(
          copied ? copy.shareCopySuccess : copy.shareCopyFailed,
        );
      } else {
        setShareManageStatusMessage(copy.shareCreateSuccess);
      }

      return created;
    } catch (error) {
      const code = unlockErrorCode(error);
      if (code.includes("SHARE_SCOPE_EMPTY")) {
        setShareManageStatusMessage(copy.shareNeedProjects);
        return null;
      }
      if (code.includes("SHARE_RESUME_RESTRICTED")) {
        setShareManageStatusMessage(copy.shareResumeRestricted);
        return null;
      }
      if (
        code.includes("SHARE_ENTITLEMENT_REQUIRED") ||
        code.includes("UNAUTHENTICATED")
      ) {
        setShareManageStatusMessage(copy.shareEntitlementRequired);
        return null;
      }
      setShareManageStatusMessage(copy.shareCreateFailed);
      return null;
    } finally {
      setShareBusy(false);
    }
  }

  async function handleCreateShareLink() {
    const normalizedDays = Number(shareExpiresInDays.trim() || "3");
    const selectedProjectSlugs = shareScope.allowAllProjects
      ? []
      : selectedSlugs;

    await createManagedShareLink({
      label: shareLabel,
      expiresInDays: normalizedDays,
      scope: {
        ...shareScope,
        allowedProjectSlugs: selectedProjectSlugs,
      },
    });
  }

  async function handleCreateFullExperienceShareLink() {
    await createManagedShareLink({
      label:
        shareLabel ||
        (lang === "zh" ? "3 天完整体验" : "3-day full experience"),
      expiresInDays: 3,
      scope: {
        allowPortfolio: true,
        allowBlog: false,
        allowDeploy: true,
        allowResume: false,
        allowAllProjects: true,
        allowedProjectSlugs: [],
      },
      copyAfterCreate: true,
    });
  }

  async function handleCreateSevenDayShareLink() {
    await createManagedShareLink({
      label:
        shareLabel ||
        (lang === "zh" ? "7 天完整体验" : "7-day full experience"),
      expiresInDays: 7,
      scope: {
        allowPortfolio: true,
        allowBlog: false,
        allowDeploy: true,
        allowResume: false,
        allowAllProjects: true,
        allowedProjectSlugs: [],
      },
      copyAfterCreate: true,
    });
  }

  async function handleCreateThirtyDayShareLink() {
    await createManagedShareLink({
      label:
        shareLabel ||
        (lang === "zh" ? "30 天完整体验" : "30-day full experience"),
      expiresInDays: 30,
      scope: {
        allowPortfolio: true,
        allowBlog: false,
        allowDeploy: true,
        allowResume: false,
        allowAllProjects: true,
        allowedProjectSlugs: [],
      },
      copyAfterCreate: true,
    });
  }

  async function handleCreateProjectDetailShareLink(projectSlug: string) {
    const normalizedSlug = normalizeSlug(projectSlug);
    const project = normalizedSlug
      ? (projects.find((item) => item.slug === normalizedSlug) ?? null)
      : null;
    if (!normalizedSlug || !project) {
      return;
    }

    await createManagedShareLink({
      label: `${getProjectPresentation(project, lang).name} · ${lang === "zh" ? "详情分享" : "detail share"}`,
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
        withSiteParams(
          `https://wordm.us?view=portfolio&project=${encodeURIComponent(normalizedSlug)}`,
          {
            lang,
            shareToken: token,
          },
        ),
      copyAfterCreate: true,
    });
  }

  async function handleCreateProjectSubdomainShareLink(projectSlug: string) {
    const normalizedSlug = normalizeSlug(projectSlug);
    const project = normalizedSlug
      ? (projects.find((item) => item.slug === normalizedSlug) ?? null)
      : null;
    if (!normalizedSlug || !project) {
      return;
    }

    const created = await createManagedShareLink({
      label: `${getProjectPresentation(project, lang).name} · ${lang === "zh" ? "子域分享" : "subdomain share"}`,
      expiresInDays: 3,
      scope: {
        allowPortfolio: false,
        allowBlog: false,
        allowDeploy: false,
        allowResume: false,
        allowAllProjects: false,
        allowedProjectSlugs: [normalizedSlug],
      },
    });

    if (!created) {
      return;
    }

    const shareUrl = withSiteParams(project.subdomainUrl, {
      lang,
      shareToken: created.token,
    });
    setLastCreatedShareUrl(shareUrl);
    const copied = await copyTextToClipboard(shareUrl);
    setShareManageStatusMessage(
      copied ? copy.shareCopySuccess : copy.shareCopyFailed,
    );
  }

  async function handleCopyLastShareLink() {
    if (!lastCreatedShareUrl) {
      setShareManageStatusMessage(copy.shareCopyFailed);
      return;
    }

    const copied = await copyTextToClipboard(lastCreatedShareUrl);
    setShareManageStatusMessage(
      copied ? copy.shareCopySuccess : copy.shareCopyFailed,
    );
  }

  async function handleRevokeShareLink(shareLinkId: string) {
    setShareBusy(true);
    try {
      if (isAdminHost) {
        await revokeAdminShareLink(shareLinkId);
      } else {
        await revokeShareLink(authConfig, shareLinkId);
      }
      const nextLinks = isAdminHost
        ? await listAdminShareLinks()
        : await listOwnShareLinks(authConfig);
      setShareLinks(nextLinks);
      if (lastCreatedShareId === shareLinkId) {
        setLastCreatedShareId(null);
        setLastCreatedShareUrl("");
      }
      setShareManageStatusMessage(copy.shareRevokeSuccess);
    } catch {
      setShareManageStatusMessage(copy.shareRevokeFailed);
    } finally {
      setShareBusy(false);
    }
  }

  async function handlePurgeInactiveShareLinks() {
    setShareBusy(true);
    try {
      const deletedCount = isAdminHost
        ? await purgeAdminShareLinks()
        : await purgeShareLinks(authConfig);
      setShareLinks(
        isAdminHost
          ? await listAdminShareLinks()
          : await listOwnShareLinks(authConfig),
      );
      setShareManageStatusMessage(
        `${copy.shareRevokeSuccess} (${deletedCount})`,
      );
    } catch {
      setShareManageStatusMessage(copy.shareRevokeFailed);
    } finally {
      setShareBusy(false);
    }
  }

  function analyticsContext(extra: Record<string, unknown> = {}) {
    return {
      ...analyticsBaseMetadata,
      ...extra,
    };
  }

  async function handleAnalyticsReload() {
    if (!canManagePricing) {
      setAnalyticsEvents([]);
      setAnalyticsStatusMessage(copy.shareListLoadFailed);
      return;
    }

    setAnalyticsBusy(true);
    setAnalyticsStatusMessage("");

    try {
      const events = await fetchSiteAnalyticsEvents(authConfig, 100);
      setAnalyticsEvents(events);
    } catch (error) {
      const detail = normalizeAuthError(error, "ANALYTICS_LIST_FAILED");
      setAnalyticsStatusMessage(detail);
    } finally {
      setAnalyticsBusy(false);
    }
  }

  async function handleAuthLogin(email: string, password: string) {
    if (!authEnabled) {
      setAuthStatusMessage(copy.authUnavailable);
      return;
    }

    if (!email || !password) {
      setAuthStatusMessage(copy.emailPasswordRequired);
      return;
    }

    setAuthBusy(true);
    setAuthStatusMessage(copy.loggingIn);

    try {
      const user = await loginWithPassword(authConfig, email, password);
      const normalizedUser = toAuthUserSummary(user, authRoleRules);
      setAuthUser(normalizedUser);
      setAuthStatusMessage(
        normalizedUser?.email
          ? withEmail(copy.loginSuccess, normalizedUser.email)
          : withDone(copy.loginSuccess, lang),
      );
      void trackSiteEvent(authConfig, {
        eventType: "login",
        userRole: normalizedUser?.role ?? "user",
        metadata: analyticsContext({ method: "password", outcome: "success" }),
      });
      if (initialAuthReturnTo) {
        window.location.assign(initialAuthReturnTo);
      }
    } catch (loginError) {
      const detail = normalizeAuthError(loginError, copy.loginFallback);
      setAuthStatusMessage(withDetail(copy.loginFailed, detail));
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleAuthSignup(email: string, password: string) {
    if (!authEnabled) {
      setAuthStatusMessage(copy.authUnavailable);
      return;
    }

    if (!email || !password) {
      setAuthStatusMessage(copy.emailPasswordRequired);
      return;
    }

    setAuthBusy(true);
    setAuthStatusMessage(copy.signingUp);

    try {
      const result = await signupWithPassword(authConfig, email, password);

      if (result.outcome === "exists") {
        setAuthStatusMessage(copy.emailExists);
        return;
      }

      if (result.outcome === "confirm") {
        setAuthStatusMessage(copy.confirmEmail);
        void trackSiteEvent(authConfig, {
          eventType: "signup",
          userRole: "guest",
          metadata: analyticsContext({ method: "password", outcome: "confirm" }),
        });
        return;
      }

      const normalizedUser = toAuthUserSummary(result.user, authRoleRules);
      setAuthUser(normalizedUser);
      setAuthStatusMessage(
        normalizedUser?.email
          ? withEmail(copy.signupAndLoginSuccess, normalizedUser.email)
          : withDone(copy.signupSuccess, lang),
      );
      void trackSiteEvent(authConfig, {
        eventType: "signup",
        userRole: normalizedUser?.role ?? "user",
        metadata: analyticsContext({ method: "password", outcome: "session" }),
      });
      if (initialAuthReturnTo) {
        window.location.assign(initialAuthReturnTo);
      }
    } catch (signupError) {
      const detail = normalizeAuthError(signupError, copy.signupFallback);
      setAuthStatusMessage(withDetail(copy.signupFailed, detail));
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleAuthSubmit(email: string, password: string) {
    if (!authEnabled) {
      setAuthStatusMessage(copy.authUnavailable);
      return;
    }

    if (!email || !password) {
      setAuthStatusMessage(copy.emailPasswordRequired);
      return;
    }

    setAuthBusy(true);
    setAuthStatusMessage(copy.loggingIn);

    try {
      const user = await loginWithPassword(authConfig, email, password);
      const normalizedUser = toAuthUserSummary(user, authRoleRules);
      setAuthUser(normalizedUser);
      setAuthStatusMessage(
        normalizedUser?.email
          ? withEmail(copy.loginSuccess, normalizedUser.email)
          : withDone(copy.loginSuccess, lang),
      );
      void trackSiteEvent(authConfig, {
        eventType: "login",
        userRole: normalizedUser?.role ?? "user",
        metadata: analyticsContext({ method: "password", outcome: "success", source: "combined_submit" }),
      });
    } catch (loginError) {
      try {
        const result = await signupWithPassword(authConfig, email, password);

        if (result.outcome === "exists") {
          setAuthStatusMessage(copy.emailExists);
          return;
        }

        if (result.outcome === "confirm") {
          setAuthStatusMessage(copy.confirmEmail);
          void trackSiteEvent(authConfig, {
            eventType: "signup",
            userRole: "guest",
            metadata: analyticsContext({ method: "password", outcome: "confirm", source: "combined_submit" }),
          });
          return;
        }

        const normalizedUser = toAuthUserSummary(result.user, authRoleRules);
        setAuthUser(normalizedUser);
        setAuthStatusMessage(
          normalizedUser?.email
            ? withEmail(copy.signupAndLoginSuccess, normalizedUser.email)
            : withDone(copy.signupSuccess, lang),
        );
        void trackSiteEvent(authConfig, {
          eventType: "signup",
          userRole: normalizedUser?.role ?? "user",
          metadata: analyticsContext({ method: "password", outcome: "session", source: "combined_submit" }),
        });
      } catch {
        const detail = normalizeAuthError(loginError, copy.loginFallback);
        setAuthStatusMessage(withDetail(copy.loginFailed, detail));
      }
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleGoogleLogin(redirectTo?: string | null) {
    if (!authEnabled) {
      setAuthStatusMessage(copy.authUnavailable);
      return;
    }

    markGoogleOAuthPending();
    setAuthBusy(true);
    setAuthStatusMessage(copy.googleLoggingIn);

    try {
      void trackSiteEvent(authConfig, {
        eventType: "login",
        userRole: "guest",
        metadata: analyticsContext({ method: "google", outcome: "started" }),
      });
      const redirected = await loginWithGoogle(authConfig, redirectTo);

      if (!redirected) {
        clearGoogleOAuthPending();
        setAuthBusy(false);
      }
    } catch (error) {
      clearGoogleOAuthPending();
      const detail = normalizeAuthError(error, copy.googleLoginFallback);
      setAuthStatusMessage(withDetail(copy.googleLoginFailed, detail));
      setAuthBusy(false);
    }
  }

  async function handleLogout() {
    if (!authEnabled) {
      setAuthStatusMessage(copy.authUnavailable);
      return;
    }

    setAuthBusy(true);
    setAuthStatusMessage(copy.loggingOut);

    try {
      await trackSiteEvent(authConfig, {
        eventType: "logout",
        userRole: authRole,
        metadata: analyticsContext({ outcome: "success" }),
        flush: true,
      });
      await logout(authConfig);
      setAuthUser(null);
      setAuthStatusMessage(copy.logoutSuccess);
    } catch (error) {
      const detail = normalizeAuthError(error, copy.logoutFallback);
      setAuthStatusMessage(withDetail(copy.logoutFailed, detail));
    } finally {
      setAuthBusy(false);
    }
  }

  const featuredProjects = useMemo(() => {
    const chosen = chooseProjects(projects, selectedSlugs);
    if (chosen.length) {
      return chosen;
    }

    const fallbackSlugs = defaultSelection(projects, FEATURED_PROJECT_SLUGS);
    return chooseProjects(projects, fallbackSlugs);
  }, [projects, selectedSlugs]);

  const visibleProjects = useMemo(() => {
    if (shareToken && shareAccess?.scope.allowAllProjects) {
      return projects;
    }

    const baseProjects = featuredProjects;

    if (!shareToken || !shareAccess) {
      return baseProjects;
    }

    const filtered = baseProjects.filter((project) =>
      canShareAccessProject(project.slug, shareAccess),
    );
    if (filtered.length) {
      return filtered;
    }

    return projects.filter((project) =>
      canShareAccessProject(project.slug, shareAccess),
    );
  }, [featuredProjects, projects, shareAccess, shareToken]);

  const selectedProject = useMemo(() => {
    if (!selectedProjectSlug) {
      return null;
    }

    return (
      projects.find((project) => project.slug === selectedProjectSlug) ?? null
    );
  }, [projects, selectedProjectSlug]);
  const selectedVisibleProjectIndex = useMemo(() => {
    if (!selectedProject) {
      return -1;
    }

    return visibleProjects.findIndex(
      (project) => project.slug === selectedProject.slug,
    );
  }, [selectedProject, visibleProjects]);
  const subdomainProject = useMemo(
    () =>
      resolveSubdomainView(projects, window.location.hostname, forcedSubdomain),
    [projects, forcedSubdomain],
  );
  const subdomainExperienceUrl = useMemo(() => {
    if (!subdomainProject?.productionUrl) {
      return null;
    }

    return withSiteParams(subdomainProject.productionUrl, { lang, shareToken });
  }, [lang, shareToken, subdomainProject]);
  const shouldBlockResumeView =
    forcedPage === "resume" ||
    hostname === "resume.wordm.us" ||
    hostname === "cv.wordm.us";
  const isAdminView = forcedPage === "admin" || hostname === "admin.wordm.us";

  const authRole: AuthRole = authUser?.role ?? "guest";
  const analyticsBaseMetadata = useMemo(
    () => ({
      rootView,
      lang,
      selectedProjectSlug,
      activeBlogArticleId,
      subdomainProjectSlug: subdomainProject?.slug ?? null,
      shareMode: Boolean(shareToken),
    }),
    [
      activeBlogArticleId,
      lang,
      rootView,
      selectedProjectSlug,
      shareToken,
      subdomainProject?.slug,
    ],
  );
  const projectOfferStates = useMemo(() => {
    const next = new Map<string, ProjectOfferState>();
    for (const project of projects) {
      next.set(
        project.slug,
        getProjectOfferState(project, pricingConfig, offerNow),
      );
    }
    return next;
  }, [offerNow, pricingConfig, projects]);
  const canManageShares =
    isAdminHost || authRole === "admin" || authRole === "tester";
  const canManagePricing = authRole === "admin" || authRole === "tester";
  useEffect(() => {
    if (!isAdminView || !canManagePricing) {
      setAnalyticsEvents([]);
      return;
    }

    let active = true;
    setAnalyticsBusy(true);
    setAnalyticsStatusMessage("");

    void fetchSiteAnalyticsEvents(authConfig, 100)
      .then((events) => {
        if (active) {
          setAnalyticsEvents(events);
        }
      })
      .catch((error) => {
        if (active) {
          setAnalyticsStatusMessage(
            normalizeAuthError(error, "ANALYTICS_LIST_FAILED"),
          );
        }
      })
      .finally(() => {
        if (active) {
          setAnalyticsBusy(false);
        }
      });

    return () => {
      active = false;
    };
  }, [authConfig, canManagePricing, isAdminView]);
  const shareEntryUrl =
    shareToken && shareAccess
      ? buildShareEntryUrl(shareToken, lang, shareAccess.scope, projects)
      : null;
  const projectCatalogSlugs = useMemo(
    () => projects.map((project) => project.slug),
    [projects],
  );
  const unlockActionDisabled =
    unlockBusy || checkoutBusyKind !== null || unlockStorageMode === "loading";
  const accountPlanSummary = useMemo(() => {
    if (authRole === "admin" || authRole === "tester") {
      return {
        tier: "privileged" as AccountTier,
        unlockedProjectCount: projects.length,
      };
    }

    const grants = unlockState?.grants ?? [];
    const directPaidProjectSlugs = new Set<string>();
    const directUnlockedProjectSlugs = new Set<string>();
    const allCurrentProjectSlugs = new Set<string>();
    let hasAllAccess = false;
    let hasAllCurrent = false;

    for (const grant of grants) {
      if (grant.kind === "all_access" || grant.kind === "all_current_plus_year") {
        hasAllAccess = true;
      }

      if (grant.kind === "all_current") {
        hasAllCurrent = true;
        for (const slug of grant.catalogSlugs ?? []) {
          allCurrentProjectSlugs.add(slug);
        }
      }

      if ((grant.kind === "single" || grant.kind === "free_pick") && grant.projectSlug) {
        directUnlockedProjectSlugs.add(grant.projectSlug);
        if (grant.kind === "single") {
          directPaidProjectSlugs.add(grant.projectSlug);
        }
      }
    }

    if (hasAllAccess) {
      return {
        tier: "all_access" as AccountTier,
        unlockedProjectCount: projects.length,
      };
    }

    if (hasAllCurrent) {
      return {
        tier: "all_current" as AccountTier,
        unlockedProjectCount:
          allCurrentProjectSlugs.size || projectCatalogSlugs.length,
      };
    }

    if (directPaidProjectSlugs.size) {
      return {
        tier: "single" as AccountTier,
        unlockedProjectCount: directUnlockedProjectSlugs.size,
      };
    }

    return {
      tier: "free" as AccountTier,
      unlockedProjectCount: directUnlockedProjectSlugs.size,
    };
  }, [authRole, projectCatalogSlugs, projects.length, unlockState]);
  const accountSinglePriceLabel =
    lang === "zh"
      ? pricingConfig.singleUnlock.defaultPriceZh
      : pricingConfig.singleUnlock.defaultPriceEn;
  const accountAllAccessPriceLabel =
    lang === "zh"
      ? pricingConfig.allAccess.priceZh
      : pricingConfig.allAccess.priceEn;
  const subdomainProjectPaidAccess = subdomainProject
    ? hasProjectPremiumAccess(subdomainProject.slug, authRole, unlockState) ||
      canShareAccessProject(subdomainProject.slug, shareAccess)
    : false;
  const portfolioShareDeniedStatus = resolveShareDeniedStatus({
    shareToken,
    shareResolveStatus,
    allowedByShare: canShareAccessView("portfolio", shareAccess),
    bypass: Boolean(authUser),
  });
  const blogShareDeniedStatus = resolveShareDeniedStatus({
    shareToken,
    shareResolveStatus,
    allowedByShare: canShareAccessView("blog", shareAccess),
    bypass: Boolean(authUser),
  });
  const subdomainShareDeniedStatus = resolveShareDeniedStatus({
    shareToken,
    shareResolveStatus,
    allowedByShare: subdomainProject
      ? canShareAccessProject(subdomainProject.slug, shareAccess)
      : false,
    bypass: subdomainProject
      ? hasProjectPremiumAccess(subdomainProject.slug, authRole, unlockState)
      : false,
  });
  const projectDetailShareDeniedStatus = resolveShareDeniedStatus({
    shareToken,
    shareResolveStatus,
    allowedByShare: selectedProject
      ? canShareAccessView("portfolio", shareAccess) &&
        canShareAccessProject(selectedProject.slug, shareAccess)
      : false,
    bypass: selectedProject
      ? hasProjectPremiumAccess(selectedProject.slug, authRole, unlockState) ||
        canManageShares
      : false,
  });
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
  };
  const projectModalOpen = rootView === "about" && Boolean(selectedProject);
  const selectedHomeProductKeySet = useMemo(
    () => new Set(selectedHomeProductKeys),
    [selectedHomeProductKeys],
  );
  const selectedHomeProducts = useMemo(
    () =>
      HOME_PROJECTS.filter((project) =>
        selectedHomeProductKeySet.has(project.key),
      ),
    [selectedHomeProductKeySet],
  );

  useEffect(() => {
    if (!authEnabled || authLoading) {
      return;
    }

    const pageKey = [
      window.location.pathname,
      window.location.search,
      rootView,
      lang,
      selectedProjectSlug ?? "",
      activeBlogArticleId ?? "",
      subdomainProject?.slug ?? "",
    ].join("|");
    const now = Date.now();
    const previousPageKey = analyticsPageKeyRef.current;

    if (previousPageKey === pageKey) {
      analyticsPageMetadataRef.current = analyticsBaseMetadata;
      return;
    }

    if (previousPageKey && previousPageKey !== pageKey) {
      const durationMs = now - analyticsPageStartedAtRef.current;
      if (durationMs >= 1000) {
        void trackSiteEvent(authConfig, {
          eventType: "engagement",
          userRole: authRole,
          durationMs,
          metadata: {
            ...analyticsPageMetadataRef.current,
            trigger: "route_change",
          },
          flush: true,
        });
      }
    }

    analyticsPageKeyRef.current = pageKey;
    analyticsPageStartedAtRef.current = now;
    analyticsPageMetadataRef.current = analyticsBaseMetadata;

    void trackSiteEvent(authConfig, {
      eventType: "page_view",
      userRole: authRole,
      metadata: analyticsBaseMetadata,
    });
  }, [
    activeBlogArticleId,
    analyticsBaseMetadata,
    authConfig,
    authEnabled,
    authLoading,
    authRole,
    lang,
    rootView,
    selectedProjectSlug,
    subdomainProject?.slug,
  ]);

  useEffect(() => {
    if (!authEnabled || typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    const flushEngagement = (trigger: string) => {
      const durationMs = Date.now() - analyticsPageStartedAtRef.current;
      if (durationMs < 1000) {
        return;
      }

      analyticsPageStartedAtRef.current = Date.now();
      void trackSiteEvent(authConfig, {
        eventType: "engagement",
        userRole: authRole,
        durationMs,
        metadata: {
          ...analyticsPageMetadataRef.current,
          trigger,
        },
        flush: true,
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushEngagement("visibility_hidden");
      }
    };
    const handlePageHide = () => flushEngagement("page_hide");

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [authConfig, authEnabled, authRole]);

  useEffect(() => {
    if (!authEnabled || typeof document === "undefined") {
      return;
    }

    const handleDocumentClick = (event: MouseEvent) => {
      const source = event.target instanceof Element ? event.target : null;
      const target = source?.closest<HTMLElement>(
        "a, button, [role='button'], [data-analytics]",
      );
      if (!target) {
        return;
      }

      const interactiveFormField = source?.closest(
        "input, textarea, select, [contenteditable='true']",
      );
      if (interactiveFormField && interactiveFormField === source) {
        return;
      }

      const anchor = target.closest("a") as HTMLAnchorElement | null;
      const href = anchor?.href ?? target.getAttribute("data-href") ?? null;
      const label =
        target.getAttribute("data-analytics") ||
        target.getAttribute("aria-label") ||
        target.getAttribute("title") ||
        target.textContent ||
        "";
      const elementTag = target.tagName.toLowerCase();
      const metadata = {
        ...analyticsBaseMetadata,
        targetId: target.id || null,
        targetRole: target.getAttribute("role"),
        targetType: target.getAttribute("type"),
      };

      void trackSiteEvent(authConfig, {
        eventType: "click",
        userRole: authRole,
        elementTag,
        elementLabel: label,
        elementHref: href,
        metadata,
      });

      if (anchor && (anchor.hasAttribute("download") || isDownloadHref(href))) {
        void trackSiteEvent(authConfig, {
          eventType: "download",
          userRole: authRole,
          elementTag,
          elementLabel: label,
          elementHref: href,
          downloadUrl: href,
          downloadName:
            anchor.getAttribute("download") ||
            anchor.textContent ||
            anchor.href.split("/").pop() ||
            null,
          metadata,
          flush: true,
        });
      }
    };

    document.addEventListener("click", handleDocumentClick, true);

    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [analyticsBaseMetadata, authConfig, authEnabled, authRole]);

  useEffect(() => {
    if (typeof document === "undefined" || !projectModalOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [projectModalOpen]);

  useEffect(() => {
    if (typeof window === "undefined" || !projectModalOpen) {
      return;
    }

    function handleProjectModalKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedProjectSlug(null);
        return;
      }

      if (selectedVisibleProjectIndex < 0 || visibleProjects.length < 2) {
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        const nextIndex =
          (selectedVisibleProjectIndex - 1 + visibleProjects.length) %
          visibleProjects.length;
        setSelectedProjectSlug(visibleProjects[nextIndex]?.slug ?? null);
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        const nextIndex =
          (selectedVisibleProjectIndex + 1) % visibleProjects.length;
        setSelectedProjectSlug(visibleProjects[nextIndex]?.slug ?? null);
      }
    }

    window.addEventListener("keydown", handleProjectModalKeydown);
    return () => {
      window.removeEventListener("keydown", handleProjectModalKeydown);
    };
  }, [projectModalOpen, selectedVisibleProjectIndex, visibleProjects]);

  function selectAdjacentVisibleProject(step: number) {
    if (selectedVisibleProjectIndex < 0 || !visibleProjects.length) {
      return;
    }

    const nextIndex =
      (selectedVisibleProjectIndex + step + visibleProjects.length) %
      visibleProjects.length;
    setSelectedProjectSlug(visibleProjects[nextIndex]?.slug ?? null);
  }

  function openAboutPage() {
    setRootView("about");
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function toggleHomeProductSelection(projectKey: string) {
    setHomeDownloadStatusMessage("");
    setSelectedHomeProductKeys((current) =>
      current.includes(projectKey)
        ? current.filter((key) => key !== projectKey)
        : [...current, projectKey],
    );
  }

  function clearHomeProductSelection() {
    setSelectedHomeProductKeys([]);
    setHomeProductSelectionMode(false);
    setHomeDownloadStatusMessage("");
  }

  function handleHomeProductCardClick(
    event: ReactMouseEvent<HTMLElement>,
    projectKey: string,
  ) {
    if (!homeProductSelectionMode) {
      return;
    }

    const target = event.target as HTMLElement;
    if (target.closest("a, iframe")) {
      return;
    }

    event.preventDefault();
    toggleHomeProductSelection(projectKey);
  }

  function handleHomeProductCardKeyDown(
    event: ReactKeyboardEvent<HTMLElement>,
    projectKey: string,
  ) {
    if (!homeProductSelectionMode) {
      return;
    }

    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    toggleHomeProductSelection(projectKey);
  }

  function switchRootView(nextRootView: RootView) {
    setRootView(nextRootView);

    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
  }

  function handleHomeProductsDownload() {
    if (!homeProductSelectionMode) {
      setHomeProductSelectionMode(true);
      setHomeDownloadStatusMessage(copy.homeProjectsDownloadPickHint);
      return;
    }

    if (!selectedHomeProducts.length) {
      setHomeDownloadStatusMessage(copy.homeProjectsDownloadEmpty);
      return;
    }

    const createdAt = new Date();
    const title =
      lang === "zh"
        ? "wordm.us 已选产品入口"
        : "wordm.us selected product entries";
    const generatedLabel = lang === "zh" ? "生成时间" : "Generated";
    const entries = selectedHomeProducts.map((project, index) => {
      const projectHref = withSiteParams(project.href, { lang });
      return `${index + 1}. ${project.name}\n${projectHref}`;
    });
    const body = [
      title,
      `${generatedLabel}: ${createdAt.toLocaleString(
        lang === "zh" ? "zh-CN" : "en-US",
      )}`,
      "",
      ...entries,
      "",
    ].join("\n");
    const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = downloadUrl;
    link.download = `wordm-selected-products-${createdAt
      .toISOString()
      .slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 0);
    setHomeDownloadStatusMessage(copy.homeProjectsDownloadStatus);
  }

  function scrollToBlogArticle(
    articleId: string,
    behavior: ScrollBehavior = "smooth",
  ) {
    const articleIndex = blogArticles.findIndex(
      (article) => article.id === articleId,
    );
    if (articleIndex < 0) {
      return;
    }

    setActiveBlogArticleId(articleId);
    if (articleIndex >= visibleBlogCount) {
      setVisibleBlogCount(
        Math.min(blogArticles.length, articleIndex + BLOG_RENDER_BATCH_SIZE),
      );
    }

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const target = document.getElementById(`blog-article-${articleId}`);
        if (target) {
          target.scrollIntoView({ behavior, block: "start" });
        }
      });
    });
  }

  function getProjectNameBySlug(slug: string) {
    return projects.find((project) => project.slug === slug)?.name || slug;
  }

  function getOfferStateBySlug(slug: string): ProjectOfferState {
    return (
      projectOfferStates.get(slug) ??
      getProjectOfferState({ slug }, pricingConfig, offerNow)
    );
  }

  function getUnlockOptionsBySlug(slug: string) {
    return getProjectUnlockOptions(slug, pricingConfig, lang);
  }

  function isProjectUnlocked(slug: string) {
    return (
      hasProjectPremiumAccess(slug, authRole, unlockState) ||
      canShareAccessProject(slug, shareAccess)
    );
  }

  function ensureCanUnlock() {
    if (unlockStorageMode === "loading") {
      setUnlockStatusMessage(copy.unlockStorageLoading);
      return false;
    }

    if (unlockBusy) {
      return false;
    }

    if (authRole === "admin" || authRole === "tester") {
      setUnlockStatusMessage(copy.unlockBypassNotice);
      return false;
    }

    if (authRole === "guest" || !authUser) {
      setUnlockStatusMessage(copy.unlockNeedLogin);
      return false;
    }

    return true;
  }

  async function applyUnlockGrant(
    kind: "single" | "all_access",
    projectSlug?: string,
  ): Promise<UserUnlockState> {
    if (unlockStorageMode === "remote") {
      try {
        return await applyUnlockGrantFromSupabase(authConfig, {
          kind,
          projectSlug: projectSlug ?? null,
          catalogSlugs: kind === "all_access" ? projectCatalogSlugs : null,
        });
      } catch (error) {
        if (isBusinessUnlockError(error)) {
          throw error;
        }

        setUnlockStorageMode("local");
        setUnlockStatusMessage(copy.unlockRemoteFallback);
        throw new Error("PAYMENT_BACKEND_REQUIRED");
      }
    }

    throw new Error("PAYMENT_BACKEND_REQUIRED");
  }

  async function handleUnlockSingle(projectSlug: string) {
    const normalizedSlug = normalizeSlug(projectSlug);
    if (!normalizedSlug) {
      return;
    }

    const unlockOptions = getUnlockOptionsBySlug(normalizedSlug);
    if (!unlockOptions.singleEnabled) {
      setUnlockStatusMessage(copy.unlockPlanUnavailable);
      return;
    }

    setUnlockTargetSlug(normalizedSlug);
    if (!ensureCanUnlock()) {
      return;
    }

    setUnlockBusy(true);
    try {
      const nextState = await applyUnlockGrant("single", normalizedSlug);
      setUnlockState(nextState);
      setUnlockStatusMessage(
        `${copy.unlockSingleSuccessPrefix}: ${getProjectNameBySlug(normalizedSlug)}`,
      );
    } catch (error) {
      if (isPaymentRequiredError(error)) {
        await startUnlockCheckout("single", normalizedSlug);
        return;
      }

      if (isLifetimeRequiredError(error)) {
        await startUnlockCheckout("all_access", normalizedSlug);
        return;
      }

      if (unlockErrorCode(error).includes("PAYMENT_BACKEND_REQUIRED")) {
        setUnlockStatusMessage(copy.unlockPaidServerRequired);
        return;
      }

      setUnlockStatusMessage(copy.unlockActionFailed);
    } finally {
      setUnlockBusy(false);
    }
  }

  async function handleUnlockAllAccess() {
    if (!pricingConfig.allAccess.enabled) {
      setUnlockStatusMessage(copy.unlockPlanUnavailable);
      return;
    }

    if (!ensureCanUnlock()) {
      return;
    }

    setUnlockBusy(true);
    try {
      const nextState = await applyUnlockGrant("all_access");
      setUnlockState(nextState);
      setUnlockStatusMessage(copy.unlockAllAccessSuccess);
    } catch (error) {
      if (isLifetimeRequiredError(error)) {
        await startUnlockCheckout("all_access");
        return;
      }

      if (isPaymentRequiredError(error)) {
        await startUnlockCheckout("all_access");
        return;
      }

      if (unlockErrorCode(error).includes("PAYMENT_BACKEND_REQUIRED")) {
        setUnlockStatusMessage(copy.unlockPaidServerRequired);
        return;
      }

      setUnlockStatusMessage(copy.unlockActionFailed);
    } finally {
      setUnlockBusy(false);
    }
  }

  useEffect(() => {
    if (rootView !== "portfolio" || !unlockTargetSlug) {
      return;
    }

    const target = document.getElementById(`project-${unlockTargetSlug}`);
    if (!target) {
      return;
    }

    target.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [rootView, unlockTargetSlug]);

  useEffect(() => {
    if (!subdomainExperienceUrl) {
      return;
    }

    window.location.replace(subdomainExperienceUrl);
  }, [subdomainExperienceUrl]);

  useEffect(() => {
    if (!shouldBlockResumeView) {
      return;
    }

    window.location.replace(withSiteParams("https://wordm.us", { lang }));
  }, [lang, shouldBlockResumeView]);

  if (subdomainExperienceUrl) {
    return null;
  }

  if (shouldBlockResumeView) {
    return null;
  }

  if (isOneAgentProductPage) {
    return <OneAgentProductPage lang={lang} />;
  }

  if (subdomainProject) {
    if (subdomainShareDeniedStatus) {
      return (
        <ShareAccessDenied
          lang={lang}
          status={subdomainShareDeniedStatus}
          authPanel={authPanelProps}
          fallbackSharedUrl={shareEntryUrl}
        />
      );
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
    );
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
        analyticsBusy={analyticsBusy}
        analyticsStatusMessage={analyticsStatusMessage}
        analyticsEvents={analyticsEvents}
        onToggleProject={(slug) => {
          setSelectedSlugs((prev) => {
            if (prev.includes(slug)) {
              return prev.filter((item) => item !== slug);
            }

            return [...prev, slug];
          });
        }}
        onSelectFeatured={() =>
          setSelectedSlugs(defaultSelection(projects, FEATURED_PROJECT_SLUGS))
        }
        onSelectAll={() =>
          setSelectedSlugs(projects.map((project) => project.slug))
        }
        onShareLabelChange={setShareLabel}
        onShareExpiresInDaysChange={setShareExpiresInDays}
        onToggleShareFlag={(key) => {
          setShareScope((prev) => ({
            ...prev,
            [key]: !prev[key],
          }));
        }}
        onCreateShareLink={() => void handleCreateShareLink()}
        onCreateFullExperienceShareLink={() =>
          void handleCreateFullExperienceShareLink()
        }
        onCreateSevenDayShareLink={() => void handleCreateSevenDayShareLink()}
        onCreateThirtyDayShareLink={() => void handleCreateThirtyDayShareLink()}
        onCreateProjectDetailShareLink={(slug) =>
          void handleCreateProjectDetailShareLink(slug)
        }
        onCreateProjectSubdomainShareLink={(slug) =>
          void handleCreateProjectSubdomainShareLink(slug)
        }
        onCopyLastShareLink={() => void handleCopyLastShareLink()}
        onPurgeInactiveShareLinks={() => void handlePurgeInactiveShareLinks()}
        onRevokeShareLink={(shareLinkId) =>
          void handleRevokeShareLink(shareLinkId)
        }
        onPricingConfigChange={setAdminPricingConfig}
        onPricingReload={() => void reloadPricingConfig(true)}
        onPricingSave={() => void handleSavePricingConfig()}
        onAnalyticsReload={() => void handleAnalyticsReload()}
      />
    );
  }

  if (rootView === "login") {
    return (
      <LoginPage
        lang={lang}
        enabled={authEnabled}
        loading={authLoading}
        busy={authBusy}
        userEmail={authUser?.email ?? null}
        userRole={authRole}
        statusMessage={authStatusMessage}
        homeHref={initialAuthReturnTo ?? homeHref}
        accountTier={accountPlanSummary.tier}
        unlockedProjectCount={accountPlanSummary.unlockedProjectCount}
        singleUpgradeHref={relativeRootHref("portfolio", lang)}
        singleUpgradeEnabled={pricingConfig.singleUnlock.enabled}
        singleUpgradePriceLabel={accountSinglePriceLabel}
        allAccessEnabled={pricingConfig.allAccess.enabled}
        allAccessPriceLabel={accountAllAccessPriceLabel}
        upgradeBusy={unlockActionDisabled}
        upgradeStatusMessage={unlockStatusMessage}
        onLangChange={setLang}
        onLogin={handleAuthLogin}
        onSignup={handleAuthSignup}
        onGoogleLogin={() => handleGoogleLogin(initialAuthReturnTo ?? accountHref)}
        onLogout={handleLogout}
        onUpgradeAllAccess={() => void handleUnlockAllAccess()}
      />
    );
  }

  if (
    rootView === "home" ||
    rootView === "pricing" ||
    rootView === "partners" ||
    rootView === "updates" ||
    rootView === "fields" ||
    rootView === "docs"
  ) {
    return (
      <FountHomePage
        lang={lang}
        page={
          rootView === "pricing"
            ? "pricing"
            : rootView === "partners"
              ? "partners"
              : rootView === "updates"
                ? "updates"
                : rootView === "fields"
                  ? "fields"
                  : rootView === "docs"
                    ? "docs"
                    : "home"
        }
        onTabChange={switchRootView}
        onLangChange={setLang}
        themeMode={themeMode}
        onThemeToggle={() =>
          setThemeMode((current) => (current === "night" ? "day" : "night"))
        }
      />
    );
  }

  if (rootView === "blog" && blogShareDeniedStatus) {
    return (
      <ShareAccessDenied
        lang={lang}
        status={blogShareDeniedStatus}
        authPanel={authPanelProps}
        fallbackSharedUrl={shareEntryUrl}
      />
    );
  }

  if (
    (rootView === "portfolio" || rootView === "about") &&
    portfolioShareDeniedStatus
  ) {
    return (
      <ShareAccessDenied
        lang={lang}
        status={portfolioShareDeniedStatus}
        authPanel={authPanelProps}
        fallbackSharedUrl={shareEntryUrl}
      />
    );
  }

  return (
    <div
      className={`page-container${rootView === "blog" ? " fount-blog-container fount-page-focused" : ""}`}
      data-page={rootView === "blog" ? "blog" : undefined}
    >
      <main
        className={`main-content portfolio-main-content${rootView === "blog" ? " blog-main" : ""}${rootView === "about" ? " about-main" : ""}`}
      >
        {rootView === "blog" ? (
          <header className="fount-header fount-blog-topbar">
            <a className="fount-logo" href={relativeRootHref("home", lang)} aria-label="Fount home">
              <span className="fount-logo-mark" aria-hidden="true">
                <img src="/fount/fount-logo-source.png" alt="" />
              </span>
              Fount
            </a>

            <nav
              className="fount-nav fount-outline-nav fount-pricing-back-nav"
              aria-label={lang === "zh" ? "Fount 博客" : "Fount Blog"}
            >
              <a href={relativeRootHref("home", lang)}>
                {lang === "zh" ? "首页" : "Home"}
              </a>
            </nav>

            <div className="fount-header-actions">
              <FountPrimaryNav
                activePage="blog"
                hrefs={{
                  home: relativeRootHref("home", lang),
                  fields: relativeRootHref("fields", lang),
                  docs: relativeRootHref("docs", lang),
                  updates: relativeRootHref("updates", lang),
                  blog: relativeRootHref("blog", lang),
                  pricing: relativeRootHref("pricing", lang),
                }}
                lang={lang}
              />
              <div className="fount-header-utils">
                <div className="fount-lang-switch" aria-label="Language switcher">
                  <button
                    type="button"
                    className={lang === "zh" ? "active" : ""}
                    onClick={() => setLang("zh")}
                  >
                    中文
                  </button>
                  <button
                    type="button"
                    className={lang === "en" ? "active" : ""}
                    onClick={() => setLang("en")}
                  >
                    EN
                  </button>
                </div>
                <button
                  type="button"
                  className="fount-theme-toggle"
                  aria-label={
                    themeMode === "night"
                      ? copy.themeToDayAria
                      : copy.themeToNightAria
                  }
                  aria-pressed={themeMode === "night"}
                  onClick={() =>
                    setThemeMode((current) =>
                      current === "night" ? "day" : "night",
                    )
                  }
                >
                  <ThemeModeIcon mode={themeMode} />
                </button>
                <a className="fount-download-small" href="/Fount.dmg">
                  <span>{lang === "zh" ? "下载 Mac app" : "Download Mac app"}</span>
                </a>
              </div>
              <a className="fount-account-link" href={accountHref}>
                {lang === "zh" ? "账号" : "Account"}
              </a>
            </div>
          </header>
        ) : (
        <div className="site-topbar">
          <div className="site-topbar-primary">
            <a
              className="site-brand"
              href={relativeRootHref("home", lang)}
              aria-label="wordm.us"
            >
              <span className="site-brand-mark">F</span>
              <span>wordm.us</span>
            </a>
          </div>

          <nav
            className="collection-switch-tabs site-topbar-tabs"
            aria-label={lang === "zh" ? "内容切换" : "Content switch"}
          >
            <button
              type="button"
              className="collection-switch-tab"
              onClick={() => switchRootView("home")}
            >
              {copy.tocHome}
            </button>
            <button
              type="button"
              className={`collection-switch-tab${rootView === "portfolio" ? " active" : ""}`}
              onClick={() => switchRootView("portfolio")}
            >
              {copy.tocProjects}
            </button>
            <button
              type="button"
              className="collection-switch-tab"
              onClick={() => switchRootView("blog")}
            >
              {copy.tocBlog}
            </button>
          </nav>

          <div className="site-topbar-secondary">
            <div
              className="site-topbar-lang"
              role="group"
              aria-label={lang === "zh" ? "语言" : "Language"}
              onWheel={(event) => {
                event.currentTarget.scrollLeft += event.deltaY;
              }}
            >
              <button
                type="button"
                className={lang === "zh" ? "active" : ""}
                aria-pressed={lang === "zh"}
                onClick={() => setLang("zh")}
              >
                中文
              </button>
              <button
                type="button"
                className={lang === "en" ? "active" : ""}
                aria-pressed={lang === "en"}
                onClick={() => setLang("en")}
              >
                EN
              </button>
            </div>

            <button
              type="button"
              className="site-theme-toggle"
              aria-label={
                themeMode === "night"
                  ? copy.themeToDayAria
                  : copy.themeToNightAria
              }
              aria-pressed={themeMode === "night"}
              onClick={() =>
                setThemeMode((current) =>
                  current === "night" ? "day" : "night",
                )
              }
            >
              <ThemeModeIcon mode={themeMode} />
            </button>

            <SocialLinks
              ariaLabel={copy.socialLinksAria}
              className="collection-corner-links site-topbar-links"
              linkClassName="topbar-social-link"
            />

            <div className="site-topbar-account">
              <AccountEntryCard
                {...authPanelProps}
                loginHref={loginHref}
                className="topbar-account-entry"
                variant="topbar"
              />
            </div>
          </div>
        </div>
        )}

        <section id="collection" className="main-collection-shell">
          {rootView === "blog" ? (
            <p className="visual-intro collection-switch-intro">
              {copy.blogIntro}
            </p>
          ) : null}

          {rootView === "blog" ? (
            <>
              <div className="blog-page">
                <aside className="blog-sidebar">
                  <ul className="nav-list">
                    {renderedBlogArticles.map((article) => (
                      <li key={article.id} className="nav-item">
                        <button
                          type="button"
                          className={`nav-link sidebar-nav-button${activeBlogArticle?.id === article.id ? " active" : ""}`}
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
                  {renderedBlogArticles.map((article) => (
                    <article
                      key={article.id}
                      id={`blog-article-${article.id}`}
                      data-article-id={article.id}
                      className={`blog-article${activeBlogArticle?.id === article.id ? " blog-article-active" : ""}`}
                    >
                      <div className="paper-meta">
                        <span>{article.date}</span>
                        <span>{article.category[lang]}</span>
                      </div>
                      <h3 className="blog-article-title">
                        {article.title[lang]}
                      </h3>
                      {article.summary[lang].trim() ? (
                        <p className="blog-article-summary">
                          {article.summary[lang]}
                        </p>
                      ) : null}
                      {article.note[lang].trim() ? (
                        <p className="blog-article-note">
                          {article.note[lang]}
                        </p>
                      ) : null}
                      {article.blocks?.length
                        ? article.blocks.map((block, index) =>
                            renderBlogContentBlock(
                              article.id,
                              block,
                              index,
                              lang,
                            ),
                          )
                        : article.paragraphs.map((paragraph, index) => (
                            <p key={`${article.id}-${index}`}>
                              {paragraph[lang]}
                            </p>
                          ))}
                    </article>
                  ))}
                  {hasMoreBlogArticles ? (
                    <div ref={blogLoadMoreRef} className="blog-load-sentinel">
                      <button
                        type="button"
                        className="blog-load-more"
                        onClick={() => {
                          setVisibleBlogCount((current) =>
                            Math.min(
                              blogArticles.length,
                              current + BLOG_RENDER_BATCH_SIZE,
                            ),
                          );
                        }}
                      >
                        {copy.blogLoadMore}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </>
          ) : null}

          {rootView === "portfolio" ? (
            <section
              className="home-projects-hero"
              aria-labelledby="home-projects-title"
            >
              <a
                className="system-cover-portal"
                href={withSiteParams(SYSTEM_SITE_URL, { lang })}
                target="_blank"
                rel="noreferrer"
                aria-label={copy.systemCoverCta}
              >
                <span className="system-cover-bg" aria-hidden="true" />
                <span
                  className="system-cover-current system-cover-current-a"
                  aria-hidden="true"
                />
                <span
                  className="system-cover-current system-cover-current-b"
                  aria-hidden="true"
                />
                <span className="system-cover-gate" aria-hidden="true" />
                <span className="system-cover-grid" aria-hidden="true" />
                <span className="system-cover-orbit" aria-hidden="true" />
                <span className="system-cover-copy">
                  <span className="system-cover-domain">
                    {copy.systemCoverDomain}
                  </span>
                  <h1 id="home-projects-title" className="system-cover-title">
                    {copy.systemCoverTitle}
                  </h1>
                  <span className="system-cover-subtitle">
                    {copy.systemCoverSubtitle}
                  </span>
                  <span className="system-cover-cta">
                    {copy.systemCoverCta}
                    <span aria-hidden="true">→</span>
                  </span>
                </span>
              </a>

              <div className="home-projects-grid">
                {HOME_PROJECTS.map((project, index) => {
                  const selected = selectedHomeProductKeySet.has(project.key);
                  const projectHref = withSiteParams(project.href, { lang });
                  const opensInNewTab = project.href === SYSTEM_SITE_URL;

                  return (
                    <article
                      key={project.key}
                      className={`home-project-card home-project-card-${project.key}${homeProductSelectionMode ? " is-selectable" : ""}${selected ? " selected" : ""}`}
                      role={homeProductSelectionMode ? "button" : undefined}
                      tabIndex={homeProductSelectionMode ? 0 : undefined}
                      aria-pressed={homeProductSelectionMode ? selected : undefined}
                      aria-label={
                        homeProductSelectionMode
                          ? `${copy.homeProjectsSelectAria}: ${project.name}`
                          : undefined
                      }
                      onClick={(event) =>
                        handleHomeProductCardClick(event, project.key)
                      }
                      onKeyDown={(event) =>
                        handleHomeProductCardKeyDown(event, project.key)
                      }
                    >
                      <div
                        className="home-project-cover"
                        role="group"
                        aria-label={`${copy.homeProjectsPreview}: ${project.name}`}
                      >
                        <img
                          src={project.coverUrl}
                          alt={project.coverAlt[lang]}
                          loading={index === 0 ? "eager" : "lazy"}
                          decoding="async"
                        />
                        <div className="home-project-preview" aria-hidden="true">
                          <span className="home-project-preview-chrome">
                            <span className="home-project-preview-dots">
                              <span />
                              <span />
                              <span />
                            </span>
                            <span className="home-project-preview-url">
                              {project.previewUrl}
                            </span>
                          </span>
                          <iframe
                            className="home-project-preview-frame"
                            title={`${project.name} ${copy.homeProjectsPreview}`}
                            src={projectHref}
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                          />
                        </div>
                      </div>
                      <div className="home-project-card-body">
                        <h2>{project.name}</h2>
                        <p>{project.summary[lang]}</p>
                        <div className="home-project-actions">
                          <a
                            className="home-project-cta"
                            href={projectHref}
                            target={opensInNewTab ? "_blank" : undefined}
                            rel={opensInNewTab ? "noreferrer" : undefined}
                          >
                            {copy.homeProjectsCta}
                            <span aria-hidden="true">→</span>
                          </a>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
              <div
                className={`home-download-bar${homeProductSelectionMode ? " is-selecting" : " is-idle"}${selectedHomeProducts.length ? " has-selection" : ""}`}
                role="status"
                aria-live="polite"
              >
                {homeProductSelectionMode ||
                selectedHomeProducts.length ||
                homeDownloadStatusMessage ? (
                  <div className="home-download-bar-copy">
                    <strong>
                      {copy.homeProjectsDownloadCount} ·{" "}
                      {selectedHomeProducts.length}
                    </strong>
                    {homeDownloadStatusMessage ? (
                      <span>{homeDownloadStatusMessage}</span>
                    ) : null}
                  </div>
                ) : null}
                <div className="home-download-actions">
                  {homeProductSelectionMode || selectedHomeProducts.length ? (
                    <button type="button" onClick={clearHomeProductSelection}>
                      {copy.homeProjectsDownloadClear}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="home-download-primary"
                    onClick={handleHomeProductsDownload}
                  >
                    {homeProductSelectionMode
                      ? copy.homeProjectsDownloadSelected
                      : copy.homeProjectsDownloadButton}
                  </button>
                </div>
              </div>
            </section>
          ) : null}

          {rootView === "about" ? (
            <section id="about" className="about-archive-section about-page">
              <div className="about-archive-copy">
                <p className="paper-meta">{copy.aboutTitle}</p>
                <h2>{copy.aboutTitle}</h2>
                <p>{copy.aboutIntro}</p>
              </div>

              <div className="about-project-archive">
                <h2>{copy.aboutArchiveTitle}</h2>
                <Suspense
                  fallback={
                    <div
                      className="portfolio-showcase-loading"
                      aria-hidden="true"
                    />
                  }
                >
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
              </div>
              {selectedProject ? (
                projectDetailShareDeniedStatus ? (
                  <div
                    className="project-detail-modal"
                    role="dialog"
                    aria-modal="true"
                    aria-label={
                      lang === "zh" ? "项目访问受限" : "Project access denied"
                    }
                    onClick={() => setSelectedProjectSlug(null)}
                  >
                    <div
                      className="project-detail-modal-shell"
                      onClick={(event) => event.stopPropagation()}
                    >
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
                ) : (
                  <ProjectDetailModal
                    lang={lang}
                    project={selectedProject}
                    lastUpdated={lastUpdated}
                    unlocked={isProjectUnlocked(selectedProject.slug)}
                    offerState={getOfferStateBySlug(selectedProject.slug)}
                    shareToken={shareToken}
                    indexLabel={
                      selectedVisibleProjectIndex >= 0
                        ? `${String(selectedVisibleProjectIndex + 1).padStart(2, "0")}/${String(visibleProjects.length).padStart(2, "0")}`
                        : null
                    }
                    hasPrevious={
                      selectedVisibleProjectIndex >= 0 &&
                      visibleProjects.length > 1
                    }
                    hasNext={
                      selectedVisibleProjectIndex >= 0 &&
                      visibleProjects.length > 1
                    }
                    onClose={() => setSelectedProjectSlug(null)}
                    onPrevious={() => selectAdjacentVisibleProject(-1)}
                    onNext={() => selectAdjacentVisibleProject(1)}
                  />
                )
              ) : null}
            </section>
          ) : null}
        </section>

        <footer id="contact">
          <div className="footer-row">
            <div className="footer-contact-inline">
              {copy.contactTitle}: 简永杰 / Jian Yongjie · {copy.profileLine1} ·{" "}
              <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
            </div>
            {rootView !== "about" ? (
              <a
                href={relativeRootHref("about", lang)}
                className="footer-about-link"
                onClick={(event) => {
                  event.preventDefault();
                  openAboutPage();
                }}
              >
                {copy.aboutEntryText}
              </a>
            ) : (
              <span className="footer-about-placeholder" aria-hidden="true" />
            )}
            <div className="footer-copyright">{copy.copyright}</div>
            <div className="footer-mode">{copy.portfolioMode}</div>
          </div>
        </footer>
      </main>
      {showScrollTop ? (
        <button
          type="button"
          className="scroll-top-btn"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          TOP
        </button>
      ) : null}
      {rootView === "blog" ? (
        <div
          className="blog-reading-dock"
          aria-label={lang === "zh" ? "博客阅读快捷操作" : "Blog reading shortcuts"}
        >
          {nextBlogArticle ? (
            <div className="blog-next-fixed-wrap">
              <button
                type="button"
                className="blog-next-fixed-btn"
                onClick={() => scrollToBlogArticle(nextBlogArticle.id)}
              >
                <span className="blog-next-fixed-label">
                  {copy.blogNextLabel}
                </span>
                <span className="blog-next-fixed-text">
                  {nextBlogArticle.title[lang]}
                </span>
              </button>
            </div>
          ) : (
            <div className="blog-next-fixed-wrap">
              <button type="button" className="blog-next-fixed-btn" disabled>
                <span className="blog-next-fixed-label">
                  {copy.blogNextLabel}
                </span>
                <span className="blog-next-fixed-text">
                  {copy.blogEndOfList}
                </span>
              </button>
            </div>
          )}
          <SiteAiChat
            lang={lang}
            projects={projects}
            lastUpdated={lastUpdated}
          />
        </div>
      ) : (
        <SiteAiChat
          lang={lang}
          projects={projects}
          lastUpdated={lastUpdated}
        />
      )}
    </div>
  );
}

export default App;
