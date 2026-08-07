import type { Lang } from "../i18n/lang";

type LocalizedText = Record<Lang, string>;

export type FountFieldScreenshot = {
  url: string;
  alt: LocalizedText;
  caption: LocalizedText;
  objectPosition?: string;
};

export type FountField = {
  key: string;
  name: string;
  href: string;
  previewUrl: string;
  embedType?: "video";
  coverUrl: string;
  coverAlt: LocalizedText;
  coverCaption: LocalizedText;
  screenshots?: FountFieldScreenshot[];
  kind: LocalizedText;
  status?: LocalizedText;
  summary: LocalizedText;
  readingShift?: {
    from: LocalizedText;
    to: LocalizedText;
  };
};

export const FOUNT_FIELDS: FountField[] = [
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
    coverCaption: {
      zh: "书页展开成可漫游的 3D 世界",
      en: "Pages unfold into a walkable 3D world",
    },
    screenshots: [
      {
        url: "/fields/gallery/flipook-home.webp",
        alt: {
          zh: "Flipook 产品首页展示可以走入的书页世界",
          en: "Flipook home page presenting books as worlds to walk into",
        },
        caption: {
          zh: "从一本书进入一个世界",
          en: "Enter a world from a book",
        },
      },
      {
        url: "/fields/gallery/flipook-features.webp",
        alt: {
          zh: "Flipook 产品路径与跨子域记忆能力介绍",
          en: "Flipook product path and cross-subdomain memory features",
        },
        caption: {
          zh: "阅读、记忆与空间连续发生",
          en: "Reading, memory, and space stay continuous",
        },
      },
    ],
    kind: {
      zh: "空间阅读 Field",
      en: "Spatial Reading Field",
    },
    summary: {
      zh: "把一本书变成可以进入、回看和继续生长的空间化阅读世界。",
      en: "Turns a book into a spatial reading world you can enter, revisit, and keep growing.",
    },
  },
  {
    key: "museum-book",
    name: "MuseumBook",
    href: "https://museum.wordm.us",
    previewUrl: "museum.wordm.us",
    coverUrl: "/fields/gallery/museum-gallery.webp",
    coverAlt: {
      zh: "MuseumBook《呐喊》分馆中可行走的 3D 章节展厅",
      en: "A walkable 3D chapter gallery inside MuseumBook's The Outcry museum",
    },
    coverCaption: {
      zh: "走进一本书真正生成的 3D 章节展厅",
      en: "Enter a real 3D chapter gallery generated from a book",
    },
    screenshots: [
      {
        url: "/fields/gallery/museum-exhibit.webp",
        alt: {
          zh: "MuseumBook 展厅中的策展导语、墙面展品与章节导航",
          en: "MuseumBook gallery with curatorial notes, wall exhibits, and chapter navigation",
        },
        caption: {
          zh: "靠近展品，阅读策展导语与意象之间的关系",
          en: "Approach exhibits and read how curatorial notes connect their motifs",
        },
      },
      {
        url: "/fields/gallery/museum-source-reader.webp",
        alt: {
          zh: "MuseumBook《狂人日记》原文阅读界面与章节完成操作",
          en: "MuseumBook source reader for A Madman's Diary with chapter completion controls",
        },
        caption: {
          zh: "从展览返回《狂人日记》原文，让空间线索落回文本",
          en: "Return from the exhibition to the source text of A Madman's Diary",
        },
      },
    ],
    kind: {
      zh: "文学博物馆 Field",
      en: "Literary Museum Field",
    },
    summary: {
      zh: "章节成为展厅，人物、地点与意象成为展品；从任一展品都能回到对应原文，用空间关系重访整本书。",
      en: "Chapters become galleries while characters, places, and motifs become exhibits; every exhibit leads back to its source passage, so the whole book can be revisited through space.",
    },
    readingShift: {
      from: {
        zh: "沿目录和页码推进",
        en: "Follow chapters and page numbers",
      },
      to: {
        zh: "逛展厅、看展品，再回到原句",
        en: "Walk galleries, inspect exhibits, return to the exact line",
      },
    },
  },
  {
    key: "bookplain",
    name: "Bookplain",
    href: "https://bookplain.wordm.us",
    previewUrl: "bookplain.wordm.us",
    coverUrl: "/home/bookplain-evidence.webp",
    coverAlt: {
      zh: "Bookplain 章节图谱、理解物件与原文证据界面",
      en: "Bookplain chapter map with understanding objects and source evidence",
    },
    coverCaption: {
      zh: "理解物件 ↔ 原文证据",
      en: "Understanding objects ↔ source evidence",
    },
    screenshots: [
      {
        url: "/home/bookplain-gallery.png",
        alt: {
          zh: "Bookplain 空间阅读画廊与真实书架",
          en: "Bookplain spatial reading gallery and realistic bookshelf",
        },
        caption: {
          zh: "地点、人物与关系构成立体图谱",
          en: "Places, people, and relationships form a spatial map",
        },
      },
      {
        url: "/fields/gallery/bookplain-reader.webp",
        alt: {
          zh: "Bookplain 专注阅读界面与章节导航",
          en: "Bookplain focused reader with chapter navigation",
        },
        caption: {
          zh: "理解最终回到原文",
          en: "Understanding always returns to the source",
        },
      },
    ],
    kind: {
      zh: "空间理解 Field",
      en: "Spatial Understanding Field",
    },
    summary: {
      zh: "把地点、人物与关系展开成可探索的立体世界；点击任何理解物件，都能定位支撑它的原文证据。",
      en: "Places, characters, and relationships unfold into an explorable world; every understanding object points back to the passage that supports it.",
    },
    readingShift: {
      from: {
        zh: "读文字，在脑中拼世界",
        en: "Read text and assemble the world in your head",
      },
      to: {
        zh: "走进世界，点物件核对原文",
        en: "Enter the world and inspect objects against the source",
      },
    },
  },
  {
    key: "wanjuan",
    name: "万卷 WanJuan",
    href: "https://wanjuan.wordm.us",
    previewUrl: "wanjuan.wordm.us",
    coverUrl: "/home/wanjuan-field.webp",
    coverAlt: {
      zh: "万卷由 162 部经典组成的时间地域 3D 书场",
      en: "WanJuan 3D literary field of 162 classics arranged across time and region",
    },
    coverCaption: {
      zh: "162 部经典 · 时间 × 地域",
      en: "162 classics · time × region",
    },
    screenshots: [
      {
        url: "/fields/gallery/wanjuan-bookshelf.webp",
        alt: {
          zh: "万卷书场中按文学坐标排列的经典作品",
          en: "Classics arranged by literary coordinates in WanJuan",
        },
        caption: {
          zh: "从文学坐标走向具体作品",
          en: "Walk from literary coordinates to a specific work",
        },
      },
      {
        url: "/fields/gallery/wanjuan-scenes.webp",
        alt: {
          zh: "万卷书场的全局、书页与场景分层视图",
          en: "WanJuan global field, page, and layered scene views",
        },
        caption: {
          zh: "全局、正文与场景三层对齐",
          en: "Global field, source page, and scene stay aligned",
        },
      },
    ],
    kind: {
      zh: "立体文学地图 Field",
      en: "Spatial Literary Atlas Field",
    },
    summary: {
      zh: "162 部世界与中国经典沿时间和地域铺成一张立体书场；从全局走到正文，再看示范场景从书页上分层升起。",
      en: "Arranges 162 world and Chinese classics into a spatial field across time and region, connecting the global map, source reading, and aligned scene layers.",
    },
    readingShift: {
      from: {
        zh: "在书单里找作品，在脑中拼场景",
        en: "Find a title in a list and imagine its world",
      },
      to: {
        zh: "沿时间与地域走到书前，让场景从书页升起",
        en: "Walk through time and region, then let a scene rise from the page",
      },
    },
  },
  {
    key: "ringbook",
    name: "RingBook",
    href: "https://ringbook.wordm.us",
    previewUrl: "ringbook.wordm.us",
    coverUrl: "/home/ringbook-park.png",
    coverAlt: {
      zh: "RingBook 私人 3D 书籍游乐园",
      en: "RingBook private 3D book amusement park",
    },
    coverCaption: {
      zh: "长篇全文沿连续书环展开",
      en: "Long-form text unfolds along a continuous reading ring",
    },
    screenshots: [
      {
        url: "/fields/gallery/ringbook-home.webp",
        alt: {
          zh: "RingBook 私人书籍园区与摩天轮阅读入口",
          en: "RingBook private book park and reading wheel entrance",
        },
        caption: {
          zh: "每一本 EPUB 都成为园区中的一处空间",
          en: "Every EPUB becomes a place in the private park",
        },
      },
      {
        url: "/fields/gallery/ringbook-ai.webp",
        alt: {
          zh: "RingBook 在阅读前询问是否让远程 AI 读取书籍",
          en: "RingBook permission prompt before remote AI reads a book",
        },
        caption: {
          zh: "本地优先，AI 读取需要明确许可",
          en: "Local first, with explicit permission for AI access",
        },
      },
    ],
    kind: {
      zh: "3D 长篇阅读 Field",
      en: "3D Long-form Reading Field",
    },
    summary: {
      zh: "本地 EPUB 留在设备上并汇成私人 3D 园区；全文沿墨晶书环连续铺开，读到的段落也能通向书中物件。",
      en: "Local EPUBs stay on-device and gather in a private 3D park; the full text flows around a crystal reading ring, with passages opening into objects from the book.",
    },
    readingShift: {
      from: {
        zh: "在书架、章节与页面间切换",
        en: "Switch between shelf, chapters, and pages",
      },
      to: {
        zh: "沿连续书环读完整部长篇",
        en: "Read the entire long-form work along one continuous ring",
      },
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
    coverCaption: {
      zh: "观察世界模型如何想象下一步",
      en: "Watch a world model imagine its next move",
    },
    screenshots: [
      {
        url: "/fields/gallery/arc3-home.webp",
        alt: {
          zh: "ARC3 自我试验参赛 Agent 平台首页",
          en: "ARC3 self-experimenting competition agent platform home",
        },
        caption: {
          zh: "让 Agent 自己试验、评估并调整",
          en: "Let the agent experiment, evaluate, and adjust",
        },
      },
      {
        url: "/fields/gallery/arc3-report.webp",
        alt: {
          zh: "ARC3 实验报告中的复现实验命令与诊断建议",
          en: "ARC3 experiment report with reproduction commands and diagnostics",
        },
        caption: {
          zh: "每次判断都留下可复现证据",
          en: "Every judgment leaves reproducible evidence",
        },
      },
    ],
    kind: {
      zh: "Agent 研究 Field",
      en: "Agent Research Field",
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
    coverCaption: {
      zh: "Agent 活动、资源与分支同屏",
      en: "Agent activity, resources, and branches in one view",
    },
    screenshots: [
      {
        url: "/fount/forge-product-screenshot.png",
        alt: {
          zh: "Forge Agent 蓝图、权限与产品预览工作台",
          en: "Forge workspace for agent blueprints, permissions, and product previews",
        },
        caption: {
          zh: "从 Agent 蓝图一直走到可验证产品",
          en: "Move from an agent blueprint to a verifiable product",
        },
      },
    ],
    kind: {
      zh: "创造型系统 Field",
      en: "Creator System Field",
    },
    summary: {
      zh: "把项目、资源、分支、审核和 agent 实时活动放进同一个可观察工作台。",
      en: "Keeps projects, resources, branches, review, and live agent activity inside one observable workspace.",
    },
  },
  {
    key: "foundry-agent-studio",
    name: "Foundry Agent Studio",
    href: "https://foundry.wordm.us",
    previewUrl: "foundry.wordm.us",
    coverUrl: "/home/foundry-agent-studio.png",
    coverAlt: {
      zh: "Foundry Agent Studio 可追溯构建流界面",
      en: "Foundry Agent Studio traceable build stream interface",
    },
    coverCaption: {
      zh: "计划 → 并行执行 → 验证",
      en: "Plan → parallel execution → verification",
    },
    screenshots: [
      {
        url: "/fields/gallery/foundry-live.webp",
        alt: {
          zh: "Foundry 构建过程中的并行任务、决策与证据流",
          en: "Foundry build stream with parallel tasks, decisions, and evidence",
        },
        caption: {
          zh: "过程不是日志，而是可介入的产品界面",
          en: "The process is a steerable product surface, not a log",
        },
      },
      {
        url: "/fount/ai-forge-foundry-ecosystem.png",
        alt: {
          zh: "Forge 与 Foundry 从创造到认证分发的生态关系",
          en: "Forge and Foundry ecosystem from creation to certified distribution",
        },
        caption: {
          zh: "创造、验证与分发连成同一条链",
          en: "Creation, verification, and distribution form one chain",
        },
      },
    ],
    kind: {
      zh: "AI 产品构建 Field",
      en: "AI Product Building Field",
    },
    summary: {
      zh: "把 AI 的计划、并行代理、执行前决策、代码、资产、验证和分支历史放进一条可介入的构建流。",
      en: "Turns AI planning, parallel agents, pre-execution decisions, code, assets, verification, and branch history into one steerable build stream.",
    },
  },
  {
    key: "town",
    name: "Town Agents",
    href: "/?view=about&show=town&project=town",
    previewUrl: "wordm.us/town-agents",
    coverUrl: "/home/town-agents.svg",
    coverAlt: {
      zh: "Town Agents 程序化城镇封面",
      en: "Town Agents procedural town cover",
    },
    coverCaption: {
      zh: "居民、关系与任务实时运行",
      en: "Residents, relationships, and tasks running live",
    },
    screenshots: [
      {
        url: "/home/town-agents.svg",
        alt: {
          zh: "Town Agents 城镇道路、居民与空间关系局部",
          en: "Town Agents town roads, residents, and spatial relationships",
        },
        caption: {
          zh: "城镇空间承载居民的行动",
          en: "The town gives resident actions a spatial home",
        },
        objectPosition: "18% center",
      },
      {
        url: "/home/town-agents.svg",
        alt: {
          zh: "Town Agents 居民任务与关系调试视图局部",
          en: "Town Agents resident task and relationship debugging detail",
        },
        caption: {
          zh: "任务与关系可以被观察和调试",
          en: "Tasks and relationships remain observable and debuggable",
        },
        objectPosition: "82% center",
      },
    ],
    kind: {
      zh: "Agent 游戏 Field",
      en: "Agent Game Field",
    },
    status: {
      zh: "开发中",
      en: "In development",
    },
    summary: {
      zh: "为可运行的居民、任务、关系和 debug 体验搭建一座持续生长的程序化城镇。",
      en: "A growing procedural town for playable residents, tasks, relationships, and debugging experiences.",
    },
  },
  {
    key: "world-models-v3",
    name: "World Models V3",
    href: "/fields/explainers/world-models-v3.mp4",
    previewUrl: "wordm.us/fields/explainers/world-models-v3.mp4",
    embedType: "video",
    coverUrl: "/fields/explainers/world-models-v3-cover.png",
    coverAlt: {
      zh: "World Models V3 混合密度循环网络讲解画面",
      en: "World Models V3 explainer frame showing a mixture-density recurrent network",
    },
    coverCaption: {
      zh: "用八章拆开世界模型的梦",
      en: "Unpack a world model's dream in eight chapters",
    },
    screenshots: [
      {
        url: "/fields/gallery/world-models-architecture.webp",
        alt: {
          zh: "World Models V3 讲解中的模型架构章节画面",
          en: "World Models V3 explainer frame from the architecture chapter",
        },
        caption: {
          zh: "V、M、C 如何组成一个会做梦的 Agent",
          en: "How V, M, and C form a dreaming agent",
        },
      },
      {
        url: "/fields/gallery/world-models-reality-gap.webp",
        alt: {
          zh: "World Models V3 讲解中的现实鸿沟章节画面",
          en: "World Models V3 explainer frame from the reality-gap chapter",
        },
        caption: {
          zh: "从梦境训练回到现实表现",
          en: "Return from dream training to real-world behavior",
        },
      },
    ],
    kind: {
      zh: "论文讲解 Field",
      en: "Paper Explainer Field",
    },
    status: {
      zh: "可观看",
      en: "Watch now",
    },
    summary: {
      zh: "一个会出错的梦，为什么还能教会智能体在现实中活下来？用八章串起 V、M、C、两个实验与现实鸿沟。",
      en: "Why can an imperfect dream still teach an agent to survive reality? Eight chapters connect V, M, C, two experiments, and the reality gap.",
    },
  },
  {
    key: "genie-explainer",
    name: "Genie",
    href: "/fields/explainers/genie.mp4",
    previewUrl: "wordm.us/fields/explainers/genie.mp4",
    embedType: "video",
    coverUrl: "/fields/explainers/genie-cover.jpg",
    coverAlt: {
      zh: "Genie 生成式交互环境论文讲解画面",
      en: "Genie generative interactive environments explainer frame",
    },
    coverCaption: {
      zh: "从视频反推动作，生成可交互世界",
      en: "Infer actions from video and generate an interactive world",
    },
    screenshots: [
      {
        url: "/fields/gallery/genie-latent-actions.webp",
        alt: {
          zh: "Genie 论文讲解中的潜在动作模型章节画面",
          en: "Genie explainer frame from the latent action model chapter",
        },
        caption: {
          zh: "先从视频里反推出动作",
          en: "First infer actions from video",
        },
      },
      {
        url: "/fields/gallery/genie-world.webp",
        alt: {
          zh: "Genie 论文讲解中的可交互世界生成章节画面",
          en: "Genie explainer frame from the interactive world generation chapter",
        },
        caption: {
          zh: "再逐帧生成可以行动的世界",
          en: "Then generate a world that can be acted in, frame by frame",
        },
      },
    ],
    kind: {
      zh: "论文讲解 Field",
      en: "Paper Explainer Field",
    },
    status: {
      zh: "可观看",
      en: "Watch now",
    },
    summary: {
      zh: "从没有动作标签的视频中反推潜在动作，再逐帧生成可交互环境的十二章论文讲解。",
      en: "A twelve-chapter explanation of inferring latent actions from unlabeled video and generating an interactive environment frame by frame.",
    },
  },
];
