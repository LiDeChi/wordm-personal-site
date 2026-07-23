import { useEffect, useState } from "react";
import type {
  CSSProperties,
  MouseEvent as ReactMouseEvent,
  ReactNode,
} from "react";
import { BLOG_ARTICLES } from "../data/blogArticles";
import { FOUNT_FIELDS } from "../data/fountFields";
import type { Lang } from "../i18n/lang";
import { withSiteParams } from "../lib/lang-url";
import { FountDocsSection } from "./FountDocsSection";
import { SocialLinks } from "./SocialLinks";
import { ThemeModeIcon } from "./ThemeModeIcon";

type FountPage =
  | "home"
  | "pricing"
  | "partners"
  | "updates"
  | "blog"
  | "fields"
  | "docs";

type FountHomePageProps = {
  lang: Lang;
  page?: FountPage;
  onTabChange?: (tab: FountPrimaryTab) => void;
  onLangChange: (lang: Lang) => void;
  themeMode: "day" | "night";
  onThemeToggle: () => void;
};

type FountPrimaryTab = "home" | "fields" | "docs";

type FountPrimaryNavProps = {
  activePage: FountPage;
  hrefs: Record<"home" | "fields" | "docs" | "updates" | "blog" | "pricing", string>;
  lang: Lang;
  onTabChange?: (tab: FountPrimaryTab) => void;
};

function handleFountTabClick(
  event: ReactMouseEvent<HTMLAnchorElement>,
  tab: FountPrimaryTab,
  onTabChange?: (tab: FountPrimaryTab) => void,
) {
  if (
    !onTabChange ||
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return;
  }

  event.preventDefault();
  onTabChange(tab);
}

function resetFieldPageScroll() {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

type LocalizedText = Record<Lang, string>;

type ConceptItem = {
  name: string;
  title: LocalizedText;
  body: LocalizedText;
  meta?: LocalizedText;
};

type HomeCardTone = "mint" | "blue" | "lilac" | "amber" | "coral" | "ink";

type HomeChapterId = "what" | "ecosystem" | "product" | "vision";

type HomeChapterItem = {
  label: string;
  body: LocalizedText;
  note?: LocalizedText;
  kind?: "line" | "formula";
};

type HomeChapter = {
  id: HomeChapterId;
  title: LocalizedText;
  cardBody: LocalizedText;
  tone: HomeCardTone;
  items: HomeChapterItem[];
};

type ListBlock = {
  title: LocalizedText;
  body: LocalizedText;
  items: LocalizedText[];
};

type StepItem = {
  label: string;
  title: LocalizedText;
  body: LocalizedText;
};

type LayerItem = {
  label: string;
  title: LocalizedText;
  body: LocalizedText;
  items: LocalizedText[];
};

type PermissionItem = {
  name: string;
  title: LocalizedText;
  body: LocalizedText;
  level: string;
};

type PricingPlan = {
  id: "player" | "builder" | "master";
  name: string;
  badge: string;
  sticker?: string;
  description: string;
  price: string;
  earlyBirdLifetimePrice?: string;
  earlyBirdLifetimeHref?: string;
  earlyBirdNextPrice?: string;
  futureAnchor?: string;
  cta: string;
  href: string;
  features: string[];
  note: string;
  featured?: boolean;
};

type ComparisonRow = {
  feature: string;
  player: string;
  builder: string;
  master: string;
};

type PricingFaqItem = {
  question: string;
  answer: string;
};

type EarlyBirdStatus = {
  claimed: number;
  limit: number;
  active: boolean;
};

type PartnerStep = {
  label: string;
  title: string;
  body: string;
};

type PartnerCard = {
  title: string;
  body: string;
};

type CommissionTier = {
  title: string;
  body: string;
  lifetime: string;
  bestFor: string;
};

type EarningsExample = {
  title: string;
  price: string;
  publicAffiliate: string;
  publicEstimate: string;
  invitedPartner: string;
  invitedEstimate: string;
};

type PartnerBenefit = {
  title: string;
  body: string;
};

type PartnerFaqItem = {
  question: string;
  answer: string[];
};

type FaqItem = {
  question: LocalizedText;
  answer: LocalizedText;
};

type OutlineId = "vision" | "ecosystem" | "product";

type FountReleaseManifest = {
  version: string;
  build: string;
  releasedAt: string;
  releaseNotes?: {
    summary?: string;
    websiteMarkdownUrl?: string;
  };
  downloads?: {
    websiteUrl?: string;
    versionedWebsiteUrl?: string;
    githubUrl?: string;
    sha256?: string;
    sizeBytes?: number;
  };
};

type FountReleaseEntry = {
  version: string;
  build: string;
  releasedAt: string;
  notes?: {
    summary?: string;
    websiteMarkdownUrl?: string;
  };
  downloads?: {
    sha256?: string;
    sizeBytes?: number;
  };
};

function resolvePublicHref(primaryEnvName: string, fallback: string) {
  const env = import.meta.env as Record<string, string | undefined>;
  const value = env[primaryEnvName]?.trim();
  if (value) {
    return value;
  }

  if (primaryEnvName.startsWith("NEXT_PUBLIC_")) {
    const viteValue = env[`VITE_${primaryEnvName.slice("NEXT_PUBLIC_".length)}`]?.trim();
    if (viteValue) {
      return viteValue;
    }
  }

  return fallback;
}

function resolvePublicNumber(primaryEnvName: string, fallback: number) {
  const env = import.meta.env as Record<string, string | undefined>;
  const raw =
    env[primaryEnvName] ??
    (primaryEnvName.startsWith("NEXT_PUBLIC_")
      ? env[`VITE_${primaryEnvName.slice("NEXT_PUBLIC_".length)}`]
      : undefined);
  const value = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(value) ? value : fallback;
}

const FOUNT_EARLY_BIRD_LIMIT = Math.max(
  1,
  resolvePublicNumber("NEXT_PUBLIC_FOUNT_EARLY_BIRD_LIMIT", 20),
);
const FOUNT_EARLY_BIRD_CLAIMED = Math.min(
  FOUNT_EARLY_BIRD_LIMIT,
  Math.max(0, resolvePublicNumber("NEXT_PUBLIC_FOUNT_EARLY_BIRD_CLAIMED", 0)),
);
const FOUNT_EARLY_BIRD_INITIAL_STATUS: EarlyBirdStatus = {
  claimed: FOUNT_EARLY_BIRD_CLAIMED,
  limit: FOUNT_EARLY_BIRD_LIMIT,
  active: FOUNT_EARLY_BIRD_CLAIMED < FOUNT_EARLY_BIRD_LIMIT,
};

const OUTLINE_ITEMS: Array<{ id: OutlineId; label: LocalizedText }> = [
  { id: "vision", label: { zh: "愿景", en: "Vision" } },
  { id: "ecosystem", label: { zh: "生态", en: "Ecosystem" } },
  { id: "product", label: { zh: "产品", en: "Product" } },
];

const DOCS_OUTLINE_ITEMS: Array<{ id: string; label: LocalizedText }> = [
  { id: "docs-start", label: { zh: "开始", en: "Start" } },
  { id: "docs-system", label: { zh: "系统", en: "System" } },
  { id: "docs-worlds", label: { zh: "后验", en: "Posterior" } },
  { id: "docs-field", label: { zh: "Field", en: "Field" } },
];

const COPY = {
  zh: {
    documentTitle: "Fount | 开放的个人 Agent 大脑",
    pricingDocumentTitle: "Fount Pricing | Player / Builder / Master",
    partnersDocumentTitle: "Fount Partner Program",
    updatesDocumentTitle: "Fount 更新记录 | Release History",
    blogDocumentTitle: "Fount 博客 | Notes",
    fieldsDocumentTitle: "我的 Fields | Fount",
    docsDocumentTitle: "Fount 文档 | 系统、Field 与 SDK",
    navHome: "首页",
    navConcepts: "概念",
    navArchitecture: "架构",
    navPermissions: "权限",
    navFlow: "循环",
    navOpen: "开放",
    navRoadmap: "路线",
    navBlog: "博客",
    navDocs: "文档",
    navFields: "Fields",
    navUpdates: "更新",
    navPricing: "定价",
    navAccount: "账号",
    socialLinksAria: "Fount 社交渠道",
    themeNight: "夜",
    themeDay: "日",
    themeToNightAria: "切换到黑夜模式",
    themeToDayAria: "切换到日间模式",
    download: "下载 Mac app",
    macDownload: "下载 Mac app",
    platformNote: "其他平台即将到来",
    releaseLabel: "最新版本",
    releaseFallbackTitle: "公开下载即将开放",
    releaseFallbackBody:
      "发布流水线已经预留官网、GitHub、社区频道和热更新清单。首个公开包生成后，这里会自动显示版本、说明和下载入口。",
    releaseDownload: "下载当前版本",
    releaseGithub: "GitHub 下载",
    releaseNotes: "更新说明",
    releaseChecksum: "校验",
    updatesTitle: "更新记录",
    updatesLead:
      "这里按时间记录 Fount 的版本变化、发布重点和校验信息。下载入口不放在这里，避免把更新历史变成下载页。",
    updatesEmpty: "还没有可展示的历史更新。",
    blogTitle: "Fount 博客",
    blogLead:
      "把关于 Fount、Field、agent system 和产品生态的思考放在同一条时间线上。这里是站内阅读入口，不再跳回旧的作品集页面。",
    blogEmpty: "还没有可展示的博客。",
    fieldsEyebrow: "Built with Fount",
    fieldsTitle: "我的 Fields",
    fieldsLead:
      "这里收录我已经做出、正在维护或继续生长的 Field。每一个 Field 都有自己的环境、规则、工具和 agent，也可以被 Fount 理解和进入。",
    fieldsCount: "个 Field",
    fieldsOpen: "进入 Field",
    fieldsListAria: "我创建的 Field 列表",
    fieldsViewSwitchAria: "切换 Fields 展示方式",
    fieldsViewList: "列表",
    fieldsViewGallery: "画廊",
    fieldsBackToList: "返回完整列表",
    fieldsOpenSeparate: "单独打开",
    fieldsProductPage: "产品页",
    fieldsVideoPage: "讲解视频",
    fieldsSwitchAria: "切换 Field",
    fieldsEmbedHint: "若页面无法内嵌，请单独打开。",
    fieldsVideoHint: "可在此直接播放完整视频。",
    heroTitle: "Fount",
    heroDeck: "像玩游戏一样构建产品。",
    heroSub: "想法变成卡片，现场铺成白板，agent 参与执行、检查和发布。",
    productImageAlt: "Forge 产品界面截图，展示左侧 agent 活动、中央白板和底部构建卡片",
    cardShelfAria: "Fount 产品构建卡片",
    cardShelfEmptyTitle: "章节卡片库",
    cardShelfEmptyBody: "待写入",
    visualAlt: "Fount 个人 agent 大脑连接多个可携带 Field 的线稿插图",
    dashboardTitle: "Experience Continuity",
    dashboardStatus: "5 layers online · 7 experience events · memory sync ready",
    dashboardFeed: "Live experience flow",
    definitionTitle: "一个大脑，许多可进入的 Field。",
    definitionLead:
      "Fount 负责人的连续性。Field 负责可体验的环境。Forge 负责创造和改造。Foundry 负责发现、安装、购买和发布。",
    visionTitle: "你和 Fount 一起进入世界，而不是只在聊天框里描述世界。",
    visionLead:
      "当 Fount 理解一个 Field，Field 会变得更有用；当 Fount 经历更多 Field，Fount 会变得更像你的个人大脑。",
    visionLabel: "The thesis",
    architectureTitle: "系统分为五层。",
    architectureLead:
      "从本地个人大脑到 Field runtime，再到系统级 Field、用户 Field 和官方服务，Fount 把体验、记忆、权限和商业化放在同一个协议框架里。",
    packageTitle: "初始下载包",
    packageLead:
      "用户下载 Fount.app 后，默认获得 Core、Field Runtime、系统 Field 和 Starter Fields。没有账号也应能进入本地优先的基础体验。",
    builtInFieldsTitle: "Fount 自带哪些 Field。",
    builtInFieldsLead:
      "初始体验分成两组：系统 Field 负责记忆、权限、创造和分发；Starter Fields 负责让用户一打开就能进入真实场景。Core 和 Runtime 是底座，不算 Field。",
    permissionsTitle: "权限默认拒绝，体验默认可控。",
    permissionsLead:
      "Field 可以请求能力，但 Fount 不应默认开放记忆、本地文件、网络、资源预算、源码访问或跨 Field 回忆。所有修改都从权限边界开始。",
    permissionsRule:
      "Fount 只有在 Field 明确授予权限时，才能通过 Forge 修改配置、行为或源码。",
    flowTitle: "体验循环让系统越用越像你。",
    flowLead:
      "Enter, Experience, Remember, Recall, Discover, Modify, Return。每一次进入 Field 都可能生成可同步、可回忆、可改造的经验事件。",
    forgeTitle: "Forge 与 Foundry 是内置系统 Field。",
    forgeLead:
      "Forge 面向普通用户和开发者；Foundry 面向发现与分发。两者不是外部工具，而是 Fount 生态中的高权限 Field。",
    sdkTitle: "SDK 把普通产品变成 Field。",
    sdkLead:
      "Fount SDK 不是简单接入一个 AI 接口。它让产品声明 manifest、权限、agent、experience events、memory sync、control channel 与 Forge editability。",
    openTitle: "开放核心，商业服务围绕创造与分发。",
    openLead:
      "Fount Core、Field Runtime、协议、权限模型、manifest schema 和 SDK 可以开放；Forge Pro、Foundry Network、认证、同步、分发和商业化可以成为官方服务。",
    roadmapTitle: "从本地个人大脑到 Field 生态。",
    roadmapLead:
      "路线图先把 Fount Core 和几个 starter Field 跑通，再进入 Forge Lite、Foundry alpha、SDK 生态和商业网络。",
    finalTitle: "从第一个 Field 开始。",
    finalBody: "先让 Fount 记住一次真实体验，再让它带着经验进入下一个现场。",
    finalSecondary: "阅读文档",
    visualTitle: "从一个个人大脑进入多个 Field。",
    visualLead:
      "Fount 记录你的偏好、目标和经验；Field 提供可进入的环境；Forge 与 Foundry 让这些环境被创造、发现、安装和改造。",
    storyTitle: "它怎么工作",
    storyLead: "Fount 在中间承接记忆和权限；不同 Field 提供真实环境；经验通过事件回到 Fount。",
    useTitle: "进入后有什么用",
    useLead: "访客需要先看懂结果：Fount 会把一次体验变成下一次行动的上下文。",
    pricingTitle: "定价",
    pricingLead:
      "Player 永久免费进入基础体验；Builder 面向完整 Forge 创作；Master 打开发布、运营和子代理网络。",
    accountTitle: "账号系统是 Fount 的身份与权限层。",
    accountLead:
      "登录、角色、权限、同步和购买状态都应该在同一个账户系统里被管理。Fount 不是无状态访问入口，而是有身份边界的个人 agent 大脑。",
    accountCta: "进入账号",
    faqTitle: "常见问题",
    faqLead: "把第一次看到 Fount 时最容易卡住的问题放在这里：它是什么、带什么、怎么保护权限，以及为什么 Field 生态值得存在。",
  },
  en: {
    documentTitle: "Fount | Open Personal Agent Brain",
    pricingDocumentTitle: "Fount Pricing | Player / Builder / Master",
    partnersDocumentTitle: "Fount Partner Program",
    updatesDocumentTitle: "Fount Updates | Release History",
    blogDocumentTitle: "Fount Blog | Notes",
    fieldsDocumentTitle: "My Fields | Fount",
    docsDocumentTitle: "Fount Docs | System, Fields, and SDK",
    navHome: "Home",
    navConcepts: "Concepts",
    navArchitecture: "Architecture",
    navPermissions: "Permissions",
    navFlow: "Loop",
    navOpen: "Open",
    navRoadmap: "Roadmap",
    navBlog: "Blog",
    navDocs: "Docs",
    navFields: "Fields",
    navUpdates: "Updates",
    navPricing: "Pricing",
    navAccount: "Account",
    socialLinksAria: "Fount social channels",
    themeNight: "Night",
    themeDay: "Day",
    themeToNightAria: "Switch to night mode",
    themeToDayAria: "Switch to day mode",
    download: "Download Mac app",
    macDownload: "Download Mac app",
    platformNote: "Other platforms coming soon",
    releaseLabel: "Latest release",
    releaseFallbackTitle: "Public download is opening soon",
    releaseFallbackBody:
      "The release pipeline is ready for the website, GitHub, community channels, and the hot-update manifest. Once the first public build is published, this section will show the version, notes, and download entry automatically.",
    releaseDownload: "Download current version",
    releaseGithub: "GitHub download",
    releaseNotes: "Release notes",
    releaseChecksum: "Checksum",
    updatesTitle: "Release history",
    updatesLead:
      "A chronological record of Fount releases, highlights, and verification details. Download buttons stay off this page so the history stays readable.",
    updatesEmpty: "No release history is available yet.",
    blogTitle: "Fount Blog",
    blogLead:
      "Notes on Fount, Fields, agent systems, and product ecosystems in one timeline. This is the in-site reading entry, not the old portfolio blog shell.",
    blogEmpty: "No blog posts are available yet.",
    fieldsEyebrow: "Built with Fount",
    fieldsTitle: "My Fields",
    fieldsLead:
      "A collection of Fields I have built, maintain, or keep growing. Each Field has its own environment, rules, tools, and agents, while remaining understandable and enterable by Fount.",
    fieldsCount: "Fields",
    fieldsOpen: "Enter Field",
    fieldsListAria: "Fields I created",
    fieldsViewSwitchAria: "Switch Fields view",
    fieldsViewList: "List",
    fieldsViewGallery: "Gallery",
    fieldsBackToList: "Back to full list",
    fieldsOpenSeparate: "Open separately",
    fieldsProductPage: "Product page",
    fieldsVideoPage: "Explainer video",
    fieldsSwitchAria: "Switch Field",
    fieldsEmbedHint: "If embedding is blocked, open it separately.",
    fieldsVideoHint: "Play the full video here.",
    heroTitle: "Fount",
    heroDeck: "Build products like a game.",
    heroSub: "Ideas become cards, the work opens on a whiteboard, and agents execute, review, and ship.",
    productImageAlt: "Forge product screenshot showing agent activity, a central whiteboard, and bottom build cards",
    cardShelfAria: "Fount product build cards",
    cardShelfEmptyTitle: "Chapter card library",
    cardShelfEmptyBody: "Waiting for chapters",
    visualAlt: "Line illustration of the Fount personal agent brain connected to portable Fields",
    dashboardTitle: "Experience Continuity",
    dashboardStatus: "5 layers online · 7 experience events · memory sync ready",
    dashboardFeed: "Live experience flow",
    definitionTitle: "One brain. Many enterable Fields.",
    definitionLead:
      "Fount carries personal continuity. Fields provide experience environments. Forge creates and reshapes them. Foundry discovers, installs, sells, and publishes them.",
    visionTitle: "You and Fount enter worlds together, instead of only describing them in chat.",
    visionLead:
      "A Field becomes more useful when Fount understands it. Fount becomes more personal when it experiences more Fields.",
    visionLabel: "The thesis",
    architectureTitle: "The system has five layers.",
    architectureLead:
      "From the local personal brain to Field runtime, system Fields, user Fields, and official services, Fount puts experience, memory, permissions, and commercialization in one protocol frame.",
    packageTitle: "Initial download package",
    packageLead:
      "When a user downloads Fount.app, it includes Core, Field Runtime, system Fields, and starter Fields. The base experience should work local-first, even without an account.",
    builtInFieldsTitle: "Which Fields come with Fount.",
    builtInFieldsLead:
      "The first experience has two groups: system Fields handle memory, permissions, creation, and distribution; Starter Fields make the app usable immediately. Core and Runtime are the base, not Fields.",
    permissionsTitle: "Permissions are denied by default. Experience stays controlled.",
    permissionsLead:
      "Fields may request capability, but Fount should not default to memory, local files, network, resource budgets, source access, or cross-field recall. Every modification begins with the permission boundary.",
    permissionsRule:
      "Fount can modify configuration, behavior, or source through Forge only when the Field explicitly grants permission.",
    flowTitle: "The experience loop makes the system more personal over time.",
    flowLead:
      "Enter, Experience, Remember, Recall, Discover, Modify, Return. Every Field session can create experience events that sync, recall, and reshape future behavior.",
    forgeTitle: "Forge and Foundry are built-in system Fields.",
    forgeLead:
      "Forge serves both ordinary users and developers. Foundry handles discovery and distribution. They are not external utilities, but higher-privilege Fields inside the Fount ecosystem.",
    sdkTitle: "The SDK turns ordinary products into Fields.",
    sdkLead:
      "The Fount SDK is not just an AI integration. It lets products declare manifests, permissions, agents, experience events, memory sync, control channels, and Forge editability.",
    openTitle: "Open core. Commercial creation and distribution services.",
    openLead:
      "Fount Core, Field Runtime, protocols, permission model, manifest schema, and SDK can be open. Forge Pro, Foundry Network, certification, sync, distribution, and commercialization can become official services.",
    roadmapTitle: "From local personal brain to Field ecosystem.",
    roadmapLead:
      "The roadmap starts with Fount Core and starter Fields, then moves into Forge Lite, Foundry alpha, SDK adoption, and commercial network services.",
    finalTitle: "Start with one Field.",
    finalBody: "Let Fount remember one real experience, then carry that context into the next environment.",
    finalSecondary: "Read docs",
    visualTitle: "From one personal brain into many Fields.",
    visualLead:
      "Fount keeps your preferences, goals, and experience. Fields provide enterable environments. Forge and Foundry let those environments be created, discovered, installed, and reshaped.",
    storyTitle: "How it works",
    storyLead: "Fount holds memory and permissions. Fields provide live environments. Experience returns through structured events.",
    useTitle: "What visitors can use it for",
    useLead: "The point is the outcome: one experience becomes context for the next action.",
    pricingTitle: "Pricing",
    pricingLead:
      "Player is free forever for the base experience; Builder unlocks full Forge creation; Master opens publishing, operations, and subagent networks.",
    accountTitle: "Account is the identity and permission layer for Fount.",
    accountLead:
      "Login, roles, permissions, sync, and purchase state should be managed through one account system. Fount is not a stateless entry point; it is a personal agent brain with identity boundaries.",
    accountCta: "Open Account",
    faqTitle: "FAQ",
    faqLead: "The questions that usually block a first read: what Fount is, what comes inside it, how permissions work, and why the Field ecosystem exists.",
  },
} as const;

export function FountPrimaryNav({
  activePage,
  hrefs,
  lang,
  onTabChange,
}: FountPrimaryNavProps) {
  const copy = COPY[lang];

  return (
    <nav className="fount-site-nav" aria-label="Site links">
      <a
        href={hrefs.home}
        className={activePage === "home" ? "active" : ""}
        aria-current={activePage === "home" ? "page" : undefined}
        onClick={(event) =>
          handleFountTabClick(event, "home", onTabChange)
        }
      >
        Fount
      </a>
      <a
        href={hrefs.fields}
        className={activePage === "fields" ? "active" : ""}
        aria-current={activePage === "fields" ? "page" : undefined}
        onClick={(event) =>
          handleFountTabClick(event, "fields", onTabChange)
        }
      >
        {copy.navFields}
      </a>
      <a
        href={hrefs.docs}
        className={activePage === "docs" ? "active" : ""}
        aria-current={activePage === "docs" ? "page" : undefined}
        onClick={(event) =>
          handleFountTabClick(event, "docs", onTabChange)
        }
      >
        {copy.navDocs}
      </a>
      <a
        href={hrefs.updates}
        className={activePage === "updates" ? "active" : ""}
        aria-current={activePage === "updates" ? "page" : undefined}
      >
        {copy.navUpdates}
      </a>
      <a
        href={hrefs.blog}
        className={activePage === "blog" ? "active" : ""}
        aria-current={activePage === "blog" ? "page" : undefined}
      >
        {copy.navBlog}
      </a>
      <a
        href={hrefs.pricing}
        className={activePage === "pricing" ? "active" : ""}
        aria-current={activePage === "pricing" ? "page" : undefined}
      >
        {copy.navPricing}
      </a>
    </nav>
  );
}

const CORE_CONCEPTS: ConceptItem[] = [
  {
    name: "Fount",
    title: {
      zh: "个人 agent 大脑",
      en: "Personal agent brain",
    },
    body: {
      zh: "记住你的经验、偏好、目标、反应、创造和决定，是所有 Field 之间的连续性中枢。",
      en: "Remembers your experiences, preferences, goals, reactions, creations, and decisions as the continuity layer across Fields.",
    },
  },
  {
    name: "Field",
    title: {
      zh: "可携带的经验环境",
      en: "Portable experience environment",
    },
    body: {
      zh: "人可以进入和使用，Fount 可以理解和行动，Field agent 可以在规则内完成任务。",
      en: "A place people can enter and use, Fount can understand and act within, and Field agents can operate under defined rules.",
    },
  },
  {
    name: "Forge",
    title: {
      zh: "创造和改造 Field 的系统 Field",
      en: "System Field for making and reshaping Fields",
    },
    body: {
      zh: "普通用户改造体验，开发者连接源码、SDK、测试、打包和发布。",
      en: "Ordinary users reshape experiences, while developers connect source, SDK, testing, packaging, and publishing.",
    },
  },
  {
    name: "Foundry",
    title: {
      zh: "发现、安装、购买和发布 Field",
      en: "Discover, install, buy, and publish Fields",
    },
    body: {
      zh: "人可以浏览，Fount 也可以基于记忆、兴趣、目标、资源和权限边界主动发现。",
      en: "People can browse it, and Fount can discover Fields based on memory, interests, goals, resources, and permission boundaries.",
    },
  },
];

const HOME_CHAPTERS: HomeChapter[] = [
  {
    id: "what",
    title: { zh: "这是什么 app", en: "What kind of app is this?" },
    cardBody: {
      zh: "一套会生长的产品体验生态。",
      en: "A growing ecosystem for product experiences.",
    },
    tone: "mint",
    items: [
      {
        label: "1.1",
        body: {
          zh: "Fount 不是一个孤立 app，而是一套通用产品体验生态。它先服务那些好玩、可探索、和想象世界有关的产品，再逐步长出 Forge、Foundry 和更多 Field。",
          en: "Fount is not an isolated app, but a general ecosystem for product experiences. It starts with playful, explorable, imagination-driven products, then grows Forge, Foundry, and more Fields.",
        },
      },
    ],
  },
  {
    id: "ecosystem",
    title: { zh: "生态如何组成", en: "How the ecosystem is composed" },
    cardBody: {
      zh: "框架、SDK、社区和用户共同驱动。",
      en: "Framework, SDK, community, and users drive it together.",
    },
    tone: "lilac",
    items: [
      {
        label: "2.1",
        kind: "formula",
        body: {
          zh: "Ecosystem = Framework + SDK + Community + Users",
          en: "Ecosystem = Framework + SDK + Community + Users",
        },
        note: {
          zh: "框架和 SDK 让产品可以变成 Field；社区和用户让它们被创造、流通和验证。",
          en: "Framework and SDK let products become Fields; community and users create, circulate, and validate them.",
        },
      },
      {
        label: "2.2",
        kind: "formula",
        body: {
          zh: "Field = Environment + Rules + Tools + Agents + Memory + UI",
          en: "Field = Environment + Rules + Tools + Agents + Memory + UI",
        },
        note: {
          zh: "Field 是今天 app + agent 的完整化：Fount 是大脑，Forge 是手，Foundry 是入口，而 Agents 是最需要加强的一层。",
          en: "A Field completes today's app + agent pattern: Fount is the brain, Forge the hand, Foundry the entry point, and Agents are the layer to strengthen.",
        },
      },
    ],
  },
  {
    id: "product",
    title: { zh: "这个产品是什么", en: "What this product is" },
    cardBody: {
      zh: "给人和 agent 共用的创造工作台。",
      en: "A shared creation workbench for people and agents.",
    },
    tone: "blue",
    items: [
      {
        label: "3.1",
        kind: "formula",
        body: {
          zh: "Fount + Forge = Field Workbench",
          en: "Fount + Forge = Field Workbench",
        },
        note: {
          zh: "人在白板上整理目标、卡片和判断；agent 在同一现场执行、检查，并把经验写回 Fount。",
          en: "People organize goals, cards, and judgment on the whiteboard; agents act in the same environment, check the work, and write experience back to Fount.",
        },
      },
    ],
  },
  {
    id: "vision",
    title: { zh: "愿景", en: "Vision" },
    cardBody: {
      zh: "让机器产生智慧，也产生世界。",
      en: "Let machines generate intelligence, and worlds.",
    },
    tone: "amber",
    items: [
      {
        label: "4.1",
        body: {
          zh: "愿景是让人机交互不止停在问答，而是一起进入、创造和改造世界。机器不只是工具，也可以成为产生智慧、经验和新世界的地方。",
          en: "The vision is to move human-machine interaction beyond Q&A into entering, creating, and reshaping worlds together. Machines are not only tools; they can become places where intelligence, experience, and new worlds emerge.",
        },
      },
    ],
  },
];

const HOME_CHAPTER_ID_SET = new Set<HomeChapterId>(HOME_CHAPTERS.map((chapter) => chapter.id));

const VISITOR_FLOW: StepItem[] = [
  {
    label: "01",
    title: { zh: "Field 声明边界", en: "Field declares boundaries" },
    body: {
      zh: "每个 Field 说明自己能提供什么、需要什么权限、会写回哪些经验。",
      en: "Each Field declares what it offers, which permissions it needs, and what experience it writes back.",
    },
  },
  {
    label: "02",
    title: { zh: "Fount 带着上下文进入", en: "Fount enters with context" },
    body: {
      zh: "它把你的偏好、目标和最近的经验带进现场，但只在允许范围内行动。",
      en: "It brings your preferences, goals, and recent experience into the environment, inside permission limits.",
    },
  },
  {
    label: "03",
    title: { zh: "经验回流成记忆", en: "Experience returns as memory" },
    body: {
      zh: "你看过、选过、改过、失败过的东西，变成下一次行动的上下文。",
      en: "What you saw, chose, changed, or failed at becomes context for the next action.",
    },
  },
];

const VISITOR_USE_CASES: ConceptItem[] = [
  {
    name: "Work",
    title: { zh: "个人工作台", en: "Personal workspace" },
    body: {
      zh: "让 agent 记住项目、文件、任务和你的判断口味。",
      en: "Let the agent remember projects, files, tasks, and your judgment style.",
    },
  },
  {
    name: "Learning",
    title: { zh: "阅读与学习", en: "Reading and learning" },
    body: {
      zh: "把困惑、标注和偏好带到下一本书或下一节课。",
      en: "Carry confusion, notes, and preferences into the next book or lesson.",
    },
  },
  {
    name: "Creation",
    title: { zh: "创造工具", en: "Creation tools" },
    body: {
      zh: "让 Forge 在权限边界内调整界面、规则和流程。",
      en: "Let Forge adjust interfaces, rules, and workflows within permission boundaries.",
    },
  },
];

const SYSTEM_CONCEPTS: ConceptItem[] = [
  {
    name: "Fount SDK",
    title: {
      zh: "把产品声明为 Field",
      en: "Declare a product as a Field",
    },
    body: {
      zh: "提供 manifest、权限、事件、agent、memory sync、control channel 和 Forge editability。",
      en: "Provides manifests, permissions, events, agents, memory sync, control channels, and Forge editability.",
    },
  },
  {
    name: "Field Agent",
    title: {
      zh: "在 Field 内行动的 agent",
      en: "Agent acting inside a Field",
    },
    body: {
      zh: "遵守 Field 规则，接收 Fount 提供的上下文、指令或控制，产生经验事件。",
      en: "Follows Field rules, receives context, instruction, or control from Fount, and produces experience events.",
    },
  },
  {
    name: "Experience Event",
    title: {
      zh: "可回流的经验单位",
      en: "The unit of returning experience",
    },
    body: {
      zh: "描述用户在 Field 中看到、做了、选择、失败、喜欢、修改或完成了什么。",
      en: "Describes what the user saw, did, chose, failed at, liked, modified, or completed inside a Field.",
    },
  },
  {
    name: "Memory Sync",
    title: {
      zh: "跨 Field 的记忆同步",
      en: "Cross-field memory sync",
    },
    body: {
      zh: "把可授权的经验带回 Fount，并在未来进入其他 Field 时被安全回忆。",
      en: "Returns permitted experience to Fount so it can be safely recalled in future Fields.",
    },
  },
  {
    name: "Control Channel",
    title: {
      zh: "Fount 对 Field agent 的控制通道",
      en: "Fount control channel for Field agents",
    },
    body: {
      zh: "用于传递上下文、指令、权限、限制和终止条件，避免 agent 脱离体验边界。",
      en: "Passes context, instructions, permissions, limits, and stopping conditions so agents stay inside the experience boundary.",
    },
  },
  {
    name: "Experience Continuity",
    title: {
      zh: "区别于 app store、插件和助手的核心",
      en: "The difference from app stores, plugins, and assistants",
    },
    body: {
      zh: "不是下载更多应用，而是在不同环境之间保留同一个人的经验连续性。",
      en: "Not downloading more apps, but preserving one person's experience continuity across different environments.",
    },
  },
];

const VISION_EXAMPLES: ConceptItem[] = [
  {
    name: "UI Playground -> Forge",
    title: {
      zh: "视觉偏好进入创造工具",
      en: "Visual preferences enter creation tools",
    },
    body: {
      zh: "你在 UI Playground 中偏爱安静、密集、线条感的界面；Fount 可在 Forge 中把这种偏好带入新 Field 的改造。",
      en: "You prefer quiet, dense, line-forward interfaces in UI Playground. Fount can carry that preference into Forge when reshaping a new Field.",
    },
  },
  {
    name: "Learning Lab -> Reading Room",
    title: {
      zh: "学习困惑变成阅读上下文",
      en: "Learning confusion becomes reading context",
    },
    body: {
      zh: "Learning Lab 记录你卡在某个概念；进入 Reading Room 后，Fount 可优先解释相关段落。",
      en: "Learning Lab records that a concept confused you. In Reading Room, Fount can explain related passages first.",
    },
  },
  {
    name: "Agent Game -> Foundry",
    title: {
      zh: "兴趣变成主动发现",
      en: "Interest becomes autonomous discovery",
    },
    body: {
      zh: "你在 Agent Game 中喜欢协作型 agent；Fount 可去 Foundry 寻找同类 Field。",
      en: "You enjoy cooperative agents in Agent Game. Fount can visit Foundry to find related Fields.",
    },
  },
];

const ARCHITECTURE_LAYERS: LayerItem[] = [
  {
    label: "01",
    title: { zh: "Fount Core", en: "Fount Core" },
    body: {
      zh: "个人 agent 大脑、本地记忆、身份、偏好、目标和经验索引。",
      en: "The personal agent brain, local memory, identity, preferences, goals, and experience index.",
    },
    items: [
      { zh: "agent runtime", en: "agent runtime" },
      { zh: "memory store", en: "memory store" },
      { zh: "user profile", en: "user profile" },
    ],
  },
  {
    label: "02",
    title: { zh: "Field Runtime", en: "Field Runtime" },
    body: {
      zh: "加载 Field、读取 manifest、执行权限检查、记录 experience events。",
      en: "Loads Fields, reads manifests, checks permissions, and records experience events.",
    },
    items: [
      { zh: "manifest loader", en: "manifest loader" },
      { zh: "permission gate", en: "permission gate" },
      { zh: "event bus", en: "event bus" },
    ],
  },
  {
    label: "03",
    title: { zh: "System Fields", en: "System Fields" },
    body: {
      zh: "Forge、Foundry、Memory、Permissions、Ledger 等内置高权限 Field。",
      en: "Built-in higher-privilege Fields such as Forge, Foundry, Memory, Permissions, and Ledger.",
    },
    items: [
      { zh: "Forge", en: "Forge" },
      { zh: "Foundry", en: "Foundry" },
      { zh: "Permissions", en: "Permissions" },
    ],
  },
  {
    label: "04",
    title: { zh: "User Fields", en: "User Fields" },
    body: {
      zh: "Reading Room、UI Playground、Agent Game、Learning Lab、Finance Garden 等具体体验环境。",
      en: "Concrete environments such as Reading Room, UI Playground, Agent Game, Learning Lab, and Finance Garden.",
    },
    items: [
      { zh: "starter fields", en: "starter fields" },
      { zh: "private fields", en: "private fields" },
      { zh: "published fields", en: "published fields" },
    ],
  },
  {
    label: "05",
    title: { zh: "Official Services", en: "Official Services" },
    body: {
      zh: "Foundry Network、Forge Cloud、认证、同步、授权、分发和商业化。",
      en: "Foundry Network, Forge Cloud, certification, sync, licensing, distribution, and commercialization.",
    },
    items: [
      { zh: "certification", en: "certification" },
      { zh: "sync", en: "sync" },
      { zh: "licensing", en: "licensing" },
    ],
  },
];

const FIELD_TYPES: ConceptItem[] = [
  {
    name: "Ordinary",
    title: { zh: "普通 Field", en: "Ordinary Field" },
    body: {
      zh: "可进入、可使用、可产生基础事件，但不一定接入记忆。",
      en: "Enterable and usable, with basic events, but not necessarily memory-aware.",
    },
  },
  {
    name: "Memory-aware",
    title: { zh: "记忆感知 Field", en: "Memory-aware Field" },
    body: {
      zh: "可读取授权记忆，写回经验事件，并在未来被回忆。",
      en: "Can read permitted memory, write experience events, and be recalled later.",
    },
  },
  {
    name: "Agent",
    title: { zh: "Agent Field", en: "Agent Field" },
    body: {
      zh: "内含 Field agent，可由 Fount 通过控制通道引导或限制。",
      en: "Contains Field agents that Fount can guide or constrain through control channels.",
    },
  },
  {
    name: "Creator",
    title: { zh: "Creator Field", en: "Creator Field" },
    body: {
      zh: "用于生成、编辑、模拟、测试或发布其他 Field。",
      en: "Used to generate, edit, simulate, test, or publish other Fields.",
    },
  },
  {
    name: "System",
    title: { zh: "系统级 Field", en: "System Field" },
    body: {
      zh: "拥有更高权限，服务于整个 Fount 生态的核心流程。",
      en: "Has higher privileges and serves core workflows across the Fount ecosystem.",
    },
  },
  {
    name: "Private / Published",
    title: { zh: "私有或发布 Field", en: "Private or Published Field" },
    body: {
      zh: "可以只存在本地，也可以通过 Foundry 分发、购买、安装和更新。",
      en: "Can live locally or be distributed, purchased, installed, and updated through Foundry.",
    },
  },
];

const BUILT_IN_FIELDS: ConceptItem[] = [
  {
    name: "Forge",
    title: { zh: "创造和改造 Field", en: "Create and reshape Fields" },
    body: {
      zh: "把想法变成 Field 草案，修改界面、规则、角色、流程；开发者还可以接源码、SDK、测试和发布链路。",
      en: "Turns ideas into Field drafts, edits UI, rules, roles, and workflows; developers can connect source, SDK, testing, and publishing.",
    },
    meta: { zh: "System Field", en: "System Field" },
  },
  {
    name: "Foundry",
    title: { zh: "发现、安装和发布 Field", en: "Discover, install, and publish Fields" },
    body: {
      zh: "展示 Field 的能力、权限、价格、认证和版本，也允许 Fount 按用户目标主动发现新 Field。",
      en: "Shows capability, permissions, pricing, certification, and versions, while letting Fount discover Fields based on user goals.",
    },
    meta: { zh: "System Field", en: "System Field" },
  },
  {
    name: "Memory",
    title: { zh: "管理个人经验", en: "Manage personal experience" },
    body: {
      zh: "查看、整理和控制哪些经验进入短期记忆、长期记忆、Field-local memory 或跨 Field 召回。",
      en: "Reviews and controls what enters working memory, long-term memory, Field-local memory, or cross-field recall.",
    },
    meta: { zh: "System Field", en: "System Field" },
  },
  {
    name: "Permissions",
    title: { zh: "审查每个 Field 的权限", en: "Review every Field permission" },
    body: {
      zh: "集中处理记忆读写、文件、网络、预算、agent 控制、Forge 修改和商业发布等授权边界。",
      en: "Centralizes memory, files, network, budget, agent control, Forge editing, and commercial publishing boundaries.",
    },
    meta: { zh: "System Field", en: "System Field" },
  },
  {
    name: "Ledger",
    title: { zh: "记录资源和商业状态", en: "Track resources and commercial state" },
    body: {
      zh: "记录资源预算、购买状态、授权、安装来源、更新记录和可审计的关键变更。",
      en: "Tracks resource budgets, purchase state, licensing, install sources, updates, and auditable changes.",
    },
    meta: { zh: "System Field", en: "System Field" },
  },
  {
    name: "Reading Room",
    title: { zh: "阅读室", en: "Reading room" },
    body: {
      zh: "让 Fount 记住你的阅读偏好、困惑、标注和解释方式，把一次阅读带到下一本书。",
      en: "Lets Fount remember reading preferences, confusion, highlights, and explanation style across books.",
    },
    meta: { zh: "Starter Field", en: "Starter Field" },
  },
  {
    name: "UI Playground",
    title: { zh: "界面偏好实验场", en: "Interface preference playground" },
    body: {
      zh: "记录你对密度、排版、动效、颜色和信息层级的判断，供 Forge 改造新 Field 时召回。",
      en: "Records taste around density, typography, motion, color, and hierarchy for Forge to recall later.",
    },
    meta: { zh: "Starter Field", en: "Starter Field" },
  },
  {
    name: "Agent Game",
    title: { zh: "多 agent 互动场", en: "Multi-agent interaction space" },
    body: {
      zh: "观察角色、协作、限制和策略，让 Fount 理解你偏好的 agent 行为模式。",
      en: "Explores roles, collaboration, constraints, and strategy so Fount learns preferred agent behavior.",
    },
    meta: { zh: "Starter Field", en: "Starter Field" },
  },
  {
    name: "Learning Lab",
    title: { zh: "学习实验室", en: "Learning lab" },
    body: {
      zh: "沉淀概念卡点、例子偏好和练习结果，让下一次学习不从零开始。",
      en: "Captures conceptual blockers, example preferences, and practice results so learning does not restart from zero.",
    },
    meta: { zh: "Starter Field", en: "Starter Field" },
  },
  {
    name: "Finance Garden",
    title: { zh: "个人财务花园", en: "Personal finance garden" },
    body: {
      zh: "在严格权限下记录风险边界、预算习惯和计划变化，默认不开放敏感数据。",
      en: "Under strict permissions, records risk boundaries, budgeting habits, and plan changes without exposing sensitive data by default.",
    },
    meta: { zh: "Starter Field", en: "Starter Field" },
  },
];

const PERMISSIONS: PermissionItem[] = [
  {
    name: "Memory",
    title: { zh: "Memory Read / Write", en: "Memory Read / Write" },
    body: {
      zh: "读取授权记忆，写回新的 experience events。",
      en: "Read permitted memory and write new experience events.",
    },
    level: "L1-L2",
  },
  {
    name: "Recall",
    title: { zh: "Cross-field Recall", en: "Cross-field Recall" },
    body: {
      zh: "把一个 Field 的经验安全带入另一个 Field。",
      en: "Safely bring experience from one Field into another.",
    },
    level: "L2",
  },
  {
    name: "Agent",
    title: { zh: "Agent Control", en: "Agent Control" },
    body: {
      zh: "允许 Fount 引导、限制或终止 Field agent 的行动。",
      en: "Let Fount guide, constrain, or stop Field agent actions.",
    },
    level: "L2-L3",
  },
  {
    name: "Resources",
    title: { zh: "Network / File / Budget", en: "Network / File / Budget" },
    body: {
      zh: "网络、本地文件、资源预算和敏感能力必须逐项授权。",
      en: "Network, local files, resource budget, and sensitive capabilities must be granted explicitly.",
    },
    level: "L3",
  },
  {
    name: "Forge",
    title: { zh: "Forge Editable / Source Access", en: "Forge Editable / Source Access" },
    body: {
      zh: "允许 Forge 修改配置、体验、行为，或在更高等级下访问源码。",
      en: "Allow Forge to modify configuration, experience, behavior, or source at higher levels.",
    },
    level: "L3-L4",
  },
  {
    name: "Commercial",
    title: { zh: "Publish / Commercial / Update", en: "Publish / Commercial / Update" },
    body: {
      zh: "发布、收费、分发、更新和认证需要明确商业权限。",
      en: "Publishing, charging, distribution, updates, and certification require explicit commercial rights.",
    },
    level: "L4-L5",
  },
];

const PERMISSION_LEVELS: StepItem[] = [
  {
    label: "L0",
    title: { zh: "Enter only", en: "Enter only" },
    body: {
      zh: "只进入和使用，不读写记忆。",
      en: "Enter and use, with no memory read or write.",
    },
  },
  {
    label: "L1",
    title: { zh: "Session memory", en: "Session memory" },
    body: {
      zh: "只在当前体验内保留上下文。",
      en: "Keep context inside the current session only.",
    },
  },
  {
    label: "L2",
    title: { zh: "Personal memory", en: "Personal memory" },
    body: {
      zh: "写回可授权的个人经验。",
      en: "Write permitted personal experience back to Fount.",
    },
  },
  {
    label: "L3",
    title: { zh: "Agent action", en: "Agent action" },
    body: {
      zh: "允许 agent 在边界内行动。",
      en: "Allow agents to act inside defined limits.",
    },
  },
  {
    label: "L4",
    title: { zh: "Forge edit", en: "Forge edit" },
    body: {
      zh: "允许改造配置、流程或源码。",
      en: "Allow configuration, workflow, or source changes.",
    },
  },
  {
    label: "L5",
    title: { zh: "Publish", en: "Publish" },
    body: {
      zh: "允许发布、收费、更新和分发。",
      en: "Allow publishing, charging, updates, and distribution.",
    },
  },
];

const EXPERIENCE_LOOP: StepItem[] = [
  {
    label: "01",
    title: { zh: "Enter", en: "Enter" },
    body: {
      zh: "人和 Fount 进入 Field。",
      en: "The person and Fount enter a Field.",
    },
  },
  {
    label: "02",
    title: { zh: "Experience", en: "Experience" },
    body: {
      zh: "使用、玩、学、创造或协作。",
      en: "Use, play, learn, create, or collaborate.",
    },
  },
  {
    label: "03",
    title: { zh: "Remember", en: "Remember" },
    body: {
      zh: "形成 experience events。",
      en: "Create experience events.",
    },
  },
  {
    label: "04",
    title: { zh: "Recall", en: "Recall" },
    body: {
      zh: "在其他 Field 中回忆。",
      en: "Recall them in other Fields.",
    },
  },
  {
    label: "05",
    title: { zh: "Discover", en: "Discover" },
    body: {
      zh: "Fount 去 Foundry 找新 Field。",
      en: "Fount visits Foundry to find new Fields.",
    },
  },
  {
    label: "06",
    title: { zh: "Modify", en: "Modify" },
    body: {
      zh: "在 Forge 中改造体验。",
      en: "Reshape the experience in Forge.",
    },
  },
  {
    label: "07",
    title: { zh: "Return", en: "Return" },
    body: {
      zh: "带着新的理解再次进入。",
      en: "Return with new understanding.",
    },
  },
];

const FORGE_FOUNDRY_BLOCKS: ListBlock[] = [
  {
    title: { zh: "Forge workflow", en: "Forge workflow" },
    body: {
      zh: "从想象一个 Field，到进入、观察、修改、检查权限、配置、源码、测试、保存和发布。",
      en: "From imagining a Field to entering, observing, changing, checking permissions, configuring, editing source, testing, saving, and publishing.",
    },
    items: [
      { zh: "普通用户改造界面、规则、角色和流程", en: "Ordinary users reshape interfaces, rules, roles, and workflows" },
      { zh: "开发者连接源码、SDK、测试和发布链路", en: "Developers connect source, SDK, testing, and publishing pipelines" },
      { zh: "权限不足时只允许可配置级别的修改", en: "When permissions are limited, only configurable changes are allowed" },
    ],
  },
  {
    title: { zh: "Foundry listing", en: "Foundry listing" },
    body: {
      zh: "Foundry 的信息不只是价格和截图，而是 Field 是否 Fount-aware、是否有 agent、记忆同步、权限、预算和认证。",
      en: "A Foundry listing is not just price and screenshots. It describes whether a Field is Fount-aware, agentic, memory-syncable, permissioned, budgeted, and certified.",
    },
    items: [
      { zh: "支持人主动浏览，也支持 Fount 基于目标主动发现", en: "Supports human browsing and Fount-initiated discovery" },
      { zh: "展示 permissions、budget、source、certification、local-first", en: "Shows permissions, budget, source, certification, and local-first status" },
      { zh: "安装、购买、更新、发布与商业授权都在同一系统中完成", en: "Installation, purchase, updates, publishing, and licensing happen in one system" },
    ],
  },
];

const SDK_CAPABILITIES: string[] = [
  "manifest",
  "permissions",
  "agents",
  "experience events",
  "memory sync",
  "control channel",
  "Forge editability",
  "resource budget",
  "certification",
  "local-first",
];

const OPEN_BLOCKS: ListBlock[] = [
  {
    title: { zh: "Open source foundation", en: "Open source foundation" },
    body: {
      zh: "开放的部分需要形成信任、互操作和开发者采用。",
      en: "The open parts create trust, interoperability, and developer adoption.",
    },
    items: [
      { zh: "Fount Core, Field Runtime, Permission Model", en: "Fount Core, Field Runtime, Permission Model" },
      { zh: "protocols, Manifest Schema, SDK", en: "protocols, Manifest Schema, SDK" },
      { zh: "Lite system Fields and starter Fields", en: "Lite system Fields and starter Fields" },
    ],
  },
  {
    title: { zh: "Official services", en: "Official services" },
    body: {
      zh: "商业化围绕创造、发现、认证、分发、同步和团队协作。",
      en: "Commercialization sits around creation, discovery, certification, distribution, sync, and team workflows.",
    },
    items: [
      { zh: "Forge Pro, Forge Cloud, virtual user testing", en: "Forge Pro, Forge Cloud, virtual user testing" },
      { zh: "Foundry Network, payments, licensing, updates", en: "Foundry Network, payments, licensing, updates" },
      { zh: "recommendations, certification, analytics, teams", en: "recommendations, certification, analytics, teams" },
    ],
  },
];

const BUSINESS_MODELS: ConceptItem[] = [
  {
    name: "Free",
    title: { zh: "Fount Core", en: "Fount Core" },
    body: {
      zh: "免费开放，提供本地个人大脑、基础 Field runtime 和 starter Fields。",
      en: "Free and open, with the local personal brain, base Field runtime, and starter Fields.",
    },
  },
  {
    name: "Plus",
    title: { zh: "Fount Plus", en: "Fount Plus" },
    body: {
      zh: "云同步、更大记忆、更多 Field、跨设备和更强模型能力。",
      en: "Cloud sync, larger memory, more Fields, cross-device use, and stronger model capacity.",
    },
  },
  {
    name: "Forge",
    title: { zh: "Forge Pro", en: "Forge Pro" },
    body: {
      zh: "高级 Field 创作、测试、模拟、源码协作、团队工作流。",
      en: "Advanced Field creation, testing, simulation, source collaboration, and team workflows.",
    },
  },
  {
    name: "Network",
    title: { zh: "Foundry Network", en: "Foundry Network" },
    body: {
      zh: "Field 分发、交易抽成、认证、更新、推荐和开发者分析。",
      en: "Field distribution, take rate, certification, updates, recommendations, and developer analytics.",
    },
  },
];

const FOUNT_PRICING_PLANS: PricingPlan[] = [
  {
    id: "player",
    name: "Player",
    badge: "Free forever",
    description: "For anyone who wants to experience Fount and connect with basic sub-agents.",
    price: "$0",
    cta: "Start Free",
    href: "/Fount.dmg",
    features: [
      "Connect with Fount",
      "Basic sub-agent experience",
      "Basic card workspace",
      "Basic whiteboard workspace",
      "Local-first experience",
      "Community access",
    ],
    note: "Best for exploring the Fount framework before building your own Fields.",
  },
  {
    id: "builder",
    name: "Builder",
    badge: "Best for Field creators",
    sticker: "Best starting point",
    description: "For creators who want to build Fields with Forge.",
    price: "$49",
    earlyBirdLifetimePrice: "$29",
    earlyBirdLifetimeHref: resolvePublicHref(
      "NEXT_PUBLIC_FOUNT_BUILDER_EARLY_BIRD_URL",
      resolvePublicHref("NEXT_PUBLIC_FOUNT_BUILDER_LIFETIME_URL", "/checkout/builder-lifetime"),
    ),
    earlyBirdNextPrice: "$49",
    futureAnchor: "Future price: $99+",
    cta: "Get Builder",
    href: resolvePublicHref("NEXT_PUBLIC_FOUNT_BUILDER_LIFETIME_URL", "/checkout/builder-lifetime"),
    features: [
      "Forge toolkit for building Fields",
      "Local Field creation workflow",
      "High-quality agent response experience",
      "Automated card generation",
      "Advanced card and whiteboard workflows",
      "Early access to new local features",
      "Builder role in the Fount ecosystem",
    ],
    note: "Includes long-term access to the local Builder experience. Future cloud services may require separate plans.",
  },
  {
    id: "master",
    name: "Master",
    badge: "Founding ecosystem member",
    sticker: "Founding",
    description: "For founding creators who want to publish, operate, and shape the Field ecosystem.",
    price: "$99",
    earlyBirdLifetimePrice: "$49",
    earlyBirdLifetimeHref: resolvePublicHref(
      "NEXT_PUBLIC_FOUNT_MASTER_EARLY_BIRD_URL",
      resolvePublicHref("NEXT_PUBLIC_FOUNT_MASTER_LIFETIME_URL", "/checkout/master-lifetime"),
    ),
    earlyBirdNextPrice: "$99",
    futureAnchor: "Future price: $199+",
    cta: "Get Master",
    href: resolvePublicHref("NEXT_PUBLIC_FOUNT_MASTER_LIFETIME_URL", "/checkout/master-lifetime"),
    features: [
      "Everything in Builder",
      "Full local publishing and operation workflow",
      "Early Foundry publishing access",
      "Sub-agent network features",
      "Priority access to ecosystem experiments",
      "Founding Master status",
      "Better fit for serious Field creators",
    ],
    note: "Master is for early creators who want to help shape the Fount ecosystem. Future cloud hosting, paid compute, team collaboration, and marketplace promotion may require separate plans.",
    featured: true,
  },
];

const FOUNT_PRICING_PAGE_COPY: Record<
  Lang,
  {
    label: string;
    title: string;
    lead: string;
    purchaseNote: string;
    earlyBirdNote: (nextPrice: string) => string;
  }
> = {
  zh: {
    label: "定价",
    title: "买的是 Forge，Fount 免费。",
    lead: "Fount 本体永久免费。这里的价格是 Forge 创作能力：Builder 用来构建 Field，Master 面向发布、运营和生态参与。",
    purchaseNote: "一次买断本地 Forge 能力；Fount 本体永久免费，未来高成本云服务可能单独计费。",
    earlyBirdNote: (nextPrice) => `Forge 早鸟买断 · 下一档 ${nextPrice}`,
  },
  en: {
    label: "Pricing",
    title: "Buy Forge. Fount stays free.",
    lead: "Fount itself is free forever. These prices are for Forge creation: Builder builds Fields, while Master adds publishing, operations, and ecosystem participation.",
    purchaseNote: "Pay once for local Forge capability. Fount remains free forever; future high-cost cloud services may be separate.",
    earlyBirdNote: (nextPrice) => `Forge Early Bird lifetime · Next tier ${nextPrice}`,
  },
};

const FOUNT_PRICING_PLAN_COPY: Record<
  Lang,
  Record<
    PricingPlan["id"],
    {
      badge: string;
      sticker?: string;
      description: string;
      priceSubtext: string;
      cta: string;
      features: string[];
      note: string;
      futureAnchor?: string;
    }
  >
> = {
  zh: {
    player: {
      badge: "Fount 永久免费",
      description: "Fount 本体免费开放；先体验基础 sub-agent、卡片和白板。",
      priceSubtext: "Fount 免费",
      cta: "免费开始",
      features: [
        "连接 Fount",
        "基础 sub-agent 体验",
        "基础卡片工作区",
        "基础白板工作区",
        "本地优先体验",
        "社区访问",
      ],
      note: "Player 是免费的 Fount 入口；需要创作和发布 Field 时，再购买 Forge。",
    },
    builder: {
      badge: "Forge 创作能力",
      sticker: "推荐起点",
      description: "适合用 Forge 构建 Field；Fount 本体仍永久免费。",
      priceSubtext: "Forge 买断",
      cta: "获取 Builder",
      features: [
        "Forge Field 创作工具",
        "本地 Field 创建流程",
        "更好的 agent 响应体验",
        "自动生成卡片",
        "高级卡片和白板流程",
        "本地新功能早期体验",
        "Fount 生态 Builder 身份",
      ],
      note: "价格对应 Forge Builder 能力；Fount Core 免费使用。未来云服务可能单独计费。",
      futureAnchor: "未来价格：$99+",
    },
    master: {
      badge: "生态创始成员",
      sticker: "Founding",
      description: "适合购买 Forge Master，用于发布、运营和参与 Field 生态。",
      priceSubtext: "Forge 买断",
      cta: "获取 Master",
      features: [
        "包含 Builder 全部能力",
        "完整本地发布和运营流程",
        "Foundry 早期发布权限",
        "Sub-agent 网络能力",
        "优先生态实验访问",
        "Founding Master 身份",
        "更适合严肃 Field 创作者",
      ],
      note: "价格对应 Forge Master 能力；Fount 本体免费。未来云托管、付费算力、团队协作和市场推广可能单独计费。",
      futureAnchor: "未来价格：$199+",
    },
  },
  en: {
    player: {
      badge: "Fount free forever",
      description: "Fount itself is free; start with basic sub-agents, cards, and whiteboards.",
      priceSubtext: "Fount free",
      cta: "Start Free",
      features: [
        "Connect with Fount",
        "Basic sub-agent experience",
        "Basic card workspace",
        "Basic whiteboard workspace",
        "Local-first experience",
        "Community access",
      ],
      note: "Player is the free Fount entry. Buy Forge when you are ready to create and publish Fields.",
    },
    builder: {
      badge: "Forge creation",
      sticker: "Best starting point",
      description: "For building Fields with Forge. Fount itself stays free forever.",
      priceSubtext: "Forge Lifetime",
      cta: "Get Builder",
      features: [
        "Forge toolkit for building Fields",
        "Local Field creation workflow",
        "High-quality agent response experience",
        "Automated card generation",
        "Advanced card and whiteboard workflows",
        "Early access to new local features",
        "Builder role in the Fount ecosystem",
      ],
      note: "This price is for Forge Builder capability; Fount Core remains free. Future cloud services may require separate plans.",
      futureAnchor: "Future price: $99+",
    },
    master: {
      badge: "Founding ecosystem member",
      sticker: "Founding",
      description: "For Forge Master: publishing, operations, and shaping the Field ecosystem.",
      priceSubtext: "Forge Lifetime",
      cta: "Get Master",
      features: [
        "Everything in Builder",
        "Full local publishing and operation workflow",
        "Early Foundry publishing access",
        "Sub-agent network features",
        "Priority access to ecosystem experiments",
        "Founding Master status",
        "Better fit for serious Field creators",
      ],
      note: "This price is for Forge Master capability; Fount itself stays free. Future cloud hosting, paid compute, team collaboration, and marketplace promotion may require separate plans.",
      futureAnchor: "Future price: $199+",
    },
  },
};

const FOUNT_COMPARISON_ROWS: ComparisonRow[] = [
  { feature: "Connect with Fount", player: "Yes", builder: "Yes", master: "Yes" },
  { feature: "Basic sub-agents", player: "Yes", builder: "Yes", master: "Yes" },
  { feature: "Basic card workspace", player: "Yes", builder: "Yes", master: "Yes" },
  { feature: "Basic whiteboard workspace", player: "Yes", builder: "Yes", master: "Yes" },
  { feature: "Forge toolkit", player: "-", builder: "Yes", master: "Yes" },
  { feature: "Build custom Fields", player: "Limited", builder: "Yes", master: "Yes" },
  { feature: "Automated card generation", player: "Limited", builder: "Yes", master: "Yes" },
  { feature: "High-quality agent response experience", player: "-", builder: "Yes", master: "Yes" },
  { feature: "Advanced card and whiteboard workflows", player: "-", builder: "Yes", master: "Yes" },
  { feature: "Local publishing workflow", player: "-", builder: "Limited", master: "Yes" },
  { feature: "Foundry early publishing access", player: "-", builder: "-", master: "Yes" },
  { feature: "Sub-agent network features", player: "-", builder: "Limited", master: "Yes" },
  { feature: "Early access to new local features", player: "-", builder: "Yes", master: "Priority" },
  { feature: "Founding ecosystem status", player: "-", builder: "Builder", master: "Master" },
  { feature: "Future cloud services", player: "Separate", builder: "Separate", master: "Separate" },
];

const FOUNDING_INCLUDED = [
  "Local Fount experience",
  "Local Forge and Field workflows",
  "Card and whiteboard features included in your plan",
  "Early local feature updates",
  "Founding ecosystem status",
];

const FOUNDING_NOT_INCLUDED = [
  "Cloud sync",
  "Hosted agent runtime",
  "Paid model or compute usage",
  "Team collaboration",
  "Commercial Foundry promotion",
  "Marketplace growth services",
  "Enterprise or managed services",
];

const FOUNT_PRICING_FAQ: PricingFaqItem[] = [
  {
    question: "Is Player really free forever?",
    answer:
      "Yes. Player is free forever. It is designed as the entry point into Fount, with basic connection, sub-agent, card, and whiteboard experiences.",
  },
  {
    question: "What is the difference between Builder and Master?",
    answer:
      "Builder is for creating Fields with Forge. It includes the local toolkit, automated card generation, high-quality agent response experience, and advanced creation workflows. Master is for founding creators who want the full local publishing and operation workflow, early Foundry publishing access, sub-agent network features, and a stronger role in shaping the Fount ecosystem.",
  },
  {
    question: "What does Founding Lifetime include?",
    answer:
      "Founding Lifetime includes long-term access to the local Fount experience included in your plan. It is an early supporter offer for users who join before the product is fully mature. It includes the local core experience, Forge/Field workflows, and early access to local feature updates.",
  },
  {
    question: "Does Founding Lifetime include all future cloud services?",
    answer:
      "No. Future cloud services may require separate plans. This includes cloud sync, hosted agent runtime, paid compute, team collaboration, commercial Foundry promotion, marketplace growth services, and enterprise services.",
  },
  {
    question: "Why is the price lower during early access?",
    answer:
      "The product is still evolving. Early users receive a lower price because they are joining earlier, giving feedback, and helping shape the Fount ecosystem. As Fount becomes more complete, pricing may increase.",
  },
  {
    question: "Can I upgrade from Builder to Master later?",
    answer:
      "Upgrade support will be available during early access. The exact upgrade price can be calculated based on the product's purchase system.",
  },
  {
    question: "Can I use Fount without cloud services?",
    answer:
      "Yes. Fount is currently local-first. The core experience is designed to work without cloud services.",
  },
  {
    question: "Who should choose Master?",
    answer:
      "Choose Master if you want to publish, operate, and organize Fields more seriously, explore sub-agent network features, and become part of the founding layer of the Fount ecosystem.",
  },
  {
    question: "Will prices increase later?",
    answer:
      "Yes. Founding prices are early access prices and may increase as the product becomes more mature.",
  },
  {
    question: "Is this for developers only?",
    answer:
      "No. Fount is not only for developers. It is for anyone who wants to create and organize AI Fields, including creators, designers, independent builders, researchers, educators, and people exploring personal agents.",
  },
];

const PARTNER_AUDIENCE_TAGS = [
  "Creator",
  "Educator",
  "Builder",
  "Community",
  "Field Maker",
  "Agent Explorer",
];

const PARTNER_STEPS: PartnerStep[] = [
  {
    label: "Step 1",
    title: "Apply",
    body: "Tell us who you are, what audience you serve, and how you want to introduce Fount.",
  },
  {
    label: "Step 2",
    title: "Get your partner link",
    body: "Approved partners receive a Creem-powered referral link or coupon code for tracking referrals.",
  },
  {
    label: "Step 3",
    title: "Share real Fount workflows",
    body: "Create tutorials, videos, articles, newsletters, templates, demos, or community sessions.",
  },
  {
    label: "Step 4",
    title: "Earn commission",
    body: "Earn commission when referred users purchase eligible Fount plans.",
  },
];

const PARTNER_AUDIENCES: PartnerCard[] = [
  {
    title: "Tutorial creators",
    body: "People who make videos, articles, walkthroughs, or courses about AI agents, coding agents, productivity tools, or creative workflows.",
  },
  {
    title: "Community owners",
    body: "People who run Discord communities, newsletters, indie builder groups, AI tool communities, or creator groups.",
  },
  {
    title: "Builders and consultants",
    body: "People who help others build workflows, automations, personal tools, Mac apps, AI-native systems, or agent-based products.",
  },
  {
    title: "Field makers",
    body: "People who want to create their own Fields, templates, examples, workflows, or agent setups inside the Fount ecosystem.",
  },
];

const COMMISSION_TIERS: CommissionTier[] = [
  {
    title: "Public Affiliate",
    body: "For people who want to share Fount with their audience using a referral link.",
    lifetime: "20% one-time commission.",
    bestFor: "Newsletter mentions, blog posts, resource lists, tool directories, and light recommendations.",
  },
  {
    title: "Invited Ecosystem Partner",
    body: "For creators, educators, builders, and community owners who create meaningful tutorials, demos, workflows, templates, or Field examples.",
    lifetime: "25% one-time commission.",
    bestFor: "Video tutorials, launch reviews, courses, community workshops, Field templates, and serious product walkthroughs.",
  },
];

const EARNINGS_EXAMPLES: EarningsExample[] = [
  {
    title: "Builder Founding Lifetime",
    price: "$49",
    publicAffiliate: "20%",
    publicEstimate: "$9.80 before platform adjustments",
    invitedPartner: "25%",
    invitedEstimate: "$12.25 before platform adjustments",
  },
  {
    title: "Master Founding Lifetime",
    price: "$99",
    publicAffiliate: "20%",
    publicEstimate: "$19.80 before platform adjustments",
    invitedPartner: "25%",
    invitedEstimate: "$24.75 before platform adjustments",
  },
];

const PARTNER_BENEFITS: PartnerBenefit[] = [
  {
    title: "Referral link or coupon code",
    body: "Each approved partner receives a unique link or code for tracking referrals through Creem.",
  },
  {
    title: "Commission tracking",
    body: "Partners can track eligible referrals and commission through the affiliate system when available.",
  },
  {
    title: "Early access",
    body: "Partners receive early access to selected Fount features, Field examples, and ecosystem experiments.",
  },
  {
    title: "Partner materials",
    body: "Partners get screenshots, demo talking points, positioning notes, comparison notes, and launch copy.",
  },
  {
    title: "Ecosystem visibility",
    body: "High-quality tutorials, Fields, templates, or demos may be featured by Fount.",
  },
  {
    title: "Future Field opportunities",
    body: "As Foundry grows, partners may be able to publish, sell, or promote their own Fields, templates, and workflows.",
  },
];

const ENCOURAGED_PARTNER_CONTENT = [
  "Real product walkthroughs",
  "Field creation tutorials",
  "Agent workflow examples",
  "Before/after workflow demos",
  "Honest reviews",
  "Founder interviews",
  "Community workshops",
  "Template or Field showcases",
  "Educational content about personal agents",
];

const DISALLOWED_PARTNER_PROMOTION = [
  "Coupon spam",
  "Fake scarcity",
  "Misleading claims",
  "Impersonating Fount",
  "Claiming to be an official Fount employee",
  "Paid ads using the Fount brand name without permission",
  "Promising that all future cloud services are included forever",
  "Promising unlimited AI usage, unlimited cloud sync, or unlimited hosted agent runtime",
  "Misrepresenting Founding Lifetime as everything forever",
  "Fake reviews or undisclosed paid promotion where disclosure is legally required",
  "Low-quality traffic, bot traffic, or fraudulent signups",
];

const PARTNER_FAQ: PartnerFaqItem[] = [
  {
    question: "Is this an affiliate program or a partner program?",
    answer: [
      "Both. Fount uses affiliate tracking and commission, but we call it a Partner Program because we care more about real education, demos, Fields, and ecosystem building than generic link sharing.",
    ],
  },
  {
    question: "How much commission do partners earn?",
    answer: [
      "Public affiliates can earn 20% one-time commission for Founding Lifetime purchases.",
      "Invited ecosystem partners can earn 25% one-time commission for Founding Lifetime purchases.",
    ],
  },
  {
    question: "Can I promote Founding Lifetime?",
    answer: [
      "Yes. Founding Lifetime is the main early access offer. Please describe it accurately as long-term access to the local Fount experience included in the user's plan.",
      "Do not describe it as unlimited access to every future cloud service.",
    ],
  },
  {
    question: "When are commissions paid?",
    answer: [
      "Commission payment timing depends on Creem and the final payout configuration. Commissions are generally paid after successful payments are confirmed and refund windows are cleared.",
    ],
  },
  {
    question: "Can I use paid ads?",
    answer: [
      "Paid ads require approval. Partners may not bid on Fount brand keywords, impersonate Fount, or create ads that look like official Fount pages without permission.",
    ],
  },
  {
    question: "Can I create tutorials or templates?",
    answer: [
      "Yes. Tutorials, demos, templates, workflows, and Field examples are strongly encouraged. High-quality partner content may be featured by Fount.",
    ],
  },
  {
    question: "Will future cloud services have the same commission?",
    answer: [
      "Not necessarily. Future cloud services, paid compute, hosted runtime, marketplace promotion, and enterprise services may have separate commission rules.",
    ],
  },
];

const ROADMAP: StepItem[] = [
  {
    label: "Phase 1",
    title: { zh: "Fount Core + starter Fields", en: "Fount Core + starter Fields" },
    body: {
      zh: "跑通本地个人大脑、记忆、Field Runtime 和几个可体验 Field。",
      en: "Ship the local personal brain, memory, Field Runtime, and several usable starter Fields.",
    },
  },
  {
    label: "Phase 2",
    title: { zh: "Forge Lite", en: "Forge Lite" },
    body: {
      zh: "让普通用户能改配置、体验、角色和规则。",
      en: "Let ordinary users edit configuration, experience, roles, and rules.",
    },
  },
  {
    label: "Phase 3",
    title: { zh: "Foundry Alpha", en: "Foundry Alpha" },
    body: {
      zh: "开始发现、安装、发布和认证 Field。",
      en: "Start discovery, installation, publishing, and certification for Fields.",
    },
  },
  {
    label: "Phase 4",
    title: { zh: "SDK ecosystem", en: "SDK ecosystem" },
    body: {
      zh: "让外部产品通过 SDK 变成 Fount-aware Field。",
      en: "Let external products become Fount-aware Fields through the SDK.",
    },
  },
  {
    label: "Phase 5",
    title: { zh: "Commercial network", en: "Commercial network" },
    body: {
      zh: "完善同步、付费、授权、推荐、团队和开发者服务。",
      en: "Complete sync, payments, licensing, recommendations, teams, and developer services.",
    },
  },
];

const DASHBOARD_FIELDS: ConceptItem[] = [
  {
    name: "Reading Room",
    title: { zh: "quiet summary preference", en: "quiet summary preference" },
    body: {
      zh: "experience event written",
      en: "experience event written",
    },
    meta: { zh: "Memory-aware", en: "Memory-aware" },
  },
  {
    name: "UI Playground",
    title: { zh: "warm minimal line style", en: "warm minimal line style" },
    body: {
      zh: "ready for Forge recall",
      en: "ready for Forge recall",
    },
    meta: { zh: "Forge editable", en: "Forge editable" },
  },
  {
    name: "Finance Garden",
    title: { zh: "conservative risk boundary", en: "conservative risk boundary" },
    body: {
      zh: "permission request pending",
      en: "permission request pending",
    },
    meta: { zh: "Private", en: "Private" },
  },
  {
    name: "Agent Game",
    title: { zh: "cooperative agent interest", en: "cooperative agent interest" },
    body: {
      zh: "Foundry discovery signal",
      en: "Foundry discovery signal",
    },
    meta: { zh: "Agent Field", en: "Agent Field" },
  },
];

const DASHBOARD_FEED: LocalizedText[] = [
  {
    zh: "UI Playground 的视觉偏好已写回 Fount。",
    en: "UI Playground visual preference was written back to Fount.",
  },
  {
    zh: "Forge 请求读取界面偏好，级别 L2。",
    en: "Forge requested interface preference recall at level L2.",
  },
  {
    zh: "Foundry 推荐 3 个协作型 Agent Field。",
    en: "Foundry recommended 3 cooperative Agent Fields.",
  },
];

const MANIFEST_SNIPPET = `{
  "id": "reading-room",
  "type": "field",
  "fountAware": true,
  "permissions": ["memory:write", "agent:control"],
  "events": ["entered", "highlighted", "confused"],
  "forge": { "editable": ["ui", "rules", "agents"] }
}`;

const TESTIMONIALS: ConceptItem[] = [
  {
    name: "Yuchen",
    title: { zh: "Builder", en: "Builder" },
    body: {
      zh: "Fount 把我在不同 Field 里的习惯串起来，感觉不是在开应用，而是在进入自己的工作世界。",
      en: "Fount connects my habits across Fields. It feels less like opening apps and more like entering my own working world.",
    },
  },
  {
    name: "Lina",
    title: { zh: "Researcher", en: "Researcher" },
    body: {
      zh: "Learning Lab 里的困惑能被 Reading Room 记住，这个细节让知识真的变得可携带。",
      en: "Confusion from Learning Lab can be remembered in Reading Room. That detail makes knowledge feel genuinely portable.",
    },
  },
  {
    name: "Ray",
    title: { zh: "Creator", en: "Creator" },
    body: {
      zh: "Forge 最迷人的地方是：我不是只提需求，而是能和 Fount 一起改造 Field。",
      en: "The magic of Forge is that I do not just request changes. I reshape Fields together with Fount.",
    },
  },
];

const ACCOUNT_FEATURES: ConceptItem[] = [
  {
    name: "Identity",
    title: { zh: "统一登录与角色", en: "Unified login and roles" },
    body: {
      zh: "账号承接游客、普通用户、测试账号和管理员角色，决定哪些 Field、文档和资源可见。",
      en: "The account layer handles guest, user, tester, and admin roles, deciding which Fields, docs, and resources are visible.",
    },
  },
  {
    name: "Permission",
    title: { zh: "权限和购买状态", en: "Permissions and purchase state" },
    body: {
      zh: "Field 访问、作品解锁、商业授权和分享链接都应落在可审计的账户状态里。",
      en: "Field access, project unlocks, commercial rights, and share links belong in auditable account state.",
    },
  },
  {
    name: "Sync",
    title: { zh: "同步与设备边界", en: "Sync and device boundary" },
    body: {
      zh: "本地优先不等于没有身份。跨设备同步、记忆恢复和云服务都从账号边界开始。",
      en: "Local-first does not mean identity-free. Cross-device sync, memory restore, and cloud services begin at the account boundary.",
    },
  },
];

const FAQ_ITEMS: FaqItem[] = [
  {
    question: {
      zh: "Fount 和普通 AI 聊天助手有什么区别？",
      en: "How is Fount different from a normal AI chat assistant?",
    },
    answer: {
      zh: "普通助手主要在聊天框里回答问题；Fount 的重点是进入 Field，带着你的经验和权限边界参与真实产品现场，并把这次体验变成下一次行动的上下文。",
      en: "A normal assistant mainly answers inside a chat box. Fount enters Fields, carries your experience and permission boundaries into live product environments, and turns each session into context for the next action.",
    },
  },
  {
    question: {
      zh: "下载 Fount 后默认会有哪些 Field？",
      en: "Which Fields are available after downloading Fount?",
    },
    answer: {
      zh: "默认会有 Forge、Foundry、Memory、Permissions、Ledger 这些系统 Field，以及 Reading Room、UI Playground、Agent Game、Learning Lab、Finance Garden 这类 starter Fields。具体 starter Fields 可以随版本替换，但系统 Field 是生态的基础能力。",
      en: "Fount includes system Fields such as Forge, Foundry, Memory, Permissions, and Ledger, plus starter Fields like Reading Room, UI Playground, Agent Game, Learning Lab, and Finance Garden. Starter Fields may change by release; system Fields are the foundation.",
    },
  },
  {
    question: {
      zh: "Field 和普通 app 是一回事吗？",
      en: "Is a Field just another app?",
    },
    answer: {
      zh: "不是。普通 app 主要服务人；Field 同时服务人和 Fount。它需要声明 manifest、权限、事件、记忆通道、控制通道和可被 Forge 修改的范围。",
      en: "No. A normal app mainly serves a person; a Field serves both the person and Fount. It declares a manifest, permissions, events, memory channels, control channels, and the parts Forge may reshape.",
    },
  },
  {
    question: {
      zh: "Fount 会默认读取我的记忆、文件或网络权限吗？",
      en: "Does Fount read my memory, files, or network permissions by default?",
    },
    answer: {
      zh: "不会。页面里的原则是默认拒绝：记忆读写、本地文件、网络、资源预算、agent 控制、源码访问和跨 Field 召回都需要明确授权。",
      en: "No. The principle is deny-by-default: memory access, local files, network, resource budget, agent control, source access, and cross-field recall require explicit permission.",
    },
  },
  {
    question: {
      zh: "开发者怎样把自己的产品变成 Field？",
      en: "How can developers turn a product into a Field?",
    },
    answer: {
      zh: "通过 Fount SDK 声明 Field manifest、权限、experience events、memory sync、control channel 和 Forge editability。这样 Fount 才能理解产品结构，并在授权范围内进入和协作。",
      en: "Through the Fount SDK: declare a Field manifest, permissions, experience events, memory sync, control channel, and Forge editability. That lets Fount understand the product and collaborate inside permitted boundaries.",
    },
  },
  {
    question: {
      zh: "没有账号也能用吗？",
      en: "Can I use it without an account?",
    },
    answer: {
      zh: "基础体验应该本地优先，没有账号也能进入 Core、Runtime 和 starter Fields。账号主要用于跨设备同步、购买状态、角色权限、分享链接和官方服务。",
      en: "The base experience should be local-first: Core, Runtime, and starter Fields can work without an account. Accounts are for cross-device sync, purchase state, roles, share links, and official services.",
    },
  },
];

export function FountHomePage({
  lang,
  page = "home",
  onTabChange,
  onLangChange,
  themeMode,
  onThemeToggle,
}: FountHomePageProps) {
  const copy = COPY[lang];
  const text = (value: LocalizedText) => value[lang];
  const isPricingPage = page === "pricing";
  const isPartnersPage = page === "partners";
  const isUpdatesPage = page === "updates";
  const isBlogPage = page === "blog";
  const isFieldsPage = page === "fields";
  const isDocsPage = page === "docs";
  const isHomePage = page === "home";
  const [activeOutline, setActiveOutline] = useState<OutlineId>("vision");
  const [viewedHomeChapterIds, setViewedHomeChapterIds] = useState<HomeChapterId[]>([]);
  const [release, setRelease] = useState<FountReleaseManifest | null>(null);
  const downloadUrl = release?.downloads?.websiteUrl ?? "/Fount.dmg";
  const langParam = `lang=${lang}`;
  const homeHref = `/?${langParam}`;
  const updatesHref = `/?view=updates&${langParam}`;
  const pricingHref = `/?view=pricing&${langParam}`;
  const blogHref = `/blog?${langParam}`;
  const fieldsHref = `/fields?${langParam}`;
  const docsHref = `/docs?${langParam}`;
  const accountHref = `/?view=login&${langParam}`;
  const viewedHomeChapterIdSet = new Set(viewedHomeChapterIds);
  const viewedHomeCards = HOME_CHAPTERS.flatMap((chapter, chapterIndex) =>
    viewedHomeChapterIdSet.has(chapter.id) ? [{ chapter, chapterNumber: chapterIndex + 1 }] : [],
  );

  useEffect(() => {
    document.title = isPricingPage
      ? copy.pricingDocumentTitle
      : isPartnersPage
        ? copy.partnersDocumentTitle
        : isFieldsPage
          ? copy.fieldsDocumentTitle
          : isDocsPage
            ? copy.docsDocumentTitle
            : isUpdatesPage
              ? copy.updatesDocumentTitle
              : isBlogPage
                ? copy.blogDocumentTitle
                : copy.documentTitle;
  }, [
    copy.blogDocumentTitle,
    copy.documentTitle,
    copy.docsDocumentTitle,
    copy.fieldsDocumentTitle,
    copy.partnersDocumentTitle,
    copy.pricingDocumentTitle,
    copy.updatesDocumentTitle,
    isBlogPage,
    isDocsPage,
    isFieldsPage,
    isPartnersPage,
    isPricingPage,
    isUpdatesPage,
  ]);

  useEffect(() => {
    if (!isHomePage) {
      return;
    }

    const sectionIds: OutlineId[] = ["vision", "ecosystem", "product"];
    const updateActiveOutline = () => {
      const marker = window.scrollY + window.innerHeight * 0.34;
      let current: OutlineId = "vision";
      sectionIds.forEach((id) => {
        const section = document.getElementById(id);
        if (section && section.offsetTop <= marker) {
          current = id;
        }
      });
      setActiveOutline(current);
    };

    updateActiveOutline();
    window.addEventListener("scroll", updateActiveOutline, { passive: true });
    window.addEventListener("resize", updateActiveOutline);

    return () => {
      window.removeEventListener("scroll", updateActiveOutline);
      window.removeEventListener("resize", updateActiveOutline);
    };
  }, [isHomePage]);

  useEffect(() => {
    if (!isHomePage) {
      setViewedHomeChapterIds([]);
      return;
    }

    const chapterNodes = Array.from(document.querySelectorAll<HTMLElement>("[data-home-chapter]"));

    const revealChapter = (chapterId: string | undefined) => {
      if (!chapterId || !HOME_CHAPTER_ID_SET.has(chapterId as HomeChapterId)) {
        return;
      }

      const typedChapterId = chapterId as HomeChapterId;
      setViewedHomeChapterIds((currentIds) =>
        currentIds.includes(typedChapterId) ? currentIds : [...currentIds, typedChapterId],
      );
    };

    const revealVisibleChapters = () => {
      const activationLine = window.innerHeight * 0.42;
      chapterNodes.forEach((node) => {
        const rect = node.getBoundingClientRect();
        if (rect.top <= activationLine && rect.bottom >= 0) {
          revealChapter(node.dataset.homeChapter);
        }
      });
    };

    const observer =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  revealChapter((entry.target as HTMLElement).dataset.homeChapter);
                }
              });
            },
            { rootMargin: "0px 0px -58% 0px", threshold: 0.18 },
          )
        : null;

    chapterNodes.forEach((node) => observer?.observe(node));
    revealVisibleChapters();
    window.addEventListener("scroll", revealVisibleChapters, { passive: true });
    window.addEventListener("resize", revealVisibleChapters);

    return () => {
      observer?.disconnect();
      window.removeEventListener("scroll", revealVisibleChapters);
      window.removeEventListener("resize", revealVisibleChapters);
    };
  }, [isHomePage]);

  useEffect(() => {
    let cancelled = false;

    fetch("/releases/fount/latest.json", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled && data?.version) {
          setRelease(data as FountReleaseManifest);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRelease(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="fount-page fount-page-focused" data-lang={lang} data-page={page}>
      <header className="fount-header">
        <a
          className="fount-logo"
          href={isHomePage ? "#vision" : homeHref}
          aria-label="Fount home"
          onClick={
            isHomePage
              ? undefined
              : (event) => handleFountTabClick(event, "home", onTabChange)
          }
        >
          <span className="fount-logo-mark" aria-hidden="true">
            <img src="/fount/fount-logo-source.png" alt="" />
          </span>
          Fount
        </a>

        {isPricingPage ||
        isPartnersPage ||
        isBlogPage ||
        isUpdatesPage ? (
          <nav
            className="fount-nav fount-outline-nav fount-pricing-back-nav"
            aria-label={
              isPartnersPage
                ? "Fount Partner Program"
                : isBlogPage
                  ? copy.navBlog
                  : isUpdatesPage
                    ? copy.navUpdates
                    : copy.navPricing
            }
          >
            <a
              href={homeHref}
              onClick={(event) =>
                handleFountTabClick(event, "home", onTabChange)
              }
            >
              {copy.navHome}
            </a>
          </nav>
        ) : isHomePage ? (
          <nav className="fount-nav fount-outline-nav" aria-label="Fount page outline">
            {OUTLINE_ITEMS.map((item) => (
              <a
                className={activeOutline === item.id ? "active" : ""}
                href={`#${item.id}`}
                aria-current={activeOutline === item.id ? "location" : undefined}
                key={item.id}
              >
                {text(item.label)}
              </a>
            ))}
          </nav>
        ) : isDocsPage ? (
          <nav
            className="fount-nav fount-outline-nav fount-docs-outline-nav"
            aria-label={copy.navDocs}
          >
            {DOCS_OUTLINE_ITEMS.map((item) => (
              <a href={`#${item.id}`} key={item.id}>
                {text(item.label)}
              </a>
            ))}
          </nav>
        ) : null}

        <div className="fount-header-actions">
          <FountPrimaryNav
            activePage={page}
            hrefs={{
              home: homeHref,
              fields: fieldsHref,
              docs: docsHref,
              updates: updatesHref,
              blog: blogHref,
              pricing: pricingHref,
            }}
            lang={lang}
            onTabChange={onTabChange}
          />
          <div className="fount-header-utils">
            <div className="fount-lang-switch" aria-label="Language switcher">
              <button
                type="button"
                className={lang === "zh" ? "active" : ""}
                onClick={() => onLangChange("zh")}
              >
                中文
              </button>
              <button
                type="button"
                className={lang === "en" ? "active" : ""}
                onClick={() => onLangChange("en")}
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
              onClick={onThemeToggle}
            >
              <ThemeModeIcon mode={themeMode} />
            </button>
            <a className="fount-download-small" href={downloadUrl}>
              <span>{copy.download}</span>
            </a>
          </div>
          <a className="fount-account-link" href={accountHref}>
            {copy.navAccount}
          </a>
        </div>
      </header>

      <SocialLinks
        ariaLabel={copy.socialLinksAria}
        className="fount-social-links fount-social-rail"
        linkClassName="fount-social-link"
      />

      {isDocsPage ? (
        <FountDocsSection lang={lang} />
      ) : isFieldsPage ? (
        <FountFieldsSection lang={lang} />
      ) : isPricingPage ? (
        <FountPricingSection lang={lang} standalone />
      ) : isPartnersPage ? (
        <FountPartnerPage />
      ) : isUpdatesPage ? (
        <FountUpdatesSection lang={lang} />
      ) : isBlogPage ? (
        <FountBlogSection lang={lang} />
      ) : (
        <>
      <section className="fount-hero" id="vision">
        <div className="fount-hero-copy">
          <h1>{copy.heroTitle}</h1>
          <p className="fount-hero-deck">{copy.heroDeck}</p>
          <p className="fount-hero-sub">{copy.heroSub}</p>
          <div className="fount-actions fount-download-actions">
            <a className="fount-primary-action fount-body-download fount-hero-download" href={downloadUrl}>
              <span>{copy.macDownload}</span>
            </a>
            <small className="fount-platform-note">{copy.platformNote}</small>
          </div>

          <figure className="fount-product-preview">
            <img src="/fount/forge-product-screenshot.png" alt={copy.productImageAlt} />
          </figure>
        </div>

        <div
          className="fount-card-shelf"
          data-empty={viewedHomeCards.length === 0 ? "true" : undefined}
          aria-label={copy.cardShelfAria}
          aria-live="polite"
        >
          {viewedHomeCards.length > 0 ? (
            viewedHomeCards.map((card, index) => (
              <article
                className={`fount-build-card fount-build-card-${card.chapter.tone}`}
                key={card.chapter.id}
                style={{ "--card-index": index } as CSSProperties}
              >
                <span>{String(card.chapterNumber).padStart(2, "0")}</span>
                <strong>{text(card.chapter.title)}</strong>
                <p>{text(card.chapter.cardBody)}</p>
              </article>
            ))
          ) : (
            <div className="fount-card-library-empty" role="status">
              <span>{copy.cardShelfEmptyTitle}</span>
              <strong>{copy.cardShelfEmptyBody}</strong>
            </div>
          )}
        </div>
      </section>

      <section
        className="fount-scroll-chapters"
        aria-label={lang === "zh" ? "Fount 主页章节" : "Fount homepage chapters"}
      >
        {HOME_CHAPTERS.map((chapter, chapterIndex) => (
          <section
            className={`fount-scroll-chapter fount-scroll-chapter-${chapter.tone}`}
            data-home-chapter={chapter.id}
            id={`chapter-${chapter.id}`}
            key={chapter.id}
          >
            <div className="fount-scroll-chapter-index">{String(chapterIndex + 1).padStart(2, "0")}</div>
            <div className="fount-scroll-chapter-copy">
              <h2>{text(chapter.title)}</h2>
              <ol className="fount-scroll-chapter-list">
                {chapter.items.map((item) => (
                  <li
                    className={`fount-scroll-chapter-item fount-scroll-chapter-item-${item.kind ?? "line"}`}
                    key={item.label}
                  >
                    <span>{item.label}</span>
                    <div className="fount-scroll-chapter-item-copy">
                      {item.kind === "formula" ? (
                        <p className="fount-scroll-formula">
                          <code>{text(item.body)}</code>
                        </p>
                      ) : (
                        <p>{text(item.body)}</p>
                      )}
                      {item.note ? <small>{text(item.note)}</small> : null}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        ))}
      </section>

      <section className="fount-section fount-visual-section">
        <div className="fount-section-head fount-section-head-wide">
          <h2>{copy.visualTitle}</h2>
          <p>{copy.visualLead}</p>
        </div>
        <FountDashboard lang={lang} />
      </section>

      <section className="fount-section" id="concepts">
        <div className="fount-section-head fount-section-head-wide">
          <h2>{copy.definitionTitle}</h2>
          <p>{copy.definitionLead}</p>
        </div>

        <div className="fount-intro-grid">
          {CORE_CONCEPTS.map((concept) => (
            <article className="fount-thick-card" key={concept.name}>
              <span>{concept.name}</span>
              <div>
                <h3>{text(concept.title)}</h3>
                <p>{text(concept.body)}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="fount-field-grid fount-system-concepts">
          {SYSTEM_CONCEPTS.map((concept) => (
            <article className="fount-field-card" key={concept.name}>
              <div className="fount-field-card-top">
                <small>{concept.name}</small>
                <h3>{text(concept.title)}</h3>
              </div>
              <p>{text(concept.body)}</p>
            </article>
          ))}
        </div>

        <div className="fount-image-rail" aria-label={lang === "zh" ? "Fount 概念插图组" : "Fount concept illustration set"}>
          <img src="/fount/ai-hero-agent-fields.png" alt="" aria-hidden="true" />
          <img src="/fount/ai-architecture-stack.png" alt="" aria-hidden="true" />
          <img src="/fount/ai-account-system.png" alt="" aria-hidden="true" />
          <img src="/fount/ai-forge-foundry-ecosystem.png" alt="" aria-hidden="true" />
        </div>
      </section>

      <section className="fount-section fount-thesis-section">
        <div className="fount-field-anatomy">
          <div className="fount-field-world">
            <span className="fount-world-label">{copy.visionLabel}</span>
            <strong>{copy.visionTitle}</strong>
            <p>{copy.visionLead}</p>
          </div>
          <div className="fount-layer-grid">
            {VISION_EXAMPLES.map((example) => (
              <span className="fount-layer-note" key={example.name}>
                <b>{example.name}</b>
                <strong>{text(example.title)}</strong>
                <small>{text(example.body)}</small>
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="fount-section fount-story-section" id="ecosystem">
        <div className="fount-section-head">
          <h2>{copy.storyTitle}</h2>
          <p>{copy.storyLead}</p>
        </div>
        <div className="fount-system-explainer">
          <figure className="fount-system-image">
            <img
              src="/fount/ai-architecture-stack.png"
              alt={lang === "zh" ? "Fount 五层架构 AI 插图" : "AI illustration of the five-layer Fount architecture"}
            />
            <figcaption>
              {lang === "zh"
                ? "这张图只表达一件事：Field 提供现场，Fount 带着记忆进入，经验再回流。"
                : "One picture, one idea: Fields provide the environment, Fount enters with memory, and experience flows back."}
            </figcaption>
          </figure>
          <div className="fount-system-steps">
            {VISITOR_FLOW.map((step) => (
              <article key={step.label}>
                <span>{step.label}</span>
                <h3>{text(step.title)}</h3>
                <p>{text(step.body)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="fount-section fount-use-section" id="product">
        <div className="fount-section-head">
          <h2>{copy.useTitle}</h2>
          <p>{copy.useLead}</p>
        </div>
        <div className="fount-use-grid">
          {VISITOR_USE_CASES.map((item) => (
            <article className="fount-use-card" key={item.name}>
              <span>{item.name}</span>
              <h3>{text(item.title)}</h3>
              <p>{text(item.body)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="fount-section" id="architecture">
        <div className="fount-section-head">
          <h2>{copy.architectureTitle}</h2>
          <p>{copy.architectureLead}</p>
        </div>

        <div className="fount-field-grid">
          {ARCHITECTURE_LAYERS.map((layer) => (
            <article className="fount-field-card fount-layer-card" key={layer.label}>
              <div className="fount-field-card-top">
                <small>{layer.label}</small>
                <h3>{text(layer.title)}</h3>
              </div>
              <p>{text(layer.body)}</p>
              <div className="fount-pill-row">
                {layer.items.map((item) => (
                  <span key={text(item)}>{text(item)}</span>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className="fount-sdk-panel">
          <div className="fount-sdk-diagram">
            <div>{copy.packageTitle}</div>
            <div>Fount Core</div>
            <span>+</span>
            <div>Field Runtime</div>
            <span>+</span>
            <div>System Fields + Starter Fields</div>
          </div>
          <div className="fount-sdk-capabilities fount-package-copy">
            <h3>{copy.packageTitle}</h3>
            <p>{copy.packageLead}</p>
            <span>Fount.app</span>
            <span>local-first</span>
            <span>starter Fields</span>
            <span>system Fields</span>
          </div>
        </div>
      </section>

      <section className="fount-section fount-built-in-fields-section">
        <div className="fount-section-head fount-section-head-wide">
          <h2>{copy.builtInFieldsTitle}</h2>
          <p>{copy.builtInFieldsLead}</p>
        </div>

        <div className="fount-built-in-field-grid">
          {BUILT_IN_FIELDS.map((field) => (
            <article className="fount-field-card fount-built-in-field-card" key={field.name}>
              <div className="fount-field-card-top">
                <small>{field.meta ? text(field.meta) : "Field"}</small>
                <h3>{field.name}</h3>
              </div>
              <div>
                <strong>{text(field.title)}</strong>
                <p>{text(field.body)}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="fount-section" id="permissions">
        <div className="fount-section-head fount-section-head-wide">
          <h2>{copy.permissionsTitle}</h2>
          <p>{copy.permissionsLead}</p>
        </div>

        <p className="fount-permission-rule">{copy.permissionsRule}</p>

        <div className="fount-foundry-grid">
          {PERMISSIONS.map((permission) => (
            <article className="fount-foundry-card" key={permission.name}>
              <div>
                <h3>{text(permission.title)}</h3>
                <span>{permission.level}</span>
              </div>
              <p>{text(permission.body)}</p>
            </article>
          ))}
        </div>

        <div className="fount-forge-flow fount-permission-levels">
          {PERMISSION_LEVELS.map((level) => (
            <article className="fount-flow-step" key={level.label}>
              <span>{level.label}</span>
              <strong>{text(level.title)}</strong>
              <p>{text(level.body)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="fount-section" id="flow">
        <div className="fount-section-head fount-section-head-wide">
          <h2>{copy.flowTitle}</h2>
          <p>{copy.flowLead}</p>
        </div>

        <div className="fount-loop-chain">
          {EXPERIENCE_LOOP.map((step) => (
            <article className="fount-loop-node" key={step.label}>
              <span>{step.label}</span>
              <strong>{text(step.title)}</strong>
              <p>{text(step.body)}</p>
            </article>
          ))}
        </div>

        <div className="fount-section-head fount-section-head-wide fount-subsection-head">
          <h2>{copy.forgeTitle}</h2>
          <p>{copy.forgeLead}</p>
        </div>

        <div className="fount-forge-columns">
          {FORGE_FOUNDRY_BLOCKS.map((block) => (
            <article key={text(block.title)}>
              <h3>{text(block.title)}</h3>
              <p>{text(block.body)}</p>
              <ul>
                {block.items.map((item) => (
                  <li key={text(item)}>{text(item)}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="fount-field-grid">
          {FIELD_TYPES.map((field) => (
            <article className="fount-field-card" key={field.name}>
              <div className="fount-field-card-top">
                <small>{field.name}</small>
                <h3>{text(field.title)}</h3>
              </div>
              <p>{text(field.body)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="fount-section" id="open">
        <div className="fount-section-head">
          <h2>{copy.sdkTitle}</h2>
          <p>{copy.sdkLead}</p>
        </div>

        <div className="fount-sdk-panel">
          <div className="fount-sdk-diagram fount-manifest-card">
            <div>field.manifest.json</div>
            <pre>{MANIFEST_SNIPPET}</pre>
          </div>
          <div className="fount-sdk-capabilities">
            {SDK_CAPABILITIES.map((capability) => (
              <span key={capability}>{capability}</span>
            ))}
          </div>
        </div>

        <div className="fount-section-head fount-section-head-wide fount-subsection-head">
          <h2>{copy.openTitle}</h2>
          <p>{copy.openLead}</p>
        </div>

        <div className="fount-forge-columns">
          {OPEN_BLOCKS.map((block) => (
            <article key={text(block.title)}>
              <h3>{text(block.title)}</h3>
              <p>{text(block.body)}</p>
              <ul>
                {block.items.map((item) => (
                  <li key={text(item)}>{text(item)}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="fount-section fount-account-section" id="product">
        <div className="fount-section-head">
          <h2>{copy.accountTitle}</h2>
          <p>{copy.accountLead}</p>
        </div>
        <div className="fount-account-panel">
          <div className="fount-account-image">
            <img
              src="/fount/ai-account-system.png"
              alt={lang === "zh" ? "账号身份、权限和同步系统 AI 插图" : "AI illustration of account identity, permissions, and sync"}
            />
          </div>
          <div className="fount-account-copy">
            {ACCOUNT_FEATURES.map((feature) => (
              <article className="fount-field-card" key={feature.name}>
                <div className="fount-field-card-top">
                  <small>{feature.name}</small>
                  <h3>{text(feature.title)}</h3>
                </div>
                <p>{text(feature.body)}</p>
              </article>
            ))}
            <a className="fount-secondary-action" href={accountHref}>
              {copy.accountCta}
            </a>
          </div>
        </div>
      </section>

      <section className="fount-section" id="roadmap">
        <div className="fount-section-head">
          <h2>{copy.roadmapTitle}</h2>
          <p>{copy.roadmapLead}</p>
        </div>

        <div className="fount-pricing-grid">
          {BUSINESS_MODELS.map((model) => (
            <article className="fount-pricing-card" key={model.name}>
              <strong>{model.name}</strong>
              <h3>{text(model.title)}</h3>
              <p>{text(model.body)}</p>
            </article>
          ))}
        </div>

        <div className="fount-forge-flow fount-roadmap-flow">
          {ROADMAP.map((step) => (
            <article className="fount-flow-step" key={step.label}>
              <span>{step.label}</span>
              <strong>{text(step.title)}</strong>
              <p>{text(step.body)}</p>
            </article>
          ))}
        </div>

        <p className="fount-foundry-line">
          {lang === "zh"
            ? "Fount 是开放的个人 agent 大脑。Field 是可携带的经验环境。Forge 和 Foundry 是默认内置的系统级 Field。SDK 让普通产品变成 Field。官方服务提供创造、发现、认证、同步、分发和商业化能力。"
            : "Fount is an open personal agent brain. Fields are portable experience environments. Forge and Foundry are built-in system Fields. The SDK turns products into Fields. Official services provide creation, discovery, certification, sync, distribution, and commercialization."}
        </p>
      </section>

      <section className="fount-section fount-voices-section">
        <div className="fount-section-head">
          <h2>{lang === "zh" ? "来自 Field 生态的声音。" : "Voices from the Field ecosystem."}</h2>
          <p>
            {lang === "zh"
              ? "评论不是装饰。它让页面从抽象系统回到具体的人：开发者、研究者、创作者、阅读者。"
              : "Comments are not decoration. They pull the system back to people: builders, researchers, creators, and readers."}
          </p>
        </div>
        <div className="fount-voices-layout">
          <div className="fount-voices-image">
            <img
              src="/fount/ai-forge-foundry-ecosystem.png"
              alt={lang === "zh" ? "Forge、Foundry 和社区评论 AI 插图" : "AI illustration of Forge, Foundry, and community comments"}
            />
          </div>
          <div className="fount-voice-grid">
            {TESTIMONIALS.map((item) => (
              <article className="fount-foundry-card fount-voice-card" key={item.name}>
                <div>
                  <h3>{item.name}</h3>
                  <span>{text(item.title)}</span>
                </div>
                <p>{text(item.body)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="fount-section fount-faq-section">
        <div className="fount-section-head fount-section-head-wide">
          <h2>{copy.faqTitle}</h2>
          <p>{copy.faqLead}</p>
        </div>

        <div className="fount-faq-list">
          {FAQ_ITEMS.map((item) => (
            <article className="fount-faq-item" key={text(item.question)}>
              <h3>{text(item.question)}</h3>
              <p>{text(item.answer)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="fount-final-cta">
        <div>
          <h2>{copy.finalTitle}</h2>
          <p>{copy.finalBody}</p>
        </div>
        <div className="fount-actions">
          <a className="fount-primary-action fount-body-download fount-final-download" href={downloadUrl}>
            <span>{copy.macDownload}</span>
          </a>
          <a
            className="fount-secondary-action"
            href={docsHref}
            onClick={(event) =>
              handleFountTabClick(event, "docs", onTabChange)
            }
          >
            {copy.finalSecondary}
          </a>
        </div>
      </section>
        </>
      )}
      <FountFooter lang={lang} onTabChange={onTabChange} />
    </main>
  );
}

type FountFieldsView = "list" | "gallery";

function FountFieldsSection({ lang }: { lang: Lang }) {
  const copy = COPY[lang];
  const [selectedFieldKey, setSelectedFieldKey] = useState<string | null>(null);
  const [fieldsView, setFieldsView] = useState<FountFieldsView>("list");
  const selectedField =
    FOUNT_FIELDS.find((field) => field.key === selectedFieldKey) ?? null;

  useEffect(() => {
    if (!selectedFieldKey) {
      return;
    }

    resetFieldPageScroll();
    const frame = window.requestAnimationFrame(resetFieldPageScroll);

    return () => window.cancelAnimationFrame(frame);
  }, [selectedFieldKey]);

  const selectField = (
    event: ReactMouseEvent<HTMLAnchorElement>,
    fieldKey: string,
  ) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    event.currentTarget.blur();
    resetFieldPageScroll();
    setSelectedFieldKey(fieldKey);
  };

  const returnToFieldList = () => {
    setSelectedFieldKey(null);
    resetFieldPageScroll();
    window.requestAnimationFrame(() => {
      resetFieldPageScroll();
    });
  };

  if (selectedField) {
    const isVideoField = selectedField.embedType === "video";
    const selectedHref = isVideoField
      ? selectedField.href
      : withSiteParams(selectedField.href, { lang });

    return (
      <section
        className="fount-section fount-fields-page-section is-preview-open"
        id="fields"
      >
        <div className="fount-fields-workspace">
          <aside className="fount-fields-sidebar">
            <header className="fount-fields-sidebar-header">
              <div>
                <p>{copy.fieldsEyebrow}</p>
                <h1>{copy.fieldsTitle}</h1>
              </div>
              <button type="button" onClick={returnToFieldList}>
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M11.75 4.75 6.5 10l5.25 5.25" />
                </svg>
                <span>{copy.fieldsBackToList}</span>
              </button>
            </header>

            <nav
              className="fount-fields-sidebar-list"
              aria-label={copy.fieldsSwitchAria}
            >
              {FOUNT_FIELDS.map((field, index) => {
                const isActive = field.key === selectedField.key;

                return (
                  <a
                    className={isActive ? "is-active" : undefined}
                    href={
                      field.embedType === "video"
                        ? field.href
                        : withSiteParams(field.href, { lang })
                    }
                    aria-current={isActive ? "page" : undefined}
                    aria-label={`${copy.fieldsSwitchAria}: ${field.name}`}
                    key={field.key}
                    onClick={(event) => selectField(event, field.key)}
                  >
                    <figure>
                      <img
                        src={field.coverUrl}
                        alt=""
                        loading={index > 1 ? "lazy" : "eager"}
                      />
                    </figure>
                    <span className="fount-fields-sidebar-copy">
                      <small>{String(index + 1).padStart(2, "0")}</small>
                      <strong>{field.name}</strong>
                      <span>{field.kind[lang]}</span>
                    </span>
                    <i aria-hidden="true" />
                  </a>
                );
              })}
            </nav>
          </aside>

          <section
            className="fount-field-product-pane"
            aria-label={`${selectedField.name} ${
              isVideoField ? copy.fieldsVideoPage : copy.fieldsProductPage
            }`}
          >
            <header className="fount-field-product-toolbar">
              <div>
                <span>{selectedField.kind[lang]}</span>
                <strong>{selectedField.name}</strong>
                <code>{selectedField.previewUrl}</code>
              </div>
              <div className="fount-field-product-actions">
                <span className="fount-field-embed-hint">
                  {isVideoField ? copy.fieldsVideoHint : copy.fieldsEmbedHint}
                </span>
                <a href={selectedHref} target="_blank" rel="noreferrer">
                  <span>{copy.fieldsOpenSeparate}</span>
                  <svg viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M7.25 5.5H5.5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-1.75" />
                    <path d="M10 3.5h6.5V10M16.25 3.75 9 11" />
                  </svg>
                </a>
                <button
                  type="button"
                  aria-label={copy.fieldsBackToList}
                  title={copy.fieldsBackToList}
                  onClick={returnToFieldList}
                >
                  <svg viewBox="0 0 20 20" aria-hidden="true">
                    <path d="m5 5 10 10M15 5 5 15" />
                  </svg>
                </button>
              </div>
            </header>

            {isVideoField ? (
              <video
                key={`${selectedField.key}-${lang}`}
                className="fount-field-product-frame fount-field-product-video"
                controls
                playsInline
                preload="metadata"
                poster={selectedField.coverUrl}
              >
                <source src={selectedHref} type="video/mp4" />
              </video>
            ) : (
              <iframe
                key={`${selectedField.key}-${lang}`}
                className="fount-field-product-frame"
                src={selectedHref}
                title={`${selectedField.name} ${copy.fieldsProductPage}`}
                allow="clipboard-read; clipboard-write; fullscreen"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            )}
          </section>
        </div>
      </section>
    );
  }

  return (
    <section
      className={`fount-section fount-fields-page-section${
        fieldsView === "gallery" ? " is-gallery-view" : ""
      }`}
      data-fields-view={fieldsView}
      id="fields"
    >
      <header className="fount-fields-hero">
        <div className="fount-fields-hero-copy">
          <p className="fount-fields-eyebrow">{copy.fieldsEyebrow}</p>
          <h1>{copy.fieldsTitle}</h1>
          <p>{copy.fieldsLead}</p>
        </div>
        <div className="fount-fields-hero-tools">
          <div
            className="fount-fields-count"
            aria-label={`${FOUNT_FIELDS.length} ${copy.fieldsCount}`}
          >
            <strong>{String(FOUNT_FIELDS.length).padStart(2, "0")}</strong>
            <span>{copy.fieldsCount}</span>
          </div>
          <div
            className="fount-fields-view-switch"
            role="group"
            aria-label={copy.fieldsViewSwitchAria}
          >
            <button
              className={fieldsView === "list" ? "is-active" : undefined}
              type="button"
              aria-pressed={fieldsView === "list"}
              onClick={() => setFieldsView("list")}
            >
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d="M4 5.5h2M9 5.5h7M4 10h2M9 10h7M4 14.5h2M9 14.5h7" />
              </svg>
              <span>{copy.fieldsViewList}</span>
            </button>
            <button
              className={fieldsView === "gallery" ? "is-active" : undefined}
              type="button"
              aria-pressed={fieldsView === "gallery"}
              onClick={() => setFieldsView("gallery")}
            >
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <rect x="3.75" y="3.75" width="5" height="5" rx="1" />
                <rect x="11.25" y="3.75" width="5" height="5" rx="1" />
                <rect x="3.75" y="11.25" width="5" height="5" rx="1" />
                <rect x="11.25" y="11.25" width="5" height="5" rx="1" />
              </svg>
              <span>{copy.fieldsViewGallery}</span>
            </button>
          </div>
        </div>
      </header>

      <div
        className="fount-fields-list"
        role="list"
        aria-label={copy.fieldsListAria}
      >
        {FOUNT_FIELDS.map((field, index) => {
          return (
            <article
              className="fount-field-row"
              role="listitem"
              key={field.key}
              style={{ "--field-order": index } as CSSProperties}
            >
              <a
                href={
                  field.embedType === "video"
                    ? field.href
                    : withSiteParams(field.href, { lang })
                }
                aria-label={`${copy.fieldsOpen}: ${field.name}`}
                onClick={(event) => selectField(event, field.key)}
              >
                <div className="fount-field-index">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <small>{field.kind[lang]}</small>
                </div>

                <figure className="fount-field-cover">
                  <img
                    src={field.coverUrl}
                    alt={field.coverAlt[lang]}
                    loading={index > 1 ? "lazy" : "eager"}
                  />
                </figure>

                <div className="fount-field-copy">
                  <div className="fount-field-heading">
                    <h2>{field.name}</h2>
                    <span className="fount-field-status">{field.status[lang]}</span>
                  </div>
                  <p>{field.summary[lang]}</p>
                  <div className="fount-field-entry">
                    <code>{field.previewUrl}</code>
                    <span>
                      {copy.fieldsOpen}
                      <b aria-hidden="true">↗</b>
                    </span>
                  </div>
                </div>
              </a>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function resolvePartnerApplyHref() {
  const creemApplyUrl = (
    import.meta.env.NEXT_PUBLIC_CREEM_AFFILIATE_APPLY_URL ||
    import.meta.env.VITE_CREEM_AFFILIATE_APPLY_URL ||
    ""
  ).trim();

  if (creemApplyUrl) {
    return creemApplyUrl;
  }

  const contactEmail = (
    import.meta.env.NEXT_PUBLIC_PARTNER_CONTACT_EMAIL ||
    import.meta.env.VITE_PARTNER_CONTACT_EMAIL ||
    "partners@wordm.us"
  ).trim();

  return `mailto:${contactEmail}?subject=${encodeURIComponent("Fount Partner Program Application")}`;
}

function FountFooter({
  lang,
  onTabChange,
}: {
  lang: Lang;
  onTabChange?: (tab: FountPrimaryTab) => void;
}) {
  const langParam = `lang=${lang}`;

  return (
    <footer className="fount-footer" id="fount-footer">
      <div className="fount-footer-brand">
        <a
          className="fount-logo"
          href={`/?${langParam}`}
          aria-label="Fount home"
          onClick={(event) =>
            handleFountTabClick(event, "home", onTabChange)
          }
        >
          <span className="fount-logo-mark" aria-hidden="true">
            <img src="/fount/fount-logo-source.png" alt="" />
          </span>
          Fount
        </a>
        <p>Local-first personal agent framework for creating Fields.</p>
      </div>
      <nav className="fount-footer-grid" aria-label="Fount footer">
        <div>
          <strong>Product</strong>
          <a
            href={`/fields?${langParam}`}
            onClick={(event) =>
              handleFountTabClick(event, "fields", onTabChange)
            }
          >
            Fields
          </a>
          <a href={`/?view=pricing&${langParam}`}>Pricing</a>
          <a href="/Fount.dmg">Download</a>
          <a
            href={`/docs?${langParam}`}
            onClick={(event) =>
              handleFountTabClick(event, "docs", onTabChange)
            }
          >
            Docs
          </a>
        </div>
        <div>
          <strong>Ecosystem</strong>
          <a href={`/partners?${langParam}`}>Partner Program</a>
          <a href={`/?${langParam}#ecosystem`}>Field Creators</a>
          <a href={`/?view=updates&${langParam}`}>Updates</a>
        </div>
        <div>
          <strong>Resources</strong>
          <a href={`/blog?${langParam}`}>Blog</a>
          <a href={`/?${langParam}#open`}>Foundry</a>
          <a href={resolvePartnerApplyHref()}>Community</a>
        </div>
      </nav>
    </footer>
  );
}

function FountPartnerPage() {
  const applyHref = resolvePartnerApplyHref();

  return (
    <section className="fount-section fount-partner-page fount-partners-page-section" id="partners">
      <div className="fount-partner-hero">
        <div className="fount-partner-hero-copy">
          <h1>Become a Fount Partner.</h1>
          <p className="fount-partner-hero-lead">
            Help creators, builders, and AI agent explorers build their own Fields - and earn commission for bringing
            the right people into the Fount ecosystem.
          </p>
          <p>
            Fount is a local-first personal agent framework for creating Fields. We are looking for partners who can
            explain, teach, build, and share real workflows around personal agents and Field creation.
          </p>
          <div className="fount-pricing-actions">
            <a className="fount-pricing-primary-action" href={applyHref}>
              Apply to Join
            </a>
            <a className="fount-pricing-secondary-action" href="#commission">
              View Commission
            </a>
          </div>
          <small>
            Invite-first during early access. High-quality tutorials, demos, templates, and community education are
            prioritized.
          </small>
        </div>
        <div className="fount-partner-tag-board" aria-hidden="true">
          {PARTNER_AUDIENCE_TAGS.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </div>

      <PartnerHowItWorks />
      <PartnerAudience />
      <PartnerCommissionSection />
      <PartnerExampleEarnings />
      <PartnerBenefits />
      <PartnerPromotionGuidelines />
      <PartnerCloudBoundary />
      <PartnerApplyCTA applyHref={applyHref} />
      <PartnerFAQ />
      <FinalPartnerCTA applyHref={applyHref} />
    </section>
  );
}

function PartnerSectionTitle({
  kicker,
  title,
  children,
}: {
  kicker?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="fount-partner-section-title">
      {kicker ? <p>{kicker}</p> : null}
      <h2>{title}</h2>
      {children}
    </div>
  );
}

function PartnerHowItWorks() {
  return (
    <div className="fount-partner-paper-section">
      <PartnerSectionTitle kicker="Partner flow" title="How it works">
        <p>
          Fount uses Creem Affiliate Program for referral tracking, attribution, and commission management.
        </p>
      </PartnerSectionTitle>
      <div className="fount-partner-step-grid">
        {PARTNER_STEPS.map((step) => (
          <article className="fount-partner-step-card" key={step.title}>
            <span>{step.label}</span>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function PartnerAudience() {
  return (
    <div className="fount-partner-paper-section">
      <PartnerSectionTitle kicker="Audience" title="Who should join?">
        <p>
          The Fount Partner Program is designed for people who can help others understand and use personal agents,
          Field creation, and local-first AI workflows.
        </p>
      </PartnerSectionTitle>
      <div className="fount-partner-card-grid">
        {PARTNER_AUDIENCES.map((item) => (
          <article className="fount-partner-info-card" key={item.title}>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function PartnerCommissionSection() {
  return (
    <div className="fount-partner-paper-section fount-partner-commission" id="commission">
      <PartnerSectionTitle kicker="Commission" title="Commission">
        <p>
          During early access, Fount rewards partners who bring the right people into the ecosystem. The goal is to
          support real education, real demos, and high-trust recommendations.
        </p>
      </PartnerSectionTitle>
      <div className="fount-commission-grid">
        {COMMISSION_TIERS.map((tier) => (
          <article className="fount-commission-card" key={tier.title}>
            <h3>{tier.title}</h3>
            <p>{tier.body}</p>
            <dl>
              <div>
                <dt>Founding Lifetime</dt>
                <dd>{tier.lifetime}</dd>
              </div>
              <div>
                <dt>Best for</dt>
                <dd>{tier.bestFor}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
      <div className="fount-partner-note">
        <strong>Important note</strong>
        <p>
          Commission is calculated from eligible net revenue after refunds, chargebacks, taxes, platform fees, and
          applicable Creem affiliate fees.
        </p>
        <p>
          If Creem currently supports only one commission tier, use the public affiliate rate in Creem and handle
          invited partner bonuses manually until tiered commission is available.
        </p>
      </div>
    </div>
  );
}

function PartnerExampleEarnings() {
  return (
    <div className="fount-partner-paper-section">
      <PartnerSectionTitle kicker="Examples" title="Example earnings" />
      <div className="fount-earnings-grid">
        {EARNINGS_EXAMPLES.map((example) => (
          <article className="fount-earnings-card" key={example.title}>
            <div>
              <h3>{example.title}</h3>
              <span>{example.price}</span>
            </div>
            <dl>
              <div>
                <dt>Public Affiliate</dt>
                <dd>{example.publicAffiliate}</dd>
                <dd>{example.publicEstimate}</dd>
              </div>
              <div>
                <dt>Invited Partner</dt>
                <dd>{example.invitedPartner}</dd>
                <dd>{example.invitedEstimate}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
      <p className="fount-partner-small-note">
        Actual commission depends on successful payments, refunds, cancellations, taxes, platform fees, Creem affiliate
        fees, and final program settings.
      </p>
    </div>
  );
}

function PartnerBenefits() {
  return (
    <div className="fount-partner-paper-section">
      <PartnerSectionTitle kicker="Partner kit" title="What partners receive" />
      <div className="fount-benefit-list">
        {PARTNER_BENEFITS.map((benefit) => (
          <article key={benefit.title}>
            <h3>{benefit.title}</h3>
            <p>{benefit.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function PartnerPromotionGuidelines() {
  return (
    <div className="fount-partner-guidelines">
      <div className="fount-partner-paper-section">
        <PartnerSectionTitle kicker="Encouraged" title="What we encourage">
          <p>
            Fount works best when people can see real use cases. We prioritize partners who help users understand how
            to build with Fount.
          </p>
        </PartnerSectionTitle>
        <ul className="fount-partner-chip-list">
          {ENCOURAGED_PARTNER_CONTENT.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div className="fount-partner-paper-section">
        <PartnerSectionTitle kicker="Promotion rules" title="Promotion rules">
          <p>
            The partner program is meant to grow the Fount ecosystem with trust. Some promotion methods are not
            allowed.
          </p>
        </PartnerSectionTitle>
        <ul className="fount-partner-disallowed-list">
          {DISALLOWED_PARTNER_PROMOTION.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function PartnerCloudBoundary() {
  return (
    <div className="fount-partner-cloud-boundary">
      <div>
        <p>Cloud boundary for partners</p>
        <h2>Important: local-first product, future cloud separate.</h2>
        <p>
          Fount is currently focused on the local-first experience. Partners should describe Founding Lifetime
          accurately: it gives users long-term access to the local Fount experience included in their plan.
        </p>
        <p>
          Partners should not claim that Founding Lifetime includes every future cloud service, hosted runtime, paid
          compute, team collaboration feature, or marketplace promotion service forever.
        </p>
        <p>
          Future cloud services may require separate pricing, usage-based pricing, or new partner terms.
        </p>
      </div>
    </div>
  );
}

function PartnerApplyCTA({ applyHref }: { applyHref: string }) {
  return (
    <div className="fount-partner-apply" id="apply">
      <div>
        <p>Apply</p>
        <h2>Apply to join the Fount Partner Program</h2>
        <p>Tell us who you are, what audience you serve, and how you want to introduce Fount.</p>
      </div>
      <a className="fount-pricing-primary-action" href={applyHref}>
        Apply to Join
      </a>
    </div>
  );
}

function PartnerFAQ() {
  return (
    <div className="fount-partner-paper-section">
      <PartnerSectionTitle kicker="FAQ" title="Partner FAQ" />
      <div className="fount-pricing-faq-list">
        {PARTNER_FAQ.map((item, index) => (
          <details className="fount-pricing-faq-item" key={item.question} open={index === 0}>
            <summary>{item.question}</summary>
            {item.answer.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </details>
        ))}
      </div>
    </div>
  );
}

function FinalPartnerCTA({ applyHref }: { applyHref: string }) {
  return (
    <div className="fount-partner-final">
      <div>
        <h2>Help shape the first layer of the Fount ecosystem.</h2>
        <p>If you can teach, build, explain, or bring the right people into Fount, we would like to hear from you.</p>
      </div>
      <div className="fount-pricing-actions">
        <a className="fount-pricing-primary-action" href={applyHref}>
          Apply to Join
        </a>
        <a className="fount-pricing-secondary-action" href="/?view=pricing">
          Back to Pricing
        </a>
      </div>
    </div>
  );
}

function FountPricingSection({
  lang,
  standalone = false,
}: {
  lang: Lang;
  standalone?: boolean;
}) {
  const [earlyBirdStatus, setEarlyBirdStatus] = useState<EarlyBirdStatus>(
    FOUNT_EARLY_BIRD_INITIAL_STATUS,
  );
  const pricingCopy = FOUNT_PRICING_PAGE_COPY[lang];
  const earlyBirdLimit = Math.max(1, earlyBirdStatus.limit);
  const earlyBirdClaimed = Math.min(earlyBirdLimit, Math.max(0, earlyBirdStatus.claimed));
  const earlyBirdActive = earlyBirdStatus.active && earlyBirdClaimed < earlyBirdLimit;
  const foundingHref = FOUNT_PRICING_PLANS.find((plan) => plan.id === "master")?.href ?? "#pricing-cards";
  const playerHref = FOUNT_PRICING_PLANS[0]?.href ?? "/Fount.dmg";

  useEffect(() => {
    let cancelled = false;

    fetch("/api/fount-early-bird-status", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled || !data || typeof data !== "object") {
          return;
        }

        const claimed = Number((data as EarlyBirdStatus).claimed);
        const limit = Number((data as EarlyBirdStatus).limit);
        if (!Number.isFinite(claimed) || !Number.isFinite(limit) || limit <= 0) {
          return;
        }

        const normalizedClaimed = Math.min(limit, Math.max(0, claimed));
        setEarlyBirdStatus({
          claimed: normalizedClaimed,
          limit,
          active: Boolean((data as EarlyBirdStatus).active) && normalizedClaimed < limit,
        });
      })
      .catch(() => {
        // Keep build-time fallback status when the runtime counter is unavailable.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const getPlanPrice = (plan: PricingPlan) =>
    earlyBirdActive && plan.earlyBirdLifetimePrice
      ? plan.earlyBirdLifetimePrice
      : plan.price;

  const getPlanHref = (plan: PricingPlan) =>
    earlyBirdActive && plan.earlyBirdLifetimeHref
      ? plan.earlyBirdLifetimeHref
      : plan.href;

  const getPlanCopy = (plan: PricingPlan) => FOUNT_PRICING_PLAN_COPY[lang][plan.id];

  const getPlanPriceNote = (plan: PricingPlan) => {
    if (earlyBirdActive && plan.earlyBirdNextPrice) {
      return pricingCopy.earlyBirdNote(plan.earlyBirdNextPrice);
    }

    return getPlanCopy(plan).futureAnchor;
  };

  return (
    <section
      className={`fount-section fount-pricing-section fount-pricing-longform${standalone ? " fount-pricing-page-section" : ""}`}
      id="pricing"
      data-lang={lang}
    >
      <div className="fount-pricing-hero fount-pricing-hero-compact">
        <div className="fount-pricing-hero-copy">
          <p className="fount-pricing-page-label">{pricingCopy.label}</p>
          <h1>{pricingCopy.title}</h1>
          <p className="fount-pricing-hero-lead">{pricingCopy.lead}</p>
        </div>
        <p className="fount-pricing-purchase-note">{pricingCopy.purchaseNote}</p>
      </div>

      <div className="fount-pricing-grid fount-pricing-grid-focused" id="pricing-cards">
        {FOUNT_PRICING_PLANS.map((plan) => {
          const planCopy = getPlanCopy(plan);
          const priceNote = getPlanPriceNote(plan);

          return (
            <article
              className={`fount-pricing-card fount-pricing-tier fount-pricing-plan-${plan.id}${plan.featured ? " fount-pricing-tier-featured" : ""}`}
              id={`pricing-${plan.id}`}
              key={plan.id}
            >
              <div className="fount-tier-decoration" aria-hidden="true">
                <span className="fount-tier-deco-grid" />
                <span className="fount-tier-deco-scan" />
                <span className="fount-tier-deco-orbit fount-tier-deco-orbit-outer" />
                <span className="fount-tier-deco-orbit fount-tier-deco-orbit-inner" />
                <span className="fount-tier-deco-particle fount-tier-deco-particle-one" />
                <span className="fount-tier-deco-particle fount-tier-deco-particle-two" />
                <span className="fount-tier-deco-particle fount-tier-deco-particle-three" />
              </div>
              <div className="fount-pricing-tier-head">
                <div>
                  <span className="fount-plan-badge">{planCopy.badge}</span>
                  <h3>{plan.name}</h3>
                </div>
                {planCopy.sticker ? <span className="fount-plan-sticker">{planCopy.sticker}</span> : null}
              </div>
              <p className="fount-plan-description">{planCopy.description}</p>
              <div className="fount-pricing-price" aria-label={`${plan.name} ${getPlanPrice(plan)}`}>
                <strong className="fount-pricing-amount">{getPlanPrice(plan)}</strong>
                <span className="fount-pricing-unit">{planCopy.priceSubtext}</span>
              </div>
              <p className="fount-pricing-price-note">{priceNote ?? "\u00a0"}</p>
              <a className={plan.featured ? "fount-pricing-primary-action" : "fount-pricing-secondary-action"} href={getPlanHref(plan)}>
                {planCopy.cta}
              </a>
              <div className="fount-plan-includes">
                <span>{lang === "zh" ? "包含" : "Includes"}</span>
                <ul>
                  {planCopy.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </div>
              <p className="fount-plan-note">{planCopy.note}</p>
            </article>
          );
        })}
      </div>

      <div className="fount-comparison-section">
        <div className="fount-pricing-section-title">
          <p>Plan comparison</p>
          <h2>Choose by how far you want to take your Fields.</h2>
        </div>
        <div className="fount-comparison-table-wrap">
          <table className="fount-comparison-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>Player</th>
                <th>Builder</th>
                <th>Master</th>
              </tr>
            </thead>
            <tbody>
              {FOUNT_COMPARISON_ROWS.map((row) => (
                <tr key={row.feature}>
                  <th scope="row">{row.feature}</th>
                  <td>{row.player}</td>
                  <td>{row.builder}</td>
                  <td>{row.master}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="fount-founding-section">
        <div className="fount-pricing-section-title">
          <p>Founding Lifetime</p>
          <h2>What does Founding Lifetime mean?</h2>
        </div>
        <div className="fount-founding-copy">
          <p>
            Founding Lifetime Access is an early supporter offer. You pay once and receive long-term access to the local
            Fount experience included in your plan. It is designed for early users who want to support the product before
            it is fully mature and help shape the Fount ecosystem from the beginning.
          </p>
          <p>
            It includes the local core experience, Forge/Field creation features, and early access to the evolving
            ecosystem. It does not mean every future cloud service, hosted runtime, paid compute, team collaboration
            feature, or marketplace promotion service will be free forever.
          </p>
        </div>
        <div className="fount-founding-grid">
          <article className="fount-founding-card fount-founding-card-included">
            <h3>Included</h3>
            <ul>
              {FOUNDING_INCLUDED.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className="fount-founding-card">
            <h3>Not automatically included</h3>
            <ul>
              {FOUNDING_NOT_INCLUDED.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
        <a className="fount-pricing-primary-action" href={foundingHref}>
          Get Founding Access
        </a>
      </div>

      <div className="fount-cloud-boundary">
        <div>
          <p>Cloud boundary</p>
          <h2>Local-first now. Cloud later.</h2>
          <p>
            Fount is currently focused on the local-first experience. You can use the core framework, build Fields, work
            with cards and agents, and explore the ecosystem without relying on cloud services.
          </p>
          <p>
            In the future, Fount may introduce optional cloud services such as sync, hosted agent runtime, team
            collaboration, paid compute, and Foundry promotion. These services may have separate pricing because they
            carry ongoing infrastructure costs.
          </p>
        </div>
        <div className="fount-cloud-diagram" aria-hidden="true">
          <span>Future optional cloud layer</span>
          <div>Local Fount</div>
          <b>{"->"}</b>
          <div>Fields</div>
          <b>{"->"}</b>
          <div>Foundry</div>
        </div>
      </div>

      <div className="fount-partner-cta">
        <div>
          <p>Partner Program</p>
          <h2>Help grow the Fount ecosystem.</h2>
          <p>
            Fount is looking for creators, educators, community owners, indie builders, and AI agent enthusiasts who
            can help more people understand personal agents, Field creation, and local-first AI workflows.
          </p>
          <p>
            Join the Fount Partner Program to earn commission, receive early access, and help bring the first
            generation of Fields into the ecosystem.
          </p>
          <small>
            Best for tutorial creators, newsletter writers, community owners, automation consultants, and AI agent
            builders.
          </small>
        </div>
        <div className="fount-partner-cta-side">
          <div className="fount-partner-cta-tags" aria-hidden="true">
            {PARTNER_AUDIENCE_TAGS.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          <div className="fount-pricing-actions">
            <a className="fount-pricing-primary-action" href="/partners">
              Join Partner Program
            </a>
            <a className="fount-pricing-secondary-action" href="/partners#commission">
              View Commission
            </a>
          </div>
        </div>
      </div>

      <div className="fount-pricing-faq">
        <div className="fount-pricing-section-title">
          <p>FAQ</p>
          <h2>Clear boundaries before you buy.</h2>
        </div>
        <div className="fount-pricing-faq-list">
          {FOUNT_PRICING_FAQ.map((item, index) => (
            <details className="fount-pricing-faq-item" key={item.question} open={index === 0}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </div>

      <div className="fount-pricing-final-cta">
        <div className="fount-floating-card-cloud" aria-hidden="true">
          {["Agent", "Card", "Field", "Forge", "Foundry", "Memory", "Workflow"].map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <div>
          <h2>Join the founding layer of Fount.</h2>
          <p>
            Start free with Player, build your first Field with Builder, or become a founding Master and help shape the
            future of the Fount ecosystem.
          </p>
          <div className="fount-pricing-actions">
            <a className="fount-pricing-primary-action" href={foundingHref}>
              Get Founding Access
            </a>
            <a className="fount-pricing-secondary-action" href={playerHref}>
              Start Free
            </a>
          </div>
          <small>Local-first early access. Future cloud services may require separate plans.</small>
        </div>
      </div>
    </section>
  );
}

function FountBlogSection({ lang }: { lang: Lang }) {
  const copy = COPY[lang];
  const articles = BLOG_ARTICLES;

  return (
    <section className="fount-section fount-blog-page-section" id="blog">
      <div className="fount-section-head fount-section-head-wide">
        <div>
          <p className="fount-pricing-page-label">{copy.navBlog}</p>
          <h1>{copy.blogTitle}</h1>
        </div>
        <p>{copy.blogLead}</p>
      </div>

      <div className="fount-blog-page-grid">
        {articles.map((article) => {
          const summary = article.summary[lang].trim();
          const note = article.note[lang].trim();
          const sourceLabel =
            article.source === "x"
              ? "X"
              : article.source === "substack"
                ? "Substack"
                : "Fount";

          return (
            <article className="fount-blog-page-card" key={article.id}>
              <div className="fount-blog-page-meta">
                <span>{article.date}</span>
                <span>{article.category[lang]}</span>
                <span>{sourceLabel}</span>
              </div>
              <h2>{article.title[lang]}</h2>
              {summary ? <p>{summary}</p> : null}
              {note ? <strong>{note}</strong> : null}
              {article.sourceUrl ? (
                <a className="fount-release-notes-link" href={article.sourceUrl} target="_blank" rel="noreferrer">
                  {lang === "zh" ? "查看原文" : "Open original"}
                </a>
              ) : null}
            </article>
          );
        })}
      </div>

      {articles.length === 0 ? (
        <p className="fount-release-empty">{copy.blogEmpty}</p>
      ) : null}
    </section>
  );
}

function FountUpdatesSection({ lang }: { lang: Lang }) {
  const copy = COPY[lang];
  const [releases, setReleases] = useState<FountReleaseEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch("/releases/fount/releases.json", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled) {
          setReleases(Array.isArray(data?.releases) ? data.releases : []);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setReleases([]);
          setLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="fount-section fount-updates-page-section" id="updates">
      <div className="fount-section-head fount-section-head-wide">
        <div>
          <p className="fount-pricing-page-label">{copy.navUpdates}</p>
          <h1>{copy.updatesTitle}</h1>
        </div>
        <p>{copy.updatesLead}</p>
      </div>

      <div className="fount-release-history">
        {releases.map((release) => (
          <article className="fount-release-history-card" key={`${release.version}-${release.build}`}>
            <div className="fount-release-history-version">
              <span>Fount</span>
              <h2>{release.version}</h2>
            </div>
            <div className="fount-release-history-body">
              <p>{release.notes?.summary ?? copy.releaseFallbackBody}</p>
              <div className="fount-release-history-meta">
                <code>build {release.build}</code>
                <code>{formatReleaseDate(release.releasedAt, lang)}</code>
                {release.downloads?.sha256 ? (
                  <code>{copy.releaseChecksum}: {release.downloads.sha256.slice(0, 12)}</code>
                ) : null}
                {release.downloads?.sizeBytes ? (
                  <code>{formatReleaseSize(release.downloads.sizeBytes)}</code>
                ) : null}
              </div>
              {release.notes?.websiteMarkdownUrl ? (
                <a className="fount-release-notes-link" href={release.notes.websiteMarkdownUrl}>
                  {copy.releaseNotes}
                </a>
              ) : null}
            </div>
          </article>
        ))}
        {loaded && releases.length === 0 ? (
          <p className="fount-release-empty">{copy.updatesEmpty}</p>
        ) : null}
      </div>
    </section>
  );
}

function FountDashboard({ lang }: { lang: Lang }) {
  const copy = COPY[lang];
  const text = (value: LocalizedText) => value[lang];

  return (
    <section className="fount-dashboard" aria-label="Fount system preview">
      <div className="fount-dashboard-top">
        <div>
          <span>Fount</span>
          <strong>{copy.dashboardTitle}</strong>
        </div>
        <p>{copy.dashboardStatus}</p>
      </div>

      <div className="fount-dashboard-body">
        <aside className="fount-dashboard-sidebar">
          {ARCHITECTURE_LAYERS.map((layer, index) => (
            <span className={index === 0 ? "active" : ""} key={layer.label}>
              {text(layer.title)}
            </span>
          ))}
        </aside>

        <div className="fount-dashboard-main">
          <div className="fount-dashboard-heading">
            <div>
              <strong>Field Runtime</strong>
              <span>manifest + permissions + events</span>
            </div>
            <button type="button">sync</button>
          </div>

          <div className="fount-field-mini-grid">
            {DASHBOARD_FIELDS.map((field) => (
              <article className="fount-field-mini-card" key={field.name}>
                <div>
                  <strong>{field.name}</strong>
                  <span>{field.meta ? text(field.meta) : "Field"}</span>
                </div>
                <p>{text(field.title)}</p>
                <small>{text(field.body)}</small>
              </article>
            ))}
          </div>
        </div>

        <aside className="fount-dashboard-feed">
          <strong>{copy.dashboardFeed}</strong>
          {DASHBOARD_FEED.map((item) => (
            <p key={text(item)}>{text(item)}</p>
          ))}
        </aside>
      </div>
    </section>
  );
}

function formatReleaseDate(value: string, lang: Lang) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(lang === "zh" ? "zh-CN" : "en-US");
}

function formatReleaseSize(sizeBytes: number) {
  const sizeMb = sizeBytes / 1024 / 1024;
  return `${sizeMb.toFixed(1)} MB`;
}
