import katex from "katex";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
  BLOG_ARTICLES,
  type BlogArticle,
  type BlogContentBlock,
} from "../data/blogArticles";
import { PERSONAL_PROJECTS, type FountField } from "../data/fountFields";
import type { Lang } from "../i18n/lang";
import { withSiteParams } from "../lib/lang-url";
import {
  CONTACT_EMAIL,
  SHELL_COPY,
  siteAboutHref,
} from "../lib/site-shell";
import { FountMusicPlayer } from "./FountMusicPlayer";
import { SocialLinks } from "./SocialLinks";
import { ThemeModeIcon } from "./ThemeModeIcon";
import "./FatherSpread.css";

type FatherSpreadProps = {
  lang: Lang;
  themeMode: "day" | "night";
  onThemeToggle: () => void;
  onLangChange: (lang: Lang) => void;
};

type HoverState = {
  key: string;
  top: number;
  line: string;
};

type NoteState = {
  key: string;
  action: "share" | "quote";
};

const WHEEL_STEP = 48;

type DeskEntry =
  | { kind: "project"; key: string; field: FountField }
  | { kind: "article"; key: string; article: BlogArticle };

const DESK_ENTRIES: DeskEntry[] = [
  ...PERSONAL_PROJECTS.map((field) => ({
    kind: "project" as const,
    key: field.key,
    field,
  })),
  ...BLOG_ARTICLES.map((article) => ({
    kind: "article" as const,
    key: `article-${article.id}`,
    article,
  })),
];

const FIRST_ARTICLE = PERSONAL_PROJECTS.length;

function entryTitle(entry: DeskEntry, lang: Lang) {
  return entry.kind === "project" ? entry.field.name : entry.article.title[lang];
}

function entryFallback(entry: DeskEntry, lang: Lang) {
  if (entry.kind === "project") {
    return entry.field.summary[lang];
  }
  return entry.article.summary[lang] || entry.article.title[lang];
}

function MathText({ text }: { text: string }) {
  const segments = text.split(/(\$\$[\s\S]+?\$\$|\$(?:\\.|[^$\n])+\$)/g);
  return segments.map((segment, index) => {
    const displayMode = segment.startsWith("$$") && segment.endsWith("$$");
    const inlineMode = !displayMode && segment.startsWith("$") && segment.endsWith("$");
    if (!displayMode && !inlineMode) {
      return segment;
    }
    const expression = displayMode ? segment.slice(2, -2) : segment.slice(1, -1);
    const html = katex.renderToString(expression, {
      displayMode,
      throwOnError: false,
      trust: false,
    });
    return (
      <span
        key={`math-${index}`}
        className={displayMode ? "father-math-display" : "father-math"}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  });
}

function articleBlocks(article: BlogArticle): BlogContentBlock[] {
  if (article.blocks?.length) {
    return article.blocks;
  }
  return article.paragraphs.map((text) => ({ type: "paragraph", text }));
}

function EntryBody({ entry, lang }: { entry: DeskEntry; lang: Lang }) {
  if (entry.kind === "project") {
    const href = withSiteParams(entry.field.href, { lang });
    return (
      <>
        <h2>{entry.field.name}</h2>
        <p className="father-kind">{entry.field.kind[lang]}</p>
        {framesOf(entry.field, lang).map((frame) => (
          <figure key={frame.url}>
            <img src={frame.url} alt={frame.alt} />
            <figcaption>{frame.caption}</figcaption>
          </figure>
        ))}
        <a
          className="father-open"
          href={href}
          {...(href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
        >
          {lang === "zh" ? "打开" : "Open"}
        </a>
      </>
    );
  }

  const href = entry.article.sourceUrl || entry.article.originalSourceUrl || "";
  return (
    <>
      <h2>{entry.article.title[lang]}</h2>
      <p className="father-kind">
        {entry.article.category[lang]} · {entry.article.date}
      </p>
      {articleBlocks(entry.article).map((block, index) => {
        const key = `${entry.key}-${index}`;
        if (block.type === "heading") {
          return (
            <h3 key={key}>
              <MathText text={block.text[lang]} />
            </h3>
          );
        }
        if (block.type === "list") {
          return (
            <ul key={key}>
              {block.items.map((item, itemIndex) => (
                <li key={`${key}-${itemIndex}`}>
                  <MathText text={item[lang]} />
                </li>
              ))}
            </ul>
          );
        }
        if (block.type === "figure") {
          return (
            <figure key={key}>
              <img src={block.src} alt={block.alt[lang]} />
              {block.caption[lang].trim() ? (
                <figcaption>
                  <MathText text={block.caption[lang]} />
                </figcaption>
              ) : null}
            </figure>
          );
        }
        return (
          <p key={key} className={block.type === "callout" ? "father-callout" : undefined}>
            <MathText text={block.text[lang]} />
          </p>
        );
      })}
      {href ? (
        <a className="father-open" href={href} target="_blank" rel="noreferrer">
          {lang === "zh" ? "原文" : "Source"}
        </a>
      ) : null}
    </>
  );
}

function framesOf(field: FountField, lang: Lang) {
  return [
    {
      url: field.coverUrl,
      alt: field.coverAlt[lang],
      caption: field.summary[lang],
    },
    ...(field.screenshots ?? []).map((shot) => ({
      url: shot.url,
      alt: shot.alt[lang],
      caption: shot.caption[lang],
    })),
  ];
}

function lineUnderPoint(x: number, y: number): string | null {
  const doc = document as Document & {
    caretPositionFromPoint?: (
      x: number,
      y: number,
    ) => { offsetNode: Node; offset: number } | null;
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
  };
  const position = doc.caretPositionFromPoint?.(x, y);
  const range = position
    ? null
    : doc.caretRangeFromPoint?.(x, y);
  const node = position?.offsetNode ?? range?.startContainer ?? null;
  const offset = position?.offset ?? range?.startOffset ?? 0;
  if (!node) {
    return null;
  }
  if (node.nodeType !== Node.TEXT_NODE) {
    const element = node instanceof Element ? node : node.parentElement;
    return element?.closest("h2, p, figcaption")?.textContent?.trim() || null;
  }

  const text = node.textContent ?? "";
  const probe = Math.max(0, Math.min(offset, text.length));
  const probeRange = document.createRange();
  try {
    probeRange.setStart(node, probe);
    probeRange.collapse(true);
  } catch {
    return text.trim() || null;
  }
  const top = probeRange.getBoundingClientRect().top;
  let start = probe;
  while (start > 0) {
    probeRange.setStart(node, start - 1);
    probeRange.setEnd(node, probe);
    if (probeRange.getBoundingClientRect().top < top - 1) {
      break;
    }
    start -= 1;
  }
  let end = probe;
  while (end < text.length) {
    probeRange.setStart(node, probe);
    probeRange.setEnd(node, end + 1);
    const rects = probeRange.getClientRects();
    const last = rects[rects.length - 1];
    if (!last || last.top > top + 1) {
      break;
    }
    end += 1;
  }
  return text.slice(start, end).replace(/\s+/g, " ").trim() || null;
}

function runTransition(update: () => void, after?: () => void) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const start = (
    document as Document & {
      startViewTransition?: (callback: () => void) => { finished: Promise<void> };
    }
  ).startViewTransition;
  if (!reduced && start) {
    start
      .call(document, () => {
        flushSync(update);
      })
      .finished.then(() => after?.())
      .catch(() => {});
    return;
  }
  update();
  after?.();
}

/**
 * Three reading windows and a button column in the gutter before the last one.
 * The wheel scrolls whichever window the pointer is on. On the button column
 * it moves the windows left and right through the projects. Clicking a window
 * expands it across the desk. Hovering shows share and quote on its right edge.
 */
export function FatherSpread({
  lang,
  themeMode,
  onThemeToggle,
  onLangChange,
}: FatherSpreadProps) {
  const copy = SHELL_COPY[lang];
  const [wide, setWide] = useState(true);
  const [start, setStart] = useState(0);
  const [focusedKey, setFocusedKey] = useState<string | null>(null);
  const [hover, setHover] = useState<HoverState | null>(null);
  const [note, setNote] = useState<NoteState | null>(null);
  const moduleRefs = useRef<Array<HTMLElement | null>>([]);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const railRef = useRef<HTMLDivElement | null>(null);
  const maxStartRef = useRef(0);
  const noteTimer = useRef(0);

  const visible = wide ? 3 : 1;
  const maxStart = Math.max(0, DESK_ENTRIES.length - visible);
  const clampedStart = Math.min(start, maxStart);
  const slots = wide
    ? [clampedStart, clampedStart + 1, clampedStart + 2]
    : [clampedStart];

  useEffect(() => {
    const media = window.matchMedia("(min-width: 980px)");
    const apply = () => setWide(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => () => window.clearTimeout(noteTimer.current), []);

  useEffect(() => {
    if (!focusedKey) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        runTransition(() => setFocusedKey(null));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusedKey]);

  useEffect(() => {
    maxStartRef.current = maxStart;
    const cleanups: Array<() => void> = [];

    moduleRefs.current.forEach((node) => {
      if (!node) {
        return;
      }
      const onWheel = (event: WheelEvent) => {
        if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
          return;
        }
        event.preventDefault();
        const max = node.scrollHeight - node.clientHeight;
        node.scrollTop = Math.min(max, Math.max(0, node.scrollTop + event.deltaY));
      };
      node.addEventListener("wheel", onWheel, { passive: false });
      cleanups.push(() => node.removeEventListener("wheel", onWheel));
    });

    const rail = railRef.current;
    if (rail) {
      let pending = 0;
      const onWheel = (event: WheelEvent) => {
        event.preventDefault();
        pending += event.deltaY;
        if (Math.abs(pending) < WHEEL_STEP) {
          return;
        }
        const direction = pending > 0 ? 1 : -1;
        pending = 0;
        setStart((current) =>
          Math.min(maxStartRef.current, Math.max(0, current + direction)),
        );
      };
      rail.addEventListener("wheel", onWheel, { passive: false });
      cleanups.push(() => rail.removeEventListener("wheel", onWheel));
    }

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [clampedStart, focusedKey, maxStart, wide]);

  function placeHover(article: HTMLElement, x: number, y: number) {
    const key = article.dataset.key;
    const entry = DESK_ENTRIES.find((item) => item.key === key);
    if (!key || !entry) {
      return;
    }
    const rect = article.getBoundingClientRect();
    const center = article.scrollTop + (y - rect.top);
    const min = article.scrollTop + 58;
    const max = article.scrollTop + article.clientHeight - 58;
    const top = Math.min(max, Math.max(min, center));
    const line = lineUnderPoint(x, y) ?? entryFallback(entry, lang);
    setHover((current) => {
      if (
        current?.key === key &&
        current.line === line &&
        Math.abs(current.top - top) < 10
      ) {
        return current;
      }
      return { key, top, line };
    });
  }

  function restorePointer() {
    const point = pointerRef.current;
    if (!point) {
      return;
    }
    const hit = document.elementFromPoint(point.x, point.y);
    const article = hit?.closest(".father-module");
    if (!(article instanceof HTMLElement)) {
      setHover(null);
      return;
    }
    placeHover(article, point.x, point.y);
  }

  function showNote(key: string, action: NoteState["action"]) {
    window.clearTimeout(noteTimer.current);
    setNote({ key, action });
    noteTimer.current = window.setTimeout(() => setNote(null), 1400);
  }

  function entryHref(entry: DeskEntry) {
    if (entry.kind === "project") {
      return withSiteParams(entry.field.href, { lang });
    }
    return entry.article.sourceUrl || entry.article.originalSourceUrl || "";
  }

  async function shareEntry(entry: DeskEntry) {
    const href = entryHref(entry);
    const url = href ? new URL(href, window.location.origin).href : window.location.href;
    const payload = {
      title: entryTitle(entry, lang),
      text: entryFallback(entry, lang),
      url,
    };
    if (navigator.share) {
      try {
        await navigator.share(payload);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }
    await navigator.clipboard.writeText(url);
    showNote(entry.key, "share");
  }

  async function quoteLine(entry: DeskEntry, line: string) {
    const citation = `「${line}」\n—— ${entryTitle(entry, lang)}`;
    await navigator.clipboard.writeText(citation);
    showNote(entry.key, "quote");
  }

  return (
    <div className={`father-spread${wide ? " is-wide" : " is-narrow"}`}>
      <div className="father-frame">
        <header className="father-mast">
          <h1>Father of Chana</h1>
          <div className="father-seal" aria-label="简永杰" title="简永杰">
            <span>简</span>
            <span>永</span>
            <span>杰</span>
          </div>
        </header>

        <div className={`father-desk${focusedKey ? " is-focused" : ""}`}>
          {slots.map((index, slot) => {
            const entry = DESK_ENTRIES[index];
            if (!entry) {
              return null;
            }
            const right = slot === slots.length - 1;
            const focused = focusedKey === entry.key;
            const tools = hover?.key === entry.key ? hover : null;
            const article = (
              <article
                className={`father-module${focused ? " is-open" : ""}${tools ? " is-hot" : ""}`}
                data-key={entry.key}
                aria-label={entryTitle(entry, lang)}
                tabIndex={0}
                style={{ viewTransitionName: `father-${entry.key}` }}
                ref={(node) => {
                  moduleRefs.current[slot] = node;
                }}
                onClick={(event) => {
                  const target = event.target;
                  if (!(target instanceof Element) || target.closest("a, button")) {
                    return;
                  }
                  const selection = window.getSelection();
                  if (selection && !selection.isCollapsed) {
                    return;
                  }
                  if (focused) {
                    return;
                  }
                  runTransition(() => setFocusedKey(entry.key), restorePointer);
                }}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") {
                    return;
                  }
                  if (event.target !== event.currentTarget || focused) {
                    return;
                  }
                  event.preventDefault();
                  runTransition(() => setFocusedKey(entry.key), restorePointer);
                }}
                onMouseMove={(event) => {
                  pointerRef.current = { x: event.clientX, y: event.clientY };
                  const target = event.target;
                  if (target instanceof Element && target.closest(".father-tools")) {
                    return;
                  }
                  placeHover(event.currentTarget, event.clientX, event.clientY);
                }}
                onMouseLeave={() => {
                  setHover((current) => (current?.key === entry.key ? null : current));
                }}
              >
                <EntryBody entry={entry} lang={lang} />
                {tools ? (
                  <div className="father-tools" style={{ top: tools.top }}>
                    {focused ? (
                      <button
                        type="button"
                        onClick={() => runTransition(() => setFocusedKey(null), restorePointer)}
                      >
                        {lang === "zh" ? "收回" : "Back"}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      aria-label={lang === "zh" ? "分享这一件" : "Share this"}
                      onClick={() => void shareEntry(entry)}
                    >
                      {note?.key === entry.key && note.action === "share"
                        ? lang === "zh"
                          ? "已复制"
                          : "Copied"
                        : lang === "zh"
                          ? "分享"
                          : "Share"}
                    </button>
                    <button
                      type="button"
                      aria-label={
                        lang === "zh"
                          ? `引用当前行：${tools.line}`
                          : `Quote this line: ${tools.line}`
                      }
                      onClick={() => void quoteLine(entry, tools.line)}
                    >
                      {note?.key === entry.key && note.action === "quote"
                        ? lang === "zh"
                          ? "已复制"
                          : "Copied"
                        : lang === "zh"
                          ? "引用"
                          : "Quote"}
                    </button>
                  </div>
                ) : null}
              </article>
            );
            return (
              <div
                className={`father-slot${right ? " father-window" : ""}${focused ? " is-focused" : ""}`}
                key={entry.key}
              >
                {article}
                {right ? <div className="father-scroll" aria-hidden="true" /> : null}
              </div>
            );
          })}

          <div
            className="father-rail"
            ref={railRef}
            aria-label={copy.railAria}
            onKeyDown={(event) => {
              if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
                return;
              }
              event.preventDefault();
              const direction = event.key === "ArrowDown" ? 1 : -1;
              setStart((current) =>
                Math.min(maxStart, Math.max(0, current + direction)),
              );
            }}
          >
            <button type="button" onClick={() => setStart(FIRST_ARTICLE)}>
              {copy.nav.blog}
            </button>
            <button
              type="button"
              aria-label={copy.langAria}
              onClick={() => onLangChange(lang === "zh" ? "en" : "zh")}
            >
              {lang === "zh" ? "中" : "EN"}
            </button>
            <button
              type="button"
              aria-label={
                themeMode === "night" ? copy.themeToDayAria : copy.themeToNightAria
              }
              aria-pressed={themeMode === "night"}
              onClick={onThemeToggle}
            >
              <ThemeModeIcon mode={themeMode} />
            </button>
            <a href={siteAboutHref(lang)}>{copy.footerAbout}</a>
            <a href={`mailto:${CONTACT_EMAIL}`} aria-label={copy.footerContact}>
              {lang === "zh" ? "聊聊" : "Hi"}
            </a>
          </div>
        </div>
        <aside className="father-side" aria-label={copy.railAria}>
          <SocialLinks
            ariaLabel={copy.socialAria}
            className="fount-social-links fount-social-rail"
            linkClassName="fount-social-link"
          />
          <FountMusicPlayer lang={lang} />
        </aside>
      </div>
    </div>
  );
}
