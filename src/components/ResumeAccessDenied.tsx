import { AuthPanel, type AuthPanelProps } from './AuthPanel'
import type { AuthRole } from '../lib/auth'

type ResumeAccessDeniedProps = {
  authPanel: Omit<AuthPanelProps, 'className'>
  role: AuthRole
}

function roleLabel(role: AuthRole) {
  if (role === 'admin') {
    return '管理员'
  }
  if (role === 'tester') {
    return '测试账号'
  }
  if (role === 'user') {
    return '普通账号'
  }
  return '游客'
}

export function ResumeAccessDenied({ authPanel, role }: ResumeAccessDeniedProps) {
  return (
    <div className="subdomain-page">
      <main className="subdomain-main">
        <p className="mono subdomain-tag">resume.wordm.us</p>
        <h1>Resume Access Restricted</h1>
        <p className="meta">当前身份：{roleLabel(role)}</p>
        <p>简历页仅对管理员账号与测试账号开放。请使用对应账号登录后访问。</p>
        <AuthPanel {...authPanel} className="subdomain-auth" />

        <footer className="subdomain-footer">
          <div>
            <a href="https://wordm.us" target="_blank" rel="noreferrer">
              Back to wordm.us
            </a>
          </div>
        </footer>
      </main>
    </div>
  )
}
