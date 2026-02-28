import { AuthPanel, type AuthPanelProps } from './AuthPanel'
import { ResumeSection } from './ResumeSection'
import type { Lang } from '../i18n/lang'
import { withLangParam } from '../lib/lang-url'

type ResumePageProps = {
  lang: Lang
  lastUpdated: string
  authPanel: Omit<AuthPanelProps, 'className'>
}

const PAGE_COPY = {
  zh: {
    title: '简永杰简历',
    updated: '最近更新',
    backHome: '返回 wordm.us',
    downloadPdf: '下载 PDF',
  },
  en: {
    title: 'Jian Yongjie Resume',
    updated: 'Updated',
    backHome: 'Back to wordm.us',
    downloadPdf: 'Download PDF',
  },
} as const

export function ResumePage({ lang, lastUpdated, authPanel }: ResumePageProps) {
  const copy = PAGE_COPY[lang]
  const homeUrl = withLangParam('https://wordm.us', lang)

  return (
    <div className="subdomain-page">
      <main className="subdomain-main">
        <p className="mono subdomain-tag">resume.wordm.us</p>
        <h1>{copy.title}</h1>
        <p className="meta">
          {copy.updated}: {lastUpdated}
        </p>
        <AuthPanel {...authPanel} className="subdomain-auth" />

        <ResumeSection lang={lang} />

        <footer className="subdomain-footer">
          <div>
            <a href={homeUrl} target="_blank" rel="noreferrer">
              {copy.backHome}
            </a>
          </div>
          <div>
            <a href="/jian-yongjie-resume.pdf" target="_blank" rel="noreferrer">
              {copy.downloadPdf}
            </a>
          </div>
        </footer>
      </main>
    </div>
  )
}
