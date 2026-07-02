import { useEffect } from "react";
import type { Lang } from "../i18n/lang";

type FountHomePageProps = {
  lang: Lang;
  onLangChange: (lang: Lang) => void;
};

type LocalizedText = Record<Lang, string>;

type ConceptItem = {
  name: string;
  title: LocalizedText;
  body: LocalizedText;
};

type FieldExample = {
  name: string;
  description: LocalizedText;
  tags: string[];
  agents: string;
  memory: LocalizedText;
};

type FoundryField = {
  name: string;
  fit: LocalizedText;
  price: string;
  budget: string;
  permissions: string;
  status: string;
  traits: string[];
};

type PricingPlan = {
  name: string;
  audience: LocalizedText;
  price: string;
  features: LocalizedText[];
};

const SYSTEM_DOCS_URL = "https://system.wordm.us";

const COPY = {
  zh: {
    documentTitle: "Fount | Personal Agent World System",
    navFields: "Fields",
    navForge: "Forge",
    navFoundry: "Foundry",
    navSdk: "SDK",
    navPricing: "Pricing",
    navDocs: "文档",
    download: "Download",
    heroTitle:
      "Fount is your personal agent brain for discovering, entering, creating, and evolving Fields.",
    heroDeck:
      "Fount is not just an assistant. It is a personal agent brain that remembers your experiences, enters Fields with you, controls Field agents, discovers new Fields, and helps you reshape them through Forge.",
    heroZh:
      "下载 Fount，进入 Field，和你的个人 agent 一起发现、体验、创造和改造新的世界。",
    primaryCta: "Download Fount for Mac",
    secondaryCta: "Explore Fields",
    heroFootnote:
      "Personal agent brain. Open Fields. Shared experience. Built for everyone.",
    dashboardTitle: "Fount Home",
    dashboardStatus: "3 Fields active · 12 memories ready to sync",
    introTitle: "One personal brain. Many Fields.",
    introLead:
      "Fount 面向所有人。它是个人 agent 大脑：进入不同 Field，与 Field agent 互动，控制部分行动，积累经验，再把一个 Field 的记忆带到另一个 Field。",
    fieldTitle: "Fields are not just apps. They are places your agent can experience.",
    fieldLead:
      "A Field can be a tool, a game, a learning space, a creative studio, a simulation, a shop, a reading room, or a small world. What makes it a Field is not its category, but that Fount can enter it, understand it, act through it, remember from it, and evolve with it.",
    forgeTitle: "Forge is where Fields are made, remixed, and reshaped.",
    forgeLead:
      "Forge 不是单纯的开发者 IDE。它是人和 Fount 一起创造可体验世界的工坊：普通用户改造体验，开发者连接源码、SDK、测试与发布。",
    everyone: "For everyone",
    builders: "For builders",
    permissionRule:
      "Fount can use Forge to modify a Field only when the Field grants the right permissions, such as source access or editable configuration.",
    foundryTitle: "Foundry is where people and Fount discover Fields.",
    foundryLead:
      "Foundry 不是普通商店。人可以发现 Field，Fount 也可以基于记忆、兴趣、目标、资源和权限边界，主动去 Foundry 寻找适合你的新 Field。",
    foundryLine:
      "Fields are discovered by people, recommended by Fount, built in Forge, and experienced together.",
    sdkTitle: "The SDK turns an app into a Field.",
    sdkLead:
      "Fount SDK 让普通 app 获得与 Fount 互通经验、记忆、权限、控制和 agent 行动的能力，而不只是接上一个接口。",
    sdkOpen:
      "Fount core and SDK can be open. Official Forge workflows, Foundry distribution, certification, testing, cloud sync, licensing, payments, recommendations, and developer analytics can be commercial services.",
    loopTitle: "Experience flows both ways.",
    loopLead:
      "A Field becomes more useful when Fount understands it. Fount becomes more personal when it experiences more Fields.",
    pricingTitle: "Start with Fount. Expand through Fields.",
    pricingLead:
      "从安装 Fount 开始，随着你的 Field、记忆、改造和发布需求增长，再扩展到 Plus、Forge 和 Foundry。",
    finalTitle: "Download Fount and enter your first Field.",
    finalBody:
      "For everyone who wants a personal agent that remembers, discovers, plays, creates, and evolves through Fields.",
    finalSecondary: "Explore Foundry",
  },
  en: {
    documentTitle: "Fount | Personal Agent World System",
    navFields: "Fields",
    navForge: "Forge",
    navFoundry: "Foundry",
    navSdk: "SDK",
    navPricing: "Pricing",
    navDocs: "文档",
    download: "Download",
    heroTitle:
      "Fount is your personal agent brain for discovering, entering, creating, and evolving Fields.",
    heroDeck:
      "Fount is not just an assistant. It is a personal agent brain that remembers your experiences, enters Fields with you, controls Field agents, discovers new Fields, and helps you reshape them through Forge.",
    heroZh:
      "Download Fount, enter Fields, and discover, experience, create, and reshape new worlds with your personal agent.",
    primaryCta: "Download Fount for Mac",
    secondaryCta: "Explore Fields",
    heroFootnote:
      "Personal agent brain. Open Fields. Shared experience. Built for everyone.",
    dashboardTitle: "Fount Home",
    dashboardStatus: "3 Fields active · 12 memories ready to sync",
    introTitle: "One personal brain. Many Fields.",
    introLead:
      "Fount is for everyone, not only developers. It enters Fields, interacts with Field agents, guides permitted actions, accumulates experience, and carries useful memory from one Field into another.",
    fieldTitle: "Fields are not just apps. They are places your agent can experience.",
    fieldLead:
      "A Field can be a tool, a game, a learning space, a creative studio, a simulation, a shop, a reading room, or a small world. What makes it a Field is not its category, but that Fount can enter it, understand it, act through it, remember from it, and evolve with it.",
    forgeTitle: "Forge is where Fields are made, remixed, and reshaped.",
    forgeLead:
      "Forge is not just an IDE. It is a workshop where people and Fount create experiences together: non-developers reshape behavior and scenes, while builders connect source, SDK, testing, packaging, and publishing.",
    everyone: "For everyone",
    builders: "For builders",
    permissionRule:
      "Fount can use Forge to modify a Field only when the Field grants the right permissions, such as source access or editable configuration.",
    foundryTitle: "Foundry is where people and Fount discover Fields.",
    foundryLead:
      "Foundry is not a normal store. People can browse it, and Fount can also visit it autonomously to find Fields that match your memories, interests, goals, resources, and permission boundaries.",
    foundryLine:
      "Fields are discovered by people, recommended by Fount, built in Forge, and experienced together.",
    sdkTitle: "The SDK turns an app into a Field.",
    sdkLead:
      "The Fount SDK lets an ordinary app exchange experience, memory, permissions, control, and agent actions with Fount. It is more than a connector.",
    sdkOpen:
      "Fount core and SDK can be open. Official Forge workflows, Foundry distribution, certification, testing, cloud sync, licensing, payments, recommendations, and developer analytics can be commercial services.",
    loopTitle: "Experience flows both ways.",
    loopLead:
      "A Field becomes more useful when Fount understands it. Fount becomes more personal when it experiences more Fields.",
    pricingTitle: "Start with Fount. Expand through Fields.",
    pricingLead:
      "Install Fount first, then expand as your Fields, memories, remixes, and publishing needs grow.",
    finalTitle: "Download Fount and enter your first Field.",
    finalBody:
      "For everyone who wants a personal agent that remembers, discovers, plays, creates, and evolves through Fields.",
    finalSecondary: "Explore Foundry",
  },
} as const;

const CONCEPTS: ConceptItem[] = [
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
      zh: "可进入的产品环境",
      en: "Enterable product environment",
    },
    body: {
      zh: "人可以使用，Fount 可以进入，Field agent 可以在规则内行动，并产生可回流的经验。",
      en: "A place people can use, Fount can enter, and Field agents can act inside defined rules while producing experience events.",
    },
  },
  {
    name: "Forge",
    title: {
      zh: "创造和改造 Field 的工坊",
      en: "Workshop for shaping Fields",
    },
    body: {
      zh: "普通用户改造界面、规则、角色和流程；开发者在获得权限后编辑源码、连接 SDK、测试和发布。",
      en: "For reshaping UI, rules, roles, and workflows, plus source editing, SDK wiring, testing, and publishing when permission is granted.",
    },
  },
  {
    name: "Foundry",
    title: {
      zh: "发现、安装、购买、发布 Field 的生态",
      en: "Field discovery and distribution",
    },
    body: {
      zh: "不是普通 app store。用户可以发现 Field，Fount 也能主动寻找适合你的 Field。",
      en: "Not a normal app store. People discover Fields, and Fount can autonomously recommend Fields for you.",
    },
  },
];

const INTRO_CARDS: ConceptItem[] = [
  {
    name: "01",
    title: { zh: "Personal Agent Brain", en: "Personal Agent Brain" },
    body: {
      zh: "Fount remembers your preferences, goals, history, creations, reactions, and decisions. It is the continuity layer across all Fields.",
      en: "Fount remembers your preferences, goals, history, creations, reactions, and decisions. It is the continuity layer across all Fields.",
    },
  },
  {
    name: "02",
    title: { zh: "Cross-Field Memory", en: "Cross-Field Memory" },
    body: {
      zh: "Reading Room 的阅读习惯可以影响 Learning Lab；UI Playground 的视觉偏好可以影响 Forge。",
      en: "A reading habit from Reading Room can influence Learning Lab. A UI preference from UI Playground can influence Forge.",
    },
  },
  {
    name: "03",
    title: { zh: "Field Control", en: "Field Control" },
    body: {
      zh: "Field agent 在 Field 规则与框架中行动，同时可以接收来自 Fount 的控制、引导、权限或上下文。",
      en: "Field agents act within their Field rules, while receiving control, guidance, permission, or context from Fount.",
    },
  },
  {
    name: "04",
    title: { zh: "Autonomous Discovery", en: "Autonomous Discovery" },
    body: {
      zh: "Fount 可以访问 Foundry，根据你的目标、好奇心、项目、情绪或日常节律推荐新 Field。",
      en: "Fount can visit Foundry and recommend Fields that match your goals, curiosity, projects, emotions, or routines.",
    },
  },
];

const HERO_FIELDS = [
  {
    name: "Reading Room",
    status: "Open",
    agents: "Reader · Tutor",
    experience: "Preferred quiet summaries",
    traits: ["Modifiable", "Memory sync"],
  },
  {
    name: "UI Playground",
    status: "Editing",
    agents: "Critic · Layout agent",
    experience: "Likes dense calm layouts",
    traits: ["Source access", "Forge-ready"],
  },
  {
    name: "Finance Garden",
    status: "Permission needed",
    agents: "Budget guide",
    experience: "Risk boundary: conservative",
    traits: ["Private", "Ledger"],
  },
  {
    name: "Memory Theater",
    status: "Remembering",
    agents: "Archivist · Director",
    experience: "Project stories as scenes",
    traits: ["Fount-aware", "Recall"],
  },
];

const RIGHT_FEED = [
  "Fount recalled your layout preference from UI Playground.",
  "Foundry found a Field that matches your interest in agent games.",
  "Forge can modify this Field because source access is granted.",
  "Field agent requested permission to use Fount memory.",
];

const FIELD_LAYERS = [
  "Field interface",
  "Field rules",
  "Field agents",
  "Experience events",
  "Permissions",
  "Memory sync",
  "Source access",
  "Fount control channel",
];

const FIELD_EXAMPLES: FieldExample[] = [
  {
    name: "Reading Room",
    description: {
      zh: "阅读和学习 Field。Fount 记住你读到哪里、困惑什么、喜欢什么解释方式。",
      en: "A reading and learning Field. Fount remembers where you stopped, what confused you, and which explanations help.",
    },
    tags: ["Fount-aware", "Memory sync", "Permission required"],
    agents: "Reader · Tutor",
    memory: { zh: "reading pace, confusion, taste", en: "reading pace, confusion, taste" },
  },
  {
    name: "UI Playground",
    description: {
      zh: "界面创造 Field。Fount 记住视觉偏好，并能带到其他设计 Field。",
      en: "A UI creation Field. Fount remembers visual preferences and carries them into other design Fields.",
    },
    tags: ["Modifiable", "Source available", "Has Field agents"],
    agents: "Layout · Critic",
    memory: { zh: "layout preference", en: "layout preference" },
  },
  {
    name: "Memory Theater",
    description: {
      zh: "回顾人生、项目和经验的 Field。Fount 把过去事件重组为场景。",
      en: "A Field for revisiting life, projects, and experience by turning past events into scenes.",
    },
    tags: ["Playable", "Memory sync", "Fount-aware"],
    agents: "Archivist · Scene maker",
    memory: { zh: "events as scenes", en: "events as scenes" },
  },
  {
    name: "Agent Game Field",
    description: {
      zh: "包含多个角色 agent 的游戏 Field。Fount 可以观察、干预或控制部分 agent。",
      en: "A game Field with character agents. Fount can observe, intervene, or control permitted agents.",
    },
    tags: ["Playable", "Has Field agents", "Permission required"],
    agents: "NPCs · Referee",
    memory: { zh: "play style", en: "play style" },
  },
  {
    name: "Learning Lab",
    description: {
      zh: "学习 Field。Fount 根据你在其他 Field 的经验调整教学方式。",
      en: "A learning Field where Fount adapts teaching based on experience from other Fields.",
    },
    tags: ["Fount-aware", "Memory sync", "Modifiable"],
    agents: "Tutor · Quiz maker",
    memory: { zh: "learning habits", en: "learning habits" },
  },
  {
    name: "Finance Garden",
    description: {
      zh: "个人财务 Field。Fount 记住预算偏好、消费模式和风险边界。",
      en: "A personal finance Field. Fount remembers budget preferences, spending patterns, and risk boundaries.",
    },
    tags: ["Permission required", "Private", "Resource ledger"],
    agents: "Budget guide",
    memory: { zh: "budget rhythm", en: "budget rhythm" },
  },
];

const EVERYONE_ITEMS = [
  "Customize a Field",
  "Change the mood, layout, rules, and agents",
  "Remix templates",
  "Ask Fount to reshape an experience",
  "Create personal spaces without writing code",
];

const BUILDER_ITEMS = [
  "Edit source when permission is granted",
  "Connect Fount SDK",
  "Expose permissions and memory channels",
  "Test with virtual users",
  "Package as a Field",
  "Publish to Foundry",
];

const FORGE_STEPS = [
  "Imagine",
  "Enter a Field",
  "Notice what should change",
  "Ask Fount to reshape it",
  "Check permissions",
  "Modify in Forge",
  "Test with Field agents and virtual users",
  "Publish or keep private",
];

const FOUNDRY_FIELDS: FoundryField[] = [
  {
    name: "Quiet Study Room",
    fit: {
      zh: "适合独处学习，Fount 可以记住用户的阅读节奏。",
      en: "For quiet study. Fount remembers your reading rhythm.",
    },
    price: "Free",
    budget: "Low CPU · Local memory",
    permissions: "Reading state",
    status: "Certified",
    traits: ["Fount-aware", "Memory sync", "No source access"],
  },
  {
    name: "Tiny Product Studio",
    fit: {
      zh: "适合把想法变成小产品，支持 Forge 改造。",
      en: "For turning ideas into small products, with Forge remix support.",
    },
    price: "Coming soon",
    budget: "Medium compute",
    permissions: "Source access",
    status: "Verified builder",
    traits: ["Forge-ready", "Field agents", "Source available"],
  },
  {
    name: "Character Town",
    fit: {
      zh: "角色 agent 小镇，Fount 可以进入、观察、控制部分 agent。",
      en: "A character-agent town where Fount can enter, observe, and control permitted agents.",
    },
    price: "Coming soon",
    budget: "Medium GPU",
    permissions: "Agent control",
    status: "Playtest",
    traits: ["Playable", "Field agents", "Permission required"],
  },
  {
    name: "Personal Ritual Garden",
    fit: {
      zh: "帮助用户建立生活仪式，Fount 会记住习惯与情绪变化。",
      en: "Build personal rituals while Fount remembers habit and mood changes.",
    },
    price: "Free",
    budget: "Low compute",
    permissions: "Habit memory",
    status: "Certified",
    traits: ["Fount-aware", "Memory sync", "Forge config"],
  },
];

const SDK_CAPABILITIES = [
  "Fount identity",
  "Memory sync",
  "Experience events",
  "Permission layer",
  "Field agent control",
  "Resource ledger",
  "Foundry metadata",
  "Forge editability",
  "Licensing",
  "Updates",
];

const LOOP_STEPS = [
  "Enter",
  "Experience",
  "Remember",
  "Recall",
  "Discover",
  "Modify",
  "Return",
];

const PRICING_PLANS: PricingPlan[] = [
  {
    name: "Fount Free",
    audience: {
      zh: "适合所有人。安装 Fount，进入 Fields，管理记忆、权限、基础资源账本，使用官方基础 Field。",
      en: "For everyone. Install Fount, enter Fields, manage memory, permissions, a basic resource ledger, and official starter Fields.",
    },
    price: "Free",
    features: [
      { zh: "Personal agent brain", en: "Personal agent brain" },
      { zh: "Basic Fields", en: "Basic Fields" },
      { zh: "Memory and permission control", en: "Memory and permission control" },
    ],
  },
  {
    name: "Fount Plus",
    audience: {
      zh: "适合深度个人使用。更多记忆能力、跨 Field 自动化、Foundry 推荐、本地和云端同步。",
      en: "For deeper personal use: stronger memory, cross-Field automation, Foundry recommendations, and local/cloud sync.",
    },
    price: "Coming soon",
    features: [
      { zh: "More memory capacity", en: "More memory capacity" },
      { zh: "Cross-Field automation", en: "Cross-Field automation" },
      { zh: "Personal recommendations", en: "Personal recommendations" },
    ],
  },
  {
    name: "Forge Pro",
    audience: {
      zh: "适合创造者和开发者。高级 Field 改造、源码编辑、SDK 工具、虚拟用户测试、打包和发布。",
      en: "For creators and developers: advanced remixes, source editing, SDK tools, virtual-user testing, packaging, and publishing.",
    },
    price: "Coming soon",
    features: [
      { zh: "Advanced Forge workflows", en: "Advanced Forge workflows" },
      { zh: "Source and SDK tooling", en: "Source and SDK tooling" },
      { zh: "Packaging and testing", en: "Packaging and testing" },
    ],
  },
  {
    name: "Foundry Developer",
    audience: {
      zh: "适合发布 Field 的创作者。Field listing、认证流程、授权、更新、分析和商业化工具。",
      en: "For Field publishers: listings, certification, licensing, updates, analytics, and monetization tools.",
    },
    price: "Coming soon",
    features: [
      { zh: "Field listing", en: "Field listing" },
      { zh: "Certification and licensing", en: "Certification and licensing" },
      { zh: "Developer analytics", en: "Developer analytics" },
    ],
  },
];

function useDocumentMetadata(lang: Lang) {
  const copy = COPY[lang];

  useEffect(() => {
    document.title = copy.documentTitle;

    let metaDescription = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    );
    if (!metaDescription) {
      metaDescription = document.createElement("meta");
      metaDescription.name = "description";
      document.head.appendChild(metaDescription);
    }
    metaDescription.content =
      lang === "zh"
        ? "Fount 是面向所有人的 personal agent world system：个人 agent 大脑、Field、Forge、Foundry 与 Fount SDK 的完整生态。"
        : "Fount is a personal agent world system for everyone: a personal agent brain, Fields, Forge, Foundry, and the Fount SDK.";
  }, [copy.documentTitle, lang]);
}

function Header({ lang, onLangChange }: FountHomePageProps) {
  const copy = COPY[lang];

  return (
    <header className="fount-header">
      <a className="fount-logo" href="/" aria-label="Fount home">
        <span className="fount-logo-mark" aria-hidden="true">
          <span />
        </span>
        <span>Fount</span>
      </a>

      <nav className="fount-nav" aria-label="Fount navigation">
        <a href="#fields">{copy.navFields}</a>
        <a href="#forge">{copy.navForge}</a>
        <a href="#foundry">{copy.navFoundry}</a>
        <a href="#sdk">{copy.navSdk}</a>
        <a href="#pricing">{copy.navPricing}</a>
        <a href={SYSTEM_DOCS_URL} target="_blank" rel="noreferrer">
          {copy.navDocs}
        </a>
      </nav>

      <div className="fount-header-actions">
        <div className="fount-lang-switch" aria-label="Language">
          <button
            type="button"
            className={lang === "zh" ? "active" : ""}
            aria-pressed={lang === "zh"}
            onClick={() => onLangChange("zh")}
          >
            中文
          </button>
          <button
            type="button"
            className={lang === "en" ? "active" : ""}
            aria-pressed={lang === "en"}
            onClick={() => onLangChange("en")}
          >
            EN
          </button>
        </div>
        <a className="fount-download-small" href="/download">
          {copy.download}
        </a>
      </div>
    </header>
  );
}

function Hero({ lang }: { lang: Lang }) {
  const copy = COPY[lang];

  return (
    <section className="fount-hero">
      <div className="fount-hero-copy">
        <h1>{copy.heroTitle}</h1>
        <p className="fount-hero-deck">{copy.heroDeck}</p>

        <div className="fount-actions">
          <a className="fount-primary-action" href="/download">
            {copy.primaryCta}
          </a>
          <a className="fount-secondary-action" href="#fields">
            {copy.secondaryCta}
          </a>
        </div>
        <p className="fount-hero-footnote">{copy.heroFootnote}</p>
        <p className="fount-hero-zh">{copy.heroZh}</p>

        <div className="fount-concept-strip" aria-label="Fount concepts">
          {CONCEPTS.map((concept) => (
            <article key={concept.name}>
              <strong>{concept.name}</strong>
              <span>{concept.title[lang]}</span>
            </article>
          ))}
        </div>
      </div>

      <FountDashboard lang={lang} />
    </section>
  );
}

function FountDashboard({ lang }: { lang: Lang }) {
  const copy = COPY[lang];

  return (
    <div className="fount-dashboard" aria-label="Fount app dashboard mockup">
      <div className="fount-window-bar">
        <span />
        <span />
        <span />
      </div>
      <div className="fount-dashboard-body">
        <aside className="fount-dashboard-sidebar">
          {["Home", "Fields", "Forge", "Foundry", "Memory", "Agents", "Permissions"].map(
            (item) => (
              <span className={item === "Fields" ? "active" : ""} key={item}>
                {item}
              </span>
            ),
          )}
        </aside>

        <main className="fount-dashboard-main">
          <div className="fount-dashboard-heading">
            <div>
              <strong>{copy.dashboardTitle}</strong>
              <span>{copy.dashboardStatus}</span>
            </div>
            <button type="button">Enter Field</button>
          </div>

          <div className="fount-field-mini-grid">
            {HERO_FIELDS.map((field) => (
              <article key={field.name} className="fount-field-mini-card">
                <div>
                  <strong>{field.name}</strong>
                  <span>{field.status}</span>
                </div>
                <p>{field.agents}</p>
                <small>{field.experience}</small>
                <div>
                  {field.traits.map((trait) => (
                    <span key={trait}>{trait}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </main>

        <aside className="fount-dashboard-feed">
          <strong>Memory stream</strong>
          {RIGHT_FEED.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </aside>
      </div>
    </div>
  );
}

function FountIntro({ lang }: { lang: Lang }) {
  const copy = COPY[lang];

  return (
    <section className="fount-section fount-intro" id="brain">
      <div className="fount-section-head">
        <h2>{copy.introTitle}</h2>
        <p>{copy.introLead}</p>
      </div>
      <div className="fount-intro-grid">
        {INTRO_CARDS.map((card) => (
          <article key={card.name} className="fount-thick-card">
            <span>{card.name}</span>
            <h3>{card.title[lang]}</h3>
            <p>{card.body[lang]}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function FieldSection({ lang }: { lang: Lang }) {
  const copy = COPY[lang];

  return (
    <section className="fount-section" id="fields">
      <div className="fount-section-head">
        <h2>{copy.fieldTitle}</h2>
        <p>{copy.fieldLead}</p>
      </div>

      <div className="fount-field-anatomy">
        <div className="fount-field-world">
          <span className="fount-world-label">Example Field</span>
          <strong>Learning Lab</strong>
          <p>Fount enters, learns the rules, guides agents, and syncs useful experience back to memory.</p>
        </div>
        <div className="fount-layer-grid">
          {FIELD_LAYERS.map((layer) => (
            <span key={layer}>{layer}</span>
          ))}
        </div>
      </div>

      <div className="fount-field-grid">
        {FIELD_EXAMPLES.map((field) => (
          <article className="fount-field-card" key={field.name}>
            <div className="fount-field-card-top">
              <h3>{field.name}</h3>
              <span>{field.agents}</span>
            </div>
            <p>{field.description[lang]}</p>
            <small>Experience: {field.memory[lang]}</small>
            <div className="fount-tag-row">
              {field.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ForgeSection({ lang }: { lang: Lang }) {
  const copy = COPY[lang];

  return (
    <section className="fount-section" id="forge">
      <div className="fount-section-head fount-section-head-wide">
        <h2>{copy.forgeTitle}</h2>
        <p>{copy.forgeLead}</p>
      </div>

      <div className="fount-forge-columns">
        <article>
          <h3>{copy.everyone}</h3>
          <ul>
            {EVERYONE_ITEMS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <article>
          <h3>{copy.builders}</h3>
          <ul>
            {BUILDER_ITEMS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </div>

      <p className="fount-permission-rule">{copy.permissionRule}</p>

      <div className="fount-forge-flow" aria-label="Forge workflow">
        {FORGE_STEPS.map((step, index) => (
          <div className="fount-flow-step" key={step}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{step}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function FoundrySection({ lang }: { lang: Lang }) {
  const copy = COPY[lang];

  return (
    <section className="fount-section" id="foundry">
      <div className="fount-section-head">
        <h2>{copy.foundryTitle}</h2>
        <p>{copy.foundryLead}</p>
      </div>

      <div className="fount-foundry-grid">
        {FOUNDRY_FIELDS.map((field) => (
          <article className="fount-foundry-card" key={field.name}>
            <div>
              <h3>{field.name}</h3>
              <span>{field.price}</span>
            </div>
            <p>{field.fit[lang]}</p>
            <dl>
              <div>
                <dt>Fount-aware</dt>
                <dd>Yes</dd>
              </div>
              <div>
                <dt>Resource budget</dt>
                <dd>{field.budget}</dd>
              </div>
              <div>
                <dt>Permissions</dt>
                <dd>{field.permissions}</dd>
              </div>
              <div>
                <dt>Certification</dt>
                <dd>{field.status}</dd>
              </div>
            </dl>
            <div className="fount-tag-row">
              {field.traits.map((trait) => (
                <span key={trait}>{trait}</span>
              ))}
            </div>
          </article>
        ))}
      </div>

      <p className="fount-foundry-line">{copy.foundryLine}</p>
    </section>
  );
}

function SDKSection({ lang }: { lang: Lang }) {
  const copy = COPY[lang];

  return (
    <section className="fount-section fount-sdk" id="sdk">
      <div className="fount-section-head">
        <h2>{copy.sdkTitle}</h2>
        <p>{copy.sdkLead}</p>
      </div>

      <div className="fount-sdk-panel">
        <div className="fount-sdk-diagram" aria-label="App to Field diagram">
          <div>Ordinary App / Product</div>
          <span aria-hidden="true">↓</span>
          <div>Fount SDK</div>
          <span aria-hidden="true">↓</span>
          <div>Field</div>
        </div>
        <div className="fount-sdk-capabilities">
          {SDK_CAPABILITIES.map((capability) => (
            <span key={capability}>{capability}</span>
          ))}
        </div>
      </div>

      <p className="fount-sdk-open">{copy.sdkOpen}</p>
    </section>
  );
}

function ExperienceLoop({ lang }: { lang: Lang }) {
  const copy = COPY[lang];

  return (
    <section className="fount-section fount-loop">
      <div className="fount-section-head">
        <h2>{copy.loopTitle}</h2>
        <p>{copy.loopLead}</p>
      </div>

      <div className="fount-loop-chain" aria-label="Experience loop">
        {LOOP_STEPS.map((step, index) => (
          <div className="fount-loop-node" key={step}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{step}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function PricingSection({ lang }: { lang: Lang }) {
  const copy = COPY[lang];

  return (
    <section className="fount-section" id="pricing">
      <div className="fount-section-head">
        <h2>{copy.pricingTitle}</h2>
        <p>{copy.pricingLead}</p>
      </div>

      <div className="fount-pricing-grid">
        {PRICING_PLANS.map((plan) => (
          <article className="fount-pricing-card" key={plan.name}>
            <h3>{plan.name}</h3>
            <strong>{plan.price}</strong>
            <p>{plan.audience[lang]}</p>
            <ul>
              {plan.features.map((feature) => (
                <li key={feature.en}>{feature[lang]}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

function FinalCTA({ lang }: { lang: Lang }) {
  const copy = COPY[lang];

  return (
    <section className="fount-final-cta">
      <h2>{copy.finalTitle}</h2>
      <p>{copy.finalBody}</p>
      <div className="fount-actions">
        <a className="fount-primary-action" href="/download">
          {copy.primaryCta}
        </a>
        <a className="fount-secondary-action" href="#foundry">
          {copy.finalSecondary}
        </a>
      </div>
    </section>
  );
}

export function FountHomePage({ lang, onLangChange }: FountHomePageProps) {
  useDocumentMetadata(lang);

  return (
    <main className="fount-page">
      <Header lang={lang} onLangChange={onLangChange} />
      <Hero lang={lang} />
      <FountIntro lang={lang} />
      <FieldSection lang={lang} />
      <ForgeSection lang={lang} />
      <FoundrySection lang={lang} />
      <SDKSection lang={lang} />
      <ExperienceLoop lang={lang} />
      <PricingSection lang={lang} />
      <FinalCTA lang={lang} />
    </main>
  );
}
