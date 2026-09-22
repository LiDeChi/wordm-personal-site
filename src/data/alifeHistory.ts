import type { Lang } from "../i18n/lang";

/**
 * 人工生命史展览（/alife/）的条目数据。
 *
 * 数据源就是展览自己的 catalog.json，运行时从 /alife/data/catalog.json 取，
 * 保证站内时间轴和展览永远同一份事实；这里只补一句双语导语和几个展示用的
 * 派生结构。展览原文是中文，没有英文版本，英文模式下照旧展示中文原文。
 */

export type LocalizedText = Record<Lang, string>;

export type AlifeLead = {
  name: string;
  role?: string;
  photo?: string;
  website?: string;
  scholar?: string;
  photoNote?: string;
};

export type AlifeLink = {
  label: string;
  url: string;
};

export type AlifeItem = {
  id: string;
  name: string;
  nameEn?: string;
  year: number;
  yearNote?: string;
  schools: string[];
  medium?: string[];
  people?: string[];
  summary?: string;
  demo?: string | null;
  demoHint?: string;
  refs?: string[];
  /** catalog 里有两种形态：单个机构字符串，或机构数组（19/39 条是数组）。 */
  team?: string | string[];
  leads?: AlifeLead[];
  construction?: string;
  lineage?: string;
  limits?: string;
  links?: AlifeLink[];
};

export type AlifeCatalog = {
  title: string;
  titleEn: string;
  schoolsOrder: string[];
  items: AlifeItem[];
  sourceNote?: string;
};

export const ALIFE_CATALOG_URL = "/alife/data/catalog.json";
export const ALIFE_MUSEUM_URL = "/alife/";

/** 本人实验在 catalog 里的流派名；catalog 目前不含本人实验条目，这个标记能力留着。 */
export const ALIFE_OWN_WORK_SCHOOL = "本人实验";

/**
 * catalog 里的 demo 有三种取值：`"none"`（31 条，是字符串不是 null）、
 * 一个画布 demo 的 key、或者 `<名字>-link`（指向本人实验的外链）。
 * 必须区分开，否则 31 条都会挂上「可演示」并且去请求不存在的预览图。
 */
export const ALIFE_RUNNABLE_DEMOS = new Set([
  "life",
  "grey-scott",
  "eca",
  "boids",
  "langton-ant",
  "tierra-lite",
  "lenia-lite",
]);

export type AlifeDemoKind = "runnable" | "link" | null;

export function alifeDemoKind(item: AlifeItem): AlifeDemoKind {
  const demo = (item.demo ?? "").trim();
  if (!demo || demo === "none") {
    return null;
  }
  if (demo.endsWith("-link")) {
    return "link";
  }
  return ALIFE_RUNNABLE_DEMOS.has(demo) ? "runnable" : null;
}

export const ALIFE_COPY: Record<
  Lang,
  {
    eyebrow: string;
    timelineAria: string;
    counts: (items: number, schools: number, years: string) => string;
    expandAll: string;
    collapseAll: string;
    openMuseum: string;
    expandEntry: string;
    ownWork: string;
    demoBadge: string;
    linkDemoBadge: string;
    demoNotes: string;
    ownDemo: string;
    openDemo: string;
    people: string;
    mechanism: string;
    lineage: string;
    limits: string;
    refs: string;
    links: string;
    loading: string;
    failed: string;
    retry: string;
    /* —— 两列（时间轴 + 画廊）—— */
    timelineLabel: string;
    decadeNav: string;
    galleryLabel: string;
    teamLabel: string;
    mediumLabel: string;
    leadSite: string;
    leadScholar: string;
    openEntry: string;
  }
> = {
  zh: {
    eyebrow: "关注方向",
    timelineAria: "人工生命史时间轴",
    counts: (items, schools, years) =>
      `${items} 个条目 · ${schools} 个流派 · ${years}`,
    expandAll: "展开全部",
    collapseAll: "收起全部",
    openMuseum: "进入沉浸式展览",
    expandEntry: "展开",
    ownWork: "本人实验",
    demoBadge: "可演示",
    linkDemoBadge: "本人 demo",
    demoNotes: "为什么没有演示",
    ownDemo: "在展览里打开演示",
    openDemo: "在展览里跑",
    people: "人物",
    mechanism: "机制",
    lineage: "谱系",
    limits: "边界",
    refs: "参考",
    links: "链接",
    loading: "正在读取展览条目…",
    failed: "展览条目读取失败。",
    retry: "重试",
    timelineLabel: "时间轴",
    decadeNav: "年代导航",
    galleryLabel: "画廊",
    teamLabel: "团队 / 机构",
    mediumLabel: "介质",
    leadSite: "主页",
    leadScholar: "谷歌学术",
    openEntry: "在展览里看",
  },
  en: {
    eyebrow: "Focus",
    timelineAria: "Artificial life history timeline",
    counts: (items, schools, years) =>
      `${items} entries · ${schools} schools · ${years}`,
    expandAll: "Expand all",
    collapseAll: "Collapse all",
    openMuseum: "Open immersive exhibition",
    expandEntry: "Expand",
    ownWork: "Own work",
    demoBadge: "Runnable",
    linkDemoBadge: "Own demo",
    demoNotes: "Why no demo",
    ownDemo: "Open the demo in the exhibition",
    openDemo: "Run in the exhibition",
    people: "People",
    mechanism: "Mechanism",
    lineage: "Lineage",
    limits: "Limits",
    refs: "Refs",
    links: "Links",
    loading: "Loading exhibition entries…",
    failed: "Could not load the exhibition entries.",
    retry: "Retry",
    timelineLabel: "Timeline",
    decadeNav: "Decade navigation",
    galleryLabel: "Gallery",
    teamLabel: "Team / institution",
    mediumLabel: "Medium",
    leadSite: "Site",
    leadScholar: "Scholar",
    openEntry: "See it in the exhibition",
  },
};

export function alifeDecade(year: number) {
  return `${Math.floor(year / 10) * 10}s`;
}

export function isOwnWork(item: AlifeItem) {
  return item.schools.includes(ALIFE_OWN_WORK_SCHOOL);
}

export async function loadAlifeCatalog(signal?: AbortSignal) {
  const response = await fetch(ALIFE_CATALOG_URL, {
    signal,
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`ALIFE_CATALOG_${response.status}`);
  }

  const catalog = (await response.json()) as AlifeCatalog;
  if (!catalog || !Array.isArray(catalog.items)) {
    throw new Error("ALIFE_CATALOG_INVALID");
  }

  // 展览里按年份排；这里排序一次，页面就不必再管顺序。
  catalog.items = [...catalog.items].sort((a, b) => a.year - b.year);
  return catalog;
}

/** catalog 里 photo 是相对展览根目录的，页面在站点根上，需要补前缀。 */
export function alifeAssetUrl(path: string | undefined) {
  if (!path) {
    return null;
  }

  // 站点绝对路径、绝对 URL，以及 catalog 里当兜底头像用的 data: URI 都原样使用。
  if (path.startsWith("/") || /^[a-z][a-z0-9+.-]*:/i.test(path)) {
    return path;
  }

  return `/alife/${path}`;
}

export function alifeDemoPreviewUrl(demo: string | null | undefined) {
  return demo ? `/alife/assets/previews/${demo}.png` : null;
}

export function alifeLeadUrl(lead: AlifeLead) {
  return lead.website || lead.scholar || null;
}

/** 卡片色板，按 schoolsOrder 的下标取用（与展览的配色规则一致）。 */
export const ALIFE_SCHOOL_COLORS = [
  "#34d399", "#60a5fa", "#a78bfa", "#f472b6", "#fbbf24",
  "#2dd4bf", "#fb7185", "#818cf8", "#4ade80", "#f59e0b",
  "#22d3ee", "#e879f9", "#a3e635", "#38bdf8", "#f97316",
];

export function alifeSchoolColor(school: string, order: string[]) {
  const index = Math.max(0, order.indexOf(school));
  return ALIFE_SCHOOL_COLORS[index % ALIFE_SCHOOL_COLORS.length];
}

/** 详情里的链接 = 条目自带 links + 人物主页 / 学术页，按 URL 去重（与展览 tips 一致）。 */
export function alifeItemLinks(
  item: AlifeItem,
  labels: { site: string; scholar: string },
): AlifeLink[] {
  const links = [...(item.links ?? [])];

  for (const lead of item.leads ?? []) {
    if (lead.website) {
      links.push({ label: `${lead.name} · ${labels.site}`, url: lead.website });
    }
    if (lead.scholar) {
      links.push({ label: `${lead.name} · ${labels.scholar}`, url: lead.scholar });
    }
  }

  const seen = new Set<string>();
  return links.filter((link) => {
    if (!link?.url || seen.has(link.url)) {
      return false;
    }
    seen.add(link.url);
    return true;
  });
}
