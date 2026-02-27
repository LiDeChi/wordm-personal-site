import { AuthPanel, type AuthPanelProps } from './AuthPanel'
import type { AuthRole } from '../lib/auth'
import type { Lang } from '../i18n/lang'
import { roleLabel } from '../i18n/roles'

type ResumeAccessDeniedProps = {
  lang: Lang
  authPanel: Omit<AuthPanelProps, 'className'>
  role: AuthRole
}

const DENIED_COPY = {
  zh: {
    title: '简历访问受限',
    rolePrefix: '当前身份',
    description: '简历页仅对管理员账号与测试账号开放。请使用对应账号登录后访问。',
    backHome: '返回 wordm.us',
  },
  en: {
    title: 'Resume Access Restricted',
    rolePrefix: 'Current role',
    description: 'The resume page is available only to admin and tester accounts. Please log in with an authorized account.',
    backHome: 'Back to wordm.us',
  },
} as const

export function ResumeAccessDenied({ lang, authPanel, role }: ResumeAccessDeniedProps) {
  const copy = DENIED_COPY[lang]

  return (
    <div className="subdomain-page">
      <main className="subdomain-main">
        <p className="mono subdomain-tag">resume.wordm.us</p>
        <h1>{copy.title}</h1>
        <p className="meta">
          {copy.rolePrefix}: {roleLabel(role, lang)}
        </p>
        <p>{copy.description}</p>
        <AuthPanel {...authPanel} className="subdomain-auth" />

        <footer className="subdomain-footer">
          <div>
            <a href="https://wordm.us" target="_blank" rel="noreferrer">
              {copy.backHome}
            </a>
          </div>
        </footer>
      </main>
    </div>
  )
}
