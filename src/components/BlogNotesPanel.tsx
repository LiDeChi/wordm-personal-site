import type { BlogArticle } from '../data/blogArticles'

type BlogNotesPanelProps = {
  activeArticle: BlogArticle
  nextArticle: BlogArticle | null
  onJumpNext: () => void
}

export function BlogNotesPanel({ activeArticle, nextArticle, onJumpNext }: BlogNotesPanelProps) {
  return (
    <aside className="margin-notes blog-notes">
      <div className="note">
        <span className="note-ref">Now</span>
        <strong>{activeArticle.title}</strong>
        <p>{activeArticle.note}</p>
      </div>

      <div className="note">
        <span className="note-ref">Next</span>
        {nextArticle ? (
          <>
            <p>{nextArticle.title}</p>
            <button type="button" className="blog-next-btn" onClick={onJumpNext}>
              跳转到下一篇
            </button>
          </>
        ) : (
          <p>已经是最后一篇。</p>
        )}
      </div>

      <div className="note">
        <span className="note-ref">Flow</span>
        文章按时间和主题串联展示，右侧按钮用于快速推进阅读节奏。
      </div>
    </aside>
  )
}
