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
    "根域 wordm.us: 个人项目与博客两个入口。",
    "个人项目 /projects: 只展示人工生命史、RingBook、MuseumBook、Flipook、诗经长卷、万卷。",
    "博客: 主导航里的博客入口，目前跳到 lidechi.github.io。",
    "About: 不进主导航，直接打开 /?view=about。",
    "admin.wordm.us: 管理入口，包含分享链接和定价配置。",
    "p-*.wordm.us: 单个项目子域页面，按项目访问与分享规则开放。",
    "oneagent.wordm.us / /oneagent: OneAgent 产品页。",
  ],
  en: [
    "Root domain wordm.us: two public entries, Projects and Writing.",
    "Projects /projects: Artificial Life History, RingBook, MuseumBook, Flipook, the Shijing scroll, and WanJuan.",
    "Writing: the nav entry currently sends visitors to lidechi.github.io.",
    "About: not in the main nav; open /?view=about directly.",
    "admin.wordm.us: management entry for share links and pricing configuration.",
    "p-*.wordm.us: project-specific subdomain pages governed by project access and share rules.",
    "oneagent.wordm.us / /oneagent: OneAgent product page.",
  ],
} as const;

const HOME_SUMMARY = {
  zh: [
    "打开 wordm.us 就是个人项目：人工生命史、RingBook、MuseumBook、Flipook、诗经长卷、万卷。",
    "另一个入口是博客，跳到 lidechi.github.io。",
    "人工生命史展览仍在 /alife/，从个人项目进入。",
  ],
  en: [
    "wordm.us opens on Projects: Artificial Life History, RingBook, MuseumBook, Flipook, the Shijing scroll, and WanJuan.",
    "The other entry is Writing, which currently goes to lidechi.github.io.",
    "The artificial-life exhibition remains at /alife/ and is reached from Projects.",
  ],
} as const;

const LANDING_PAGES = {
  zh: [
    "人工生命史: https://wordm.us/alife/ ，按时间与流派织成的人工生命展览。",
    "RingBook: https://ringbook.wordm.us ，本地 EPUB 汇成私人 3D 园区，全文沿书环展开。",
    "MuseumBook: https://museum.wordm.us ，章节成为展厅，展品能回到原文。",
    "Flipook: 把一本书变成可以进入、回看和继续生长的空间化阅读世界。",
    "诗经长卷: https://wordm.us/shijing/ ，风雅颂铺成一卷青绿山水，拖拽展卷并点击金点读全诗。",
    "万卷: 由经典组成的时间地域 3D 书场。",
  ],
  en: [
    "Artificial Life History: https://wordm.us/alife/ — a gallery of artificial life by decade and school.",
    "RingBook: https://ringbook.wordm.us — local EPUBs gather in a private 3D park and the full text runs along a reading ring.",
    "MuseumBook: https://museum.wordm.us — chapters become galleries, and exhibits lead back to the source text.",
    "Flipook: turns a book into a spatial reading world you can enter, revisit, and keep growing.",
    "Shijing: https://wordm.us/shijing/ — Airs, odes, and hymns as one landscape scroll; drag to unfurl and click a gold mark to read.",
    "WanJuan: a 3D field of classics arranged by time and place.",
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
