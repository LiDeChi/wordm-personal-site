import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { getNextArticleInSource } from "../src/data/articleNavigation.ts";

const snapshotPath = fileURLToPath(
  new URL("../src/data/articles.snapshot.json", import.meta.url),
);
const articles = JSON.parse(readFileSync(snapshotPath, "utf8"));
const nextArticle = getNextArticleInSource(articles, "reward-functions-01");

if (nextArticle?.id !== "large-world-agent-system") {
  throw new Error(
    `奖励函数的相邻长文应为 large-world-agent-system，实际为 ${nextArticle?.id ?? "null"}`,
  );
}

console.log("文章导航检查通过：奖励函数 → 大世界中的 Agent System");
