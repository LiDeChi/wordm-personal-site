import type { MouseEvent } from "react";
import type { Lang } from "../i18n/lang";
import { SHELL_COPY, siteTabHref } from "../lib/site-shell";

/**
 * 站点标记：Conway 滑翔机的五个格子。
 *
 * 「人工的生命」最小的图形 —— 规则放进去、结构自己长出来，正好是这个标题在做的事。
 * 上面那格用强调色，其余跟文字同色；深浅两套主题都不用改这份标记。
 */
function SiteLifeMark() {
  return (
    <svg className="site-mark" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect className="is-seed" x="9" y="1.5" width="6" height="6" rx="1.2" />
      <rect x="16.5" y="9" width="6" height="6" rx="1.2" />
      <rect x="1.5" y="16.5" width="6" height="6" rx="1.2" />
      <rect x="9" y="16.5" width="6" height="6" rx="1.2" />
      <rect x="16.5" y="16.5" width="6" height="6" rx="1.2" />
    </svg>
  );
}

/**
 * 顶栏 / 页脚的站点标记：左边滑翔机，右边站点标题（衬线体）。
 *
 * 标题就是站点的标题本身，顶栏不再显示域名；点击回到关注方向。
 */
export function SiteBrand({
  lang,
  onNavigate,
}: {
  lang: Lang;
  onNavigate: (event: MouseEvent<HTMLAnchorElement>) => void;
}) {
  const copy = SHELL_COPY[lang];

  return (
    <a className="fount-logo" href={siteTabHref("focus", lang)} onClick={onNavigate}>
      <span className="fount-logo-mark" aria-hidden="true">
        <SiteLifeMark />
      </span>
      <span className="site-brand-title">{copy.brand}</span>
    </a>
  );
}

export default SiteBrand;
