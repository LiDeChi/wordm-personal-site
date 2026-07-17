import type { Lang } from "../i18n/lang";

type LocalizedText = Record<Lang, string>;

export type FountField = {
  key: string;
  name: string;
  href: string;
  previewUrl: string;
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
];
