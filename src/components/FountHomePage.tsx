import { useEffect } from "react";
import type { Lang } from "../i18n/lang";
import { BLOG_ARTICLES } from "../data/blogArticles";

type FountHomePageProps = {
  lang: Lang;
  onLangChange: (lang: Lang) => void;
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

const SYSTEM_DOCS_URL = "https://system.wordm.us";

const COPY = {
  zh: {
    documentTitle: "Fount | 开放的个人 Agent 大脑",
    navConcepts: "概念",
    navArchitecture: "架构",
    navPermissions: "权限",
    navFlow: "循环",
    navOpen: "开放",
    navRoadmap: "路线",
    navBlog: "博客",
    navDocs: "文档",
    download: "Download",
    heroTitle: "Fount 是开放的个人 agent 大脑",
    heroDeck:
      "Field 是可携带的经验环境。Forge 和 Foundry 是默认内置的系统级 Field。SDK 让普通产品变成 Field，经验在 Field 与 Fount 之间流动。",
    heroSub:
      "它不是普通 AI 助手，也不是开发者工具，而是一个能随你进入不同环境、理解体验、积累记忆并帮助改造世界的连续性系统。",
    primaryCta: "Download Fount for Mac",
    secondaryCta: "阅读概念",
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
    finalTitle: "Download Fount and enter your first Field.",
    finalBody:
      "Fount 是开放的个人 agent 大脑。Field 是可携带的经验环境。经验在 Field 和 Fount 之间流动。",
    finalSecondary: "Explore Foundry",
    visualTitle: "少一点说明书，多一点可进入的世界。",
    visualLead:
      "Fount 的关键不是把功能罗列出来，而是让人看见：大脑、环境、记忆、权限、创造和发现如何连成一个活的系统。",
    storyTitle: "三个场景，把概念变成画面。",
    storyLead:
      "用架构图看系统层次，用案例图看跨 Field 记忆，用评论图看生态的真实感。",
    blogTitle: "博客没有漏掉。",
    blogLead:
      "这里接入的是站内真实博客数据。首页只展示一组入口，完整文章列表仍在博客页。",
    blogCta: "查看全部博客",
  },
  en: {
    documentTitle: "Fount | Open Personal Agent Brain",
    navConcepts: "Concepts",
    navArchitecture: "Architecture",
    navPermissions: "Permissions",
    navFlow: "Loop",
    navOpen: "Open",
    navRoadmap: "Roadmap",
    navBlog: "Blog",
    navDocs: "Docs",
    download: "Download",
    heroTitle: "Fount is an open personal agent brain.",
    heroDeck:
      "Fields are portable experience environments. Forge and Foundry are built-in system Fields. The SDK turns products into Fields, and experience flows between Fields and Fount.",
    heroSub:
      "It is not a normal AI assistant or a developer tool. It is a continuity system that enters environments with you, understands experience, accumulates memory, and helps reshape worlds.",
    primaryCta: "Download Fount for Mac",
    secondaryCta: "Read Concepts",
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
    finalTitle: "Download Fount and enter your first Field.",
    finalBody:
      "Fount is an open personal agent brain. Fields are portable experience environments. Experience flows between Fields and Fount.",
    finalSecondary: "Explore Foundry",
    visualTitle: "Less manual. More enterable world.",
    visualLead:
      "Fount should not read like a feature inventory. The page needs to show how brain, environment, memory, permission, creation, and discovery become one living system.",
    storyTitle: "Three scenes turn the concept into a picture.",
    storyLead:
      "Use an architecture image for layers, a case image for cross-field memory, and a comment wall for ecosystem feeling.",
    blogTitle: "The blog is here too.",
    blogLead:
      "This section uses the real site blog data. The homepage shows a curated entry point, while the full writing archive remains on the blog page.",
    blogCta: "View all writing",
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

const FEATURED_BLOG_ARTICLES = BLOG_ARTICLES.slice(0, 6);

export function FountHomePage({ lang, onLangChange }: FountHomePageProps) {
  const copy = COPY[lang];
  const text = (value: LocalizedText) => value[lang];

  useEffect(() => {
    document.title = copy.documentTitle;
  }, [copy.documentTitle]);

  return (
    <main className="fount-page" data-lang={lang}>
      <header className="fount-header">
        <a className="fount-logo" href="#top" aria-label="Fount home">
          <span className="fount-logo-mark" aria-hidden="true">
            <span />
          </span>
          Fount
        </a>

        <nav className="fount-nav fount-outline-nav" aria-label="Fount page outline">
          <a href="#concepts">{copy.navConcepts}</a>
          <a href="#architecture">{copy.navArchitecture}</a>
          <a href="#permissions">{copy.navPermissions}</a>
          <a href="#flow">{copy.navFlow}</a>
          <a href="#open">{copy.navOpen}</a>
          <a href="#roadmap">{copy.navRoadmap}</a>
        </nav>

        <div className="fount-header-actions">
          <nav className="fount-site-nav" aria-label="Site links">
            <a href="/?view=blog">{copy.navBlog}</a>
            <a href={SYSTEM_DOCS_URL} target="_blank" rel="noreferrer">
              {copy.navDocs}
            </a>
          </nav>
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
          <a className="fount-download-small" href="/Fount.dmg">
            {copy.download}
          </a>
        </div>
      </header>

      <section className="fount-hero" id="top">
        <div className="fount-hero-copy">
          <h1>{copy.heroTitle}</h1>
          <p className="fount-hero-deck">{copy.heroDeck}</p>
          <p className="fount-hero-zh">{copy.heroSub}</p>

          <div className="fount-actions">
            <a className="fount-primary-action" href="/Fount.dmg">
              {copy.primaryCta}
            </a>
            <a className="fount-secondary-action" href="#concepts">
              {copy.secondaryCta}
            </a>
          </div>

          <div className="fount-concept-strip" aria-label="Core concepts">
            {CORE_CONCEPTS.map((concept) => (
              <article key={concept.name}>
                <strong>{concept.name}</strong>
                <span>{text(concept.title)}</span>
              </article>
            ))}
          </div>
        </div>

        <div className="fount-hero-visual" aria-label={copy.visualAlt}>
          <img src="/fount/hero-agent-fields.svg" alt={copy.visualAlt} />
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
          <img src="/fount/hero-agent-fields.svg" alt="" aria-hidden="true" />
          <img src="/fount/architecture-stack.svg" alt="" aria-hidden="true" />
          <img src="/fount/case-field-room.svg" alt="" aria-hidden="true" />
          <img src="/fount/community-comments.svg" alt="" aria-hidden="true" />
        </div>
      </section>

      <section className="fount-section">
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

      <section className="fount-section fount-story-section">
        <div className="fount-section-head">
          <h2>{copy.storyTitle}</h2>
          <p>{copy.storyLead}</p>
        </div>
        <div className="fount-visual-grid">
          <article className="fount-visual-card">
            <img
              src="/fount/architecture-stack.svg"
              alt={lang === "zh" ? "Fount 五层架构线稿图" : "Line diagram of the five-layer Fount architecture"}
            />
            <div>
              <span>Architecture</span>
              <h3>{copy.architectureTitle}</h3>
              <p>{copy.architectureLead}</p>
            </div>
          </article>
          <article className="fount-visual-card">
            <img
              src="/fount/case-field-room.svg"
              alt={lang === "zh" ? "跨 Field 记忆案例线稿图" : "Line illustration of cross-field memory in a case scene"}
            />
            <div>
              <span>Case</span>
              <h3>{text(VISION_EXAMPLES[1].title)}</h3>
              <p>{text(VISION_EXAMPLES[1].body)}</p>
            </div>
          </article>
          <article className="fount-visual-card">
            <img
              src="/fount/community-comments.svg"
              alt={lang === "zh" ? "Field 生态评论墙线稿图" : "Line illustration of community comments around Fields"}
            />
            <div>
              <span>Voices</span>
              <h3>{lang === "zh" ? "评论让生态有真实感" : "Voices make the ecosystem feel alive"}</h3>
              <p>
                {lang === "zh"
                  ? "不是冷冰冰的能力列表，而是不同角色如何进入、使用、创造和分享 Field。"
                  : "Not a cold feature list, but how different people enter, use, create, and share Fields."}
              </p>
            </div>
          </article>
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
              src="/fount/community-comments.svg"
              alt={lang === "zh" ? "Field 生态评论插图" : "Field ecosystem comments illustration"}
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

      <section className="fount-section fount-blog-section" id="blog">
        <div className="fount-section-head">
          <h2>{copy.blogTitle}</h2>
          <p>{copy.blogLead}</p>
        </div>
        <div className="fount-blog-grid">
          {FEATURED_BLOG_ARTICLES.map((article) => (
            <a
              className="fount-blog-card"
              href={`/?view=blog&article=${article.id}`}
              key={article.id}
            >
              <span>{article.category[lang]} · {article.date}</span>
              <h3>{article.title[lang]}</h3>
              <p>{article.summary[lang]}</p>
            </a>
          ))}
        </div>
        <a className="fount-blog-more" href="/?view=blog">
          {copy.blogCta}
        </a>
      </section>

      <section className="fount-final-cta">
        <div>
          <h2>{copy.finalTitle}</h2>
          <p>{copy.finalBody}</p>
        </div>
        <div className="fount-actions">
          <a className="fount-primary-action" href="/Fount.dmg">
            {copy.primaryCta}
          </a>
          <a className="fount-secondary-action" href="#flow">
            {copy.finalSecondary}
          </a>
        </div>
      </section>
    </main>
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
