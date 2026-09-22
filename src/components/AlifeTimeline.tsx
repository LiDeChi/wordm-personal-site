import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Lang } from "../i18n/lang";
import { ALIFE_COPY, ALIFE_MUSEUM_URL, alifeAssetUrl, alifeDecade, alifeDemoKind, alifeItemLinks, isOwnWork, loadAlifeCatalog, type AlifeCatalog, type AlifeItem } from "../data/alifeHistory";
import { AlifeDemoPreview } from "./AlifeDemoPreview";
import { AlifeItemDetail } from "./AlifeItemDetail";
import "./AlifeTimeline.css";

type View = "list" | "gallery";
type State = { status: "loading" } | { status: "ready"; catalog: AlifeCatalog } | { status: "failed" };
const NO_ITEMS: AlifeItem[] = [];

/** A single chronological collection, with two presentations and shared disclosure state. */
export function AlifeTimeline({ lang }: { lang: Lang }) {
  const copy = ALIFE_COPY[lang];
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [view, setView] = useState<View>("list");
  const [openIds, setOpenIds] = useState<string[]>([]);
  const [activeDecade, setActiveDecade] = useState<string | null>(null);
  const paneRef = useRef<HTMLDivElement>(null);
  const decadeRefs = useRef<Record<string, HTMLElement | null>>({});
  const entryRefs = useRef<Record<string, HTMLLIElement | null>>({});
  const restoreId = useRef<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void loadAlifeCatalog(controller.signal).then((catalog) => {
      if (!controller.signal.aborted) setState({ status: "ready", catalog });
    }).catch(() => {
      if (!controller.signal.aborted) setState({ status: "failed" });
    });
    return () => controller.abort();
  }, [attempt]);

  const items = state.status === "ready" ? state.catalog.items : NO_ITEMS;
  const allOpen = items.length > 0 && openIds.length === items.length;
  const groups = useMemo(() => {
    const result = new Map<string, AlifeItem[]>();
    for (const item of items) {
      const decade = alifeDecade(item.year);
      result.set(decade, [...(result.get(decade) ?? []), item]);
    }
    return [...result.entries()];
  }, [items]);

  function scrollToElement(element: HTMLElement | null | undefined) {
    const pane = paneRef.current;
    if (pane && element) pane.scrollTop += element.getBoundingClientRect().top - pane.getBoundingClientRect().top;
  }

  useLayoutEffect(() => {
    if (restoreId.current) scrollToElement(entryRefs.current[restoreId.current]);
    restoreId.current = null;
  }, [view]);

  function changeView(next: View) {
    if (next === view) return;
    const top = paneRef.current?.getBoundingClientRect().top ?? 0;
    restoreId.current = items.find((item) => {
      const rect = entryRefs.current[item.id]?.getBoundingClientRect();
      return rect && rect.bottom > top + 4;
    })?.id ?? null;
    setView(next);
  }

  function updateDecade() {
    const top = paneRef.current?.getBoundingClientRect().top ?? 0;
    const current = groups.find(([decade]) => (decadeRefs.current[decade]?.getBoundingClientRect().bottom ?? 0) > top + 10);
    if (current) setActiveDecade(current[0]);
  }

  return (
    <section className={`alife-timeline is-${view}`} aria-label={copy.timelineAria} id="alife-timeline">
      <header className="alife-timeline-head">
        <div className="alife-head-lead">
          <p className="alife-eyebrow">{copy.eyebrow}</p>
          {state.status === "ready" && items.length > 0 && <span className="alife-count">{copy.counts(items.length, state.catalog.schoolsOrder.length, `${items[0].year} → ${items[items.length - 1].year}`)}</span>}
        </div>
        <a className="alife-museum-link" href={ALIFE_MUSEUM_URL}>{copy.openMuseum} ↗</a>
      </header>
      {state.status === "loading" && <p className="alife-status" role="status">{copy.loading}</p>}
      {state.status === "failed" && <p className="alife-status" role="alert">{copy.failed} <button onClick={() => { setState({ status: "loading" }); setAttempt((n) => n + 1); }}>{copy.retry}</button></p>}
      {state.status === "ready" && <>
        <div className="alife-toolbar">
          <div className="alife-view-switch" role="group" aria-label={lang === "zh" ? "浏览视图" : "Browse view"}>
            <button type="button" aria-pressed={view === "list"} onClick={() => changeView("list")}><span aria-hidden="true">☷</span> {lang === "zh" ? "列表" : "List"}</button>
            <button type="button" aria-pressed={view === "gallery"} onClick={() => changeView("gallery")}><span aria-hidden="true">▦</span> {copy.galleryLabel}</button>
          </div>
          <button className="alife-head-toggle" type="button" aria-pressed={allOpen} onClick={() => setOpenIds(allOpen ? [] : items.map((item) => item.id))}>{allOpen ? copy.collapseAll : copy.expandAll}</button>
        </div>
        <div className="alife-timeline-split">
          <nav className="alife-year-rail" aria-label={copy.decadeNav}>
            {groups.map(([decade, group]) => <button type="button" key={decade} aria-current={decade === (activeDecade ?? groups[0]?.[0]) ? "true" : undefined} onClick={() => { scrollToElement(decadeRefs.current[decade]); setActiveDecade(decade); }}><span>{decade}</span><small>{group.length}</small></button>)}
          </nav>
          <div className="alife-timeline-body" ref={paneRef} onScroll={updateDecade} aria-label={view === "list" ? (lang === "zh" ? "项目列表" : "Project list") : copy.galleryLabel}>
            {groups.map(([decade, group]) => <section className="alife-decade" key={decade} ref={(node) => { decadeRefs.current[decade] = node; }}>
              <h2 className="alife-decade-label">{decade}<small>{group.length}</small></h2>
              <ol className="alife-entry-list">
                {group.map((item) => <AlifeEntry key={item.id} item={item} lang={lang} open={openIds.includes(item.id)} onToggle={() => setOpenIds((ids) => ids.includes(item.id) ? ids.filter((id) => id !== item.id) : [...ids, item.id])} registerRef={(node) => { entryRefs.current[item.id] = node; }} />)}
              </ol>
            </section>)}
          </div>
        </div>
      </>}
    </section>
  );
}

function AlifeEntry({ item, lang, open, onToggle, registerRef }: { item: AlifeItem; lang: Lang; open: boolean; onToggle: () => void; registerRef: (node: HTMLLIElement | null) => void }) {
  const copy = ALIFE_COPY[lang];
  const demo = alifeDemoKind(item);
  const preview = demo === "runnable" ? item.demo : null;
  const photo = item.leads?.find((lead) => lead.photo?.startsWith("assets/photos/"));
  const photoUrl = photo ? alifeAssetUrl(photo.photo) : null;
  const team = Array.isArray(item.team) ? item.team.join(" · ") : item.team;
  const people = item.people?.join(" · ") || item.leads?.map((lead) => lead.name).join(" · ");
  const links = alifeItemLinks(item, { site: copy.leadSite, scholar: copy.leadScholar });
  return <li ref={registerRef} className={`alife-entry${open ? " is-open" : ""}`}>
    <div className={`alife-entry-overview${preview ? " has-preview" : ""}`}>
      {preview && <div className={`alife-entry-preview${preview ? " has-demo" : ""}`}>
        {preview ? <a href={ALIFE_MUSEUM_URL} aria-label={`${copy.openDemo}: ${item.name}`}><AlifeDemoPreview demo={preview} label={`${item.name} · ${lang === "zh" ? "demo 运行预览" : "running demo preview"}`} /><span>{copy.demoBadge} ↗</span></a> : null}
        {preview && photoUrl && <img className="alife-demo-author" src={photoUrl} alt={photo?.name ?? ""} loading="lazy" decoding="async" />}
      </div>}
      <div className="alife-entry-copy">
        <p className="alife-entry-date"><strong>{item.year}</strong>{item.yearNote && <span>{item.yearNote}</span>}</p>
        <h3 id={`alife-entry-head-${item.id}`}><button type="button" aria-expanded={open} aria-controls={`alife-entry-panel-${item.id}`} onClick={onToggle}>{item.name}<span aria-hidden="true">{open ? "−" : "+"}</span></button></h3>
        {item.nameEn && item.nameEn !== item.name && <p className="alife-entry-en">{item.nameEn}</p>}
        <div className="alife-entry-meta">{item.schools.map((school) => <span className="alife-school" key={school}>{school}</span>)}{isOwnWork(item) && <span className="alife-badge is-own">{copy.ownWork}</span>}</div>
        {(people || team) && <p className="alife-entry-credits">{!preview && photoUrl && <img className="alife-credit-avatar" src={photoUrl} alt={photo?.name ?? ""} loading="lazy" decoding="async" />}{[people, team].filter(Boolean).join(" · ")}</p>}
        {item.summary && <p className="alife-entry-abstract">{item.summary}</p>}
        {item.limits && <p className="alife-entry-limit"><span>{copy.limits}</span>{item.limits}</p>}
        <div className="alife-entry-actions">
          {links.slice(0, 2).map((link) => <a href={link.url} key={link.url} target="_blank" rel="noreferrer">{link.label} ↗</a>)}
          <button type="button" aria-expanded={open} aria-controls={`alife-entry-panel-${item.id}`} onClick={onToggle}>{open ? (lang === "zh" ? "收起详情" : "Less") : (lang === "zh" ? "完整资料" : "Full details")} {open ? "−" : "+"}</button>
        </div>
      </div>
    </div>
    {open && <div className="alife-entry-panel" id={`alife-entry-panel-${item.id}`} aria-labelledby={`alife-entry-head-${item.id}`}><AlifeItemDetail item={item} lang={lang} overviewVisible /></div>}
  </li>;
}

export default AlifeTimeline;
