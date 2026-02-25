import { ResumeSection } from './ResumeSection'

type ResumePageProps = {
  lastUpdated: string
}

export function ResumePage({ lastUpdated }: ResumePageProps) {
  return (
    <div className="subdomain-page">
      <main className="subdomain-main">
        <p className="mono subdomain-tag">resume.wordm.us</p>
        <h1>Jian Yongjie Resume</h1>
        <p className="meta">Updated: {lastUpdated}</p>

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
