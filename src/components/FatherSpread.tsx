import katex from "katex";
import { memo, useCallback, useEffect, useMemo, useRef, useState, type ComponentPropsWithoutRef, type CSSProperties, type MouseEvent } from "react";
import { flushSync } from "react-dom";
import {
  BLOG_ARTICLES,
  type BlogArticle,
  type BlogContentBlock,
} from "../data/blogArticles";
import { PERSONAL_PROJECTS, type FountField } from "../data/fountFields";
import type { Lang } from "../i18n/lang";
import { withSiteParams } from "../lib/lang-url";
import { CONTACT_EMAIL, SHELL_COPY, siteTabHref } from "../lib/site-shell";
import { FatherLanding } from "./FatherLanding";
import { FountMusicPlayer } from "./FountMusicPlayer";
import { SocialLinks } from "./SocialLinks";
import { ThemeModeIcon } from "./ThemeModeIcon";
import "./FatherSpread.css";

export type ReaderSurface = "home" | "projects" | "articles";

type FatherSpreadProps = {
  surface: ReaderSurface;
  onSurfaceChange: (surface: ReaderSurface) => void;
  onArticleOpen: (articleId: string) => void;
  lang: Lang;
  themeMode: "day" | "night";
  onThemeToggle: () => void;
  onLangChange: (lang: Lang) => void;
  articles?: BlogArticle[];
};

type Pile = "projects" | "articles";
type NoteState = { key: string; text: string };
type DeskEntry =
  | { kind: "project"; key: string; field: FountField }
  | { kind: "article"; key: string; article: BlogArticle };

const PROJECT_ENTRIES: DeskEntry[] = PERSONAL_PROJECTS.map((field) => ({
  kind: "project",
  key: field.key,
  field,
}));
const INITIAL_PROJECT = Math.floor((PROJECT_ENTRIES.length - 1) / 2);
const WHEEL_STEP = 64;

function entryTitle(entry: DeskEntry, lang: Lang) {
  return entry.kind === "project" ? entry.field.name : entry.article.title[lang];
}

function entryFallback(entry: DeskEntry, lang: Lang) {
  return entry.kind === "project"
    ? entry.field.summary[lang]
    : entry.article.summary[lang] || entry.article.title[lang];
}

function MathText({ text }: { text: string }) {
  const segments = text.split(/(\$\$[\s\S]+?\$\$|\$(?:\\.|[^$\n])+\$)/g);
  return segments.map((segment, index) => {
    const displayMode = segment.startsWith("$$") && segment.endsWith("$$");
    const inlineMode = !displayMode && segment.startsWith("$") && segment.endsWith("$");
    if (!displayMode && !inlineMode) return segment;
    const expression = displayMode ? segment.slice(2, -2) : segment.slice(1, -1);
    return (
      <span
        key={`math-${index}`}
        className={displayMode ? "father-math-display" : "father-math"}
        dangerouslySetInnerHTML={{
          __html: katex.renderToString(expression, {
            displayMode,
            throwOnError: false,
            trust: false,
          }),
        }}
      />
    );
  });
}

function articleBlocks(article: BlogArticle): BlogContentBlock[] {
  return article.blocks?.length
    ? article.blocks
    : article.paragraphs.map((text) => ({ type: "paragraph", text }));
}

function framesOf(field: FountField, lang: Lang) {
  return [
    { url: field.coverUrl, alt: field.coverAlt[lang], caption: field.summary[lang] },
    ...(field.screenshots ?? []).map((shot) => ({
      url: shot.url,
      alt: shot.alt[lang],
      caption: shot.caption[lang],
    })),
  ];
}

type ReaderModuleProps = ComponentPropsWithoutRef<"article"> & {
  entryKey: string;
  onRegister: (key: string, node: HTMLElement | null) => void;
};

function ReaderModule({ entryKey, onRegister, ...props }: ReaderModuleProps) {
  const register = useCallback((node: HTMLElement | null) => onRegister(entryKey, node), [entryKey, onRegister]);
  return <article {...props} ref={register} />;
}

const EntryBody = memo(function EntryBody({ entry, lang }: { entry: DeskEntry; lang: Lang }) {
  if (entry.kind === "project") {
    const href = withSiteParams(entry.field.href, { lang });
    return (
      <>
        <h2>{entry.field.name}</h2>
        <p className="father-kind">{entry.field.kind[lang]}</p>
        {framesOf(entry.field, lang).map((frame) => (
          <figure key={frame.url}>
            <img src={frame.url} alt={frame.alt} loading="lazy" />
            <figcaption>{frame.caption}</figcaption>
          </figure>
        ))}
        <a
          className="father-open"
          href={href}
          {...(href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
        >
          {lang === "zh" ? "打开项目" : "Visit project"}
        </a>
      </>
    );
  }

  return (
    <>
      <h2>{entry.article.title[lang]}</h2>
      <p className="father-kind">
        {entry.article.category[lang]} · {entry.article.date}
      </p>
      {articleBlocks(entry.article).map((block, index) => {
        const key = `${entry.key}-${index}`;
        if (block.type === "heading") {
          return <h3 key={key}><MathText text={block.text[lang]} /></h3>;
        }
        if (block.type === "list") {
          return (
            <ul key={key}>
              {block.items.map((item, itemIndex) => (
                <li key={`${key}-${itemIndex}`}><MathText text={item[lang]} /></li>
              ))}
            </ul>
          );
        }
        if (block.type === "figure") {
          return (
            <figure key={key}>
              <img src={block.src} alt={block.alt[lang]} loading="lazy" />
              {block.caption[lang].trim() ? (
                <figcaption><MathText text={block.caption[lang]} /></figcaption>
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
    </>
  );
});

function runTransition(update: () => void, after?: () => void) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const start = (document as Document & {
    startViewTransition?: (callback: () => void) => { finished: Promise<void> };
  }).startViewTransition;
  if (!reduced && start) {
    start.call(document, () => flushSync(update)).finished.then(after).catch(() => {});
  } else {
    flushSync(update);
    after?.();
  }
}

function Chevron({ next = false }: { next?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={next ? "m9 5 7 7-7 7" : "m15 5-7 7 7 7"} />
    </svg>
  );
}

/** Full sheets overlap at their own width; hovering raises a sheet without reflowing its text. */
export function FatherSpread({
  surface,
  onSurfaceChange,
  onArticleOpen,
  lang,
  themeMode,
  onThemeToggle,
  onLangChange,
  articles = BLOG_ARTICLES,
}: FatherSpreadProps) {
  const copy = SHELL_COPY[lang];
  const pile: Pile = surface === "articles" ? "articles" : "projects";
  const [requestedArticleId] = useState(() => surface === "articles"
    ? new URLSearchParams(window.location.search).get("article")
    : null);
  const [previousSurface, setPreviousSurface] = useState(surface);
  const [positions, setPositions] = useState(() => ({
    projects: INITIAL_PROJECT,
    articles: Math.max(0, articles.findIndex((article) => article.id === requestedArticleId)),
  }));
  const [previewKey, setPreviewKey] = useState<string | null>(null);
  const [focusRequest, setFocusedKey] = useState<string | null>(requestedArticleId ? `article-${requestedArticleId}` : null);
  const [pendingFocus, setPendingFocus] = useState<string | null>(null);
  const [note, setNote] = useState<NoteState | null>(null);
  const [indexQuery, setIndexQuery] = useState("");
  const [socialOpen, setSocialOpen] = useState(false);
  const deskRef = useRef<HTMLDivElement>(null);
  const sideRef = useRef<HTMLElement>(null);
  const indexRef = useRef<HTMLDialogElement>(null);
  const indexInputRef = useRef<HTMLInputElement>(null);
  const moduleRefs = useRef(new Map<string, HTMLElement>());
  const scrollPositions = useRef(new Map<string, number>());
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const noteTimer = useRef(0);
  const registerModule = useCallback((key: string, node: HTMLElement | null) => {
    if (node) {
      moduleRefs.current.set(key, node);
      const saved = scrollPositions.current.get(key);
      if (saved !== undefined && node.scrollTop !== saved) node.scrollTop = saved;
    } else {
      const previous = moduleRefs.current.get(key);
      if (previous) scrollPositions.current.set(key, previous.scrollTop);
      moduleRefs.current.delete(key);
    }
  }, []);

  const articleEntries = useMemo<DeskEntry[]>(() => articles.map((article) => ({
    kind: "article", key: `article-${article.id}`, article,
  })), [articles]);
  const entries = pile === "projects" ? PROJECT_ENTRIES : articleEntries;
  const maxCursor = Math.max(0, entries.length - 1);
  const focusedIndex = surface === "home" ? -1 : entries.findIndex((entry) => entry.key === focusRequest);
  const focusedKey = focusedIndex >= 0 ? focusRequest : null;
  const center = focusedIndex >= 0 ? focusedIndex : Math.min(positions[pile], maxCursor);
  const centerKey = entries[center]?.key ?? null;
  const openKey = focusedKey ?? previewKey ?? centerKey;
  // Keep a small article window mounted, with the focused entry pinned in place.
  const windowStart = Math.max(0, Math.min(center - 2, entries.length - 5));
  const visibleEntries = pile === "projects" ? entries : entries.slice(windowStart, windowStart + 5);
  const matchingArticles = articleEntries.filter((entry) =>
    entryTitle(entry, lang).toLocaleLowerCase().includes(indexQuery.trim().toLocaleLowerCase()),
  );

  // Route changes clear the enlarged sheet; both piles retain their reading positions.
  if (surface !== previousSurface) {
    setPreviousSurface(surface);
    setPreviewKey(null);
    setFocusedKey(surface === "articles" ? pendingFocus : null);
    setPendingFocus(null);
  }

  useEffect(() => () => window.clearTimeout(noteTimer.current), []);

  function restoreFocus(key: string) {
    moduleRefs.current.get(key)?.focus({ preventScroll: true });
  }

  function closeFocus() {
    const key = focusedKey;
    runTransition(() => {
      setPositions((current) => ({ ...current, [pile]: center }));
      setFocusedKey(null);
    }, () => { if (key) restoreFocus(key); });
  }

  useEffect(() => {
    if (!focusedKey) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || indexRef.current?.open) return;
      const key = focusedKey;
      runTransition(() => {
        setPositions((current) => ({ ...current, [pile]: center }));
        setFocusedKey(null);
      }, () => restoreFocus(key));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [center, focusedKey, pile]);

  useEffect(() => {
    if (surface === "home") return;
    let pending = 0;
    let lastEvent = 0;
    let lastStep = 0;
    const step = (delta: number) => {
      if (focusedKey) return;
      const now = performance.now();
      if (now - lastEvent > 180) pending = 0;
      lastEvent = now;
      pending += delta;
      if (Math.abs(pending) < WHEEL_STEP || now - lastStep < 260) return;
      const direction = pending > 0 ? 1 : -1;
      pending = 0;
      lastStep = now;
      setPreviewKey(null);
      setPositions((current) => ({
        ...current,
        [pile]: Math.min(maxCursor, Math.max(0, current[pile] + direction)),
      }));
    };
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const module = target.closest<HTMLElement>(".father-module");
      const multiplier = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 600 : 1;
      const horizontal = event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY);
      // Native scrolling keeps trackpad momentum and stays off the main thread.
      if (module && !horizontal) return;
      if (horizontal && target.closest(".father-math-display")) return;
      step((horizontal ? event.deltaX || event.deltaY : event.deltaY) * multiplier);
    };
    const desk = deskRef.current;
    const side = sideRef.current;
    desk?.addEventListener("wheel", onWheel, { passive: true });
    side?.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      desk?.removeEventListener("wheel", onWheel);
      side?.removeEventListener("wheel", onWheel);
    };
  }, [focusedKey, maxCursor, pile, surface]);

  function jumpTo(index: number) {
    const apply = () => {
      setPositions((current) => ({ ...current, [pile]: index }));
      setPreviewKey(null);
      setFocusedKey(null);
    };
    if (focusedKey) runTransition(apply);
    else apply();
    indexRef.current?.close();
  }

  function focusEntry(entry: DeskEntry) {
    const index = entries.findIndex((item) => item.key === entry.key);
    if (index < 0) return;
    runTransition(() => {
      setPositions((current) => ({ ...current, [pile]: index }));
      setPreviewKey(entry.key);
      setFocusedKey(entry.key);
      if (entry.kind === "article") onArticleOpen(entry.article.id);
    });
  }

  function openArticle(articleId: string) {
    const index = articleEntries.findIndex((entry) => entry.kind === "article" && entry.article.id === articleId);
    if (index < 0) return;
    const entry = articleEntries[index];
    indexRef.current?.close();
    runTransition(() => {
      setPositions((current) => ({ ...current, articles: index }));
      setPreviewKey(entry.key);
      if (surface !== "articles") {
        setPendingFocus(entry.key);
        onSurfaceChange("articles");
      } else {
        setFocusedKey(entry.key);
      }
      onArticleOpen(articleId);
    });
  }

  function openSurface(next: ReaderSurface) {
    indexRef.current?.close();
    setPendingFocus(null);
    pointerRef.current = null;
    setPreviewKey(null);
    setFocusedKey(null);
    onSurfaceChange(next);
  }

  function surfaceLink(event: MouseEvent<HTMLAnchorElement>, next: ReaderSurface) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    openSurface(next);
  }

  function showNote(key: string, failed = false) {
    window.clearTimeout(noteTimer.current);
    setNote({ key, text: failed
      ? lang === "zh" ? "复制未成功" : "Copy failed"
      : lang === "zh" ? "已复制" : "Copied" });
    noteTimer.current = window.setTimeout(() => setNote(null), 1800);
  }

  async function shareEntry(entry: DeskEntry) {
    const articleUrl = new URL(siteTabHref("blog", lang), window.location.origin);
    if (entry.kind === "article") articleUrl.searchParams.set("article", entry.article.id);
    const href = entry.kind === "project"
      ? withSiteParams(entry.field.href, { lang })
      : articleUrl.href;
    const url = href ? new URL(href, window.location.origin).href : window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: entryTitle(entry, lang), text: entryFallback(entry, lang), url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      showNote(entry.key);
    } catch { showNote(entry.key, true); }
  }

  return (
    <div className={`father-spread${surface === "home" ? " is-home" : ""}${focusedKey ? " is-reading" : ""}`}>
      <div className="father-frame">
        <header className="father-mast">
          <a className="father-home" href={withSiteParams("/", { lang })} aria-current={surface === "home" ? "page" : undefined} onClick={(event) => surfaceLink(event, "home")}>
            {lang === "zh" ? "首页" : "Home"}
          </a>
          <div className="father-identity">
            <h1>Father of Chana</h1>
          </div>
        </header>

        {surface === "home" ? (
          <FatherLanding lang={lang} articles={articles} onOpen={openSurface} onOpenArticle={openArticle} />
        ) : (
          <>
            <nav className="father-navigation" aria-label={lang === "zh" ? "卡片导航" : "Card navigation"}>
              <div className="father-sections" role="group" aria-label={copy.navAria}>
                <a href={siteTabHref("projects", lang)} aria-current={surface === "projects" ? "page" : undefined} onClick={(event) => surfaceLink(event, "projects")}>{lang === "zh" ? "项目" : "Projects"}</a>
                <a href={siteTabHref("blog", lang)} aria-current={surface === "articles" ? "page" : undefined} onClick={(event) => surfaceLink(event, "articles")}>{copy.nav.blog}</a>
              </div>
              <div className="father-jumps" aria-label={lang === "zh" ? "快速定位" : "Jump to"}>
                {pile === "projects" ? PROJECT_ENTRIES.map((entry, index) => (
                  <button type="button" key={entry.key} aria-current={center === index ? "true" : undefined} onClick={() => jumpTo(index)}>
                    {entryTitle(entry, lang)}
                  </button>
                )) : (
                  <button className="father-index-trigger" type="button" aria-haspopup="dialog" onClick={() => {
                    indexRef.current?.showModal();
                    indexInputRef.current?.focus();
                  }}>
                    {lang === "zh" ? "文章目录" : "All articles"}
                    <span>{entries.length}</span>
                  </button>
                )}
              </div>
              <div className="father-paging">
                <button type="button" disabled={center === 0} aria-label={lang === "zh" ? "上一张卡片" : "Previous card"} onClick={() => jumpTo(center - 1)}><Chevron /></button>
                <span aria-live="polite">{center + 1} / {entries.length}</span>
                <button type="button" disabled={center >= maxCursor} aria-label={lang === "zh" ? "下一张卡片" : "Next card"} onClick={() => jumpTo(center + 1)}><Chevron next /></button>
              </div>
            </nav>

            <div
              className={`father-desk${focusedKey ? " is-focused" : ""}`}
              ref={deskRef}
              onPointerLeave={() => {
                if (!focusedKey) setPreviewKey(null);
                pointerRef.current = null;
              }}
              onKeyDown={(event) => {
                if (focusedKey || !(event.target instanceof HTMLElement) || !event.target.matches(".father-module")) return;
                if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
                event.preventDefault();
                jumpTo(Math.min(maxCursor, Math.max(0, center + (event.key === "ArrowRight" ? 1 : -1))));
              }}
            >
              {focusedKey ? <button className="father-back" type="button" onClick={closeFocus}>{lang === "zh" ? "收回" : "Back"}</button> : null}
              {visibleEntries.map((entry, slot) => {
                const index = pile === "projects" ? slot : windowStart + slot;
                const distance = index - center;
                const depth = Math.abs(distance);
                const expanded = entry.key === openKey;
                const focused = entry.key === focusedKey;
                const offset = Math.sign(distance) * (depth ? 1 + (depth - 1) * 0.62 : 0);
                const style = {
                  "--card-offset": `calc(var(--card-step) * ${offset})`,
                  "--card-top": "0px",
                  "--card-scale": 1,
                  zIndex: expanded ? 40 : 20 - depth,
                  // Capture the scrolling paper and its stationary frame as one sheet.
                  viewTransitionName: `father-${entry.key}`,
                } as CSSProperties;
                return (
                  <div className={`father-slot${expanded ? " is-expanded" : ""}${focused ? " is-focused" : ""}`} style={style} key={entry.key}>
                    <ReaderModule
                      entryKey={entry.key}
                      onRegister={registerModule}
                      className={`father-module${focused ? " is-open" : ""}`}
                      data-key={entry.key}
                      aria-label={entryTitle(entry, lang)}
                      tabIndex={0}
                      onClick={(event) => {
                        const target = event.target;
                        if (!(target instanceof Element) || target.closest("a, button")) return;
                        if (window.getSelection()?.isCollapsed === false || focused) return;
                        focusEntry(entry);
                      }}
                      onFocus={(event) => {
                        if (event.target === event.currentTarget && !focusedKey) setPreviewKey(entry.key);
                      }}
                      onKeyDown={(event) => {
                        if ((event.key !== "Enter" && event.key !== " ") || event.target !== event.currentTarget || focused) return;
                        event.preventDefault();
                        focusEntry(entry);
                      }}
                      onPointerMove={(event) => {
                        if (event.pointerType === "touch") return;
                        const previous = pointerRef.current;
                        const moved = !previous || Math.hypot(event.clientX - previous.x, event.clientY - previous.y) > 3;
                        if (moved) {
                          pointerRef.current = { x: event.clientX, y: event.clientY };
                          if (!focusedKey && openKey !== entry.key) setPreviewKey(entry.key);
                        }
                      }}
                      onScroll={(event) => {
                        const article = event.currentTarget;
                        scrollPositions.current.set(entry.key, article.scrollTop);
                      }}
                    >
                      <div className="father-page" inert={!expanded}>
                        <EntryBody entry={entry} lang={lang} />
                      </div>
                    </ReaderModule>
                    {expanded ? (
                      <div className="father-tools">
                        <button type="button" aria-label={lang === "zh" ? "分享这一件" : "Share this"} onClick={() => void shareEntry(entry)}>
                          {note?.key === entry.key ? note.text : lang === "zh" ? "分享" : "Share"}
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </>
        )}

        <aside className={`father-side${socialOpen ? " is-social-open" : ""}`} ref={sideRef} aria-label={copy.railAria}>
          <div className="father-rail">
            <button type="button" aria-label={copy.langAria} onClick={() => onLangChange(lang === "zh" ? "en" : "zh")}>{lang === "zh" ? "中" : "EN"}</button>
            <button type="button" aria-label={themeMode === "night" ? copy.themeToDayAria : copy.themeToNightAria} aria-pressed={themeMode === "night"} onClick={onThemeToggle}><ThemeModeIcon mode={themeMode} /></button>
            <a href={`mailto:${CONTACT_EMAIL}`} aria-label={copy.footerContact}>{lang === "zh" ? "聊聊" : "Hi"}</a>
            <button className="father-social-trigger" type="button" aria-label={copy.socialAria} aria-expanded={socialOpen} aria-controls="father-social" onClick={() => setSocialOpen((current) => !current)}>···</button>
          </div>
          <FountMusicPlayer lang={lang} />
          <div className="father-social" id="father-social">
            <SocialLinks ariaLabel={copy.socialAria} className="fount-social-links" linkClassName="fount-social-link" />
          </div>
        </aside>
      </div>

      <dialog className="father-index" ref={indexRef} aria-label={lang === "zh" ? "文章目录" : "Article index"} onClose={() => setIndexQuery("")} onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.close(); }}>
        <div className="father-index-head">
          <input type="search" ref={indexInputRef} value={indexQuery} onChange={(event) => setIndexQuery(event.target.value)} placeholder={lang === "zh" ? "查找文章" : "Find an article"} aria-label={lang === "zh" ? "查找文章" : "Find an article"} />
          <button type="button" onClick={() => indexRef.current?.close()}>{lang === "zh" ? "关闭" : "Close"}</button>
        </div>
        <div className="father-index-list">
          {matchingArticles.map((entry) => (
            <button type="button" key={entry.key} onClick={() => { if (entry.kind === "article") openArticle(entry.article.id); }}>
              <span>{entryTitle(entry, lang)}</span>
              <small>{entry.kind === "article" ? entry.article.date : ""}</small>
            </button>
          ))}
          {!matchingArticles.length ? <p>{lang === "zh" ? "没有找到这篇文章" : "No matching articles"}</p> : null}
        </div>
      </dialog>
      <p className="sr-only" role="status">{note?.text ?? ""}</p>
    </div>
  );
}
