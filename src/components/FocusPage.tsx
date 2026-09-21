import type { Lang } from "../i18n/lang";
import { AlifeGallery } from "./AlifeGallery";
import { AlifeTimeline } from "./AlifeTimeline";
import "./FocusPage.css";

/**
 * 关注方向 / Focus
 *
 * 一页到底：上面是人工生命史时间轴（渐进式披露），下面是同一份 catalog 的卡片墙
 * —— 左列是项目索引和选中条目的说明，右列是展览的画廊卡片。
 */
export function FocusPage({ lang }: { lang: Lang }) {
  return (
    <section className="focus-page">
      <AlifeTimeline lang={lang} />
      <AlifeGallery lang={lang} />
    </section>
  );
}

export default FocusPage;
