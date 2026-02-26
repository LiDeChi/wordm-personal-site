import { AuthPanel, type AuthPanelProps } from './AuthPanel'
import { ResumeSection } from './ResumeSection'

type ResumePageProps = {
  lastUpdated: string
  authPanel: Omit<AuthPanelProps, 'className'>
}

export function ResumePage({ lastUpdated, authPanel }: ResumePageProps) {
  return (
    <div className="subdomain-page">
      <main className="subdomain-main">
        <p className="mono subdomain-tag">resume.wordm.us</p>
        <h1>Jian Yongjie Resume</h1>
        <p className="meta">Updated: {lastUpdated}</p>
        <AuthPanel {...authPanel} className="subdomain-auth" />

        <ResumeSection />

        <footer className="subdomain-footer">
          <div>
            <a href="https://wordm.us" target="_blank" rel="noreferrer">
              Back to wordm.us
            </a>
          </div>
          <div>
            <a href="/jian-yongjie-resume.pdf" target="_blank" rel="noreferrer">
              Download PDF
            </a>
          </div>
        </footer>
      </main>
    </div>
  )
}
