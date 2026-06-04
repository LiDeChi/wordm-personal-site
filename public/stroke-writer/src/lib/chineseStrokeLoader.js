import { CHINESE_FALLBACK } from "../data/chineseFallback.js";
import { sampleSvgPath } from "./svgPathSampler.js";

const HANZI_CDN_BASE = "https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0";
const HANZI_COORDINATE_SCALE = 1024;
const HANZI_TOP_Y = 900;
const HANZI_TOP_Y_NORMALIZED = HANZI_TOP_Y / HANZI_COORDINATE_SCALE;
const cache = new Map();

function simplifyStroke(stroke) {
  if (stroke.length < 3) {
    return stroke;
  }

  const simplified = [stroke[0]];
  for (let i = 1; i < stroke.length; i += 1) {
    const prev = simplified[simplified.length - 1];
    const current = stroke[i];
    const dx = current.x - prev.x;
    const dy = current.y - prev.y;
    if (dx * dx + dy * dy > 0.00005) {
      simplified.push(current);
    }
  }
  return simplified;
}

function smoothStroke(stroke) {
  if (stroke.length < 4) {
    return stroke;
  }

  const output = [stroke[0]];
  for (let i = 1; i < stroke.length - 1; i += 1) {
    const prev = stroke[i - 1];
    const current = stroke[i];
    const next = stroke[i + 1];
    output.push({
      x: (prev.x + current.x * 2 + next.x) / 4,
      y: (prev.y + current.y * 2 + next.y) / 4,
    });
  }
  output.push(stroke[stroke.length - 1]);
  return output;
}

function normalizeMedians(entry) {
  if (!Array.isArray(entry.medians) || entry.medians.length === 0) {
    return [];
  }

  let maxCoordinate = 0;
  for (const stroke of entry.medians) {
    for (const [x, y] of stroke) {
      if (Number.isFinite(x)) {
        maxCoordinate = Math.max(maxCoordinate, Math.abs(x));
      }
      if (Number.isFinite(y)) {
        maxCoordinate = Math.max(maxCoordinate, Math.abs(y));
      }
    }
  }
  const useRawCoordinates = maxCoordinate > 2;

  return entry.medians
    .map((stroke) =>
      stroke
        .map((point) => {
          const [xRaw, yRaw] = point;
          if (!Number.isFinite(xRaw) || !Number.isFinite(yRaw)) {
            return null;
          }

          if (useRawCoordinates) {
            return {
              x: xRaw / HANZI_COORDINATE_SCALE,
              // make-me-a-hanzi / hanzi-writer: y decreases downward, top is near 900.
              y: (HANZI_TOP_Y - yRaw) / HANZI_COORDINATE_SCALE,
            };
          }

          return {
            x: xRaw,
            // fallback data in this repo is pre-scaled legacy medians (y/1024).
            y: HANZI_TOP_Y_NORMALIZED - yRaw,
          };
        })
        .filter((point) => point !== null)
        .filter(
          (point) =>
            Number.isFinite(point.x) &&
            Number.isFinite(point.y) &&
            point.x >= -0.2 &&
            point.x <= 1.2 &&
            point.y >= -0.2 &&
            point.y <= 1.4,
        )
        .filter((point, index, array) => {
          if (index === 0 || index === array.length - 1) {
            return true;
          }
          return Number.isFinite(point.x) && Number.isFinite(point.y);
        }),
    )
    .map((stroke) => smoothStroke(simplifyStroke(stroke)))
    .filter((stroke) => stroke.length >= 2);
}

function normalizePathStrokes(entry, samplingStep) {
  if (!Array.isArray(entry.strokes) || entry.strokes.length === 0) {
    return [];
  }

  return entry.strokes
    .map((pathData) => sampleSvgPath(pathData, samplingStep))
    .filter((stroke) => stroke.length >= 2);
}

function normalizeStrokeData(entry, samplingStep) {
  const medianPoints = normalizeMedians(entry);
  const points = medianPoints.length
    ? medianPoints
    : normalizePathStrokes(entry, samplingStep);
  const strokePaths =
    Array.isArray(entry.strokes) && entry.strokes.every((item) => typeof item === "string")
      ? entry.strokes
      : null;

  return {
    advance: 1.06,
    strokes: points,
    strokePaths,
    pathScale: 1024,
    source: entry.source,
  };
}

async function loadFromRemote(char) {
  const encodedChar = encodeURIComponent(char);
  const url = `${HANZI_CDN_BASE}/${encodedChar}.json`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Remote Hanzi not found for "${char}"`);
  }
  const payload = await response.json();
  return {
    medians: payload.medians,
    strokes: payload.strokes,
    source: "remote",
  };
}

export async function loadChineseGlyph(char, options = {}) {
  const allowRemote = options.allowRemote ?? true;
  const samplingStep = options.samplingStep ?? 28;

  if (cache.has(char)) {
    return cache.get(char);
  }

  let rawEntry = null;

  if (allowRemote) {
    try {
      rawEntry = await loadFromRemote(char);
    } catch (error) {
      if (CHINESE_FALLBACK[char]) {
        rawEntry = {
          ...CHINESE_FALLBACK[char],
          source: "fallback",
        };
      } else {
        rawEntry = null;
      }
    }
  } else if (CHINESE_FALLBACK[char]) {
    rawEntry = {
      ...CHINESE_FALLBACK[char],
      source: "fallback",
    }
  }

  if (!rawEntry) {
    return null;
  }

  const normalized = normalizeStrokeData(rawEntry, samplingStep);
  cache.set(char, normalized);
  return normalized;
}
