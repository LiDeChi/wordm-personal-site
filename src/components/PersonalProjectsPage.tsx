import type { BlogArticle } from "../data/blogArticles";
import type { Lang } from "../i18n/lang";
import { FatherSpread, type ReaderSurface } from "./FatherSpread";

/** The entrance and both reading surfaces keep the same desk instance. */
type PersonalProjectsPageProps = {
  surface: ReaderSurface;
  onSurfaceChange: (surface: ReaderSurface) => void;
  onArticleOpen: (articleId: string) => void;
  lang: Lang;
  themeMode: "day" | "night";
  onThemeToggle: () => void;
  onLangChange: (lang: Lang) => void;
  articles: BlogArticle[];
};

export function PersonalProjectsPage(props: PersonalProjectsPageProps) {
  return <FatherSpread {...props} />;
}
