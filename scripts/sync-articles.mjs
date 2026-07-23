import {
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const sourceIndex = args.indexOf("--source");
const sourceInput =
  sourceIndex >= 0 && args[sourceIndex + 1]
    ? resolve(args[sourceIndex + 1])
    : null;
const manifestUrl = "https://lidechi.github.io/12-Articles/articles.json";
const targetPath = join(projectRoot, "src/data/articles.snapshot.json");

async function readManifest() {
  if (sourceInput) {
    const sourcePath = statSync(sourceInput).isDirectory()
      ? join(sourceInput, "_site/articles.json")
      : sourceInput;
    return {
      source: sourcePath,
      value: JSON.parse(readFileSync(sourcePath, "utf8")),
    };
  }

  const response = await fetch(manifestUrl, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Article manifest request failed: ${response.status}`);
  }
  return {
    source: manifestUrl,
    value: await response.json(),
  };
}

function validateManifest(value) {
  if (!Array.isArray(value) || !value.length) {
    throw new Error("Article manifest must be a non-empty array.");
  }

  const ids = new Set();
  for (const article of value) {
    if (
      !article ||
      typeof article !== "object" ||
      typeof article.id !== "string" ||
      typeof article.title?.zh !== "string" ||
      typeof article.title?.en !== "string"
    ) {
      throw new Error("Article manifest contains an invalid article.");
    }
    if (ids.has(article.id)) {
      throw new Error(`Article manifest contains duplicate id: ${article.id}`);
    }
    ids.add(article.id);
  }
}

const manifest = await readManifest();
validateManifest(manifest.value);
writeFileSync(
  targetPath,
  `${JSON.stringify(manifest.value, null, 2)}\n`,
  "utf8",
);
console.log(
  `Synced ${manifest.value.length} articles from ${manifest.source} to src/data/articles.snapshot.json`,
);
