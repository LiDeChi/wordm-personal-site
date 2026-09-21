import { useEffect, useMemo, useState } from "react";
import type { Lang } from "../i18n/lang";
import {
  ALIFE_COPY,
  ALIFE_INTRO,
  ALIFE_MUSEUM_URL,
  alifeDecade,
  alifeDemoKind,
  isOwnWork,
  loadAlifeCatalog,
  type AlifeCatalog,
  type AlifeItem,
} from "../data/alifeHistory";
import { AlifeItemDetail } from "./AlifeItemDetail";
import "./AlifeTimeline.css";

/**
 * 人工生命史时间轴（41 条，1948 → 2026）。
 *
 * 渐进式披露：
 *  1. 默认只给一行摘要 —— 年份 / 名称 / 流派 / 是否有 demo，41 条可以快速扫完；
 *  2. 展开单条才渲染详情面板（DOM 也是按需的），面板本体复用 AlifeItemDetail；
 *  3. 「展开全部 / 收起全部」给需要通读的人，不默认打开。
 */

type TimelineProps = {
  lang: Lang;
};

type State =
  | { status: "loading" }
  | { status: "ready"; catalog: AlifeCatalog }
  | { status: "failed" };

/** 稳定引用：没有数据时用它，避免 useMemo 依赖每帧变化。 */
const NO_ITEMS: AlifeItem[] = [];

export function AlifeTimeline({ lang }: TimelineProps) {
  const copy = ALIFE_COPY[lang];
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [openIds, setOpenIds] = useState<string[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    void loadAlifeCatalog(controller.signal)
      .then((catalog) => {
        if (!cancelled) {
          setState({ status: "ready", catalog });
        }
      })
      .catch((error: unknown) => {
        if (cancelled || (error instanceof DOMException && error.name === "AbortError")) {
          return;
        }
        console.warn("Failed to load the artificial life catalog.", error);
        setState({ status: "failed" });
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [attempt]);

  const items = state.status === "ready" ? state.catalog.items : NO_ITEMS;
  const allOpen = items.length > 0 && openIds.length === items.length;

  const groups = useMemo(() => {
    const byDecade = new Map<string, AlifeItem[]>();
    for (const item of items) {
      const key = alifeDecade(item.year);
      const bucket = byDecade.get(key);
      if (bucket) {
        bucket.push(item);
      } else {
        byDecade.set(key, [item]);
      }
    }
    return [...byDecade.entries()];
  }, [items]);

  function toggle(id: string) {
    setOpenIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  }

  return (
    <section
      className="alife-timeline"
      aria-label={copy.timelineAria}
      id="alife-timeline"
    >
      <header className="alife-timeline-head">
        <p className="alife-eyebrow">{copy.eyebrow}</p>
        <h1>{copy.title}</h1>

        <div className="alife-intro">
          {/* 时间轴上的一段话：这条方向到底在追什么。 */}
          <p>{ALIFE_INTRO[lang]}</p>
          {copy.chineseOnly ? (
            <p className="alife-note">{copy.chineseOnly}</p>
          ) : null}
        </div>

        <div className="alife-timeline-tools">
          <span className="alife-count">
            {state.status === "ready"
              ? copy.counts(state.catalog.items.length, state.catalog.schoolsOrder.length)
              : null}
          </span>
          <div className="alife-tool-actions">
            {state.status === "ready" ? (
              <button
                type="button"
                aria-pressed={allOpen}
                onClick={() => setOpenIds(allOpen ? [] : items.map((item) => item.id))}
              >
                {allOpen ? copy.collapseAll : copy.expandAll}
              </button>
            ) : null}
            <a href={ALIFE_MUSEUM_URL}>
              {copy.openMuseum}
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </header>

      {state.status === "loading" ? (
        <p className="alife-status" role="status">
          {copy.loading}
        </p>
      ) : null}

      {state.status === "failed" ? (
        <p className="alife-status is-failed" role="alert">
          {copy.failed}
          <button
            type="button"
            onClick={() => {
              setState({ status: "loading" });
              setAttempt((value) => value + 1);
            }}
          >
            {copy.retry}
          </button>
        </p>
      ) : null}

      {state.status === "ready" ? (
        <div className="alife-timeline-body">
          {groups.map(([decade, group]) => (
            <section className="alife-decade" key={decade}>
              <h2 className="alife-decade-label">
                <span>{decade}</span>
              </h2>
              <ol className="alife-entry-list">
                {group.map((item) => (
                  <AlifeEntry
                    key={item.id}
                    item={item}
                    lang={lang}
                    open={openIds.includes(item.id)}
                    onToggle={() => toggle(item.id)}
                  />
                ))}
              </ol>
            </section>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function AlifeEntry({
  item,
  lang,
  open,
  onToggle,
}: {
  item: AlifeItem;
  lang: Lang;
  open: boolean;
  onToggle: () => void;
}) {
  const copy = ALIFE_COPY[lang];
  const ownWork = isOwnWork(item);
  const panelId = `alife-entry-panel-${item.id}`;
  const headingId = `alife-entry-head-${item.id}`;
  const demoKind = alifeDemoKind(item);

  return (
    <li
      className={`alife-entry${open ? " is-open" : ""}${ownWork ? " is-own-work" : ""}`}
    >
      <h3 className="alife-entry-heading" id={headingId}>
        <button
          type="button"
          className="alife-entry-summary"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
        >
          <span className="alife-entry-year">
            {item.year}
            {item.yearNote ? <small>{item.yearNote}</small> : null}
          </span>

          <span className="alife-entry-title">
            <strong>{item.name}</strong>
            {item.nameEn ? <small>{item.nameEn}</small> : null}
          </span>

          <span className="alife-entry-meta">
            {item.schools.map((school) => (
              <span className="alife-school" key={school}>
                {school}
              </span>
            ))}
            {ownWork ? (
              <span className="alife-badge is-own">{copy.ownWork}</span>
            ) : null}
            {demoKind === "runnable" ? (
              <span className="alife-badge is-demo">{copy.demoBadge}</span>
            ) : null}
            {demoKind === "link" ? (
              <span className="alife-badge is-link-demo">{copy.linkDemoBadge}</span>
            ) : null}
          </span>

          <span className="alife-entry-chevron" aria-hidden="true" />
          <span className="sr-only">
            {copy.expandEntry}: {item.name}
          </span>
        </button>
      </h3>

      {open ? (
        <div className="alife-entry-panel" id={panelId} aria-labelledby={headingId}>
          <AlifeItemDetail item={item} lang={lang} />
        </div>
      ) : null}
    </li>
  );
}

export default AlifeTimeline;
