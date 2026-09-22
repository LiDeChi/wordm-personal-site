import { useEffect, useMemo, useRef, useState } from "react";
import type { Lang } from "../i18n/lang";
import {
  ALIFE_COPY,
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
 * 联动：
 *  - 指针停在左列条目上 → 右列把对应卡片带到中间；
 *  - 滚左列 → 右列跟着走，始终把「中线附近那一条」的卡片放在正中间；
 *  - 指针停在右列卡片上 → 左列滚到那条并展开说明牌（卡片的详情就在左列列表里）；
 *  - 悬停左列右侧的「+」也展开说明牌，只悬停标题只做联动、不展开。
 *
 * 展开状态拆成两个集合，点标题永远收得回来：
 *  - openIds：明确展开（点标题 / 展开全部）；
 *  - closedIds：明确收起（把悬停展开的那条点回去）；
 *  - expandId：悬停「+」或右侧卡片临时带出来的展开。
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

/** 只滚某个滚动容器把元素带进视野，不牵动整页。 */
function scrollPaneToShow(
  pane: HTMLElement,
  el: HTMLElement,
  block: "center" | "nearest" | "start",
  smooth: boolean,
) {
  const paneRect = pane.getBoundingClientRect();
  const rect = el.getBoundingClientRect();
  const offset = rect.top - paneRect.top;

  let top = pane.scrollTop;
  if (block === "center") {
    top += offset - (pane.clientHeight - rect.height) / 2;
  } else if (block === "start") {
    // 年份导航跳代：这一代的开头贴到滚动区顶。
    top += offset;
  } else if (offset < 0) {
    top += offset;
  } else if (rect.bottom > paneRect.bottom) {
    top += rect.bottom - paneRect.bottom;
  }

  pane.scrollTo({ top, behavior: smooth ? "smooth" : "auto" });
}

/** 程序化滚动的这段时间里不跟随（平滑滚动比一帧长，400ms 是卡片联动、800ms 是跳代）。 */
function holdScrollFollow(guard: { current: number }, ms: number) {
  guard.current = performance.now() + ms;
}

/** 滚动跟随时用：中心离容器中线最近的那一条。 */
function nearestToPaneCenter(
  pane: HTMLElement,
  elements: Record<string, HTMLLIElement | null>,
) {
  const paneRect = pane.getBoundingClientRect();
  const middle = paneRect.top + paneRect.height / 2;
  let bestId: string | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const [id, el] of Object.entries(elements)) {
    if (!el) {
      continue;
    }
    const rect = el.getBoundingClientRect();
    const distance = Math.abs(rect.top + rect.height / 2 - middle);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestId = id;
    }
  }

  return bestId;
}

export function AlifeTimeline({ lang }: TimelineProps) {
  const copy = ALIFE_COPY[lang];
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [openIds, setOpenIds] = useState<string[]>([]);
  const [closedIds, setClosedIds] = useState<string[]>([]);
  const [expandId, setExpandId] = useState<string | null>(null);
  /** 指针 / 焦点停在谁身上：两列的高亮和联动滚动都看它。 */
  const [activeId, setActiveId] = useState<string | null>(null);
  /** 谁发起的选中、要不要补间动画。 */
  const pendingScroll = useRef<{ from: "list" | "wall"; smooth: boolean } | null>(null);
  const listRefs = useRef<Record<string, HTMLLIElement | null>>({});
  const cardRefs = useRef<Record<string, HTMLLIElement | null>>({});
  /** 年代分组的外层节点：年份导航按它把左列滚到那一代的开头。 */
  const decadeRefs = useRef<Record<string, HTMLElement | null>>({});
  const listPaneRef = useRef<HTMLDivElement | null>(null);
  const wallPaneRef = useRef<HTMLUListElement | null>(null);
  const scrollFrame = useRef(0);
  /** 程序化滚动左列的这段时间里，忽略滚动跟随（否则会把悬停态抢走）。 */
  const scrollGuard = useRef(0);

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

  useEffect(
    () => () => {
      if (scrollFrame.current) {
        cancelAnimationFrame(scrollFrame.current);
      }
    },
    [],
  );

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

  /** 年份导航高亮哪一代：跟当前条目（悬停 / 滚动中线）走，没有当前条目时落在最早一代。 */
  const activeDecade = useMemo(() => {
    const current = activeId
      ? items.find((entry) => entry.id === activeId)
      : undefined;
    return current ? alifeDecade(current.year) : (groups[0]?.[0] ?? null);
  }, [activeId, groups, items]);

  // 联动滚动要等渲染完：展开/收起会改左列高度，先滚会滚偏。
  useEffect(() => {
    const pending = pendingScroll.current;
    if (!pending || !activeId) {
      return;
    }
    pendingScroll.current = null;

    if (pending.from === "list") {
      // 左列在动 → 右列把对应的卡片摆到正中间。
      const card = cardRefs.current[activeId];
      if (wallPaneRef.current && card) {
        scrollPaneToShow(wallPaneRef.current, card, "center", pending.smooth);
      }
      return;
    }

    // 右列在动 → 只把左列对应的那条带进视野。这里不碰右侧：正中间那一下会把
    // 指针底下的卡片换掉，反而把悬停态抢走（再触发一轮联动）。
    const row = listRefs.current[activeId];
    if (listPaneRef.current && row) {
      holdScrollFollow(scrollGuard, 400);
      scrollPaneToShow(listPaneRef.current, row, "nearest", pending.smooth);
    }
  }, [activeId]);

  function activate(id: string, from: "list" | "wall", smooth: boolean) {
    if (id === activeId) {
      return;
    }
    pendingScroll.current = { from, smooth };
    setActiveId(id);
  }

  /** 悬停「+」：展开这条的说明牌，并把右列对应的卡片带到中间。 */
  function expandByHover(id: string, from: "list" | "wall") {
    setExpandId(id);
    setClosedIds((current) => current.filter((value) => value !== id));
    activate(id, from, true);
  }

  function isOpen(id: string) {
    return (
      !closedIds.includes(id) && (openIds.includes(id) || expandId === id)
    );
  }

  /** 点标题：开着就收回来，收着就展开（跟悬停无关，永远点得动）。 */
  function toggleEntry(id: string) {
    if (isOpen(id)) {
      setClosedIds((current) =>
        current.includes(id) ? current : [...current, id],
      );
      setOpenIds((current) => current.filter((value) => value !== id));
      setExpandId((current) => (current === id ? null : current));
      return;
    }

    setOpenIds((current) => (current.includes(id) ? current : [...current, id]));
    setClosedIds((current) => current.filter((value) => value !== id));
  }

  /**
   * 点年份导航：左列滚到那一代的开头，右列跟着把这一代第一条的卡片居中。
   * 跳得远时平滑滚动会超过 400ms，这段里的滚动跟随（scrollGuard）得放长一点，
   * 否则动画途中「中线附近那一条」会先抢一次高亮。
   */
  function goToDecade(decade: string, firstId: string | undefined) {
    const pane = listPaneRef.current;
    const section = decadeRefs.current[decade];

    if (!pane || !section) {
      return;
    }

    holdScrollFollow(scrollGuard, 800);
    // 跳代用瞬时滚动：距离上千像素，平滑动画在这种长跳上只是拖时间，
    // 而且一旦动画不跑（后台标签页 / 低功耗）就变成「点了没反应」。
    scrollPaneToShow(pane, section, "start", false);

    if (firstId) {
      activate(firstId, "list", true);
    }
  }

  /** 展开全部 / 收起全部：两个集合一起改，点完不留残留的悬停展开。 */
  function toggleAll() {
    setOpenIds(allOpen ? [] : items.map((item) => item.id));
    setClosedIds(allOpen ? items.map((item) => item.id) : []);
    setExpandId(null);
  }

  /** 滚左列时右列跟着走：中线附近那一条成为当前条目。 */
  function handleListScroll() {
    if (scrollFrame.current) {
      return;
    }
    scrollFrame.current = requestAnimationFrame(() => {
      scrollFrame.current = 0;
      const pane = listPaneRef.current;
      if (!pane) {
        return;
      }
      if (performance.now() < scrollGuard.current) {
        // 程序化滚动还没停：守卫顺延，等它停下来再跟——半路上跟着走会把
        // 指针底下的那条换掉，反而把悬停态抢走。
        holdScrollFollow(scrollGuard, 150);
        return;
      }
      const next = nearestToPaneCenter(pane, listRefs.current);
      if (next && next !== activeId) {
        pendingScroll.current = { from: "list", smooth: false };
        setActiveId(next);
      }
    });
  }

  return (
    <section
      className="alife-timeline"
      aria-label={copy.timelineAria}
      id="alife-timeline"
    >
      <header className="alife-timeline-head">
        <div className="alife-head-lead">
          <p className="alife-eyebrow">{copy.eyebrow}</p>
          {state.status === "ready" ? (
            <span className="alife-count">
              {copy.counts(
                state.catalog.items.length,
                state.catalog.schoolsOrder.length,
              )}
            </span>
          ) : null}
        </div>

        <a className="alife-museum-link" href={ALIFE_MUSEUM_URL}>
          {copy.openMuseum}
          <span aria-hidden="true">↗</span>
        </a>
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
              <span className="alife-column-title">{copy.timelineLabel}</span>
              <button
                type="button"
                className="alife-head-toggle"
                aria-pressed={allOpen}
                onClick={toggleAll}
              >
                {allOpen ? copy.collapseAll : copy.expandAll}
              </button>
            </header>

            <div className="alife-timeline-split">
              <nav className="alife-year-rail" aria-label={copy.decadeNav}>
                {groups.map(([decade, group]) => (
                  <button
                    type="button"
                    key={decade}
                    className={decade === activeDecade ? "is-active" : undefined}
                    aria-current={decade === activeDecade ? "true" : undefined}
                    onClick={() => goToDecade(decade, group[0]?.id)}
                  >
                    <span>{decade}</span>
                    <small>{group.length}</small>
                  </button>
                ))}
              </nav>

              <div
                className="alife-timeline-body"
                ref={listPaneRef}
                onScroll={handleListScroll}
              >
                {groups.map(([decade, group]) => (
                  <section
                    className="alife-decade"
                    key={decade}
                    ref={(node) => {
                      decadeRefs.current[decade] = node;
                    }}
                  >
                    <h2 className="alife-decade-label">
                      <span>{decade}</span>
                    </h2>
                    <ol className="alife-entry-list">
                      {group.map((item) => (
                        <AlifeEntry
                          key={item.id}
                          item={item}
                          lang={lang}
                          open={isOpen(item.id)}
                          active={activeId === item.id}
                          onActivate={() => activate(item.id, "list", false)}
                          onExpand={() => expandByHover(item.id, "list")}
                          onCollapseHover={() =>
                            setExpandId((current) => (current === item.id ? null : current))
                          }
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
          </div>

          <AlifeCardWall
            lang={lang}
            items={items}
            schoolsOrder={state.catalog.schoolsOrder}
            activeId={activeId}
            cardRefs={cardRefs}
            paneRef={wallPaneRef}
            onActivate={(id) => expandByHover(id, "wall")}
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
  onExpand,
  onCollapseHover,
  onToggle,
  registerRef,
}: {
  item: AlifeItem;
  lang: Lang;
  open: boolean;
  active: boolean;
  onActivate: () => void;
  onExpand: () => void;
  onCollapseHover: () => void;
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
      // 悬停展开是临时的：指针离开这一条就收回去（点过的除外）。
      onMouseLeave={onCollapseHover}
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
          <span className="alife-entry-year">{item.year}</span>

          <span className="alife-entry-title">
            <strong>{item.name}</strong>
            {item.nameEn ? <small>{item.nameEn}</small> : null}
          </span>

          <span className="alife-entry-meta">
            {/* 年份注记跟标签同行：塞进年份格会把整行撑高，行高就参差了。 */}
            {item.yearNote ? (
              <span className="alife-entry-note">{item.yearNote}</span>
            ) : null}
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

          {/* 悬停这个「+」就展开说明牌；只停在标题上只做联动。 */}
          <span
            className="alife-entry-chevron"
            aria-hidden="true"
            onMouseEnter={onExpand}
          />
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
