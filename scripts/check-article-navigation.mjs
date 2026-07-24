import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { getNextArticleInSource } from "../src/data/articleNavigation.ts";

const snapshotPath = fileURLToPath(
  new URL("../src/data/articles.snapshot.json", import.meta.url),
);
const articles = JSON.parse(readFileSync(snapshotPath, "utf8"));
const secondArticle = articles[1];
const nextArticle = getNextArticleInSource(
  articles,
  "large-world-agent-system",
);

if (secondArticle?.id !== "large-world-agent-system") {
  throw new Error(
    `第二篇文章应为 large-world-agent-system，实际为 ${secondArticle?.id ?? "null"}`,
  );
}

if (nextArticle?.id !== "reward-functions-01") {
  throw new Error(
    `大世界 Agent System 的下一篇长文应为 reward-functions-01，实际为 ${nextArticle?.id ?? "null"}`,
  );
}

console.log(
  "文章导航检查通过：第二篇为大世界中的 Agent System，下一篇长文为奖励函数",
);
