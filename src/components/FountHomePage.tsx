import type { ReactNode } from "react";
import type { Lang } from "../i18n/lang";
import {
  CONTACT_EMAIL,
  SHELL_COPY,
  SITE_TABS,
  siteAboutHref,
  siteTabHref,
  type SiteTab,
} from "../lib/site-shell";
import { FountMusicPlayer } from "./FountMusicPlayer";
import { SiteBrand } from "./SiteBrand";
import { SocialLinks } from "./SocialLinks";
import { ThemeModeIcon } from "./ThemeModeIcon";

/**
 * The personal site shell.
 *
 * This is the original homepage frame — fixed header, right-side social +
 * music rail, footer — with the Fount product marketing removed. It only
 * provides chrome: every body is passed in as `children`.
 */

type FountHomePageProps = {
  lang: Lang;
  activeTab: SiteTab;
  onTabChange: (tab: SiteTab) => void;
  onLangChange: (lang: Lang) => void;
  themeMode: "day" | "night";
  onThemeToggle: () => void;
  children: ReactNode;
  /** Extra class placed on the body wrapper, for tab-specific layout. */
  bodyClassName?: string;
};

function handleTabClick(
  event: React.MouseEvent<HTMLAnchorElement>,
  tab: SiteTab,
  onTabChange: (tab: SiteTab) => void,
) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return;
  }

  event.preventDefault();
  onTabChange(tab);
}

export function FountHomePage({
  lang,
  activeTab,
  onTabChange,
  onLangChange,
  themeMode,
  onThemeToggle,
  children,
  bodyClassName,
}: FountHomePageProps) {
  const copy = SHELL_COPY[lang];

  return (
    <main
      className="fount-page fount-page-focused"
      data-lang={lang}
      data-page={activeTab}
    >
      <header className="fount-header">
        <h1 className="site-brand-h1">
          <SiteBrand
            lang={lang}
            onNavigate={(event) => handleTabClick(event, "focus", onTabChange)}
          />
        </h1>

        <div className="fount-header-actions">
          <nav className="fount-site-nav" aria-label={copy.navAria}>
            {SITE_TABS.map((tab) => (
              <a
                className={activeTab === tab ? "active" : ""}
                href={siteTabHref(tab, lang)}
                aria-current={activeTab === tab ? "page" : undefined}
                key={tab}
                onClick={(event) => handleTabClick(event, tab, onTabChange)}
              >
                {copy.nav[tab]}
              </a>
            ))}
          </nav>
          <div className="fount-header-utils">
            <div className="fount-lang-switch" aria-label={copy.langAria}>
              <button
                type="button"
                className={lang === "zh" ? "active" : ""}
                aria-pressed={lang === "zh"}
                onClick={() => onLangChange("zh")}
              >
                中文
              </button>
              <button
                type="button"
                className={lang === "en" ? "active" : ""}
                aria-pressed={lang === "en"}
                onClick={() => onLangChange("en")}
              >
                EN
              </button>
            </div>
            <button
              type="button"
              className="fount-theme-toggle"
              aria-label={
                themeMode === "night"
                  ? copy.themeToDayAria
                  : copy.themeToNightAria
              }
              aria-pressed={themeMode === "night"}
              onClick={onThemeToggle}
            >
              <ThemeModeIcon mode={themeMode} />
            </button>
          </div>
        </div>
      </header>

      <div className="fount-rail" aria-label={copy.railAria}>
        <SocialLinks
          ariaLabel={copy.socialAria}
          className="fount-social-links fount-social-rail"
          linkClassName="fount-social-link"
        />
        <FountMusicPlayer lang={lang} />
      </div>

      <div className={`fount-body${bodyClassName ? ` ${bodyClassName}` : ""}`}>
        {children}
      </div>

      <footer className="fount-footer" id="fount-footer">
        <div className="fount-footer-brand">
          <SiteBrand
            lang={lang}
            onNavigate={(event) => handleTabClick(event, "focus", onTabChange)}
          />
          <p>{copy.footerNote}</p>
        </div>
        <nav className="fount-footer-grid" aria-label={copy.footerNavAria}>
          <div>
            <strong>{copy.footerSections}</strong>
            {SITE_TABS.map((tab) => (
              <a
                href={siteTabHref(tab, lang)}
                key={tab}
                onClick={(event) => handleTabClick(event, tab, onTabChange)}
              >
                {copy.nav[tab]}
              </a>
            ))}
          </div>
          <div>
            <strong>{copy.footerAbout}</strong>
            <a href={siteAboutHref(lang)}>{copy.footerAbout}</a>
          </div>
          <div>
            <strong>{copy.footerContact}</strong>
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </div>
        </nav>
      </footer>
    </main>
  );
}

export default FountHomePage;
