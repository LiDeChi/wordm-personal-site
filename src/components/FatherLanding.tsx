import type { MouseEvent } from "react";
import type { BlogArticle } from "../data/blogArticles";
import { PERSONAL_PROJECTS } from "../data/fountFields";
import type { Lang } from "../i18n/lang";
import { withSiteParams } from "../lib/lang-url";

type FatherLandingProps = {
  lang: Lang;
  articles: BlogArticle[];
  onOpen: (surface: "projects" | "articles") => void;
  onOpenArticle: (articleId: string) => void;
};

export function FatherLanding({ lang, articles, onOpen, onOpenArticle }: FatherLandingProps) {
  const project = PERSONAL_PROJECTS.find((field) => field.key === "ringbook") ?? PERSONAL_PROJECTS[0];
  const article = articles[0];
  const previewParagraphs = article?.blocks?.length
    ? article.blocks.flatMap((block) =>
      block.type === "paragraph" || block.type === "callout" ? [block.text[lang]] : [],
    )
    : article?.paragraphs.map((paragraph) => paragraph[lang]) ?? [];
  const excerpt = previewParagraphs.slice(0, 4).join("\n\n") || article?.summary[lang] || "";

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
        <a className="father-entry-collection" href={withSiteParams("/blog", { lang })} onClick={(event) => open(event, "articles")}>
          <div className="father-entry-heading">
            <h2 id="father-entry-articles-title">{lang === "zh" ? "博客" : "Blog"}</h2>
            <span className="father-entry-count">{articles.length}{lang === "zh" ? " 篇文章" : " articles"}</span>
          </div>
        </a>
        {article ? (
          <>
            <a className="father-entry-writing father-article-preview" href={articleHref(article.id)} onClick={(event) => openArticle(event, article.id)}>
              <p className="father-entry-date">{article.date}</p>
              <h3>{article.title[lang]}</h3>
              <p className="father-entry-excerpt">{excerpt}</p>
            </a>
            <div className="father-entry-article-list">
              {articles.slice(1, 3).map((item) => (
                <a className="father-article-preview" href={articleHref(item.id)} key={item.id} onClick={(event) => openArticle(event, item.id)}>
                  <h3>{item.title[lang]}</h3>
                  <p className="father-entry-date">{item.date}</p>
                </a>
              ))}
            </div>
          </>
        ) : (
          <p className="father-entry-empty">{lang === "zh" ? "还没有已发布的文章" : "No published articles yet"}</p>
        )}
      </section>
    </div>
  );
}
