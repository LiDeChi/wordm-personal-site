import type { Lang } from "../i18n/lang";
import {
  ALIFE_COPY,
  ALIFE_MUSEUM_URL,
  alifeAssetUrl,
  alifeDemoKind,
  alifeDemoPreviewUrl,
  alifeItemLinks,
  alifeLeadUrl,
  type AlifeItem,
} from "../data/alifeHistory";
import "./AlifeItemDetail.css";

/**
 * 展览条目的详情块。
 *
 * 时间轴展开的条目、卡片墙左侧的说明牌都用这一份，字段与展览的 tips 面板对齐：
 * 介质 / 团队 / 参考 → 人物 → 机制（生命构建方式）→ 谱系 → 边界 → demo → 链接。
 * 两处共用同一组件，避免 catalog 字段变了只改一边。
 */
export function AlifeItemDetail({ item, lang }: { item: AlifeItem; lang: Lang }) {
  const copy = ALIFE_COPY[lang];
  const demoKind = alifeDemoKind(item);
  const demoPreview = demoKind === "runnable" ? alifeDemoPreviewUrl(item.demo) : null;
  const links = alifeItemLinks(item, { site: copy.leadSite, scholar: copy.leadScholar });
  // catalog 里 team 有字符串和数组两种形态，22 / 19 开。
  const team = item.team
    ? Array.isArray(item.team)
      ? item.team.join(" · ")
      : item.team
    : null;

  return (
    <div className="alife-detail">
      {item.summary ? <p className="alife-summary">{item.summary}</p> : null}

      {item.medium?.length || team || item.refs?.length ? (
        <dl className="alife-facts">
          {item.medium?.length ? (
            <>
              <dt>{copy.mediumLabel}</dt>
              <dd>{item.medium.join(" · ")}</dd>
            </>
          ) : null}
          {team ? (
            <>
              <dt>{copy.teamLabel}</dt>
              <dd>{team}</dd>
            </>
          ) : null}
          {item.refs?.length ? (
            <>
              <dt>{copy.refs}</dt>
              <dd>{item.refs.join(" · ")}</dd>
            </>
          ) : null}
        </dl>
      ) : null}

      {item.leads?.length ? (
        <div className="alife-people">
          <span className="alife-field-label">{copy.people}</span>
          <ul>
            {item.leads.map((lead) => {
              const href = alifeLeadUrl(lead);
              const photo = alifeAssetUrl(lead.photo);
              return (
                <li key={`${item.id}-${lead.name}`}>
                  {photo ? (
                    <img
                      src={photo}
                      alt={lead.name}
                      loading="lazy"
                      decoding="async"
                      width={48}
                      height={60}
                    />
                  ) : (
                    <span className="alife-person-monogram" aria-hidden="true">
                      {lead.name.slice(0, 1)}
                    </span>
                  )}
                  <span className="alife-person-copy">
                    {href ? (
                      <a href={href} target="_blank" rel="noreferrer">
                        {lead.name}
                      </a>
                    ) : (
                      <strong>{lead.name}</strong>
                    )}
                    {lead.role ? <small>{lead.role}</small> : null}
                    {lead.photoNote ? <small>{lead.photoNote}</small> : null}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {item.construction ? (
        <div className="alife-field">
          <span className="alife-field-label">{copy.mechanism}</span>
          <p>{item.construction}</p>
        </div>
      ) : null}

      {item.lineage ? (
        <div className="alife-field">
          <span className="alife-field-label">{copy.lineage}</span>
          <p>{item.lineage}</p>
        </div>
      ) : null}

      {item.limits ? (
        <div className="alife-field">
          <span className="alife-field-label">{copy.limits}</span>
          <p>{item.limits}</p>
        </div>
      ) : null}

      {demoKind ? (
        <div className="alife-demo">
          {demoPreview ? (
            <img
              src={demoPreview}
              alt=""
              loading="lazy"
              decoding="async"
              width={160}
              height={90}
            />
          ) : null}
          <div>
            {item.demoHint ? <p>{item.demoHint}</p> : null}
            <a href={ALIFE_MUSEUM_URL}>
              {copy.openDemo}
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      ) : null}

      {!demoKind && item.demoHint ? (
        <div className="alife-field alife-demo-note">
          <span className="alife-field-label">{copy.demoNotes}</span>
          <p>{item.demoHint}</p>
        </div>
      ) : null}

      {links.length ? (
        <div className="alife-field">
          <span className="alife-field-label">{copy.links}</span>
          <ul className="alife-links">
            {links.map((link) => (
              <li key={`${item.id}-${link.url}`}>
                <a href={link.url} target="_blank" rel="noreferrer">
                  {link.label}
                  <span aria-hidden="true">↗</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {demoKind ? null : (
        <p className="alife-detail-open">
          <a href={ALIFE_MUSEUM_URL}>
            {copy.openEntry}
            <span aria-hidden="true">↗</span>
          </a>
        </p>
      )}
    </div>
  );
}

export default AlifeItemDetail;
