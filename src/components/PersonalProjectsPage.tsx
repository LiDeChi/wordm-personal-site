import type { BlogArticle } from "../data/blogArticles";
import type { Lang } from "../i18n/lang";
import { FatherSpread } from "./FatherSpread";

/** Project and article sheets share the desk and its global controls. */
type PersonalProjectsPageProps = {
  lang: Lang;
  themeMode: "day" | "night";
  onThemeToggle: () => void;
  onLangChange: (lang: Lang) => void;
  articles: BlogArticle[];
};

export function PersonalProjectsPage(props: PersonalProjectsPageProps) {
  return <FatherSpread {...props} />;
}
