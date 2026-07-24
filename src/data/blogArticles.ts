import type { Lang } from "../i18n/lang";
import articlesSnapshotRaw from "./articles.snapshot.json";

export type BilingualText = Record<Lang, string>;

export type BlogContentBlock =
  | {
      type: "heading";
      text: BilingualText;
    }
  | {
      type: "callout";
      text: BilingualText;
    }
  | {
      type: "paragraph";
      text: BilingualText;
    }
  | {
      type: "list";
      items: BilingualText[];
    }
  | {
      type: "figure";
      src: string;
      alt: BilingualText;
      caption: BilingualText;
      width?: number;
      height?: number;
    };

export type BlogArticle = {
  id: string;
  title: BilingualText;
  date: string;
  dateSort?: string;
  category: BilingualText;
  summary: BilingualText;
  note: BilingualText;
  paragraphs: BilingualText[];
  blocks?: BlogContentBlock[];
  source?: "site" | "x" | "substack";
  sourceUrl?: string | null;
  originalSourceUrl?: string | null;
  originalPublishedAt?: string | null;
};

export const ARTICLES_SITE_URL = "https://lidechi.github.io/12-Articles/";
export const ARTICLES_MANIFEST_URL = `${ARTICLES_SITE_URL}articles.json`;

function isBilingualText(value: unknown): value is BilingualText {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<BilingualText>;
  return typeof candidate.zh === "string" && typeof candidate.en === "string";
}

function isBlogArticle(value: unknown): value is BlogArticle {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<BlogArticle>;
  return (
    typeof candidate.id === "string" &&
    isBilingualText(candidate.title) &&
    typeof candidate.date === "string" &&
    isBilingualText(candidate.category) &&
    isBilingualText(candidate.summary) &&
    isBilingualText(candidate.note) &&
    Array.isArray(candidate.paragraphs) &&
    (candidate.blocks === undefined || Array.isArray(candidate.blocks))
  );
}

function parseArticleManifest(value: unknown): BlogArticle[] {
  if (!Array.isArray(value) || !value.every(isBlogArticle)) {
    throw new Error("Published article manifest has an invalid shape.");
  }

  const ids = new Set<string>();
  for (const article of value) {
    if (ids.has(article.id)) {
      throw new Error(`Published article manifest has duplicate id: ${article.id}`);
    }
    ids.add(article.id);
  }

  return value;
}

export const BLOG_ARTICLES = parseArticleManifest(articlesSnapshotRaw);

export async function loadPublishedBlogArticles(
  signal?: AbortSignal,
): Promise<BlogArticle[]> {
  // Local development must reflect the snapshot produced by scripts/sync-articles.mjs.
  // Otherwise an older GitHub Pages manifest can silently replace the code under test.
  if (import.meta.env.DEV) {
    return BLOG_ARTICLES;
  }

  const response = await fetch(ARTICLES_MANIFEST_URL, {
    signal,
    cache: "no-cache",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Article manifest request failed: ${response.status}`);
  }

  return parseArticleManifest(await response.json());
}
