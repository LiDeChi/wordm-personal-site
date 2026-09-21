import type { CSSProperties, RefObject } from "react";
import type { Lang } from "../i18n/lang";
import {
  ALIFE_COPY,
  alifeAssetUrl,
  alifeDemoKind,
  alifeDemoPreviewUrl,
  alifeSchoolColor,
  isOwnWork,
  type AlifeItem,
} from "../data/alifeHistory";
import "./AlifeCardWall.css";

/**
 * 时间轴的右列：展览的画廊卡片。
 *
 * 卡片与展览里的一致（年份 / 中英文名 / 流派 pill / 可演示角标 / 静态预览封面 / 人物小头像），
 * 但首页只挂 `assets/previews/` 里的静态图，不在这里起 canvas demo。
 * 数据由父组件（AlifeTimeline）统一加载，选中状态也由父组件持有。
 */
export function AlifeCardWall({
  lang,
  items,
  schoolsOrder,
  activeId,
  cardRefs,
  onActivate,
}: {
  lang: Lang;
  items: AlifeItem[];
  schoolsOrder: string[];
  activeId: string | null;
  cardRefs: RefObject<Record<string, HTMLLIElement | null>>;
  onActivate: (id: string) => void;
}) {
  const copy = ALIFE_COPY[lang];

  return (
    <section className="alife-column alife-card-wall" aria-label={copy.galleryLabel}>
      <header className="alife-column-head">
        <span className="alife-field-label">{copy.galleryLabel}</span>
        <span className="alife-column-hint" aria-hidden="true">
          {copy.galleryHint}
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
            .filter((lead): lead is { name: string; src: string } => Boolean(lead.src));

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
                    "--card-accent": alifeSchoolColor(item.schools[0] ?? "", schoolsOrder),
                  } as CSSProperties
                }
                aria-pressed={isActive}
                onMouseEnter={() => onActivate(item.id)}
                onFocus={() => onActivate(item.id)}
                onClick={() => onActivate(item.id)}
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
                            "--pill": alifeSchoolColor(school, schoolsOrder),
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
  );
}

export default AlifeCardWall;
