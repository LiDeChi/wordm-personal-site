import { useState } from "react";
import type { Lang } from "../i18n/lang";
import { PERSONAL_PROJECTS, type FountField } from "../data/fountFields";
import { withSiteParams } from "../lib/lang-url";
import "./PersonalProjectsPage.css";

/**
 * 「个人项目」页：只铺对外保留的六件作品。
 *
 * 顺序写在 `PERSONAL_PROJECT_KEYS`：人工生命史、RingBook、MuseumBook、
 * Flipook、诗经长卷、万卷。其余登记项和工作区实验不进这一页。
 */

const COPY = {
  zh: {
    workMeta: "产品与作品",
    workCount: (count: number) => `${count} 个已上线入口`,
    workPreview: "预览页面",
    workOpen: "打开",
  },
  en: {
    workMeta: "Products & work",
    workCount: (count: number) => `${count} live entries`,
    workPreview: "Page preview",
    workOpen: "Open",
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
            {copy.workCount(PERSONAL_PROJECTS.length)}
          </span>
        </div>

        <div className="home-projects-hero">
          <div className="home-projects-grid">
            {PERSONAL_PROJECTS.map((field, index) => {
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
    </>
  );
}
