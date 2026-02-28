import type { Lang } from '../i18n/lang'

export function withLangParam(url: string, lang: Lang): string {
  const hashIndex = url.indexOf('#')
  const hash = hashIndex >= 0 ? url.slice(hashIndex) : ''
  const withoutHash = hashIndex >= 0 ? url.slice(0, hashIndex) : url

  const [path, rawQuery = ''] = withoutHash.split('?')
  const params = new URLSearchParams(rawQuery)
  params.set('lang', lang)

  const query = params.toString()
  return `${path}${query ? `?${query}` : ''}${hash}`
}

