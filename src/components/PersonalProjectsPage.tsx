import { useState } from "react";
import type { Lang } from "../i18n/lang";
import { FOUNT_FIELDS, type FountField } from "../data/fountFields";
import {
  FAMILY_PROJECTS,
  FAMILY_SOURCE_LABEL,
  FAMILY_STATUS_LABELS,
  FAMILY_TAG_LABELS,
  type FamilyProject,
} from "../data/mindFamily";
import { withSiteParams } from "../lib/lang-url";
import "./PersonalProjectsPage.css";

/**
 * 「个人项目」页：只摆两类东西——已经上线、能点进去的作品，以及人工生命的实验。
 *
 * 作品取自 `FOUNT_FIELDS`（Flipook / MuseumBook / RingBook / 诗经长卷 …），
 * 实验取自 `mind-society` 登记表里带 `alife` 标签的成员（`FAMILY_PROJECTS`）。
 * 工作区里其余仓库不进这一页：站点只呈现本人收口过的清单。
 */

const SYSTEM_SITE_URL = "https://system.wordm.us";

/** 已经作为作品出现过的 key（例如 town / Town Agents），实验区不重复铺一遍。 */
const WORK_KEYS: Record<string, true> = Object.fromEntries(
  FOUNT_FIELDS.map((field) => [field.key, true]),
);

const EXPERIMENTS: FamilyProject[] = FAMILY_PROJECTS.filter(
  (project) => project.tags.includes("alife") && !WORK_KEYS[project.key],
);

const COPY = {
  zh: {
    systemCoverDomain: "system.wordm.us",
    systemCoverTitle: "System",
    systemCoverSubtitle:
      "架构图、Core / WCP / Apps 关系，以及开源 Core 源码入口都在这里。",
    systemCoverCta: "进入 System",
    workMeta: "产品与作品",
    workCount: (count: number) => `${count} 个已上线入口`,
    workPreview: "预览页面",
    workOpen: "打开",
    experimentsMeta: "实验",
    experimentsTitle: "人工生命的实验",
    experimentsIntro:
      "这些还没有公开入口，都在本机跑：规则是身体里可以搬动、复制、重接的结构；解释器可以把时钟接过来；史料只给一半，看世界自己往哪儿长。",
    experimentsCount: (count: number) => `${count} 个实验`,
    experimentRepo: "查看仓库",
    experimentLocalOnly: "本机运行",
  },
  en: {
    systemCoverDomain: "system.wordm.us",
    systemCoverTitle: "System",
    systemCoverSubtitle:
      "Architecture, Core / WCP / Apps, and the open Core source live here.",
    systemCoverCta: "Enter System",
    workMeta: "Products & work",
    workCount: (count: number) => `${count} live entries`,
    workPreview: "Page preview",
    workOpen: "Open",
    experimentsMeta: "Experiments",
    experimentsTitle: "Artificial-life experiments",
    experimentsIntro:
      "These have no public entry yet and run locally: rules are structures you can move, copy, and rewire inside a body; the interpreter can take over the clock; and the chronicle is cut in half to watch a world grow on its own.",
    experimentsCount: (count: number) => `${count} experiments`,
    experimentRepo: "Repository",
    experimentLocalOnly: "Runs locally",
  },
} as const;

/** 视频类条目（论文讲解）本身就是文件，不加 lang 参数，也不做 iframe 预览。 */
function fieldHref(field: FountField, lang: Lang) {
  return field.embedType === "video"
    ? field.href
    : withSiteParams(field.href, { lang });
}

export function PersonalProjectsPage({ lang }: { lang: Lang }) {
  const copy = COPY[lang];
  const [previewKey, setPreviewKey] = useState<string | null>(null);

  return (
    <>
      <section
        className="fount-body-section personal-work-section"
        aria-labelledby="personal-work-title"
      >
        <div className="personal-projects-lead">
          <p className="paper-meta" id="personal-work-title">
            {copy.workMeta}
          </p>
          <span className="personal-projects-count">
            {copy.workCount(FOUNT_FIELDS.length)}
          </span>
        </div>

        <div className="home-projects-hero">
          <a
            className="system-cover-portal"
            href={withSiteParams(SYSTEM_SITE_URL, { lang })}
            target="_blank"
            rel="noreferrer"
            aria-label={copy.systemCoverCta}
          >
            <span className="system-cover-bg" aria-hidden="true" />
            <span
              className="system-cover-current system-cover-current-a"
              aria-hidden="true"
            />
            <span
              className="system-cover-current system-cover-current-b"
              aria-hidden="true"
            />
            <span className="system-cover-gate" aria-hidden="true" />
            <span className="system-cover-grid" aria-hidden="true" />
            <span className="system-cover-orbit" aria-hidden="true" />
            <span className="system-cover-copy">
              <span className="system-cover-domain">
                {copy.systemCoverDomain}
              </span>
              <span className="system-cover-title">{copy.systemCoverTitle}</span>
              <span className="system-cover-subtitle">
                {copy.systemCoverSubtitle}
              </span>
              <span className="system-cover-cta">
                {copy.systemCoverCta}
                <span aria-hidden="true">→</span>
              </span>
            </span>
          </a>

          <div className="home-projects-grid">
            {FOUNT_FIELDS.map((field, index) => {
              const href = fieldHref(field, lang);
              const isVideo = field.embedType === "video";

              return (
                <article className="home-project-card" key={field.key}>
                  <div
                    className="home-project-cover"
                    role="group"
                    aria-label={`${copy.workPreview}: ${field.name}`}
                    onMouseEnter={() => setPreviewKey(field.key)}
                    onMouseLeave={() =>
                      setPreviewKey((current) =>
                        current === field.key ? null : current,
                      )
                    }
                    onFocusCapture={() => setPreviewKey(field.key)}
                    onBlurCapture={() =>
                      setPreviewKey((current) =>
                        current === field.key ? null : current,
                      )
                    }
                  >
                    <img
                      src={field.coverUrl}
                      alt={field.coverAlt[lang]}
                      loading={index > 1 ? "lazy" : "eager"}
                      decoding="async"
                    />
                    {isVideo ? null : (
                      <div className="home-project-preview" aria-hidden="true">
                        <span className="home-project-preview-chrome">
                          <span className="home-project-preview-dots">
                            <span />
                            <span />
                            <span />
                          </span>
                          <span className="home-project-preview-url">
                            {field.previewUrl}
                          </span>
                        </span>
                        {previewKey === field.key ? (
                          <iframe
                            className="home-project-preview-frame"
                            title={`${field.name} ${copy.workPreview}`}
                            src={href}
                            loading="lazy"
                            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                            referrerPolicy="no-referrer-when-downgrade"
                          />
                        ) : null}
                      </div>
                    )}
                  </div>
                  <div className="home-project-card-body">
                    <div>
                      <h3>{field.name}</h3>
                      <span className="personal-work-kind">
                        {field.kind[lang]}
                      </span>
                    </div>
                    <p>{field.summary[lang]}</p>
                    <div className="home-project-actions">
                      <a
                        className="home-project-cta"
                        href={href}
                        target={field.href.startsWith("http") ? "_blank" : undefined}
                        rel={
                          field.href.startsWith("http") ? "noreferrer" : undefined
                        }
                      >
                        {copy.workOpen}
                        <span aria-hidden="true">→</span>
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section
        className="fount-body-section personal-experiments-section"
        aria-labelledby="personal-experiments-title"
      >
        <div className="personal-projects-lead">
          <p className="paper-meta">{copy.experimentsMeta}</p>
          <span className="personal-projects-count">
            {copy.experimentsCount(EXPERIMENTS.length)}
          </span>
        </div>

        <div className="personal-experiments-copy">
          <h2 id="personal-experiments-title">{copy.experimentsTitle}</h2>
          <p>{copy.experimentsIntro}</p>
          <p className="personal-projects-source">{FAMILY_SOURCE_LABEL[lang]}</p>
        </div>

        <div className="personal-experiment-grid">
          {EXPERIMENTS.map((project) => (
            <article className="personal-experiment-card" key={project.key}>
              <header className="personal-experiment-head">
                <h3>{project.name}</h3>
                {project.latin ? (
                  <span className="personal-experiment-latin">
                    {project.latin}
                  </span>
                ) : null}
              </header>

              <p className="personal-experiment-meta">
                <span>{project.kind[lang]}</span>
                <span
                  className="personal-experiment-status"
                  data-status={project.status}
                >
                  {FAMILY_STATUS_LABELS[project.status][lang]}
                </span>
              </p>

              <p className="personal-experiment-summary">
                {project.summary[lang]}
              </p>

              <p className="personal-experiment-tags">
                {project.tags.map((tag) => (
                  <span className="personal-experiment-tag" key={tag}>
                    {FAMILY_TAG_LABELS[tag][lang]}
                  </span>
                ))}
              </p>

              <div className="personal-experiment-actions">
                {project.repoUrl ? (
                  <a href={project.repoUrl} target="_blank" rel="noreferrer">
                    {copy.experimentRepo}
                    <span aria-hidden="true">→</span>
                  </a>
                ) : (
                  <span className="personal-experiment-local">
                    {copy.experimentLocalOnly}
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
