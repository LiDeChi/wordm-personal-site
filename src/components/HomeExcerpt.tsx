import { useEffect, useRef } from "react";
import { MathText } from "./MathText";

/** Keep the source (including formulas) intact; only the home preview is clipped. */
export function HomeExcerpt({ text }: { text: string }) {
  const excerptRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const node = excerptRef.current;
    if (!node) return;
    let active = true;
    const measure = () => {
      if (active) node.dataset.overflow = String(node.scrollHeight > node.clientHeight + 1);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    if (node.firstElementChild) observer.observe(node.firstElementChild);
    measure();
    void document.fonts.ready.then(measure);
    document.fonts.addEventListener("loadingdone", measure);
    return () => {
      active = false;
      observer.disconnect();
      document.fonts.removeEventListener("loadingdone", measure);
    };
  }, [text]);

  return <p className="father-entry-excerpt" ref={excerptRef}><span><MathText text={text} /></span></p>;
}
