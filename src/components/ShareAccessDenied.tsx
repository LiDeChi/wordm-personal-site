import { AuthPanel, type AuthPanelProps } from './AuthPanel'
import type { Lang } from '../i18n/lang'
import { withSiteParams } from '../lib/lang-url'
import type { ShareResolveStatus } from '../lib/share-links'

type ShareAccessDeniedProps = {
  lang: Lang
  status: ShareResolveStatus
  authPanel: Omit<AuthPanelProps, 'className'>
  fallbackSharedUrl?: string | null
}

const COPY = {
  zh: {
    invalid: '分享链接无效',
    expired: '分享链接已过期',
    revoked: '分享链接已撤销',
    restricted: '分享链接未开放此页面或项目',
    loading: '正在验证分享链接...',
    description: '这个分享入口当前不可用。你可以返回公开主页，或使用具备权限的账号登录。',
    backHome: '返回公开主页',
    openSharedEntry: '打开分享入口',
  },
  en: {
    invalid: 'Share link is invalid',
    expired: 'Share link has expired',
    revoked: 'Share link has been revoked',
    restricted: 'This share link does not include this page or project',
    loading: 'Validating share link...',
    description: 'This shared entry is currently unavailable. You can go back to the public home page, or log in with an authorized account.',
    backHome: 'Back to public home',
    openSharedEntry: 'Open shared entry',
  },
} as const

function titleForStatus(lang: Lang, status: ShareResolveStatus) {
  const copy = COPY[lang]
  if (status === 'loading') {
    return copy.loading
  }
  if (status === 'expired') {
    return copy.expired
  }
  if (status === 'revoked') {
    return copy.revoked
  }
  if (status === 'active') {
    return copy.restricted
  }
  return copy.invalid
}

export function ShareAccessDenied({ lang, status, authPanel, fallbackSharedUrl = null }: ShareAccessDeniedProps) {
  const copy = COPY[lang]
  const homeUrl = withSiteParams('https://wordm.us', { lang })

  return (
    <div className="subdomain-page">
      <main className="subdomain-main">
        <p className="mono subdomain-tag">wordm.us</p>
        <h1>{titleForStatus(lang, status)}</h1>
        <p>{copy.description}</p>
        <AuthPanel {...authPanel} className="subdomain-auth" />

        <footer className="subdomain-footer">
          <div>
            <a href={homeUrl} target="_blank" rel="noreferrer">
              {copy.backHome}
            </a>
          </div>
          {fallbackSharedUrl ? (
            <div>
              <a href={fallbackSharedUrl} target="_blank" rel="noreferrer">
                {copy.openSharedEntry}
              </a>
            </div>
          ) : null}
        </footer>
      </main>
    </div>
  )
}
