import { BLOG_ARTICLES, type BlogArticle, type BlogContentBlock } from "../data/blogArticles";
import { getProjectPresentation } from "../data/projectPresentation";
import type { Lang } from "../i18n/lang";
import type { PortfolioProject } from "../types";
import domainOwnershipDoc from "../../docs/domain-ownership.md?raw";
import ideaDoc from "../../docs/idea.md?raw";

const MAX_ARTICLES = 16;
const MAX_PROJECTS = 60;
const MAX_TEXT_LENGTH = 34_000;

type BuildSiteAiContextOptions = {
  lang: Lang;
  projects: PortfolioProject[];
  lastUpdated: string;
};

type SiteAiContextSection = {
  title: string;
  body: string;
};

export type SiteAiContext = {
  title: string;
  lang: Lang;
  lastUpdated: string;
  sections: SiteAiContextSection[];
  text: string;
};

const SITE_STRUCTURE = {
  zh: [
    "根域 wordm.us: 系统主页、产品入口、文章和旧作品归档。",
    "主页 Home: 介绍 Wordm System、Agent Core life loop、Core Host 下载和产品入口。",
    "Projects: 展示 Flipook、ARC3、Forge、Agent Core、Town Agents 等产品入口，并支持项目预览。",
    "Blog: 连续文章阅读流，包含站内长文、X/Substack 归档和配图。",
    "About: 旧作品集归档与项目详情弹窗。",
    "resume.wordm.us / cv.wordm.us: 简历页，受管理员或测试账号权限保护。",
    "admin.wordm.us: 管理入口，包含分享链接和定价配置。",
    "p-*.wordm.us: 单个项目子域页面，按项目访问与分享规则开放。",
    "oneagent.wordm.us / /oneagent: OneAgent 产品页。",
  ],
  en: [
    "Root domain wordm.us: system home, product entries, articles, and archived portfolio.",
    "Home: introduces Wordm System, the Agent Core life loop, Core Host download, and product entries.",
    "Projects: presents Flipook, ARC3, Forge, Agent Core, Town Agents, and product previews.",
    "Blog: continuous article reading flow with on-site writing plus X/Substack archives and figures.",
    "About: archived portfolio and project detail modal.",
    "resume.wordm.us / cv.wordm.us: protected resume page for admin or tester access.",
    "admin.wordm.us: management entry for share links and pricing configuration.",
    "p-*.wordm.us: project-specific subdomain pages governed by project access and share rules.",
    "oneagent.wordm.us / /oneagent: OneAgent product page.",
  ],
} as const;

const HOME_SUMMARY = {
  zh: [
    "Wordm System 是一套让应用拥有 agent life loop 的架构。",
    "Core 负责持续感知、分配注意力、生成与回收子代理、沉淀 skill。",
    "Agent、Flipook 和未来 app 通过 WCP 接入，把信号与工具交给 Core，同时接收 Core 的指导。",
    "Core Host 是启动本机 Agent Core 的 macOS 测试壳，用来验证 local runtime、WCP 协议和 app 接入链路。",
  ],
  en: [
    "Wordm System is an architecture that gives apps an agent life loop.",
    "Core handles perception, attention allocation, agent spawning and retirement, and skill crystallization.",
    "Agent, Flipook, and future apps connect through WCP, sending signals and tools to Core while receiving guidance.",
    "Core Host is a macOS test shell for starting the local Agent Core and validating the runtime, WCP protocol, and app connection loop.",
  ],
} as const;

const LANDING_PAGES = {
  zh: [
    "Flipook: 把一本书变成可以进入、回看和继续生长的空间化阅读世界。",
    "ARC3: 围绕 ARC-AGI-3 的世界模型 agent、想象 rollout 和自调训练 cockpit。",
    "Forge: 把项目、资源、分支、审核和 agent 实时活动放进同一个可观察工作台。",
    "Agent Core: wordm.us 主页里的 agent core 入口，包含 agent loop、监控、记忆和生命周期。",
    "Town Agents: Godot 城镇项目入口，后续接居民、任务、关系和 debug 体验。",
  ],
  en: [
    "Flipook: turns a book into a spatial reading world you can enter, revisit, and keep growing.",
    "ARC3: a world-model agent cockpit for ARC-AGI-3, imagined rollouts, and self-tuning training.",
    "Forge: keeps projects, resources, branches, review, and live agent activity inside one observable workspace.",
    "Agent Core: the agent core entry on wordm.us for loops, monitoring, memory, and lifecycle.",
    "Town Agents: entry for the Godot town project, ready for residents, tasks, relationships, and debug experience.",
  ],
} as const;

function compactWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function truncateText(value: string, maxLength: number) {
  const normalized = compactWhitespace(value);

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

function blockToText(block: BlogContentBlock, lang: Lang) {
  if (block.type === "heading") {
    return `## ${block.text[lang]}`;
  }

  if (block.type === "list") {
    return block.items.map((item) => `- ${item[lang]}`).join("\n");
  }

  if (block.type === "figure") {
    const caption = block.caption[lang].trim();
    return caption
      ? `[figure] ${block.alt[lang]} — ${caption}`
      : `[figure] ${block.alt[lang]}`;
  }

  return block.text[lang];
}

function articleToContextLine(article: BlogArticle, lang: Lang) {
  const body = article.blocks?.length
    ? article.blocks.map((block) => blockToText(block, lang)).join("\n")
    : article.paragraphs.map((paragraph) => paragraph[lang]).join("\n");
  const note = article.note[lang].trim();
  const summary = article.summary[lang].trim();
  const source = article.source ? `source=${article.source}` : "source=site";
  const originalDate = article.originalPublishedAt
    ? ` original=${article.originalPublishedAt}`
    : "";

  return [
    `- ${article.title[lang]} (${article.date}, ${article.category[lang]}, ${source}${originalDate})`,
    summary ? `  summary: ${summary}` : "",
    note ? `  note: ${note}` : "",
    body ? `  excerpt: ${truncateText(body, 700)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function projectToContextLine(project: PortfolioProject, lang: Lang) {
  const presentation = getProjectPresentation(project, lang);
  const detail = project.detail;
  const links = [
    project.productionUrl ? `product=${project.productionUrl}` : "",
    project.sourceUrl ? `source=${project.sourceUrl}` : "",
    project.subdomainUrl ? `subdomain=${project.subdomainUrl}` : "",
  ].filter(Boolean);
  const commands = detail
    ? Object.entries(detail.commands)
        .filter(([, value]) => value && value !== "N/A")
        .map(([key, value]) => `${key}:${value}`)
        .join(", ")
    : "";

  return [
    `- ${presentation.name} (${project.slug})`,
    `  tagline: ${presentation.tagline || project.tagline}`,
    `  summary: ${presentation.summary || project.summary}`,
    project.techStack.length ? `  stack: ${project.techStack.join(", ")}` : "",
    project.tags.length ? `  tags: ${project.tags.join(", ")}` : "",
    detail
      ? `  detail: status=${detail.status ?? "unknown"}, type=${detail.type ?? "unknown"}, language=${detail.language ?? "unknown"}, entry=${detail.entry ?? "unknown"}`
      : "",
    commands ? `  commands: ${commands}` : "",
    links.length ? `  links: ${links.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function docsToContextLine(title: string, body: string) {
  return `## ${title}\n${truncateText(body, 2_200)}`;
}

function trimContextText(value: string) {
  if (value.length <= MAX_TEXT_LENGTH) {
    return value;
  }

  return `${value.slice(0, MAX_TEXT_LENGTH - 180).trimEnd()}\n\n[Context truncated to stay within the site assistant budget.]`;
}

export function buildSiteAiContext({
  lang,
  projects,
  lastUpdated,
}: BuildSiteAiContextOptions): SiteAiContext {
  const projectLines = projects
    .slice(0, MAX_PROJECTS)
    .map((project) => projectToContextLine(project, lang))
    .join("\n");
  const articleLines = BLOG_ARTICLES.slice(0, MAX_ARTICLES)
    .map((article) => articleToContextLine(article, lang))
    .join("\n");
  const docLines = [
    docsToContextLine("docs/domain-ownership.md", domainOwnershipDoc),
    docsToContextLine("docs/idea.md", ideaDoc),
  ].join("\n\n");

  const sections: SiteAiContextSection[] = [
    {
      title: lang === "zh" ? "网站结构" : "Site structure",
      body: SITE_STRUCTURE[lang].join("\n"),
    },
    {
      title: lang === "zh" ? "主页信息" : "Home page",
      body: HOME_SUMMARY[lang].join("\n"),
    },
    {
      title: lang === "zh" ? "落地页" : "Landing pages",
      body: LANDING_PAGES[lang].join("\n"),
    },
    {
      title: lang === "zh" ? "文档" : "Docs",
      body: docLines,
    },
    {
      title: lang === "zh" ? "项目" : "Projects",
      body: projectLines,
    },
    {
      title: lang === "zh" ? "博客" : "Blog",
      body: articleLines,
    },
  ];
  const text = trimContextText(
    [
      `# wordm.us site context`,
      `lang=${lang}`,
      `lastUpdated=${lastUpdated}`,
      ...sections.map((section) => `\n## ${section.title}\n${section.body}`),
    ].join("\n"),
  );

  return {
    title: "wordm.us",
    lang,
    lastUpdated,
    sections,
    text,
  };
}
