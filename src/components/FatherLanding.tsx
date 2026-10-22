import type { MouseEvent } from "react";
import type { BlogArticle } from "../data/blogArticles";
import { PERSONAL_PROJECTS } from "../data/fountFields";
import type { Lang } from "../i18n/lang";
import { withSiteParams } from "../lib/lang-url";
import { HomeExcerpt } from "./HomeExcerpt";
import { useAdaptivePreviewCount } from "./useAdaptivePreviewCount";
import { useHomeLibraryGesture } from "./useHomeLibraryGesture";

type FatherLandingProps = {
  lang: Lang;
  articles: BlogArticle[];
  onOpen: (surface: "projects" | "articles") => void;
  onOpenArticle: (articleId: string) => void;
  onOpenProject: (projectKey: string) => void;
};

function articleExcerpt(article: BlogArticle, lang: Lang) {
  if (article.summary[lang].trim()) return article.summary[lang];
  for (const block of article.blocks ?? []) {
    if ((block.type === "paragraph" || block.type === "callout") && block.text[lang].trim()) {
      return block.text[lang];
    }
  }
  return article.paragraphs.find((paragraph) => paragraph[lang].trim())?.[lang] ?? "";
}

export function FatherLanding({ lang, articles, onOpen, onOpenArticle, onOpenProject }: FatherLandingProps) {
  const landingRef = useHomeLibraryGesture(onOpen);
  const { previewsRef, previewCount } = useAdaptivePreviewCount(articles.length);
  const chronology = lang === "zh" ? ["最新", "上一篇", "更早"] : ["Latest", "Previous", "Earlier"];

  function open(event: MouseEvent<HTMLAnchorElement>, surface: "projects" | "articles") {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onOpen(surface);
  }

  function openPreview(event: MouseEvent<HTMLAnchorElement>, action: () => void) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (window.getSelection()?.isCollapsed === false) return;
    action();
  }

  function articleHref(articleId: string) {
    return withSiteParams(`/blog?article=${encodeURIComponent(articleId)}`, { lang });
  }

  return (
    <div className="father-landing" ref={landingRef}>
      <section
        className="father-entry father-entry-projects"
        data-home-surface="projects"
        style={{ viewTransitionName: "father-library-projects" }}
        aria-labelledby="father-entry-projects-title"
      >
        <a className="father-entry-heading" href={withSiteParams("/projects", { lang })} onClick={(event) => open(event, "projects")} aria-label={lang === "zh" ? "打开项目卡片库" : "Open project library"}>
          <div className="father-entry-heading-link">
            <h2 id="father-entry-projects-title">{lang === "zh" ? "项目" : "Projects"}</h2>
            <span className="father-entry-arrow" aria-hidden="true">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 12h16m-7-7 7 7-7 7" /></svg>
            </span>
          </div>
          <span className="father-entry-count">{PERSONAL_PROJECTS.length}{lang === "zh" ? " 件作品" : " works"}</span>
        </a>
        <div className="father-entry-previews">
          <ol className="father-entry-preview-list">
            {PERSONAL_PROJECTS.map((project) => (
              <li key={project.key}>
                <a className="father-project-preview" href={withSiteParams(`/projects?card=${encodeURIComponent(project.key)}`, { lang })} onClick={(event) => openPreview(event, () => onOpenProject(project.key))}>
                  <img className="father-entry-image" src={project.coverUrl} alt={project.coverAlt[lang]} />
                  <div>
                    <h3>{project.name}</h3>
                    <HomeExcerpt text={project.summary[lang]} />
                  </div>
                </a>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="father-entry father-entry-articles" data-home-surface="articles" style={{ viewTransitionName: "father-library-articles" }} aria-labelledby="father-entry-articles-title">
        <a className="father-entry-heading" href={withSiteParams("/blog", { lang })} onClick={(event) => open(event, "articles")} aria-label={lang === "zh" ? "打开文章卡片库" : "Open article library"}>
          <div className="father-entry-heading-link">
            <h2 id="father-entry-articles-title">{lang === "zh" ? "文章" : "Articles"}</h2>
            <span className="father-entry-arrow" aria-hidden="true">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 12h16m-7-7 7 7-7 7" /></svg>
            </span>
          </div>
          <span className="father-entry-count">{articles.length}{lang === "zh" ? " 篇文章" : " articles"}</span>
        </a>
        <div className="father-entry-previews" ref={previewsRef}>
          {articles.length ? (
            <ol className="father-entry-preview-list">
              {articles.slice(0, previewCount).map((article, index) => (
                <li key={article.id}>
                  <a className="father-article-preview" href={articleHref(article.id)} onClick={(event) => openPreview(event, () => onOpenArticle(article.id))}>
                    <div className="father-entry-article-meta">
                      <span>{chronology[Math.min(index, 2)]}</span>
                      <span className="father-entry-date">{article.date}</span>
                    </div>
                    <h3>{article.title[lang]}</h3>
                    <HomeExcerpt text={articleExcerpt(article, lang)} />
                  </a>
                </li>
              ))}
            </ol>
          ) : (
            <p className="father-entry-empty">{lang === "zh" ? "还没有已发布的文章" : "No published articles yet"}</p>
          )}
        </div>
      </section>
    </div>
  );
}
