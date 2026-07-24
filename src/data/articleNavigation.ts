export type ArticleNavigationItem = {
  id: string;
  source?: string;
};

export function getNextArticleInSource<
  T extends ArticleNavigationItem,
>(articles: readonly T[], activeArticleId: string): T | null {
  const activeIndex = articles.findIndex(
    (article) => article.id === activeArticleId,
  );
  if (activeIndex < 0) return null;

  const activeSource = articles[activeIndex]?.source ?? "site";
  return (
    articles
      .slice(activeIndex + 1)
      .find((article) => (article.source ?? "site") === activeSource) ?? null
  );
}
