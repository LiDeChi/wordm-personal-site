import { classifyChar } from "./charClassifier.js?v=20260307c";
import { createUniversalFontMapper } from "./universalFontMapper.js?v=20260317b";

async function fetchFontArrayBuffer(url) {
  const response = await fetch(url, { cache: "force-cache" });
  if (!response.ok) {
    throw new Error(`font fetch failed: ${url} (${response.status})`);
  }
  return response.arrayBuffer();
}

async function createMapperFromSource(source) {
  if (!source) {
    return null;
  }
  if (source instanceof ArrayBuffer) {
    return createUniversalFontMapper(source);
  }
  return createUniversalFontMapper(await fetchFontArrayBuffer(String(source)));
}

function createCompositeMapper(mappers = {}, displayName = "Runtime Font Session") {
  return {
    displayName,
    async getGlyph(char) {
      const category = classifyChar(char);
      const ordered = [];
      if (category === "han") {
        ordered.push(
          mappers.hanPrimary,
          mappers.hanFallback,
          mappers.latinPrimary,
          mappers.latinFallback,
          mappers.mathPrimary,
          mappers.mathFallback,
        );
      } else if (category === "math") {
        ordered.push(
          mappers.mathPrimary,
          mappers.mathFallback,
          mappers.latinPrimary,
          mappers.latinFallback,
          mappers.hanPrimary,
          mappers.hanFallback,
        );
      } else {
        ordered.push(
          mappers.latinPrimary,
          mappers.latinFallback,
          mappers.mathPrimary,
          mappers.mathFallback,
          mappers.hanPrimary,
          mappers.hanFallback,
        );
      }
      for (const mapper of ordered) {
        if (!mapper || typeof mapper.getGlyph !== "function") {
          continue;
        }
        const glyph = await mapper.getGlyph(char);
        if (glyph) {
          return glyph;
        }
      }
      return null;
    },
  };
}

export async function createFontSession(fontSources = {}) {
  const settled = await Promise.allSettled([
    createMapperFromSource(fontSources.latinPrimary ?? null),
    createMapperFromSource(fontSources.latinFallback ?? null),
    createMapperFromSource(fontSources.hanPrimary ?? null),
    createMapperFromSource(fontSources.hanFallback ?? null),
    createMapperFromSource(fontSources.mathPrimary ?? null),
    createMapperFromSource(fontSources.mathFallback ?? null),
  ]);

  const mappers = {
    latinPrimary: settled[0]?.status === "fulfilled" ? settled[0].value : null,
    latinFallback: settled[1]?.status === "fulfilled" ? settled[1].value : null,
    hanPrimary: settled[2]?.status === "fulfilled" ? settled[2].value : null,
    hanFallback: settled[3]?.status === "fulfilled" ? settled[3].value : null,
    mathPrimary: settled[4]?.status === "fulfilled" ? settled[4].value : null,
    mathFallback: settled[5]?.status === "fulfilled" ? settled[5].value : null,
  };
  const displayName = [mappers.latinPrimary?.displayName, mappers.hanPrimary?.displayName, mappers.mathPrimary?.displayName]
    .filter(Boolean)
    .join(" + ") || "Runtime Font Session";

  return {
    displayName,
    mappers,
    universalFontMapper:
      mappers.latinPrimary ||
      mappers.latinFallback ||
      mappers.hanPrimary ||
      mappers.hanFallback ||
      mappers.mathPrimary ||
      mappers.mathFallback
        ? createCompositeMapper(mappers, displayName)
        : null,
  };
}
