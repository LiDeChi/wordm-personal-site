import type { Lang } from '../i18n/lang'

type SiteParamOptions = {
  lang: Lang
  shareToken?: string | null
}

export function withSiteParams(url: string, options: SiteParamOptions): string {
  const hashIndex = url.indexOf('#')
  const hash = hashIndex >= 0 ? url.slice(hashIndex) : ''
  const withoutHash = hashIndex >= 0 ? url.slice(0, hashIndex) : url

  const [path, rawQuery = ''] = withoutHash.split('?')
  const params = new URLSearchParams(rawQuery)
  params.set('lang', options.lang)

  if (options.shareToken) {
    params.set('share', options.shareToken)
  } else {
    params.delete('share')
  }

  const query = params.toString()
  return `${path}${query ? `?${query}` : ''}${hash}`
}

export function withLangParam(url: string, lang: Lang): string {
  return withSiteParams(url, { lang })
}
