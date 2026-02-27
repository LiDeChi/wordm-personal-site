import type { AuthRole } from '../lib/auth'
import type { Lang } from './lang'

const ROLE_LABELS: Record<Lang, Record<AuthRole, string>> = {
  zh: {
    admin: '管理员',
    tester: '测试账号',
    user: '普通账号',
    guest: '游客',
  },
  en: {
    admin: 'Admin',
    tester: 'Tester',
    user: 'User',
    guest: 'Guest',
  },
}

export function roleLabel(role: AuthRole, lang: Lang) {
  return ROLE_LABELS[lang][role]
}

