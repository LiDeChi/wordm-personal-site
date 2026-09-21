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
 * 一页到底：上面是人工生命史时间轴（渐进式披露），下面是项目卡片。
 * 人工生命和机器心智的项目混在同一张列表里，只用标签区分，不做筛选。
 */

type FocusCopy = {
  projectsLabel: string;
  projectsTitle: string;
  projectsLead: string;
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
    entryLabel: "运行",
    repoLabel: "仓库",
    tagsAria: "项目标签",
  },
  en: {
    projectsLabel: "Projects",
    projectsTitle: "Sixteen things on the same direction",
    projectsLead:
      "Artificial life and machine minds are not filed apart here. The tags say which way each card leans; follow whichever interests you.",
    entryLabel: "Run",
    repoLabel: "Repo",
    tagsAria: "Project tags",
  },
};

export function FocusPage({ lang }: { lang: Lang }) {
  const copy = COPY[lang];

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

        <ul className="focus-card-grid">
          {FAMILY_PROJECTS.map((project) => (
            <li
              className="focus-card"
              key={project.key}
              id={`project-${project.key}`}
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
          ))}
        </ul>

        <p className="focus-source">{FAMILY_SOURCE_LABEL[lang]}</p>
      </section>
    </section>
  );
}

export default FocusPage;
