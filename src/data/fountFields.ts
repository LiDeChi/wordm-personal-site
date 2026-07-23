import type { Lang } from "../i18n/lang";

type LocalizedText = Record<Lang, string>;

export type FountField = {
  key: string;
  name: string;
  href: string;
  previewUrl: string;
  embedType?: "video";
  coverUrl: string;
  coverAlt: LocalizedText;
  kind: LocalizedText;
  status: LocalizedText;
  summary: LocalizedText;
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
    kind: {
      zh: "空间阅读 Field",
      en: "Spatial Reading Field",
    },
    status: {
      zh: "可进入",
      en: "Available",
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
    coverUrl: "/home/museum-book.svg",
    coverAlt: {
      zh: "MuseumBook 文学分馆建筑剖面",
      en: "MuseumBook literary museum cutaway",
    },
    kind: {
      zh: "文学博物馆 Field",
      en: "Literary Museum Field",
    },
    status: {
      zh: "可进入",
      en: "Available",
    },
    summary: {
      zh: "把 EPUB 建成可漫游的文学分馆，在展厅、展品与连续原文阅读之间往返。",
      en: "Builds an EPUB into a walkable literary museum spanning galleries, exhibits, and continuous full-text reading.",
    },
  },
  {
    key: "bookplain",
    name: "Bookplain",
    href: "https://bookplain.wordm.us",
    previewUrl: "bookplain.wordm.us",
    coverUrl: "/home/bookplain-gallery.png",
    coverAlt: {
      zh: "Bookplain 真实书架与空间阅读界面",
      en: "Bookplain spatial reading gallery with a realistic bookshelf",
    },
    kind: {
      zh: "空间理解 Field",
      en: "Spatial Understanding Field",
    },
    status: {
      zh: "可进入",
      en: "Available",
    },
    summary: {
      zh: "把整本 EPUB 或文本展开成可阅读、可探索、可从原文定位理解物件的立体世界。",
      en: "Turns a complete EPUB or text into a readable world where source passages connect directly to explorable understanding objects.",
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
    kind: {
      zh: "Agent 研究 Field",
      en: "Agent Research Field",
    },
    status: {
      zh: "可进入",
      en: "Available",
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
    kind: {
      zh: "创造型系统 Field",
      en: "Creator System Field",
    },
    status: {
      zh: "可进入",
      en: "Available",
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
    kind: {
      zh: "AI 产品构建 Field",
      en: "AI Product Building Field",
    },
    status: {
      zh: "可进入",
      en: "Available",
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
