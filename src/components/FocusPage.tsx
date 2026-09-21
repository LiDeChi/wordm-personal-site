import type { Lang } from "../i18n/lang";
import {
  FAMILY_PROJECTS,
  FAMILY_SOURCE_LABEL,
  FAMILY_STAGES,
  FAMILY_STATUS_LABELS,
  FAMILY_TAG_LABELS,
  FAMILY_THESIS,
  type FamilyProject,
} from "../data/mindFamily";
import "./FocusPage.css";

/**
 * 关注方向 / Focus
 *
 * 一条时间轴（带一段话）+ 一屏项目卡片。人工生命和机器心智的项目混在同一
 * 张卡片列表里，只用标签区分，不做筛选、不做文章页。
 */

type FocusCopy = {
  eyebrow: string;
  title: string;
  timelineLabel: string;
  timelineAria: string;
  projectsLabel: string;
  projectsTitle: string;
  projectsLead: string;
  entryLabel: string;
  repoLabel: string;
  stageMembers: string;
};

const COPY: Record<Lang, FocusCopy> = {
  zh: {
    eyebrow: "关注方向",
    title: "人工生命与机器心智",
    timelineLabel: "时间轴",
    timelineAria: "关注方向时间轴",
    projectsLabel: "项目",
    projectsTitle: "同一个方向上的十六件东西",
    projectsLead:
      "人工生命和机器心智在这里不分开摆。每张卡片的标签标出它偏向哪一类，按自己的兴趣顺着看就行。",
    entryLabel: "运行",
    repoLabel: "仓库",
    stageMembers: "这一段的成员",
  },
  en: {
    eyebrow: "Focus",
    title: "Artificial Life & Machine Minds",
    timelineLabel: "Timeline",
    timelineAria: "Focus timeline",
    projectsLabel: "Projects",
    projectsTitle: "Sixteen things on the same direction",
    projectsLead:
      "Artificial life and machine minds are not filed apart here. The tags say which way each card leans; follow whichever interests you.",
    entryLabel: "Run",
    repoLabel: "Repo",
    stageMembers: "In this stage",
  },
};

const PROJECT_BY_KEY = new Map(
  FAMILY_PROJECTS.map((project) => [project.key, project]),
);

function stageProjects(keys: string[]): FamilyProject[] {
  return keys
    .map((key) => PROJECT_BY_KEY.get(key))
    .filter((project): project is FamilyProject => Boolean(project));
}

type FocusPageProps = {
  lang: Lang;
};

export function FocusPage({ lang }: FocusPageProps) {
  const copy = COPY[lang];

  return (
    <section className="focus-page">
      <header className="focus-hero">
        <p className="focus-eyebrow">{copy.eyebrow}</p>
        <h1>{copy.title}</h1>
      </header>

      <section
        className="focus-timeline"
        aria-label={copy.timelineAria}
        id="focus-timeline"
      >
        <div className="focus-timeline-head">
          <span className="focus-label">{copy.timelineLabel}</span>
          {/* 时间轴本身要带一段话：整条方向的共同命题。 */}
          <p className="focus-thesis">{FAMILY_THESIS[lang]}</p>
        </div>

        <ol className="focus-timeline-list">
          {FAMILY_STAGES.map((stage, index) => (
            <li className="focus-stage" key={stage.key}>
              <div className="focus-stage-rail" aria-hidden="true">
                <span>{String(index + 1).padStart(2, "0")}</span>
              </div>
              <div className="focus-stage-body">
                <p className="focus-stage-label">{stage.label[lang]}</p>
                <h2>{stage.title[lang]}</h2>
                <p className="focus-stage-text">{stage.body[lang]}</p>
                <ul
                  className="focus-stage-members"
                  aria-label={`${copy.stageMembers}: ${stage.title[lang]}`}
                >
                  {stageProjects(stage.members).map((project) => (
                    <li key={project.key}>
                      <a href={`#project-${project.key}`}>{project.name}</a>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="focus-projects" id="focus-projects">
        <header className="focus-projects-head">
          <span className="focus-label">{copy.projectsLabel}</span>
          <h2>{copy.projectsTitle}</h2>
          <p>{copy.projectsLead}</p>
        </header>

        <ul className="focus-card-grid">
          {FAMILY_PROJECTS.map((project) => (
            <li className="focus-card" key={project.key} id={`project-${project.key}`}>
              <div className="focus-card-head">
                <h3>
                  {project.name}
                  {project.latin ? <small>{project.latin}</small> : null}
                </h3>
                <span className={`focus-card-status is-${project.status}`}>
                  {FAMILY_STATUS_LABELS[project.status][lang]}
                </span>
              </div>

              <ul className="focus-tags" aria-label="tags">
                {project.tags.map((tag) => (
                  <li key={tag} data-tag={tag}>
                    {FAMILY_TAG_LABELS[tag][lang]}
                  </li>
                ))}
              </ul>

              <p className="focus-card-summary">{project.summary[lang]}</p>
              <p className="focus-card-kind">{project.kind[lang]}</p>

              <div className="focus-card-foot">
                {project.entry ? (
                  <p className="focus-card-entry">
                    <span>{copy.entryLabel}</span>
                    <code>{project.entry}</code>
                  </p>
                ) : null}
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
              </div>
            </li>
          ))}
        </ul>

        <p className="focus-source">{FAMILY_SOURCE_LABEL[lang]}</p>
      </section>
    </section>
  );
}

export default FocusPage;
