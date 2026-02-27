export type Lang = 'zh' | 'en'

export function toLang(raw: string | null | undefined): Lang {
  return raw === 'en' ? 'en' : 'zh'
}

function parsePathLang(pathname: string): Lang | null {
  const segment = pathname.split('/').filter(Boolean)[0] ?? ''
  if (segment === 'zh' || segment === 'en') {
    return segment
  }
  return null
}

export function resolveInitialLang(locationLike: { search: string; pathname: string }): Lang {
  const params = new URLSearchParams(locationLike.search)
  const queryLang = params.get('lang')
  if (queryLang === 'zh' || queryLang === 'en') {
    return queryLang
  }

  return parsePathLang(locationLike.pathname) ?? 'zh'
}

