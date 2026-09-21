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
  team?: string;
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

/** 本人实验在 catalog 里就是这个流派名。 */
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

export const ALIFE_INTRO: LocalizedText = {
  zh: "这条线从 1948 年 von Neumann 的自复制自动机一直排到今年。它不追问「什么是生命」这句话怎么答，而是不断把问题换成一个能跑起来的东西：规则放进去，看它自己长出什么。每一条都可以展开——机制、谱系、边界、人物、可跑的 demo 都在里面。",
  en: "This line runs from von Neumann's self-reproducing automata in 1948 to this year. It never argues about how to answer “what is life”; it keeps turning the question into something that runs: put the rules in and watch what grows. Every entry opens — mechanism, lineage, limits, people, and the demos that run.",
};

export const ALIFE_COPY: Record<
  Lang,
  {
    eyebrow: string;
    title: string;
    timelineAria: string;
    counts: (items: number, schools: number) => string;
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
    chineseOnly: string;
  }
> = {
  zh: {
    eyebrow: "关注方向",
    title: "人工生命与机器心智",
    timelineAria: "人工生命史时间轴",
    counts: (items, schools) => `${items} 个条目 · ${schools} 个流派 · 1948 → 2026`,
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
    chineseOnly: "",
  },
  en: {
    eyebrow: "Focus",
    title: "Artificial Life & Machine Minds",
    timelineAria: "Artificial life history timeline",
    counts: (items, schools) =>
      `${items} entries · ${schools} schools · 1948 → 2026`,
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
    // 展览原文只有中文，英文模式下如实说明，而不是假装有译文。
    chineseOnly:
      "Exhibition text is the museum's Chinese original; names, years, and links are shown as-is.",
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

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `/alife/${path.replace(/^\/+/, "")}`;
}

export function alifeDemoPreviewUrl(demo: string | null | undefined) {
  return demo ? `/alife/assets/previews/${demo}.png` : null;
}

export function alifeLeadUrl(lead: AlifeLead) {
  return lead.website || lead.scholar || null;
}
