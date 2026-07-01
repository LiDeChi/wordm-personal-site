import type { BlogArticle } from '../data/blogArticles'
import type { Lang } from '../i18n/lang'

type BlogNotesPanelProps = {
  lang: Lang
  activeArticle: BlogArticle
  nextArticle: BlogArticle | null
  onJumpNext: () => void
}

export function BlogNotesPanel({ lang, activeArticle, nextArticle, onJumpNext }: BlogNotesPanelProps) {
  const currentLabel = lang === 'zh' ? '当前' : 'Now'
  const nextLabel = lang === 'zh' ? '下一篇' : 'Next'
  const flowLabel = lang === 'zh' ? '结构' : 'Flow'
  const jumpText = lang === 'zh' ? '跳转到下一篇博客' : 'Jump to next post'
  const noNextText = lang === 'zh' ? '已经是最后一篇博客。' : 'This is the last blog post.'
  const flowText =
    lang === 'zh'
      ? '博客按时间和主题串联展示，右侧按钮用于快速推进阅读节奏。'
      : 'Blog posts are connected by time and topic, with a quick-action button for faster reading flow.'

  return (
    <aside className="margin-notes blog-notes">
      <div className="note">
        <span className="note-ref">{currentLabel}</span>
        <strong>{activeArticle.title[lang]}</strong>
        <p>{activeArticle.note[lang]}</p>
      </div>

      <div className="note">
        <span className="note-ref">{nextLabel}</span>
        {nextArticle ? (
          <>
            <p>{nextArticle.title[lang]}</p>
            <button type="button" className="blog-next-btn" onClick={onJumpNext}>
              {jumpText}
            </button>
          </>
        ) : (
          <p>{noNextText}</p>
        )}
      </div>

      <div className="note">
        <span className="note-ref">{flowLabel}</span>
        {flowText}
      </div>
    </aside>
  )
}
