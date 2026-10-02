import type { Lang } from "../i18n/lang";
import { AlifeTimeline } from "./AlifeTimeline";
import "./FocusPage.css";

/** The homepage is the artificial life timeline. The research framing that
 *  used to sit above it was removed so the page opens on the timeline itself. */
export function FocusPage({ lang }: { lang: Lang }) {
  return (
    <main className="focus-page">
      <section className="world-alife" id="alife-section" aria-label={lang === "zh" ? "人工生命史" : "Artificial life history"}>
        <AlifeTimeline lang={lang} />
      </section>
    </main>
  );
}

export default FocusPage;
