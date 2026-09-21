import { ARTICLES_SITE_URL, IN_SITE_BLOG_ENABLED } from "../data/blogArticles";
import type { Lang } from "../i18n/lang";
import { withSiteParams } from "./lang-url";

/**
 * 站点外壳 / personal site shell — the three top-level sections.
 *
 * Kept out of `FountHomePage.tsx` so the component file stays fast-refresh
 * friendly.
 */

export type SiteTab = "focus" | "projects" | "blog";

export const SITE_TABS: SiteTab[] = ["focus", "projects", "blog"];

export const CONTACT_EMAIL = "parsonjian@gmail.com";

type SiteShellCopy = {
  /** 顶栏 / 页脚显示的站点标题（衬线体），不再是域名。 */
  brand: string;
  nav: Record<SiteTab, string>;
  navAria: string;
  langAria: string;
  themeToDayAria: string;
  themeToNightAria: string;
  railAria: string;
  socialAria: string;
  footerNavAria: string;
  footerSections: string;
  footerNote: string;
  footerAbout: string;
  footerContact: string;
};

export const SHELL_COPY: Record<Lang, SiteShellCopy> = {
  zh: {
    brand: "人工的生命、心智、交互",
    nav: { focus: "关注方向", projects: "个人项目", blog: "博客" },
    navAria: "主导航",
    langAria: "语言",
    themeToDayAria: "切换到白天模式",
    themeToNightAria: "切换到黑夜模式",
    railAria: "侧边栏",
    socialAria: "社交媒体",
    footerNavAria: "页脚导航",
    footerSections: "栏目",
    footerNote: "关注人工生命与机器心智，做一些可以走进去的东西。",
    footerAbout: "关于",
    footerContact: "一起聊聊",
  },
  en: {
    brand: "Artificial Life, Minds & Interaction",
    nav: { focus: "Focus", projects: "Projects", blog: "Writing" },
    navAria: "Main navigation",
    langAria: "Language",
    themeToDayAria: "Switch to light mode",
    themeToNightAria: "Switch to dark mode",
    railAria: "Side rail",
    socialAria: "Social channels",
    footerNavAria: "Footer navigation",
    footerSections: "Sections",
    footerNote:
      "Artificial life and machine minds — building things you can walk into.",
    footerAbout: "About",
    footerContact: "Get in touch",
  },
};

export function siteTabHref(tab: SiteTab, lang: Lang): string {
  if (tab === "projects") {
    return withSiteParams("/projects", { lang });
  }

  if (tab === "blog") {
    return IN_SITE_BLOG_ENABLED
      ? withSiteParams("/blog", { lang })
      : withSiteParams(ARTICLES_SITE_URL, { lang });
  }

  return withSiteParams("/", { lang });
}

export function siteAboutHref(lang: Lang): string {
  return withSiteParams("/?view=about", { lang });
}
