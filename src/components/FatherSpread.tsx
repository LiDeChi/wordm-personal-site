import { useEffect, useRef, useState } from "react";
import { PERSONAL_PROJECTS, type FountField } from "../data/fountFields";
import type { Lang } from "../i18n/lang";
import { withSiteParams } from "../lib/lang-url";
import {
  CONTACT_EMAIL,
  SHELL_COPY,
  siteAboutHref,
  siteTabHref,
} from "../lib/site-shell";
import { ThemeModeIcon } from "./ThemeModeIcon";
import "./FatherSpread.css";

type FatherSpreadProps = {
  lang: Lang;
  themeMode: "day" | "night";
  onThemeToggle: () => void;
  onLangChange: (lang: Lang) => void;
};

const WHEEL_STEP = 48;

function framesOf(field: FountField, lang: Lang) {
  return [
    {
      url: field.coverUrl,
      alt: field.coverAlt[lang],
      caption: field.summary[lang],
    },
    ...(field.screenshots ?? []).map((shot) => ({
      url: shot.url,
      alt: shot.alt[lang],
      caption: shot.caption[lang],
    })),
  ];
}

/**
 * Three reading windows and a button column in the gutter before the last one.
 * The wheel scrolls whichever window the pointer is on. On the button column
 * it moves the windows left and right through the projects.
 */
export function FatherSpread({
  lang,
  themeMode,
  onThemeToggle,
  onLangChange,
}: FatherSpreadProps) {
  const copy = SHELL_COPY[lang];
  const [wide, setWide] = useState(true);
  const [start, setStart] = useState(0);
  const moduleRefs = useRef<Array<HTMLElement | null>>([]);
  const railRef = useRef<HTMLDivElement | null>(null);
  const maxStartRef = useRef(0);

  const visible = wide ? 3 : 1;
  const maxStart = Math.max(0, PERSONAL_PROJECTS.length - visible);
  const clampedStart = Math.min(start, maxStart);
  const slots = wide
    ? [clampedStart, clampedStart + 1, clampedStart + 2]
    : [clampedStart];

  useEffect(() => {
    const media = window.matchMedia("(min-width: 980px)");
    const apply = () => setWide(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    maxStartRef.current = maxStart;
    const cleanups: Array<() => void> = [];

    moduleRefs.current.forEach((node) => {
      if (!node) {
        return;
      }
      const onWheel = (event: WheelEvent) => {
        if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
          return;
        }
        event.preventDefault();
        const max = node.scrollHeight - node.clientHeight;
        node.scrollTop = Math.min(max, Math.max(0, node.scrollTop + event.deltaY));
      };
      node.addEventListener("wheel", onWheel, { passive: false });
      cleanups.push(() => node.removeEventListener("wheel", onWheel));
    });

    const rail = railRef.current;
    if (rail) {
      let pending = 0;
      const onWheel = (event: WheelEvent) => {
        event.preventDefault();
        pending += event.deltaY;
        if (Math.abs(pending) < WHEEL_STEP) {
          return;
        }
        const direction = pending > 0 ? 1 : -1;
        pending = 0;
        setStart((current) =>
          Math.min(maxStartRef.current, Math.max(0, current + direction)),
        );
      };
      rail.addEventListener("wheel", onWheel, { passive: false });
      cleanups.push(() => rail.removeEventListener("wheel", onWheel));
    }

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [clampedStart, maxStart, wide]);

  return (
    <div className={`father-spread${wide ? " is-wide" : " is-narrow"}`}>
      <div className="father-frame">
        <header className="father-mast">
          <h1>Father of Chana</h1>
          <div className="father-seal" aria-label="简永杰" title="简永杰">
            <span>简</span>
            <span>永</span>
            <span>杰</span>
          </div>
        </header>

        <div className="father-desk">
          {slots.map((index, slot) => {
            const field = PERSONAL_PROJECTS[index];
            const right = slot === slots.length - 1;
            const article = (
              <article
                className="father-module"
                aria-label={field.name}
                ref={(node) => {
                  moduleRefs.current[slot] = node;
                }}
              >
                <h2>{field.name}</h2>
                <p className="father-kind">{field.kind[lang]}</p>
                {framesOf(field, lang).map((frame) => (
                  <figure key={frame.url}>
                    <img src={frame.url} alt={frame.alt} />
                    <figcaption>{frame.caption}</figcaption>
                  </figure>
                ))}
                <a
                  className="father-open"
                  href={withSiteParams(field.href, { lang })}
                  {...(field.href.startsWith("http")
                    ? { target: "_blank", rel: "noreferrer" }
                    : {})}
                >
                  {lang === "zh" ? "打开" : "Open"}
                </a>
              </article>
            );
            if (!right) {
              return (
                <div className="father-slot" key={field.key}>
                  {article}
                </div>
              );
            }
            return (
              <div className="father-window" key={field.key}>
                {article}
                <div className="father-scroll" aria-hidden="true" />
              </div>
            );
          })}

          <div
            className="father-rail"
            ref={railRef}
            aria-label={copy.railAria}
            onKeyDown={(event) => {
              if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
                return;
              }
              event.preventDefault();
              const direction = event.key === "ArrowDown" ? 1 : -1;
              setStart((current) =>
                Math.min(maxStart, Math.max(0, current + direction)),
              );
            }}
          >
            <a href={siteTabHref("blog", lang)}>{copy.nav.blog}</a>
            <button
              type="button"
              aria-label={copy.langAria}
              onClick={() => onLangChange(lang === "zh" ? "en" : "zh")}
            >
              {lang === "zh" ? "中" : "EN"}
            </button>
            <button
              type="button"
              aria-label={
                themeMode === "night" ? copy.themeToDayAria : copy.themeToNightAria
              }
              aria-pressed={themeMode === "night"}
              onClick={onThemeToggle}
            >
              <ThemeModeIcon mode={themeMode} />
            </button>
            <a href={siteAboutHref(lang)}>{copy.footerAbout}</a>
            <a href={`mailto:${CONTACT_EMAIL}`} aria-label={copy.footerContact}>
              {lang === "zh" ? "聊聊" : "Hi"}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
