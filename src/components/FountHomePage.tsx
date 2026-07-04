import { useEffect, useState } from "react";
import type { Lang } from "../i18n/lang";
import { SocialLinks } from "./SocialLinks";
import { ThemeModeIcon } from "./ThemeModeIcon";

type FountHomePageProps = {
  lang: Lang;
  page?: "home" | "pricing" | "updates";
  onLangChange: (lang: Lang) => void;
  themeMode: "day" | "night";
  onThemeToggle: () => void;
};

type LocalizedText = Record<Lang, string>;

type ConceptItem = {
  name: string;
  title: LocalizedText;
  body: LocalizedText;
  meta?: LocalizedText;
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

type PricingTier = {
  name: string;
  title: LocalizedText;
  price: LocalizedText;
  priceCurrency?: LocalizedText;
  priceUnit?: LocalizedText;
  body: LocalizedText;
  items: LocalizedText[];
  undetermined?: boolean;
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

const SYSTEM_DOCS_URL = "https://system.wordm.us";

const OUTLINE_ITEMS: Array<{ id: OutlineId; label: LocalizedText }> = [
  { id: "vision", label: { zh: "愿景", en: "Vision" } },
  { id: "ecosystem", label: { zh: "生态", en: "Ecosystem" } },
  { id: "product", label: { zh: "产品", en: "Product" } },
];

const COPY = {
  zh: {
    documentTitle: "Fount | 开放的个人 Agent 大脑",
    pricingDocumentTitle: "Fount Pricing | Player / Explorer / Master",
    updatesDocumentTitle: "Fount 更新记录 | Release History",
    navHome: "首页",
    navConcepts: "概念",
    navArchitecture: "架构",
    navPermissions: "权限",
    navFlow: "循环",
    navOpen: "开放",
    navRoadmap: "路线",
    navBlog: "博客",
    navDocs: "文档",
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
    heroTitle: "Fount",
    heroDeck: "让你的 agent 不只会聊天，而是能记住经验、进入现场、改造工具。",
    heroSub: "Fount 是个人 agent 大脑；Field 是它进入的产品现场。",
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
      "从先玩起来，到长期探索，再到完整掌控你的 Field 生态。三档都围绕同一个目标：让 Fount 记住经验，并把经验带回下一次行动。",
    accountTitle: "账号系统是 Fount 的身份与权限层。",
    accountLead:
      "登录、角色、权限、同步和购买状态都应该在同一个账户系统里被管理。Fount 不是无状态访问入口，而是有身份边界的个人 agent 大脑。",
    accountCta: "进入账号",
    faqTitle: "常见问题",
    faqLead: "把第一次看到 Fount 时最容易卡住的问题放在这里：它是什么、带什么、怎么保护权限，以及为什么 Field 生态值得存在。",
  },
  en: {
    documentTitle: "Fount | Open Personal Agent Brain",
    pricingDocumentTitle: "Fount Pricing | Player / Explorer / Master",
    updatesDocumentTitle: "Fount Updates | Release History",
    navHome: "Home",
    navConcepts: "Concepts",
    navArchitecture: "Architecture",
    navPermissions: "Permissions",
    navFlow: "Loop",
    navOpen: "Open",
    navRoadmap: "Roadmap",
    navBlog: "Blog",
    navDocs: "Docs",
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
    heroTitle: "Fount",
    heroDeck: "An agent that does more than chat: it remembers experience, enters live environments, and reshapes tools.",
    heroSub: "Fount is the personal agent brain. Fields are the product environments it enters.",
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
      "Start by playing, keep exploring, then fully command your Field ecosystem. Each tier keeps the same promise: Fount remembers experience and carries it into the next action.",
    accountTitle: "Account is the identity and permission layer for Fount.",
    accountLead:
      "Login, roles, permissions, sync, and purchase state should be managed through one account system. Fount is not a stateless entry point; it is a personal agent brain with identity boundaries.",
    accountCta: "Open Account",
    faqTitle: "FAQ",
    faqLead: "The questions that usually block a first read: what Fount is, what comes inside it, how permissions work, and why the Field ecosystem exists.",
  },
} as const;

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

const VISITOR_PROMISES: ConceptItem[] = [
  {
    name: "Remember",
    title: { zh: "记得住", en: "Remembers" },
    body: {
      zh: "偏好、目标、选择和失败不会散落在不同工具里。",
      en: "Preferences, goals, choices, and failures do not scatter across tools.",
    },
  },
  {
    name: "Enter",
    title: { zh: "进得去", en: "Enters" },
    body: {
      zh: "Fount 和你一起进入 Field，而不是在聊天框外猜现场。",
      en: "Fount enters Fields with you instead of guessing outside the product.",
    },
  },
  {
    name: "Reshape",
    title: { zh: "改得动", en: "Reshapes" },
    body: {
      zh: "授权以后，Forge 可以把体验改成更适合你的版本。",
      en: "With permission, Forge can reshape the experience around you.",
    },
  },
];

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

const PRICING_TIERS: PricingTier[] = [
  {
    name: "Player",
    title: { zh: "先进入、先玩起来", en: "Enter and start playing" },
    price: { zh: "0", en: "0" },
    priceCurrency: { zh: "¥", en: "$" },
    priceUnit: { zh: "永久免费", en: "free forever" },
    body: {
      zh: "适合先体验 Fount.app、本地 Core 和 starter Fields。",
      en: "For trying Fount.app, local Core, and starter Fields first.",
    },
    items: [
      { zh: "本地个人 agent 大脑", en: "Local personal agent brain" },
      { zh: "基础 Field Runtime", en: "Base Field Runtime" },
      { zh: "Starter Fields 与基础记忆", en: "Starter Fields and base memory" },
    ],
  },
  {
    name: "Explorer",
    title: { zh: "跨 Field 持续探索", en: "Explore across Fields" },
    price: { zh: "待定", en: "TBD" },
    priceUnit: { zh: "即将公布", en: "announced soon" },
    undetermined: true,
    body: {
      zh: "适合希望跨设备同步、扩大记忆、使用更多 Field 的个人用户。",
      en: "For people who want sync, deeper memory, and more usable Fields.",
    },
    items: [
      { zh: "云同步与跨设备连续性", en: "Cloud sync and cross-device continuity" },
      { zh: "更大记忆与更多 Field", en: "Larger memory and more Fields" },
      { zh: "Foundry 发现与安装", en: "Foundry discovery and installation" },
    ],
  },
  {
    name: "Master",
    title: { zh: "创造、改造、发布 Field", en: "Create, reshape, and publish Fields" },
    price: { zh: "待定", en: "TBD" },
    priceUnit: { zh: "即将公布", en: "announced soon" },
    undetermined: true,
    body: {
      zh: "适合创作者、开发者和团队，把 Forge、测试、发布和商业化接起来。",
      en: "For creators, developers, and teams connecting Forge, testing, publishing, and commercialization.",
    },
    items: [
      { zh: "Forge Pro 创作与改造", en: "Forge Pro creation and reshaping" },
      { zh: "源码协作、模拟、测试", en: "Source collaboration, simulation, and testing" },
      { zh: "发布、认证、授权和更新", en: "Publishing, certification, licensing, and updates" },
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
  onLangChange,
  themeMode,
  onThemeToggle,
}: FountHomePageProps) {
  const copy = COPY[lang];
  const text = (value: LocalizedText) => value[lang];
  const isPricingPage = page === "pricing";
  const isUpdatesPage = page === "updates";
  const isHomePage = page === "home";
  const [activeOutline, setActiveOutline] = useState<OutlineId>("vision");
  const [release, setRelease] = useState<FountReleaseManifest | null>(null);
  const downloadUrl = release?.downloads?.websiteUrl ?? "/Fount.dmg";
  const blogHref = lang === "en" ? "/blog?lang=en" : "/blog";
  const accountHref = lang === "en" ? "/?view=login&lang=en" : "/?view=login";

  useEffect(() => {
    document.title = isPricingPage
      ? copy.pricingDocumentTitle
      : isUpdatesPage
        ? copy.updatesDocumentTitle
        : copy.documentTitle;
  }, [
    copy.documentTitle,
    copy.pricingDocumentTitle,
    copy.updatesDocumentTitle,
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
        <a className="fount-logo" href={isHomePage ? "#vision" : "/"} aria-label="Fount home">
          <span className="fount-logo-mark" aria-hidden="true">
            <img src="/fount/fount-logo-source.png" alt="" />
          </span>
          Fount
        </a>

        {isPricingPage ? (
          <nav
            className="fount-nav fount-outline-nav fount-pricing-back-nav"
            aria-label={copy.navPricing}
          >
            <a href="/">{copy.navHome}</a>
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
        ) : null}

        <div className="fount-header-actions">
          <nav className="fount-site-nav" aria-label="Site links">
            <a href={SYSTEM_DOCS_URL} target="_blank" rel="noreferrer">
              {copy.navDocs}
            </a>
            <a
              href="/?view=updates"
              className={isUpdatesPage ? "active" : ""}
              aria-current={isUpdatesPage ? "page" : undefined}
            >
              {copy.navUpdates}
            </a>
            <a href={blogHref}>{copy.navBlog}</a>
            <a
              href="/?view=pricing"
              className={isPricingPage ? "active" : ""}
              aria-current={isPricingPage ? "page" : undefined}
            >
              {copy.navPricing}
            </a>
          </nav>
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

      {isPricingPage ? (
        <FountPricingSection lang={lang} standalone />
      ) : isUpdatesPage ? (
        <FountUpdatesSection lang={lang} />
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

          <div className="fount-concept-strip" aria-label="Core concepts">
            {VISITOR_PROMISES.map((concept) => (
              <article key={concept.name}>
                <strong>{text(concept.title)}</strong>
                <span>{text(concept.body)}</span>
              </article>
            ))}
          </div>
        </div>

        <div className="fount-hero-visual" aria-hidden="true">
          <img src="/fount/ai-hero-agent-fields.png" alt="" />
          <div className="fount-hero-visual-caption">
            <strong>Fount</strong>
            <span>brain / Fields / memory / Forge / Foundry</span>
          </div>
        </div>
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
          <a className="fount-secondary-action" href={SYSTEM_DOCS_URL} target="_blank" rel="noreferrer">
            {copy.finalSecondary}
          </a>
        </div>
      </section>
        </>
      )}
    </main>
  );
}

function FountPricingSection({
  lang,
  standalone = false,
}: {
  lang: Lang;
  standalone?: boolean;
}) {
  const copy = COPY[lang];
  const text = (value: LocalizedText) => value[lang];

  return (
    <section
      className={`fount-section fount-pricing-section${standalone ? " fount-pricing-page-section" : ""}`}
      id="pricing"
    >
      <div className="fount-section-head fount-section-head-wide">
        {standalone ? (
          <div>
            <p className="fount-pricing-page-label">{copy.navPricing}</p>
          </div>
        ) : (
          <h2>{copy.navPricing}</h2>
        )}
        <p>{copy.pricingLead}</p>
      </div>
      <div className="fount-pricing-grid fount-pricing-grid-focused">
        {PRICING_TIERS.map((tier) => {
          const price = text(tier.price).trim();
          const currency = tier.priceCurrency ? text(tier.priceCurrency).trim() : "";
          const unit = tier.priceUnit ? text(tier.priceUnit).trim() : "";

          return (
            <article
              className={`fount-pricing-card fount-pricing-tier${tier.undetermined ? " fount-pricing-tier-undetermined" : ""}`}
              data-state={tier.undetermined ? "undetermined" : "available"}
              key={tier.name}
            >
              <div className="fount-pricing-tier-head">
                <h3>{tier.name}</h3>
                <span>{text(tier.title)}</span>
              </div>
              {price ? (
                <div className="fount-pricing-price" aria-label={`${currency}${price} ${unit}`.trim()}>
                  {currency ? <span className="fount-pricing-currency">{currency}</span> : null}
                  <strong className="fount-pricing-amount">{price}</strong>
                  {unit ? <span className="fount-pricing-unit">{unit}</span> : null}
                </div>
              ) : null}
              <p>{text(tier.body)}</p>
              <ul>
                {tier.items.map((item) => (
                  <li key={text(item)}>{text(item)}</li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
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
