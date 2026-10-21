import type { MouseEvent } from "react";
import type { BlogArticle } from "../data/blogArticles";
import { PERSONAL_PROJECTS } from "../data/fountFields";
import type { Lang } from "../i18n/lang";
import { withSiteParams } from "../lib/lang-url";
import { MathText } from "./MathText";

type FatherLandingProps = {
  lang: Lang;
  articles: BlogArticle[];
  onOpen: (surface: "projects" | "articles") => void;
  onOpenArticle: (articleId: string) => void;
  onOpenIndex: () => void;
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

export function FatherLanding({ lang, articles, onOpen, onOpenArticle, onOpenIndex }: FatherLandingProps) {
  const project = PERSONAL_PROJECTS.find((field) => field.key === "ringbook") ?? PERSONAL_PROJECTS[0];
  const chronology = lang === "zh" ? ["最新", "上一篇", "更早"] : ["Latest", "Previous", "Earlier"];

  function open(event: MouseEvent<HTMLAnchorElement>, surface: "projects" | "articles") {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onOpen(surface);
  }

  function openArticle(event: MouseEvent<HTMLAnchorElement>, articleId: string) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (window.getSelection()?.isCollapsed === false) return;
    onOpenArticle(articleId);
  }

  function articleHref(articleId: string) {
    return withSiteParams(`/blog?article=${encodeURIComponent(articleId)}`, { lang });
  }

  return (
    <div className="father-landing">
      <a
        className="father-entry father-entry-projects"
        href={withSiteParams("/projects", { lang })}
        onClick={(event) => open(event, "projects")}
        aria-labelledby="father-entry-projects-title"
      >
        <div className="father-entry-heading">
          <h2 id="father-entry-projects-title">{lang === "zh" ? "项目" : "Projects"}</h2>
          <span className="father-entry-count">{PERSONAL_PROJECTS.length}{lang === "zh" ? " 件作品" : " works"}</span>
        </div>
        {project ? (
          <figure className="father-entry-project-preview">
            <img className="father-entry-image" src={project.coverUrl} alt={project.coverAlt[lang]} />
            <figcaption>
              <h3>{project.name}</h3>
              <p>{project.summary[lang]}</p>
            </figcaption>
          </figure>
        ) : null}
        <div className="father-entry-project-list">
          {PERSONAL_PROJECTS.map((field) => <span key={field.key}>{field.name}</span>)}
        </div>
      </a>

      <section className="father-entry father-entry-articles" aria-labelledby="father-entry-articles-title">
        <div className="father-entry-heading">
          <h2 id="father-entry-articles-title">{lang === "zh" ? "博客" : "Blog"}</h2>
          <span className="father-entry-count">{articles.length}{lang === "zh" ? " 篇文章" : " articles"}</span>
        </div>
        <div className="father-entry-article-previews">
          {articles.length ? (
            <ol className="father-entry-article-list">
              {articles.slice(0, 3).map((article, index) => (
                <li key={article.id}>
                  <a className="father-article-preview" href={articleHref(article.id)} onClick={(event) => openArticle(event, article.id)}>
                    <div className="father-entry-article-meta">
                      <span>{chronology[index]}</span>
                      <span className="father-entry-date">{article.date}</span>
                    </div>
                    <h3>{article.title[lang]}</h3>
                    <p className="father-entry-excerpt"><MathText text={articleExcerpt(article, lang)} /></p>
                    <span className="father-entry-read">{lang === "zh" ? "阅读全文" : "Read article"}</span>
                  </a>
                </li>
              ))}
            </ol>
          ) : (
            <p className="father-entry-empty">{lang === "zh" ? "还没有已发布的文章" : "No published articles yet"}</p>
          )}
        </div>
        <footer className="father-entry-articles-footer">
          <button className="father-entry-all-articles" type="button" aria-haspopup="dialog" onClick={onOpenIndex}>
            {lang === "zh" ? "全部文章" : "All articles"}
          </button>
        </footer>
      </section>
    </div>
  );
}
