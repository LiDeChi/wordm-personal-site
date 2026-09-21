import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Lang } from "../i18n/lang";
import {
  ALIFE_COPY,
  ALIFE_MUSEUM_URL,
  alifeAssetUrl,
  alifeDemoKind,
  alifeDemoPreviewUrl,
  alifeSchoolColor,
  isOwnWork,
  loadAlifeCatalog,
  type AlifeCatalog,
  type AlifeItem,
} from "../data/alifeHistory";
import { AlifeItemDetail } from "./AlifeItemDetail";
import "./AlifeGallery.css";

/**
 * 人工生命史卡片墙：左边是项目索引和选中条目的说明，右边是展览的画廊卡片。
 *
 * 两边是同一份 catalog（/alife/data/catalog.json），交互是双向的：
 * 指针停在卡片上 → 左边换成那张卡片的说明；指针停在索引行上 → 右边把那张卡片带进视野。
 */

type GalleryProps = {
  lang: Lang;
};

type State =
  | { status: "loading" }
  | { status: "ready"; catalog: AlifeCatalog }
  | { status: "failed" };

/** 稳定引用：没有数据时用它，避免每次渲染都新建数组。 */
const NO_ITEMS: AlifeItem[] = [];

export function AlifeGallery({ lang }: GalleryProps) {
  const copy = ALIFE_COPY[lang];
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  /** 谁发起的选中；滚动要对准另一列。 */
  const pendingScroll = useRef<"index" | "card" | null>(null);
  const indexRefs = useRef<Record<string, HTMLLIElement | null>>({});
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

  const catalog = state.status === "ready" ? state.catalog : null;
  const items = catalog ? catalog.items : NO_ITEMS;
  // 落地时左边不能是空的：没选中就站在第一条上（派生，不进 effect）。
  const activeId =
    selectedId && items.some((item) => item.id === selectedId)
      ? selectedId
      : (items[0]?.id ?? null);

  // 同步滚动要等渲染完：行展开会改变左侧高度，先滚会滚偏。
  useEffect(() => {
    const from = pendingScroll.current;
    if (!from || !activeId) {
      return;
    }
    pendingScroll.current = null;
    const target =
      from === "index" ? cardRefs.current[activeId] : indexRefs.current[activeId];
    target?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [activeId]);

  function activate(id: string, from: "index" | "card") {
    if (id === activeId) {
      return;
    }
    pendingScroll.current = from;
    setSelectedId(id);
  }

  return (
    <section className="alife-gallery" id="alife-gallery">
      <header className="alife-gallery-head">
        <p className="alife-eyebrow">{copy.wallEyebrow}</p>
        <h2>{copy.wallTitle}</h2>
        <p className="alife-gallery-lead">{copy.wallLead}</p>
      </header>

      {state.status === "loading" ? (
        <p className="alife-gallery-status" role="status">
          {copy.loading}
        </p>
      ) : null}

      {state.status === "failed" ? (
        <p className="alife-gallery-status is-failed" role="alert">
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
        <div className="alife-gallery-layout">
          <aside className="alife-gallery-index" aria-label={copy.wallIndexLabel}>
            <header className="alife-gallery-panel-head">
              <span className="alife-field-label">{copy.wallIndexLabel}</span>
              <span className="alife-gallery-count">
                {String(items.length).padStart(2, "0")}
              </span>
            </header>

            <ol className="alife-index-list">
              {items.map((item, index) => {
                const isActive = activeId === item.id;
                const panelId = `alife-index-detail-${item.id}`;
                const demoKind = alifeDemoKind(item);

                return (
                  <li
                    className={`alife-index-item${isActive ? " is-active" : ""}`}
                    key={item.id}
                    ref={(node) => {
                      indexRefs.current[item.id] = node;
                    }}
                  >
                    <button
                      type="button"
                      className="alife-index-button"
                      aria-expanded={isActive}
                      aria-controls={panelId}
                      onMouseEnter={() => activate(item.id, "index")}
                      onFocus={() => activate(item.id, "index")}
                      onClick={() => activate(item.id, "index")}
                    >
                      <span className="alife-index-number" aria-hidden="true">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="alife-index-name">
                        {item.name}
                        {item.nameEn ? <small>{item.nameEn}</small> : null}
                      </span>
                      <span className="alife-index-year">{item.year}</span>
                      <span className="alife-index-schools">
                        {item.schools.join(" · ")}
                      </span>
                      <span className="alife-index-badges">
                        {isOwnWork(item) ? (
                          <span className="alife-badge is-own">{copy.ownWork}</span>
                        ) : null}
                        {demoKind === "runnable" ? (
                          <span className="alife-badge is-demo">{copy.demoBadge}</span>
                        ) : null}
                        {demoKind === "link" ? (
                          <span className="alife-badge is-link-demo">
                            {copy.linkDemoBadge}
                          </span>
                        ) : null}
                      </span>
                    </button>

                    {isActive ? (
                      <div className="alife-index-detail" id={panelId}>
                        <AlifeItemDetail item={item} lang={lang} />
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </aside>

          <section className="alife-gallery-wall" aria-label={copy.wallGalleryLabel}>
            <header className="alife-gallery-panel-head">
              <span className="alife-field-label">{copy.wallGalleryLabel}</span>
              <span className="alife-gallery-hint" aria-hidden="true">
                {copy.wallGalleryHint}
              </span>
            </header>

            <ul className="alife-wall-grid">
              {items.map((item) => {
                const isActive = activeId === item.id;
                const demoKind = alifeDemoKind(item);
                const demoPreview =
                  demoKind === "runnable" ? alifeDemoPreviewUrl(item.demo) : null;
                // 展览的卡片也是这么挑的：只挂真实人像文件，data: 兜底头像不上墙。
                const leadPhotos = (item.leads ?? [])
                  .filter((lead) => (lead.photo ?? "").startsWith("assets/photos/"))
                  .slice(0, 3)
                  .map((lead) => ({ name: lead.name, src: alifeAssetUrl(lead.photo) }))
                  .filter(
                    (lead): lead is { name: string; src: string } => Boolean(lead.src),
                  );

                return (
                  <li
                    className={`alife-wall-cell${isActive ? " is-active" : ""}`}
                    key={item.id}
                    ref={(node) => {
                      cardRefs.current[item.id] = node;
                    }}
                  >
                    <button
                      type="button"
                      className="alife-card"
                      style={
                        {
                          "--card-accent": alifeSchoolColor(
                            item.schools[0] ?? "",
                            state.catalog.schoolsOrder,
                          ),
                        } as CSSProperties
                      }
                      aria-pressed={isActive}
                      onMouseEnter={() => activate(item.id, "card")}
                      onFocus={() => activate(item.id, "card")}
                      onClick={() => activate(item.id, "card")}
                    >
                      <span className="alife-card-cover" aria-hidden="true">
                        {demoPreview ? (
                          <img
                            className="alife-card-thumb"
                            src={demoPreview}
                            alt=""
                            loading="lazy"
                            decoding="async"
                          />
                        ) : null}
                        {demoKind === "runnable" ? (
                          <span className="alife-card-demo">{copy.demoBadge}</span>
                        ) : null}
                        {leadPhotos.length ? (
                          <span className="alife-card-leads">
                            {leadPhotos.map((lead) => (
                              <img
                                className="alife-card-lead"
                                key={`${item.id}-${lead.name}`}
                                src={lead.src}
                                alt=""
                                title={lead.name}
                                loading="lazy"
                                decoding="async"
                              />
                            ))}
                          </span>
                        ) : null}
                      </span>

                      <span className="alife-card-body">
                        <span className="alife-card-year">
                          {item.year}
                          {item.yearNote ? ` · ${item.yearNote}` : ""}
                        </span>
                        <span className="alife-card-name">{item.name}</span>
                        {item.nameEn ? (
                          <span className="alife-card-en">{item.nameEn}</span>
                        ) : null}
                        <span className="alife-card-schools">
                          {item.schools.slice(0, 3).map((school) => (
                            <span
                              className="alife-school-pill"
                              key={`${item.id}-${school}`}
                              style={
                                {
                                  "--pill": alifeSchoolColor(
                                    school,
                                    state.catalog.schoolsOrder,
                                  ),
                                } as CSSProperties
                              }
                            >
                              {school}
                            </span>
                          ))}
                          {isOwnWork(item) ? (
                            <span className="alife-badge is-own">{copy.ownWork}</span>
                          ) : null}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      ) : null}

      {state.status === "ready" ? (
        <p className="alife-gallery-foot">
          <span>
            {copy.counts(items.length, state.catalog.schoolsOrder.length)}
          </span>
          <a href={ALIFE_MUSEUM_URL}>
            {copy.openMuseum}
            <span aria-hidden="true">↗</span>
          </a>
        </p>
      ) : null}
    </section>
  );
}

export default AlifeGallery;
