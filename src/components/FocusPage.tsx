import { useEffect, useRef, useState } from "react";
import type { Lang } from "../i18n/lang";
import {
  FAMILY_PROJECTS,
  FAMILY_SOURCE_LABEL,
  FAMILY_STATUS_LABELS,
  FAMILY_TAG_LABELS,
  FAMILY_THESIS,
} from "../data/mindFamily";
import { AlifeTimeline } from "./AlifeTimeline";
import "./FocusPage.css";

/**
 * 关注方向 / Focus
 *
 * 一页到底：上面是人工生命史时间轴（渐进式披露），下面是项目索引和画廊。
 * 两边使用同一份项目顺序，索引悬停时能直接定位右侧卡片。
 */

type FocusCopy = {
  projectsLabel: string;
  projectsTitle: string;
  projectsLead: string;
  projectIndexLabel: string;
  projectIndexAria: string;
  galleryLabel: string;
  galleryAria: string;
  tipLabel: string;
  entryLabel: string;
  repoLabel: string;
  tagsAria: string;
};

const COPY: Record<Lang, FocusCopy> = {
  zh: {
    projectsLabel: "项目",
    projectsTitle: "同一个方向上的十六件东西",
    projectsLead:
      "人工生命和机器心智在这里不分开摆。每张卡片的标签标出它偏向哪一类，按自己的兴趣顺着看就行。",
    projectIndexLabel: "项目索引",
    projectIndexAria: "项目索引",
    galleryLabel: "画廊",
    galleryAria: "项目画廊",
    tipLabel: "提示",
    entryLabel: "运行",
    repoLabel: "仓库",
    tagsAria: "项目标签",
  },
  en: {
    projectsLabel: "Projects",
    projectsTitle: "Sixteen things on the same direction",
    projectsLead:
      "Artificial life and machine minds are not filed apart here. The tags say which way each card leans; follow whichever interests you.",
    projectIndexLabel: "Project index",
    projectIndexAria: "Project index",
    galleryLabel: "Gallery",
    galleryAria: "Project gallery",
    tipLabel: "Tip",
    entryLabel: "Run",
    repoLabel: "Repo",
    tagsAria: "Project tags",
  },
};

export function FocusPage({ lang }: { lang: Lang }) {
  const copy = COPY[lang];
  const [activeProjectKey, setActiveProjectKey] = useState<string | null>(null);
  const galleryCardRefs = useRef<Record<string, HTMLLIElement | null>>({});

  useEffect(() => {
    if (!activeProjectKey) {
      return;
    }

    galleryCardRefs.current[activeProjectKey]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeProjectKey]);

  return (
    <section className="focus-page">
      <AlifeTimeline lang={lang} />

      <section className="focus-projects" id="focus-projects">
        <header className="focus-projects-head">
          <span className="focus-label">{copy.projectsLabel}</span>
          <h2>{copy.projectsTitle}</h2>
          <p>{copy.projectsLead}</p>
          <p className="focus-thesis">{FAMILY_THESIS[lang]}</p>
        </header>

        <div className="focus-projects-layout">
          <aside className="focus-project-index" aria-label={copy.projectIndexAria}>
            <header className="focus-project-panel-head">
              <span className="focus-panel-label">{copy.projectIndexLabel}</span>
              <span className="focus-panel-count">
                {String(FAMILY_PROJECTS.length).padStart(2, "0")}
              </span>
            </header>

            <ol className="focus-project-list">
              {FAMILY_PROJECTS.map((project, index) => {
                const tipId = `focus-project-tip-${project.key}`;
                const isActive = activeProjectKey === project.key;

                return (
                  <li
                    className={`focus-project-list-item${isActive ? " is-active" : ""}`}
                    key={project.key}
                  >
                    <button
                      className="focus-project-list-button"
                      type="button"
                      title={`${project.summary[lang]} · ${project.kind[lang]}`}
                      aria-describedby={isActive ? tipId : undefined}
                      aria-pressed={isActive}
                      onMouseEnter={() => setActiveProjectKey(project.key)}
                      onFocus={() => setActiveProjectKey(project.key)}
                    >
                      <span className="focus-project-list-number" aria-hidden="true">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="focus-project-list-name">
                        {project.name}
                        {project.latin ? <small>{project.latin}</small> : null}
                      </span>
                      <span className={`focus-card-status is-${project.status}`}>
                        {FAMILY_STATUS_LABELS[project.status][lang]}
                      </span>
                      <span className="focus-project-list-tags">
                        {project.tags.map((tag) => FAMILY_TAG_LABELS[tag][lang]).join(" · ")}
                      </span>
                      <span className="focus-project-list-arrow" aria-hidden="true">
                        ↗
                      </span>
                    </button>
                    <span className="focus-project-list-tip" id={tipId} role="tooltip">
                      <strong>{copy.tipLabel}</strong>
                      <span>{project.summary[lang]}</span>
                      <small>{project.kind[lang]}</small>
                    </span>
                  </li>
                );
              })}
            </ol>
          </aside>

          <section className="focus-project-gallery" aria-label={copy.galleryAria}>
            <header className="focus-project-panel-head">
              <span className="focus-panel-label">{copy.galleryLabel}</span>
              <span className="focus-panel-hint" aria-hidden="true">
                ← → scroll
              </span>
            </header>

            <ul className="focus-gallery-track">
              {FAMILY_PROJECTS.map((project) => {
                const isActive = activeProjectKey === project.key;

                return (
                  <li
                    className={`focus-card focus-gallery-card${isActive ? " is-highlighted" : ""}`}
                    key={project.key}
                    id={`project-${project.key}`}
                    ref={(node) => {
                      galleryCardRefs.current[project.key] = node;
                    }}
                    onMouseEnter={() => setActiveProjectKey(project.key)}
                    onFocus={() => setActiveProjectKey(project.key)}
                  >
                    <div className="focus-card-head">
                      <h3>
                        {project.name}
                        {project.latin ? <small>{project.latin}</small> : null}
                      </h3>
                      <span className={`focus-card-status is-${project.status}`}>
                        {FAMILY_STATUS_LABELS[project.status][lang]}
                      </span>
                    </div>

                    <ul className="focus-tags" aria-label={copy.tagsAria}>
                      {project.tags.map((tag) => (
                        <li key={tag} data-tag={tag}>
                          {FAMILY_TAG_LABELS[tag][lang]}
                        </li>
                      ))}
                    </ul>

                    <p className="focus-card-summary">{project.summary[lang]}</p>
                    <p className="focus-card-kind">
                      {project.kind[lang]}
                      {project.entry ? (
                        <>
                          <span aria-hidden="true"> · </span>
                          <span className="focus-card-inline-entry">
                            {copy.entryLabel} <code>{project.entry}</code>
                          </span>
                        </>
                      ) : null}
                    </p>

                    {project.repoUrl ? (
                      <a
                        className="focus-card-repo"
                        href={project.repoUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {copy.repoLabel}
                        <span aria-hidden="true">↗</span>
                      </a>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <p className="focus-source">{FAMILY_SOURCE_LABEL[lang]}</p>
      </section>
    </section>
  );
}

export default FocusPage;
