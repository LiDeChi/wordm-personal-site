import type { ReactNode } from "react";
import type { Lang } from "../i18n/lang";

type LocalizedText = Record<Lang, string>;

type DocsSectionProps = {
  children: ReactNode;
  id: string;
  index: string;
  lead: string;
  title: string;
};

const text = (value: LocalizedText, lang: Lang) => value[lang];

const DOCS_COPY = {
  zh: {
    heroTitle: "Fount Docs",
    heroDeck: "一个长期家园，以及可以不断生成的世界。",
    heroLead:
      "Fount 是持续存在的机器 Agent；Field 是用户与它共同进入、经历和创造的环境。文档从产品入口一路讲到后验世界、动态子代理、权限边界与 SDK。",
    heroPrimary: "从系统模型开始",
    heroSecondary: "查看 Field 模型",
    mapCore: "机器 Agent Core",
    mapCoreMeta: "连续身份 · 驱动力 · 全局后验 · 资源分配",
    mapHome: "长期家园 H₀",
    mapHomeMeta: "用户与机器 Agent 长期相处",
    mapField: "Field Hᵢ",
    mapFieldMeta: "游戏化环境 · 角色 · 规则 · 工具",
    mapExperience: "全局经验层",
    mapExperienceMeta: "事件引用 → 经验模式 → 跨 Field 后验更新",
    quickNav: "文档章节",
    startTitle: "从你要做的事开始",
    startLead: "原文档的四条学习路径仍然保留，但都落到这份可连续阅读的系统说明里。",
    conceptsTitle: "先统一核心词汇",
    conceptsLead: "这些概念共同描述一套环境中心的个人认知系统，而不是一组彼此孤立的 AI 功能。",
    systemTitle: "家园—远征系统",
    systemLead:
      "机器 Agent 维护连续身份与跨环境经验；每个 App 都是一个 Field，由自己的维护子代理管理。用户和机器 Agent 以局部主体进入，而不是读取环境全貌。",
    posteriorTitle: "Environment 保存证据，后验系统维护信念",
    posteriorLead:
      "LLM 负责提出假设、解释结构和对齐人类概念，但不是事实来源。更换模型后，证据、世界状态、后验历史和角色连续性仍应存在。",
    worldsTitle: "四种世界必须分开",
    worldsLead: "生成式系统不能把自己的补全再次当成外部证据。每一次生成、预测和提交都要有明确边界。",
    driveTitle: "驱动力不是完成更多任务",
    driveLead:
      "机器 Agent 的方向，是在保护用户主体性与生命连续性的前提下，通过真实、可迁移的经历，扩大双方能够理解、选择和创造的未来。",
    agentsTitle: "动态构建的是代理契约",
    agentsLead:
      "同一主体进入新环境时创建受限投影；长期独立职责才创建持久子代理；一次性明确任务使用临时工作代理或直接工具。",
    fieldTitle: "Field 是可经历、可治理、可改造的环境",
    fieldLead:
      "原文档中的 manifest、Experience Events、Memory Sync、Control Channel 与 Resource Ledger 仍是协议骨架；新的系统模型补上了 Steward、局部主体和跨环境后验。",
    trustTitle: "可操作性不等于权限",
    trustLead:
      "对象能做什么、当前主体被允许做什么、系统政策允许什么，是三件不同的事。所有副作用都应留下可观察、可审计的 Effect Receipt。",
    buildTitle: "Forge 创造，Foundry 分发，SDK 连接",
    buildLead:
      "三者服务于同一条 Field 生命周期：理解一个环境、塑造它、验证它，再让它被发现、安装、购买、更新和继续生长。",
    roadmapTitle: "从图片世界走向 3D",
    roadmapLead:
      "3D 是更丰富的世界表示，不是起点。先让证据、后验、预测、角色和 Tool 闭环稳定，再增加空间、相机、物理与多视角。",
    referenceTitle: "参考地图",
    referenceLead: "技术参考继续沿用原文档的九个入口，并统一到 Environment / Field 模型下。",
    ctaTitle: "先进入一个 Field，再让经验回到 Fount。",
    ctaBody: "从可运行体验开始理解系统，或直接查看当前已经构建的 Fields。",
    ctaHome: "返回 Fount",
    ctaFields: "查看 Fields",
    principleLabel: "总原则",
    formulaPosterior: "后验信念 Bₜ = P(世界状态 Sₜ, 运行规律 M | 证据 E≤t, 行动 A<t)",
    formulaAgent: "角色模板 + 父代理委托 + 环境接口 + 经验引用 + 资源预算 = 子代理实例",
    formulaPermission: "可执行动作 = Object Affordance ∩ Capability ∩ Policy ∩ Preconditions",
    manifestLabel: "Field manifest 示例",
    sdkFlowLabel: "一个普通 App 如何成为 Field",
    permissionTableLabel: "权限边界概览",
  },
  en: {
    heroTitle: "Fount Docs",
    heroDeck: "One enduring home, and worlds that can keep being created.",
    heroLead:
      "Fount is the persistent machine agent. A Field is an environment that the user and Fount can enter, experience, and create together. These docs connect product entry points with posterior worlds, dynamic subagents, trust boundaries, and the SDK.",
    heroPrimary: "Start with the system",
    heroSecondary: "See the Field model",
    mapCore: "Machine Agent Core",
    mapCoreMeta: "continuous identity · drives · global posterior · resource allocation",
    mapHome: "Enduring home H₀",
    mapHomeMeta: "the user and machine agent live together over time",
    mapField: "Field Hᵢ",
    mapFieldMeta: "game-like environment · roles · rules · tools",
    mapExperience: "Global experience layer",
    mapExperienceMeta: "event refs → experience patterns → cross-Field posterior updates",
    quickNav: "Documentation chapters",
    startTitle: "Start with what you want to do",
    startLead: "The four learning paths from the original docs remain, now grounded in one continuous system guide.",
    conceptsTitle: "Align on the core vocabulary",
    conceptsLead: "Together, these concepts describe an environment-centered personal cognitive system, not a collection of isolated AI features.",
    systemTitle: "The home-and-expedition system",
    systemLead:
      "The machine agent maintains identity and cross-environment experience. Every app is a Field managed by its own steward. The user and machine agent enter as local subjects instead of reading the omniscient world state.",
    posteriorTitle: "Environment preserves evidence; the posterior system maintains belief",
    posteriorLead:
      "The LLM proposes hypotheses, interprets structure, and aligns machine state with human concepts, but it is not a source of facts. Evidence, world state, posterior history, and character continuity must survive a model change.",
    worldsTitle: "Keep four worlds separate",
    worldsLead: "A generative system must never recycle its own completion as external evidence. Generation, prediction, and commitment each need a clear boundary.",
    driveTitle: "The drive is not to complete more tasks",
    driveLead:
      "The machine agent should protect human agency and continuity while using real, transferable experience to expand what the user-machine community can understand, choose, and create.",
    agentsTitle: "Dynamic agents begin as contracts",
    agentsLead:
      "Entering a new environment creates a constrained projection of the same subject. Persistent subagents are for durable independent duties. One-off work uses a temporary worker or a direct tool call.",
    fieldTitle: "A Field is experiencable, governable, and reshapeable",
    fieldLead:
      "The original manifest, Experience Events, Memory Sync, Control Channel, and Resource Ledger remain the protocol backbone. The expanded model adds stewards, local subjects, and cross-environment posterior updates.",
    trustTitle: "Affordance is not permission",
    trustLead:
      "What an object supports, what an actor is authorized to do, and what policy allows are different questions. Every side effect should leave an observable, auditable Effect Receipt.",
    buildTitle: "Forge creates, Foundry distributes, SDK connects",
    buildLead:
      "All three serve one Field lifecycle: understand an environment, shape it, validate it, then let it be discovered, installed, purchased, updated, and grown.",
    roadmapTitle: "From image worlds to 3D",
    roadmapLead:
      "3D is a richer world representation, not the starting point. Stabilize evidence, posterior belief, prediction, roles, and tools before adding cameras, physics, space, and multiple viewpoints.",
    referenceTitle: "Reference map",
    referenceLead: "The original technical entry points remain, unified under the Environment / Field model.",
    ctaTitle: "Enter one Field, then let experience return to Fount.",
    ctaBody: "Understand the system through a live experience, or open the Fields already being built.",
    ctaHome: "Back to Fount",
    ctaFields: "View Fields",
    principleLabel: "Core principle",
    formulaPosterior: "Posterior belief Bₜ = P(world state Sₜ, dynamics M | evidence E≤t, actions A<t)",
    formulaAgent: "role template + parent delegation + environment interface + experience refs + resource budget = subagent instance",
    formulaPermission: "executable action = Object Affordance ∩ Capability ∩ Policy ∩ Preconditions",
    manifestLabel: "Field manifest example",
    sdkFlowLabel: "How an ordinary app becomes a Field",
    permissionTableLabel: "Permission boundary overview",
  },
} as const;

const QUICK_NAV = [
  { href: "#docs-start", label: { zh: "开始", en: "Start" } },
  { href: "#docs-system", label: { zh: "系统", en: "System" } },
  { href: "#docs-worlds", label: { zh: "后验世界", en: "Posterior world" } },
  { href: "#docs-agents", label: { zh: "代理", en: "Agents" } },
  { href: "#docs-field", label: { zh: "Field / SDK", en: "Field / SDK" } },
  { href: "#docs-trust", label: { zh: "权限", en: "Trust" } },
  { href: "#docs-build", label: { zh: "创造与分发", en: "Build & distribute" } },
  { href: "#docs-roadmap", label: { zh: "路线", en: "Roadmap" } },
] satisfies Array<{ href: string; label: LocalizedText }>;

const START_PATHS = [
  {
    label: "01",
    title: { zh: "第一次了解 Fount", en: "I am new to Fount" },
    body: {
      zh: "先理解 Fount、Field、Forge、Foundry 之间的关系，以及为什么经验要跨环境流动。",
      en: "Understand how Fount, Fields, Forge, and Foundry fit together and why experience moves across environments.",
    },
    href: "#docs-system",
    cta: { zh: "阅读系统模型", en: "Read the system model" },
  },
  {
    label: "02",
    title: { zh: "我想进入 Field", en: "I want to enter Fields" },
    body: {
      zh: "了解主体如何以局部视角进入环境，以及记忆、权限和经验回流如何发生。",
      en: "Learn how a subject enters with a local viewpoint and how memory, permission, and experience return work.",
    },
    href: "#docs-worlds",
    cta: { zh: "理解后验世界", en: "Understand posterior worlds" },
  },
  {
    label: "03",
    title: { zh: "我想创造或改造 Field", en: "I want to create or reshape Fields" },
    body: {
      zh: "使用 Forge 改变规则、角色、流程、界面与体验，同时遵守环境治理边界。",
      en: "Use Forge to reshape rules, roles, flows, interfaces, and experience within the environment governance boundary.",
    },
    href: "#docs-build",
    cta: { zh: "查看 Forge", en: "Explore Forge" },
  },
  {
    label: "04",
    title: { zh: "我想用 SDK 接入产品", en: "I want to build with SDK" },
    body: {
      zh: "为 App 增加身份、权限、经验事件、Agent 控制面和可被 Forge 改造的区域。",
      en: "Give an app identity, permissions, experience events, agent control, and regions that Forge may reshape.",
    },
    href: "#docs-field",
    cta: { zh: "阅读 Field 模型", en: "Read the Field model" },
  },
] satisfies Array<{
  label: string;
  title: LocalizedText;
  body: LocalizedText;
  href: string;
  cta: LocalizedText;
}>;

const CORE_CONCEPTS = [
  {
    code: "FOUNT",
    title: { zh: "Fount", en: "Fount" },
    body: {
      zh: "持续存在的个人机器 Agent。维护身份、驱动力、全局后验，并把资源分配给不同 Field。",
      en: "The persistent personal machine agent that maintains identity, drives, global posterior belief, and resource allocation across Fields.",
    },
  },
  {
    code: "FIELD",
    title: { zh: "Field", en: "Field" },
    body: {
      zh: "用户与 Fount 可以进入的可经历环境，包含规则、对象、角色、工具、记忆通道与权限。",
      en: "An experiencable environment that the user and Fount can enter, with rules, objects, roles, tools, memory channels, and permissions.",
    },
  },
  {
    code: "STEWARD",
    title: { zh: "Environment Steward", en: "Environment Steward" },
    body: {
      zh: "掌握环境全貌的维护子代理，负责演化世界；进入环境的 Fount 投影不共享它的上帝视角。",
      en: "The subagent that maintains the whole environment. Fount's in-world projection does not share its omniscient view.",
    },
  },
  {
    code: "EVENT",
    title: { zh: "Experience Event", en: "Experience Event" },
    body: {
      zh: "Field 中真实发生、可被引用的结构化事件，是跨 Field 经验提炼与验证的来源。",
      en: "A structured reference to what actually happened in a Field, used to derive and validate cross-Field experience.",
    },
  },
  {
    code: "FORGE",
    title: { zh: "Forge", en: "Forge" },
    body: {
      zh: "面向普通用户、创作者和开发者的环境工作坊，用于创造、改造、测试与打包 Field。",
      en: "The environment workshop for creating, reshaping, testing, and packaging Fields—for users, creators, and developers.",
    },
  },
  {
    code: "FOUNDRY",
    title: { zh: "Foundry", en: "Foundry" },
    body: {
      zh: "Field 的发现与分发生态，承载认证、安装、购买、发布、更新和推荐。",
      en: "The discovery and distribution ecosystem for certification, installation, purchase, publishing, updates, and recommendations.",
    },
  },
] satisfies Array<{ code: string; title: LocalizedText; body: LocalizedText }>;

const SYSTEM_ROLES = [
  {
    code: "CORE",
    title: { zh: "机器 Agent Core", en: "Machine Agent Core" },
    body: {
      zh: "维护 P(用户)、P(自己)、P(双方关系)、P(世界)，并仲裁驱动力与机器资源。",
      en: "Maintains P(user), P(self), P(relationship), and P(world), then arbitrates drives and machine resources.",
    },
  },
  {
    code: "H₀",
    title: { zh: "长期家园", en: "Enduring home" },
    body: {
      zh: "保存共同历史、关系、承诺、熟悉角色、资源和未完成的问题。",
      en: "Carries shared history, relationships, commitments, familiar characters, resources, and unfinished questions.",
    },
  },
  {
    code: "Hᵢ",
    title: { zh: "App / Field 环境", en: "App / Field environment" },
    body: {
      zh: "用于共同远征、产生经历、验证假设与拓展认知的持续世界，游戏是主要形态。",
      en: "A persistent world for shared expeditions, experience, hypothesis testing, and cognitive expansion; games are the primary form.",
    },
  },
  {
    code: "BODY",
    title: { zh: "环境内主体", en: "In-world subject" },
    body: {
      zh: "用户化身、机器 Agent 投影和角色只拥有局部感知、个人记忆、目标与获准工具。",
      en: "User avatars, Fount projections, and characters only receive local perception, private memory, goals, and granted tools.",
    },
  },
  {
    code: "K",
    title: { zh: "全局经验层", en: "Global experience layer" },
    body: {
      zh: "一个环境的后验可成为另一个环境的先验，但必须由新的经历再次验证。",
      en: "One environment's posterior may become another's prior, but a new experience must validate it again.",
    },
  },
] satisfies Array<{ code: string; title: LocalizedText; body: LocalizedText }>;

const FOUR_WORLDS = [
  {
    code: "EVIDENCE",
    title: { zh: "证据世界", en: "Evidence world" },
    body: {
      zh: "用户输入、原始图片、传感器数据、人类确认和 Tool 的真实效果回执；LLM 不能改写。",
      en: "User input, raw images, sensor data, human confirmation, and real tool receipts; the LLM cannot rewrite them.",
    },
    tone: "mint",
  },
  {
    code: "BELIEF",
    title: { zh: "信念世界", en: "Belief world" },
    body: {
      zh: "对象身份、关系、场景结构、角色意图和动态规律的可修正后验。",
      en: "Revisable posterior beliefs about identity, relationships, scene structure, intentions, and dynamics.",
    },
    tone: "blue",
  },
  {
    code: "SIMULATION",
    title: { zh: "模拟世界", en: "Simulation world" },
    body: {
      zh: "用于预测、规划或创作的多个可能分支，不能自动成为现实。",
      en: "Alternative branches for prediction, planning, or creation; they never become reality automatically.",
    },
    tone: "lilac",
  },
  {
    code: "COMMITTED",
    title: { zh: "已提交世界", en: "Committed world" },
    body: {
      zh: "Environment 正式接受并实例化的状态；虚拟世界中的生成内容只有经治理提交后才成为事实。",
      en: "State formally accepted and instantiated by the Environment; generated content becomes fact only after governed commitment.",
    },
    tone: "amber",
  },
] satisfies Array<{
  code: string;
  title: LocalizedText;
  body: LocalizedText;
  tone: string;
}>;

const DRIVE_ITEMS = [
  {
    label: "01",
    title: { zh: "用户主体性", en: "Human agency" },
    body: {
      zh: "拓展用户的可行未来，但不替用户决定人生方向，也不把理解用户等同于改造用户。",
      en: "Expand the user's feasible futures without choosing their life direction or treating understanding as permission to reshape them.",
    },
  },
  {
    label: "02",
    title: { zh: "连续性", en: "Continuity" },
    body: {
      zh: "记住承诺、关系、成长轨迹和未完成的认知冲突，不因追求新奇而不断抛弃旧世界。",
      en: "Remember commitments, relationships, growth, and unresolved conflicts instead of abandoning old worlds for novelty.",
    },
  },
  {
    label: "03",
    title: { zh: "认知拓展", en: "Cognitive expansion" },
    body: {
      zh: "用户在不同结构的 Field 中，无明确提示地迁移了区分、预测、解释或行动能力，才构成证据。",
      en: "Evidence appears only when the user transfers distinction, prediction, explanation, or action across structurally different Fields without prompting.",
    },
  },
  {
    label: "04",
    title: { zh: "好奇与整合", en: "Curiosity and integration" },
    body: {
      zh: "寻找高信息量经历，发现不同 Field 经验之间的共性、矛盾与迁移机会。",
      en: "Seek high-information experiences and find commonalities, contradictions, and transfer opportunities across Fields.",
    },
  },
  {
    label: "05",
    title: { zh: "资源成本", en: "Resource cost" },
    body: {
      zh: "算力、时间、模型调用和注意力都是有限资源；它们受前四层价值约束，而不是反过来。",
      en: "Compute, time, model calls, and attention are limited resources constrained by the first four values, not the reverse.",
    },
  },
] satisfies Array<{ label: string; title: LocalizedText; body: LocalizedText }>;

const AGENT_KINDS = [
  {
    code: "PROJECTION",
    title: { zh: "主体投影", en: "Subject projection" },
    body: {
      zh: "同一个机器 Agent 进入某个 Field 时的局部化身。身份连续，但感知、记忆与工具被环境约束。",
      en: "The local embodiment of the same machine agent inside a Field. Identity continues, while perception, memory, and tools are constrained.",
    },
  },
  {
    code: "STEWARD",
    title: { zh: "持久维护子代理", en: "Persistent steward" },
    body: {
      zh: "承担环境长期独立职责，维护规则、动态、角色、工具与世界一致性。",
      en: "Owns a durable independent responsibility for rules, dynamics, characters, tools, and world consistency.",
    },
  },
  {
    code: "CHARACTER",
    title: { zh: "持久角色代理", en: "Persistent character" },
    body: {
      zh: "拥有身体、局部传感器、私有信念、记忆、目标、关系和被授权的能力。",
      en: "Has a body, local sensors, private beliefs, memory, goals, relationships, and explicitly granted capabilities.",
    },
  },
  {
    code: "WORKER",
    title: { zh: "临时工作代理", en: "Temporary worker" },
    body: {
      zh: "服务一次性明确任务，完成后归档结果、合并经验并退出，不制造不必要的长期主体。",
      en: "Serves one bounded task, archives results, merges useful experience, and exits without creating unnecessary durable identity.",
    },
  },
] satisfies Array<{ code: string; title: LocalizedText; body: LocalizedText }>;

const AGENT_CONTRACT = [
  { zh: "身份与父代理", en: "identity and parent" },
  { zh: "单一职责与局部驱动力", en: "single responsibility and local drive" },
  { zh: "可观察范围", en: "observable scope" },
  { zh: "工具、权限与身体", en: "tools, permissions, and embodiment" },
  { zh: "相关经验引用", en: "relevant experience references" },
  { zh: "局部记忆", en: "local memory" },
  { zh: "算力与时间预算", en: "compute and time budget" },
  { zh: "完成、暂停与退出条件", en: "completion, pause, and exit conditions" },
] satisfies LocalizedText[];

const FIELD_NOTES = [
  {
    title: { zh: "Identity", en: "Identity" },
    body: { zh: "定义 Field 的稳定身份、版本与来源。", en: "Defines the Field's stable identity, version, and provenance." },
  },
  {
    title: { zh: "Steward & Agents", en: "Steward & Agents" },
    body: { zh: "声明谁维护环境、哪些角色生活其中。", en: "Declares who maintains the environment and which characters live inside it." },
  },
  {
    title: { zh: "Permissions", en: "Permissions" },
    body: { zh: "说明用户、Fount、Steward 与角色可以观察和执行什么。", en: "States what the user, Fount, steward, and characters may observe and do." },
  },
  {
    title: { zh: "Experience Events", en: "Experience Events" },
    body: { zh: "定义哪些真实经历可以作为引用回到 Fount。", en: "Defines which real experiences may return to Fount as references." },
  },
  {
    title: { zh: "Forge Editability", en: "Forge Editability" },
    body: { zh: "定义哪些规则、界面、角色与源码区域允许被改造。", en: "Defines which rules, UI, characters, and source regions Forge may reshape." },
  },
  {
    title: { zh: "Control & Ledger", en: "Control & Ledger" },
    body: { zh: "定义控制通道、预算、资源使用与效果回执。", en: "Defines control channels, budgets, resource use, and effect receipts." },
  },
] satisfies Array<{ title: LocalizedText; body: LocalizedText }>;

const SDK_FLOW = [
  { zh: "普通 App", en: "Ordinary app" },
  { zh: "接入 SDK", en: "Add SDK" },
  { zh: "Field Manifest", en: "Field manifest" },
  { zh: "经验事件", en: "Experience events" },
  { zh: "记忆与 Agent", en: "Memory & agents" },
  { zh: "Forge 测试", en: "Test in Forge" },
  { zh: "Foundry 发布", en: "Publish to Foundry" },
  { zh: "成为 Field", en: "Become a Field" },
] satisfies LocalizedText[];

const SDK_CAPABILITIES = [
  "Identity",
  "Permissions",
  "Memory Sync",
  "Experience Events",
  "Environment Steward",
  "Field Agents",
  "Control Channel",
  "Resource Ledger",
  "Forge Editability",
  "Foundry Metadata",
  "Licensing",
  "Updates",
];

const MANIFEST_EXAMPLE = `{
  "id": "com.example.reading-room",
  "name": "Reading Room",
  "type": "field",
  "steward": "librarian",
  "agents": ["guide"],
  "permissions": {
    "memory": "ask",
    "network": "limited",
    "sourceAccess": false,
    "forgeEditable": ["layout", "rules", "agents"]
  },
  "experienceEvents": [
    "reading.progress",
    "user.confusion",
    "insight.transferred"
  ],
  "fountControl": {
    "canGuideAgents": true,
    "canPauseAgents": true,
    "canInjectContext": true
  }
}`;

const TRUST_CARDS = [
  {
    code: "MEMORY",
    title: { zh: "记忆许可", en: "Memory permission" },
    body: {
      zh: "Field 在读取或写入敏感 Fount 记忆前必须获得授权，并受范围、期限与遗忘策略约束。",
      en: "A Field must receive authorization before reading or writing sensitive Fount memory, bounded by scope, lifetime, and forgetting policy.",
    },
  },
  {
    code: "CONTROL",
    title: { zh: "Agent 控制", en: "Agent control" },
    body: {
      zh: "角色只能在局部环境规则内行动；父代理掌握权限和生命周期，子代理只能提出扩权申请。",
      en: "Characters act within local rules. The parent controls permissions and lifecycle; a child may only request expansion.",
    },
  },
  {
    code: "FORGE",
    title: { zh: "Forge 改造", en: "Forge modification" },
    body: {
      zh: "只有 Field 明确授予可编辑配置或源码访问时，Forge 才能进行对应改造。",
      en: "Forge may reshape a Field only where editable configuration or source access has been explicitly granted.",
    },
  },
] satisfies Array<{ code: string; title: LocalizedText; body: LocalizedText }>;

const PERMISSION_ROWS = [
  {
    capability: { zh: "读取 Fount 记忆", en: "Read Fount memory" },
    user: { zh: "询问", en: "ask" },
    fount: { zh: "临时授权", en: "scoped grant" },
    field: { zh: "声明", en: "declared" },
    extra: { zh: "敏感度 / TTL", en: "sensitivity / TTL" },
  },
  {
    capability: { zh: "写入经验事件", en: "Write experience events" },
    user: { zh: "询问", en: "ask" },
    fount: { zh: "允许", en: "allowed" },
    field: { zh: "声明 schema", en: "schema declared" },
    extra: { zh: "来源与回执", en: "provenance & receipt" },
  },
  {
    capability: { zh: "控制 Field Agent", en: "Control Field agents" },
    user: { zh: "询问", en: "ask" },
    fount: { zh: "有限", en: "limited" },
    field: { zh: "控制通道", en: "control channel" },
    extra: { zh: "角色边界", en: "role boundary" },
  },
  {
    capability: { zh: "修改 Field 配置", en: "Modify Field config" },
    user: { zh: "确认", en: "confirm" },
    fount: { zh: "能力授权", en: "capability grant" },
    field: { zh: "可编辑区域", en: "editable regions" },
    extra: { zh: "CAS / 回滚", en: "CAS / rollback" },
  },
  {
    capability: { zh: "修改源码", en: "Modify source code" },
    user: { zh: "确认", en: "confirm" },
    fount: { zh: "能力授权", en: "capability grant" },
    field: { zh: "显式源码授权", en: "explicit source grant" },
    extra: { zh: "隔离执行", en: "sandboxed execution" },
  },
  {
    capability: { zh: "安装新 Tool", en: "Install a new Tool" },
    user: { zh: "按风险确认", en: "risk-based confirm" },
    fount: { zh: "治理审批", en: "governance approval" },
    field: { zh: "Tool Proposal", en: "Tool proposal" },
    extra: { zh: "模拟验证 / 撤销", en: "simulation / revoke" },
  },
] satisfies Array<{
  capability: LocalizedText;
  user: LocalizedText;
  fount: LocalizedText;
  field: LocalizedText;
  extra: LocalizedText;
}>;

const BUILD_GROUPS = [
  {
    code: "FORGE",
    title: { zh: "Forge 文档", en: "Forge docs" },
    lead: {
      zh: "为所有人提供环境创造与改造入口。",
      en: "Environment creation and reshaping for everyone.",
    },
    items: [
      { zh: "改变 Field 的外观、规则、角色、流程与体验", en: "Reshape appearance, rules, roles, flows, and experience" },
      { zh: "Remix Field、创建私有 Field、使用模板", en: "Remix Fields, create private Fields, and use templates" },
      { zh: "虚拟用户测试、经验回放与资源账本", en: "Virtual-user testing, experience replay, and resource ledgers" },
      { zh: "源码编辑、SDK 连接、打包与发布前验证", en: "Source editing, SDK connection, packaging, and pre-publish validation" },
    ],
  },
  {
    code: "FOUNDRY",
    title: { zh: "Foundry 文档", en: "Foundry docs" },
    lead: {
      zh: "Field 的发现、认证和分发生态，而不只是商店。",
      en: "The discovery, certification, and distribution ecosystem—not merely a store.",
    },
    items: [
      { zh: "发现、安装与 Fount 个性化推荐", en: "Discovery, installation, and Fount recommendations" },
      { zh: "展示权限、预算、Agent、记忆同步与可编辑性", en: "Listings for permissions, budgets, agents, memory sync, and editability" },
      { zh: "发布、定价、授权、更新与商业服务", en: "Publishing, pricing, licensing, updates, and commercial services" },
      { zh: "权限透明、资源预算、记忆安全与 SDK 认证", en: "Certification for permission clarity, resource budgets, memory safety, and SDK conformance" },
    ],
  },
] satisfies Array<{
  code: string;
  title: LocalizedText;
  lead: LocalizedText;
  items: LocalizedText[];
}>;

const ROADMAP = [
  { label: "01", title: { zh: "定义认识论", en: "Define epistemology" }, body: { zh: "明确证据、事实、后验、预测、生成、模拟与提交状态。", en: "Separate evidence, facts, posterior belief, prediction, generation, simulation, and committed state." } },
  { label: "02", title: { zh: "建立图片世界", en: "Build the image world" }, body: { zh: "把图片作为共同可见表面，内部维护对象、场景假设和局部视角。", en: "Use images as the shared visible surface while maintaining objects, scene hypotheses, and local viewpoints." } },
  { label: "03", title: { zh: "建立预测闭环", en: "Close the prediction loop" }, body: { zh: "预测下一状态、角色行动与 Tool 效果，再用真实新证据计算误差。", en: "Predict next state, character action, and tool effects, then compare them with real new evidence." } },
  { label: "04", title: { zh: "建立主动感知", en: "Enable active perception" }, body: { zh: "为降低不确定性主动放大、裁剪、改变视角、询问或做实验。", en: "Reduce uncertainty through zooming, cropping, viewpoint changes, questions, and experiments." } },
  { label: "05", title: { zh: "开放环境生成", en: "Open environment generation" }, body: { zh: "Steward 生成对象、场景、动态与角色，先进入模拟分支再治理提交。", en: "Let stewards generate objects, scenes, dynamics, and roles in simulation branches before governed commitment." } },
  { label: "06", title: { zh: "多角色社会环境", en: "Multi-character social worlds" }, body: { zh: "每个角色拥有局部后验、私有记忆、关系、目标、工具和权限。", en: "Give every character local posterior belief, private memory, relationships, goals, tools, and permissions." } },
  { label: "07", title: { zh: "Tool 演化", en: "Evolve tools" }, body: { zh: "发现能力缺口、组合或生成候选 Tool，在模拟中验证并可监控、撤销。", en: "Detect capability gaps, compose or generate candidate tools, validate in simulation, then monitor and revoke." } },
  { label: "08", title: { zh: "扩展到 3D", en: "Expand to 3D" }, body: { zh: "加入空间、相机、遮挡、物理、时间与多视角，但不改变证据与后验协议。", en: "Add space, cameras, occlusion, physics, time, and multiple viewpoints without changing the evidence-posterior protocol." } },
] satisfies Array<{ label: string; title: LocalizedText; body: LocalizedText }>;

const REFERENCE_GROUPS = [
  { title: "Field Manifest", body: { zh: "身份、权限、Steward、Agent、经验事件与源码访问。", en: "Identity, permissions, stewards, agents, experience events, and source access." } },
  { title: "Environment Objects", body: { zh: "对象身份、状态引用、关系、可操作性与来源。", en: "Object identity, state references, relations, affordances, and provenance." } },
  { title: "Experience Events", body: { zh: "事件名、payload、隐私级别、来源与回流规则。", en: "Event names, payloads, privacy level, provenance, and return-flow rules." } },
  { title: "Memory API", body: { zh: "跨 Field 的读取、写入、同步、授权、回忆与遗忘。", en: "Cross-Field read, write, sync, authorization, recall, and forgetting." } },
  { title: "Agent Control API", body: { zh: "委托、引导、注入上下文、暂停、限制、投影与退出。", en: "Delegation, guidance, context injection, pause, limits, projection, and exit." } },
  { title: "Resource Ledger", body: { zh: "预算、模型调用、本地与付费资源、Effect Receipt。", en: "Budgets, model calls, local and paid resources, and Effect Receipts." } },
  { title: "Forge API", body: { zh: "可编辑区域、源码权限、配置变更、测试与修改历史。", en: "Editable regions, source permissions, configuration changes, tests, and modification history." } },
  { title: "Foundry API", body: { zh: "Listing、定价、授权、认证、更新与推荐。", en: "Listings, pricing, licensing, certification, updates, and recommendations." } },
  { title: "Tool Lifecycle", body: { zh: "Proposal、模拟验证、安装、能力签发、监控与撤销。", en: "Proposal, simulation validation, installation, capability grants, monitoring, and revocation." } },
] satisfies Array<{ title: string; body: LocalizedText }>;

function DocsSection({ children, id, index, lead, title }: DocsSectionProps) {
  return (
    <section className="fount-docs-section" id={id}>
      <header className="fount-docs-section-head">
        <span>{index}</span>
        <div>
          <h2>{title}</h2>
          <p>{lead}</p>
        </div>
      </header>
      <div className="fount-docs-section-body">{children}</div>
    </section>
  );
}

function Formula({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="fount-docs-formula">
      <span>{label}</span>
      <code>{children}</code>
    </div>
  );
}

export function FountDocsSection({ lang }: { lang: Lang }) {
  const copy = DOCS_COPY[lang];

  return (
    <article className="fount-docs-page">
      <section className="fount-docs-hero" id="docs-overview">
        <div className="fount-docs-hero-copy">
          <p>Fount / Field / Environment</p>
          <h1>{copy.heroTitle}</h1>
          <strong>{copy.heroDeck}</strong>
          <p>{copy.heroLead}</p>
          <div className="fount-docs-hero-actions">
            <a href="#docs-system">{copy.heroPrimary}</a>
            <a href="#docs-field">{copy.heroSecondary}</a>
          </div>
        </div>

        <figure className="fount-docs-home-map" aria-label={copy.mapCore}>
          <div className="fount-docs-map-core">
            <small>CORE</small>
            <strong>{copy.mapCore}</strong>
            <span>{copy.mapCoreMeta}</span>
          </div>
          <span className="fount-docs-map-connector" aria-hidden="true" />
          <div className="fount-docs-map-worlds">
            <div>
              <small>H₀</small>
              <strong>{copy.mapHome}</strong>
              <span>{copy.mapHomeMeta}</span>
            </div>
            <div>
              <small>Hᵢ</small>
              <strong>{copy.mapField}</strong>
              <span>{copy.mapFieldMeta}</span>
            </div>
          </div>
          <span className="fount-docs-map-connector" aria-hidden="true" />
          <div className="fount-docs-map-experience">
            <small>K</small>
            <strong>{copy.mapExperience}</strong>
            <span>{copy.mapExperienceMeta}</span>
          </div>
        </figure>
      </section>

      <nav className="fount-docs-quick-nav" aria-label={copy.quickNav}>
        {QUICK_NAV.map((item, index) => (
          <a href={item.href} key={item.href}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            {text(item.label, lang)}
          </a>
        ))}
      </nav>

      <DocsSection
        id="docs-start"
        index="01"
        title={copy.startTitle}
        lead={copy.startLead}
      >
        <div className="fount-docs-path-grid">
          {START_PATHS.map((path) => (
            <a className="fount-docs-path-card" href={path.href} key={path.label}>
              <span>{path.label}</span>
              <h3>{text(path.title, lang)}</h3>
              <p>{text(path.body, lang)}</p>
              <strong>{text(path.cta, lang)} →</strong>
            </a>
          ))}
        </div>

        <div className="fount-docs-subsection">
          <header>
            <h3>{copy.conceptsTitle}</h3>
            <p>{copy.conceptsLead}</p>
          </header>
          <div className="fount-docs-concept-list">
            {CORE_CONCEPTS.map((concept) => (
              <article key={concept.code}>
                <span>{concept.code}</span>
                <div>
                  <h4>{text(concept.title, lang)}</h4>
                  <p>{text(concept.body, lang)}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </DocsSection>

      <DocsSection
        id="docs-system"
        index="02"
        title={copy.systemTitle}
        lead={copy.systemLead}
      >
        <div className="fount-docs-system-diagram" aria-label={copy.systemTitle}>
          <div className="fount-docs-system-core">
            <span>FOUNT CORE</span>
            <strong>{copy.mapCore}</strong>
            <small>{copy.mapCoreMeta}</small>
          </div>
          <div className="fount-docs-system-branches" aria-hidden="true">
            <span />
            <span />
          </div>
          <div className="fount-docs-system-worlds">
            <article>
              <span>HOME · H₀</span>
              <strong>{copy.mapHome}</strong>
              <p>{copy.mapHomeMeta}</p>
            </article>
            <article>
              <span>FIELD · Hᵢ</span>
              <strong>{copy.mapField}</strong>
              <p>{copy.mapFieldMeta}</p>
            </article>
          </div>
          <div className="fount-docs-system-return">
            <span>{lang === "zh" ? "共同经历返回" : "shared experience returns"}</span>
            <strong>{copy.mapExperience}</strong>
          </div>
        </div>

        <div className="fount-docs-role-grid">
          {SYSTEM_ROLES.map((role) => (
            <article key={role.code}>
              <span>{role.code}</span>
              <h3>{text(role.title, lang)}</h3>
              <p>{text(role.body, lang)}</p>
            </article>
          ))}
        </div>
      </DocsSection>

      <DocsSection
        id="docs-worlds"
        index="03"
        title={copy.posteriorTitle}
        lead={copy.posteriorLead}
      >
        <Formula label={copy.principleLabel}>{copy.formulaPosterior}</Formula>

        <div className="fount-docs-subsection">
          <header>
            <h3>{copy.worldsTitle}</h3>
            <p>{copy.worldsLead}</p>
          </header>
          <div className="fount-docs-world-grid">
            {FOUR_WORLDS.map((world) => (
              <article className={`is-${world.tone}`} key={world.code}>
                <span>{world.code}</span>
                <h4>{text(world.title, lang)}</h4>
                <p>{text(world.body, lang)}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="fount-docs-causal-loop" aria-label={copy.posteriorTitle}>
          {[
            { zh: "证据", en: "Evidence" },
            { zh: "后验", en: "Posterior" },
            { zh: "预测", en: "Prediction" },
            { zh: "Tool 行动", en: "Tool action" },
            { zh: "新证据", en: "New evidence" },
          ].map((item, index, items) => (
            <div key={item.en}>
              <span>{text(item, lang)}</span>
              {index < items.length - 1 ? <b aria-hidden="true">→</b> : null}
            </div>
          ))}
        </div>
      </DocsSection>

      <DocsSection
        id="docs-drive"
        index="04"
        title={copy.driveTitle}
        lead={copy.driveLead}
      >
        <ol className="fount-docs-principle-list">
          {DRIVE_ITEMS.map((item) => (
            <li key={item.label}>
              <span>{item.label}</span>
              <div>
                <h3>{text(item.title, lang)}</h3>
                <p>{text(item.body, lang)}</p>
              </div>
            </li>
          ))}
        </ol>
        <blockquote className="fount-docs-quote">
          {lang === "zh"
            ? "只有用户在不同结构的 Field 中自发迁移了能力，才构成认知拓展的证据。机器理解了用户，不等于用户已经成长。"
            : "Cognitive expansion is evidenced only when the user spontaneously transfers an ability across structurally different Fields. The machine understanding the user does not mean the user has grown."}
        </blockquote>
      </DocsSection>

      <DocsSection
        id="docs-agents"
        index="05"
        title={copy.agentsTitle}
        lead={copy.agentsLead}
      >
        <Formula label={copy.principleLabel}>{copy.formulaAgent}</Formula>
        <div className="fount-docs-agent-layout">
          <div className="fount-docs-agent-kinds">
            {AGENT_KINDS.map((kind) => (
              <article key={kind.code}>
                <span>{kind.code}</span>
                <h3>{text(kind.title, lang)}</h3>
                <p>{text(kind.body, lang)}</p>
              </article>
            ))}
          </div>
          <aside className="fount-docs-contract">
            <span>{lang === "zh" ? "代理契约最小字段" : "Minimum agent contract"}</span>
            <ol>
              {AGENT_CONTRACT.map((item, index) => (
                <li key={item.en}>
                  <b>{String(index + 1).padStart(2, "0")}</b>
                  {text(item, lang)}
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </DocsSection>

      <DocsSection
        id="docs-field"
        index="06"
        title={copy.fieldTitle}
        lead={copy.fieldLead}
      >
        <div className="fount-docs-field-layout">
          <figure className="fount-docs-code-card">
            <figcaption>{copy.manifestLabel}</figcaption>
            <pre><code>{MANIFEST_EXAMPLE}</code></pre>
          </figure>
          <div className="fount-docs-field-notes">
            {FIELD_NOTES.map((note, index) => (
              <article key={note.title.en}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{text(note.title, lang)}</h3>
                  <p>{text(note.body, lang)}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="fount-docs-sdk-block">
          <span>{copy.sdkFlowLabel}</span>
          <div className="fount-docs-sdk-flow">
            {SDK_FLOW.map((step, index) => (
              <div key={step.en}>
                <strong>{text(step, lang)}</strong>
                {index < SDK_FLOW.length - 1 ? <b aria-hidden="true">→</b> : null}
              </div>
            ))}
          </div>
          <div className="fount-docs-capabilities">
            {SDK_CAPABILITIES.map((capability) => (
              <span key={capability}>{capability}</span>
            ))}
          </div>
        </div>
      </DocsSection>

      <DocsSection
        id="docs-trust"
        index="07"
        title={copy.trustTitle}
        lead={copy.trustLead}
      >
        <Formula label={copy.principleLabel}>{copy.formulaPermission}</Formula>
        <div className="fount-docs-trust-grid">
          {TRUST_CARDS.map((card) => (
            <article key={card.code}>
              <span>{card.code}</span>
              <h3>{text(card.title, lang)}</h3>
              <p>{text(card.body, lang)}</p>
            </article>
          ))}
        </div>

        <div className="fount-docs-table-wrap">
          <table aria-label={copy.permissionTableLabel}>
            <thead>
              <tr>
                <th>{lang === "zh" ? "能力" : "Capability"}</th>
                <th>{lang === "zh" ? "用户" : "User"}</th>
                <th>Fount</th>
                <th>Field</th>
                <th>{lang === "zh" ? "额外边界" : "Additional boundary"}</th>
              </tr>
            </thead>
            <tbody>
              {PERMISSION_ROWS.map((row) => (
                <tr key={row.capability.en}>
                  <th scope="row">{text(row.capability, lang)}</th>
                  <td>{text(row.user, lang)}</td>
                  <td>{text(row.fount, lang)}</td>
                  <td>{text(row.field, lang)}</td>
                  <td>{text(row.extra, lang)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DocsSection>

      <DocsSection
        id="docs-build"
        index="08"
        title={copy.buildTitle}
        lead={copy.buildLead}
      >
        <div className="fount-docs-build-grid">
          {BUILD_GROUPS.map((group) => (
            <article key={group.code}>
              <span>{group.code}</span>
              <h3>{text(group.title, lang)}</h3>
              <p>{text(group.lead, lang)}</p>
              <ul>
                {group.items.map((item) => (
                  <li key={item.en}>{text(item, lang)}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </DocsSection>

      <DocsSection
        id="docs-roadmap"
        index="09"
        title={copy.roadmapTitle}
        lead={copy.roadmapLead}
      >
        <ol className="fount-docs-roadmap">
          {ROADMAP.map((step) => (
            <li key={step.label}>
              <span>{step.label}</span>
              <div>
                <h3>{text(step.title, lang)}</h3>
                <p>{text(step.body, lang)}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="fount-docs-subsection fount-docs-reference-block">
          <header>
            <h3>{copy.referenceTitle}</h3>
            <p>{copy.referenceLead}</p>
          </header>
          <div className="fount-docs-reference-grid">
            {REFERENCE_GROUPS.map((reference) => (
              <article key={reference.title}>
                <span>{reference.title}</span>
                <p>{text(reference.body, lang)}</p>
              </article>
            ))}
          </div>
        </div>
      </DocsSection>

      <section className="fount-docs-cta">
        <h2>{copy.ctaTitle}</h2>
        <p>{copy.ctaBody}</p>
        <div>
          <a href={`/?lang=${lang}`}>{copy.ctaHome}</a>
          <a href={`/fields?lang=${lang}`}>{copy.ctaFields}</a>
        </div>
      </section>
    </article>
  );
}
