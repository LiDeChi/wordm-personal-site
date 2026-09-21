import type { Lang } from "../i18n/lang";
import { AlifeTimeline } from "./AlifeTimeline";
import "./FocusPage.css";

/**
 * 关注方向 / Focus
 *
 * 一页到底：人工生命史的时间轴（左）和展览的卡片（右），两列读同一份 catalog，
 * 指针停在任意一边，另一边跟着走。
 */
export function FocusPage({ lang }: { lang: Lang }) {
  return (
    <section className="focus-page">
      <AlifeTimeline lang={lang} />
    </section>
  );
}

export default FocusPage;
