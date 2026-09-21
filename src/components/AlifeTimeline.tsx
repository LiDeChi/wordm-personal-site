import { useEffect, useMemo, useRef, useState } from "react";
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
import { AlifeCardWall } from "./AlifeCardWall";
import { AlifeItemDetail } from "./AlifeItemDetail";
import "./AlifeTimeline.css";

/**
 * 人工生命史：左边时间轴，右边展览的卡片墙（41 条，1948 → 2026）。
 *
 * 两列读同一份 catalog，联动是双向的：
 *  - 停/点左列条目 → 右列把对应卡片带进视野；
 *  - 停/点右列卡片 → 左列滚到那条，并把它的说明牌展开（卡片详情就在左列列表里）。
 *
 * 左列的展开面板复用 AlifeItemDetail；「展开全部 / 收起全部」保留给要通读的人。
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
  /** 指针 / 焦点停在谁身上：两列的选中高亮和联动滚动都看它。 */
  const [activeId, setActiveId] = useState<string | null>(null);
  /** 从右列卡片选中的条目：它的说明牌在左列展开。 */
  const [cardId, setCardId] = useState<string | null>(null);
  /** 谁发起的选中：滚动要对准另一列。 */
  const pendingScroll = useRef<"list" | "wall" | null>(null);
  const listRefs = useRef<Record<string, HTMLLIElement | null>>({});
  const cardRefs = useRef<Record<string, HTMLLIElement | null>>({});

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

  // 同步滚动要等渲染完：展开/收起会改左列高度，先滚会滚偏。
  useEffect(() => {
    const from = pendingScroll.current;
    if (!from || !activeId) {
      return;
    }
    pendingScroll.current = null;
    const target =
      from === "list" ? cardRefs.current[activeId] : listRefs.current[activeId];
    target?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [activeId]);

  function activateFromList(id: string) {
    if (id === activeId) {
      return;
    }
    pendingScroll.current = "list";
    setActiveId(id);
  }

  function activateFromWall(id: string) {
    setCardId(id);
    if (id === activeId) {
      return;
    }
    pendingScroll.current = "wall";
    setActiveId(id);
  }

  function toggleEntry(id: string) {
    setOpenIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
    activateFromList(id);
  }

  return (
    <section
      className="alife-timeline"
      aria-label={copy.timelineAria}
      id="alife-timeline"
    >
      <header className="alife-timeline-head">
        {/* 站点标题已经移到顶栏，这里只留栏目标签。 */}
        <p className="alife-eyebrow">{copy.eyebrow}</p>

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
                onClick={() => {
                  setOpenIds(allOpen ? [] : items.map((item) => item.id));
                  setCardId(null);
                }}
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
        <div className="alife-timeline-layout">
          <div className="alife-column alife-column-timeline">
            <header className="alife-column-head">
              <span className="alife-field-label">{copy.timelineLabel}</span>
              <span className="alife-column-hint" aria-hidden="true">
                {copy.timelineHint}
              </span>
            </header>

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
                        open={openIds.includes(item.id) || cardId === item.id}
                        active={activeId === item.id}
                        onActivate={() => activateFromList(item.id)}
                        onToggle={() => toggleEntry(item.id)}
                        registerRef={(node) => {
                          listRefs.current[item.id] = node;
                        }}
                      />
                    ))}
                  </ol>
                </section>
              ))}
            </div>
          </div>

          <AlifeCardWall
            lang={lang}
            items={items}
            schoolsOrder={state.catalog.schoolsOrder}
            activeId={activeId}
            cardRefs={cardRefs}
            onActivate={activateFromWall}
          />
        </div>
      ) : null}
    </section>
  );
}

function AlifeEntry({
  item,
  lang,
  open,
  active,
  onActivate,
  onToggle,
  registerRef,
}: {
  item: AlifeItem;
  lang: Lang;
  open: boolean;
  active: boolean;
  onActivate: () => void;
  onToggle: () => void;
  registerRef: (node: HTMLLIElement | null) => void;
}) {
  const copy = ALIFE_COPY[lang];
  const ownWork = isOwnWork(item);
  const panelId = `alife-entry-panel-${item.id}`;
  const headingId = `alife-entry-head-${item.id}`;
  const demoKind = alifeDemoKind(item);

  return (
    <li
      className={`alife-entry${open ? " is-open" : ""}${active ? " is-active" : ""}${
        ownWork ? " is-own-work" : ""
      }`}
      ref={registerRef}
    >
      <h3 className="alife-entry-heading" id={headingId}>
        <button
          type="button"
          className="alife-entry-summary"
          aria-expanded={open}
          aria-controls={panelId}
          onMouseEnter={onActivate}
          onFocus={onActivate}
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
