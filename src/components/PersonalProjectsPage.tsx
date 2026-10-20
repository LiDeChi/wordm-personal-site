import type { Lang } from "../i18n/lang";
import { FatherSpread } from "./FatherSpread";

/**
 * 「个人项目」页：三列阅读窗。光标在哪一列，滚轮就滚哪一列；
 * 右侧按钮列上的滚轮左右换作品。
 */

type PersonalProjectsPageProps = {
  lang: Lang;
  themeMode: "day" | "night";
  onThemeToggle: () => void;
  onLangChange: (lang: Lang) => void;
};

export function PersonalProjectsPage({
  lang,
  themeMode,
  onThemeToggle,
  onLangChange,
}: PersonalProjectsPageProps) {
  return (
    <FatherSpread
      lang={lang}
      themeMode={themeMode}
      onThemeToggle={onThemeToggle}
      onLangChange={onLangChange}
    />
  );
}
