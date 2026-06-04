import { classifyChar } from "./charClassifier.js?v=20260307c";
import { loadChineseGlyph } from "./chineseStrokeLoader.js?v=20260307c";
import { isLatexMathLine, layoutLatexMathLine } from "./latexMathLayout.js?v=20260319c";
import { layoutLatexMathLineWithKatex } from "./katexDomLayout.js?v=20260307c";
import { getFormulaGlyph, getLatinMathGlyph, hasFormulaGlyph } from "./latinMathStrokeFont.js?v=20260319d";
import { createPageStructurePlanner } from "./pageStructurePlanner.js?v=20260316a";

const MARKER_SECTION = "[[SECTION]]";
const MARKER_SUBSECTION = "[[SUBSECTION]]";
const MARKER_CENTER_START = "[[CENTER_START]]";
const MARKER_CENTER_END = "[[CENTER_END]]";
const MARKER_MULTICOL_BREAK = "[[MCOL_BREAK]]";
const MARKER_MULTICOL_END = "[[MCOL_END]]";
const MARKER_PAR_BREAK = "[[PAR_BREAK]]";
const MARKER_PAGE_BREAK = "[[PAGE_BREAK]]";
const MARKER_FIG_IMAGE = "[图]";
const MARKER_FIG_FORMULA = "[图公式]";
const MARKER_POSITION_PREFIX = "[[POS:";
const MARKER_GAP_PREFIX = "[[GAP:";

const LEADING_LINE_PUNCTUATION = new Set([
  ",",
  ".",
  ":",
  ";",
  "!",
  "?",
  "%",
  "，",
  "。",
  "、",
  "：",
  "；",
  "！",
  "？",
  "）",
  "】",
  "》",
  "”",
  "’",
]);

const OPENING_PUNCTUATION = new Set([
  "(",
  "[",
  "{",
  "（",
  "【",
  "《",
  "“",
  "‘",
]);

function isLeadingLinePunctuation(char) {
  return LEADING_LINE_PUNCTUATION.has(char);
}

function isOpeningPunctuation(char) {
  return OPENING_PUNCTUATION.has(char);
}

function parseMulticolStartMarker(lineText) {
  const text = String(lineText ?? "").trim();
  const match = text.match(/^\[\[MCOL_START:(\d+)\]\]$/);
  if (!match) {
    return null;
  }
  return Math.max(1, Number(match[1]) || 2);
}

function parsePositionMarker(lineText) {
  const text = String(lineText ?? "").trim();
  if (!text.startsWith(MARKER_POSITION_PREFIX) || !text.endsWith("]]")) {
    return null;
  }
  const payload = text.slice(MARKER_POSITION_PREFIX.length, -2);
  const parts = payload.split(",").map((part) => Number.parseFloat(part.trim()));
  if (parts.length !== 2 || !Number.isFinite(parts[0]) || !Number.isFinite(parts[1])) {
    return null;
  }
  return { x: parts[0], y: parts[1] };
}

function parseGapMarker(lineText) {
  const text = String(lineText ?? "").trim();
  if (!text.startsWith(MARKER_GAP_PREFIX) || !text.endsWith("]]")) {
    return null;
  }
  const payload = Number.parseFloat(text.slice(MARKER_GAP_PREFIX.length, -2).trim());
  if (!Number.isFinite(payload)) {
    return null;
  }
  return Math.max(0, payload);
}

function isHeadingMarkerLine(lineText) {
  const text = String(lineText ?? "").trim();
  return text.startsWith(`${MARKER_SECTION} `) || text.startsWith(`${MARKER_SUBSECTION} `);
}

function isCompactBoardNoteLine(lineText, options = {}) {
  if (!options.boardLectureMode) {
    return false;
  }

  const text = String(lineText ?? "").trim();
  if (!text || text.length > 28) {
    return false;
  }

  if (
    isHeadingMarkerLine(text) ||
    text === MARKER_PAR_BREAK ||
    text === MARKER_PAGE_BREAK ||
    text === MARKER_CENTER_START ||
    text === MARKER_CENTER_END ||
    text === MARKER_MULTICOL_BREAK ||
    text === MARKER_MULTICOL_END ||
    parseMulticolStartMarker(text) ||
    parsePositionMarker(text) ||
    parseGapMarker(text) != null ||
    parseFigureSketchKinds(text) ||
    isAsciiTableRuleLine(text) ||
    parseAsciiTableRowLine(text) ||
    isLatexMathLine(text)
  ) {
    return false;
  }

  const hanCount = (text.match(/[\p{Script=Han}]/gu) || []).length;
  const asciiLetterCount = (text.match(/[A-Za-z]/g) || []).length;
  const digitCount = (text.match(/\d/g) || []).length;
  const mathMarkCount = (text.match(/[=+\-*/<>^_\\]/g) || []).length;
  const prosePunctuation = /[，。；：、！？（）,.!?;:]/.test(text);

  if (mathMarkCount > Math.max(1, Math.floor(text.length * 0.08))) {
    return false;
  }

  if (digitCount > Math.max(1, Math.floor(text.length * 0.2))) {
    return false;
  }

  return hanCount >= 2 || prosePunctuation || (asciiLetterCount >= 4 && mathMarkCount === 0);
}

function shouldAutoBoardLectureColumns(lines, options = {}) {
  if (!options.boardLectureMode || !options.documentLayoutMode) {
    return false;
  }
  if (lines.some((line) => parseMulticolStartMarker(line) || String(line ?? "").trim() === MARKER_MULTICOL_END)) {
    return false;
  }

  const meaningful = lines
    .map((line) => String(line ?? "").trim())
    .filter(Boolean)
    .filter(
      (line) =>
        !line.startsWith(MARKER_POSITION_PREFIX) &&
        !line.startsWith(MARKER_GAP_PREFIX) &&
        line !== MARKER_PAR_BREAK &&
        line !== MARKER_PAGE_BREAK,
    );

  if (meaningful.length < 5) {
    return false;
  }

  const totalBodyWeight = meaningful.reduce((sum, line) => sum + Math.max(1, Math.ceil(line.length / 10)), 0);
  const hasEnoughMaterialForColumns = meaningful.length >= 10 || totalBodyWeight >= 110;
  if (!hasEnoughMaterialForColumns) {
    return false;
  }

  const mathLines = meaningful.filter(
    (line) =>
      !line.startsWith(`${MARKER_SECTION} `) &&
      !line.startsWith(`${MARKER_SUBSECTION} `) &&
      isLatexMathLine(line),
  ).length;
  const proseLines = meaningful.filter(
    (line) =>
      !line.startsWith(`${MARKER_SECTION} `) &&
      !line.startsWith(`${MARKER_SUBSECTION} `) &&
      !isLatexMathLine(line),
  ).length;

  return mathLines >= 4 && mathLines / meaningful.length >= 0.5 && mathLines >= proseLines * 1.4;
}

function injectBoardLectureColumns(lines) {
  const result = [];
  const totalBodyWeight = lines.reduce((sum, line) => {
    const trimmed = String(line ?? "").trim();
    const isEligible =
      trimmed &&
      !trimmed.startsWith(`${MARKER_SECTION} `) &&
      !trimmed.startsWith(`${MARKER_SUBSECTION} `) &&
      !trimmed.startsWith(MARKER_POSITION_PREFIX) &&
      !trimmed.startsWith(MARKER_GAP_PREFIX) &&
      trimmed !== MARKER_PAR_BREAK &&
      trimmed !== MARKER_PAGE_BREAK &&
      trimmed !== MARKER_MULTICOL_END &&
      !parseMulticolStartMarker(trimmed);
    if (!isEligible) {
      return sum;
    }
    return sum + Math.max(1, Math.ceil(trimmed.length / 10));
  }, 0);
  const breakAtWeight = Math.max(1, Math.ceil(totalBodyWeight * 0.42));
  let inserted = false;
  let insertedBreak = false;
  let bodyWeight = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    const trimmed = String(rawLine ?? "").trim();
    const nextTrimmed = String(lines[index + 1] ?? "").trim();
    const previousTrimmed = String(lines[index - 1] ?? "").trim();
    const isBodyLine =
      trimmed &&
      !trimmed.startsWith(`${MARKER_SECTION} `) &&
      !trimmed.startsWith(`${MARKER_SUBSECTION} `) &&
      !trimmed.startsWith(MARKER_POSITION_PREFIX) &&
      !trimmed.startsWith(MARKER_GAP_PREFIX) &&
      trimmed !== MARKER_PAR_BREAK &&
      trimmed !== MARKER_PAGE_BREAK &&
      trimmed !== MARKER_MULTICOL_END &&
      !parseMulticolStartMarker(trimmed);

    if (trimmed.startsWith(`${MARKER_SECTION} `) || trimmed.startsWith(`${MARKER_SUBSECTION} `)) {
      result.push(rawLine);
      if (!inserted && !isCompactBoardNoteLine(nextTrimmed, { boardLectureMode: true })) {
        result.push("[[MCOL_START:2]]");
        inserted = true;
      }
      continue;
    }
    if (
      !inserted &&
      isCompactBoardNoteLine(trimmed, { boardLectureMode: true }) &&
      isHeadingMarkerLine(previousTrimmed)
    ) {
      result.push(rawLine);
      result.push("[[MCOL_START:2]]");
      inserted = true;
      continue;
    }
    if (!inserted && isBodyLine) {
      result.push("[[MCOL_START:2]]");
      inserted = true;
    }
    if (inserted && !insertedBreak && isBodyLine && bodyWeight >= breakAtWeight) {
      result.push(MARKER_MULTICOL_BREAK);
      insertedBreak = true;
    }

    result.push(rawLine);

    if (isBodyLine) {
      bodyWeight += Math.max(1, Math.ceil(trimmed.length / 10));
    }
  }

  if (inserted) {
    result.push(MARKER_MULTICOL_END);
  }
  return result;
}

function parseStyledLine(lineText, baseFontSize, options = {}) {
  const documentLayoutMode = Boolean(options.documentLayoutMode);
  const boardLectureMode = Boolean(options.boardLectureMode);
  const text = String(lineText ?? "");
  if (text.startsWith(`${MARKER_SECTION} `)) {
    return {
      text: text.slice(`${MARKER_SECTION} `.length).trim(),
      fontSize: baseFontSize * 1.28,
      lineScale: documentLayoutMode ? (boardLectureMode ? 1.24 : 1.18) : 1.24,
      afterGap: documentLayoutMode ? (boardLectureMode ? 0.22 : 0.06) : 0.34,
    };
  }
  if (text.startsWith(`${MARKER_SUBSECTION} `)) {
    return {
      text: text.slice(`${MARKER_SUBSECTION} `.length).trim(),
      fontSize: baseFontSize * 1.14,
      lineScale: documentLayoutMode ? (boardLectureMode ? 1.18 : 1.14) : 1.16,
      afterGap: documentLayoutMode ? (boardLectureMode ? 0.1 : 0.04) : 0.28,
    };
  }
  return {
    text,
    fontSize: baseFontSize,
    lineScale: documentLayoutMode ? (boardLectureMode ? 1.3 : 1.22) : 1.22,
    afterGap: documentLayoutMode ? (boardLectureMode ? 0.1 : 0.08) : 0.12,
  };
}

function parseFigureSketchKinds(lineText) {
  const text = String(lineText ?? "");
  const hasImage = text.includes(MARKER_FIG_IMAGE);
  const hasFormula = text.includes(MARKER_FIG_FORMULA);
  if (!hasImage && !hasFormula) {
    return null;
  }
  if (hasImage && hasFormula) {
    return text.indexOf(MARKER_FIG_IMAGE) <= text.indexOf(MARKER_FIG_FORMULA)
      ? ["image", "formula"]
      : ["formula", "image"];
  }
  return [hasImage ? "image" : "formula"];
}

function isAsciiTableRuleLine(lineText) {
  const text = String(lineText ?? "").trim();
  return /^\+(?:-+\+)+$/.test(text);
}

function parseAsciiTableRowLine(lineText) {
  const text = String(lineText ?? "").trim();
  if (!/^\|(?:[^|]*\|)+$/.test(text)) {
    return null;
  }

  const parts = text.split("|");
  if (parts.length < 3 || parts[0] !== "" || parts.at(-1) !== "") {
    return null;
  }
  return parts.slice(1, -1).map((cell) => cell.trim());
}

function parseAsciiTableBlock(lines, startIndex) {
  if (!isAsciiTableRuleLine(lines[startIndex])) {
    return null;
  }

  const rows = [];
  let index = startIndex + 1;
  let sawClosingRule = false;

  while (index < lines.length) {
    const row = parseAsciiTableRowLine(lines[index]);
    if (!row) {
      break;
    }
    rows.push(row);
    index += 1;

    if (!isAsciiTableRuleLine(lines[index])) {
      break;
    }
    sawClosingRule = true;
    index += 1;
  }

  if (!rows.length || !sawClosingRule) {
    return null;
  }

  return {
    rows,
    lineCount: index - startIndex,
  };
}

function mulberry32(seed) {
  let t = seed + 0x6d2b79f5;
  return function random() {
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashCode(input) {
  let hash = 2166136261;
  for (const char of input) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function clampValue(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeMathPresentationChar(char) {
  const raw = String(char ?? "");
  if (!raw) {
    return raw;
  }
  if (raw === "ℒ") {
    return raw;
  }
  const normalized = raw.normalize("NFKD");
  if (!normalized) {
    return raw;
  }

  const asciiOnly = normalized.replace(/[^\u0000-\u007f]/g, "");
  if (asciiOnly.length === 1 && /[A-Za-z0-9]/.test(asciiOnly)) {
    return asciiOnly;
  }
  if (asciiOnly.length === 1 && /[+\-*/=<>()[\]{}.,:;!?|\\]/.test(asciiOnly)) {
    return asciiOnly;
  }
  return raw;
}

function createCharTransform(char, charIndex, category, isScript, lockShape = false, extraSoftness = 1) {
  if (lockShape) {
    return {
      scaleX: 1,
      scaleY: 1,
      slant: 0,
      offsetX: 0,
      offsetY: 0,
    };
  }

  const random = mulberry32(hashCode(`${char}:${charIndex}`));
  const softnessBase =
    category === "han"
      ? 0.28
      : category === "latin"
        ? 0.12
      : category === "math"
          ? 0.14
          : 0.42;
  const softness = softnessBase * clampValue(extraSoftness, 0.5, 3.2);
  const scriptFactor = isScript ? 0.75 : 1;

  return {
    scaleX: 1 + (random() - 0.5) * 0.024 * softness * scriptFactor,
    scaleY: 1 + (random() - 0.5) * 0.032 * softness * scriptFactor,
    slant: (random() - 0.5) * 0.045 * softness * scriptFactor,
    offsetX: (random() - 0.5) * 0.015 * softness,
    offsetY: (random() - 0.5) * 0.022 * softness,
  };
}

function transformUnitPoint(point, transform) {
  const centeredY = point.y - 0.5;
  const x = point.x * transform.scaleX + centeredY * transform.slant + transform.offsetX;
  const y = point.y * transform.scaleY + transform.offsetY;
  return { x, y };
}

function pushGlyphStrokes(target, payload) {
  const {
    glyph,
    char,
    category,
    charIndex,
    cursorX,
    cursorY,
    fontSize,
    penWidth,
    isScript,
    scriptType,
    transform,
    finalizeDisabled,
    isUniversalGlyph,
    mathStyle,
    mathMicroVariance,
    charAdvance,
    layoutLocked,
  } = payload;

  const strokeCount = glyph.strokes.length;
  for (let strokeIndex = 0; strokeIndex < strokeCount; strokeIndex += 1) {
    const stroke = glyph.strokes[strokeIndex];
    const points = stroke
      .map((point) => transformUnitPoint(point, transform))
      .map((point) => ({
        x: cursorX + point.x * fontSize,
        y: cursorY + point.y * fontSize,
      }));
    const outlinePathData =
      category === "han" && Array.isArray(glyph.strokePaths)
        ? glyph.strokePaths[strokeIndex] ?? null
        : null;

    if (points.length >= 2) {
      target.push({
        char,
        category,
        charIndex,
        strokeIndexInChar: strokeIndex,
        strokeCountInChar: strokeCount,
        isScript,
        scriptType,
        width: penWidth,
        points,
        outlinePathData,
        outlinePathScale: glyph.pathScale ?? 1024,
        outlineX: cursorX,
        outlineY: cursorY,
        outlineSize: fontSize,
        charX: cursorX,
        charY: cursorY,
        charFontSize: fontSize,
        charAdvance: Number.isFinite(charAdvance) ? charAdvance : glyph.advance,
        finalizeDisabled: Boolean(finalizeDisabled),
        isUniversalGlyph: Boolean(isUniversalGlyph),
        layoutLocked: Boolean(layoutLocked),
        mathStyle: mathStyle ?? null,
        mathMicroVariance: Number.isFinite(mathMicroVariance) ? mathMicroVariance : 0,
      });
    }
  }
}

function createPlaceholderGlyph() {
  return {
    advance: 0.78,
    strokes: [
      [
        { x: 0.48, y: 0.52 },
        { x: 0.52, y: 0.52 },
      ],
    ],
  };
}

function measureGlyphBounds(glyph, transform = null) {
  const strokes = glyph?.strokes;
  if (!Array.isArray(strokes) || strokes.length === 0) {
    return null;
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const stroke of strokes) {
    if (!Array.isArray(stroke)) {
      continue;
    }
    for (const point of stroke) {
      if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
        continue;
      }
      const resolved = transform ? transformUnitPoint(point, transform) : point;
      minX = Math.min(minX, resolved.x);
      maxX = Math.max(maxX, resolved.x);
      minY = Math.min(minY, resolved.y);
      maxY = Math.max(maxY, resolved.y);
    }
  }

  if (!Number.isFinite(minX) || !Number.isFinite(maxX)) {
    return null;
  }

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: Math.max(0, maxX - minX),
    height: Math.max(0.001, maxY - minY),
  };
}

function isLatinAlnumChar(char) {
  return /^[A-Za-z0-9]$/.test(char);
}

function normalizeLatinAdvanceAndOffset(char, glyph, options = {}) {
  const bounds = measureGlyphBounds(glyph, options.transform ?? null);
  if (!bounds) {
    return null;
  }

  const isUpper = /^[A-Z]$/.test(char);
  const isDigit = /^[0-9]$/.test(char);
  const isNarrow = /[ilIjtfr1]/.test(char);
  const targetLeftBearing = isNarrow ? 0.2 : isUpper ? 0.16 : isDigit ? 0.17 : 0.18;
  const sidePad = isNarrow ? 0.14 : isUpper ? 0.15 : isDigit ? 0.16 : 0.18;
  const opticalAdvance = bounds.width + sidePad * 2;
  const rawAdvance = Number(glyph?.advance) || opticalAdvance;
  const blendRaw = isNarrow ? 0.54 : isUpper ? 0.66 : isDigit ? 0.64 : 0.62;
  let normalizedAdvance = rawAdvance * blendRaw + opticalAdvance * (1 - blendRaw);

  if (/[mwMW]/.test(char)) {
    normalizedAdvance += 0.02;
  }

  normalizedAdvance = clampValue(
    normalizedAdvance,
    isNarrow ? 0.42 : isUpper ? 0.7 : isDigit ? 0.64 : 0.56,
    isUpper ? 1.14 : isDigit ? 1.08 : 1.02,
  );

  return {
    cursorXShift: clampValue(
      (targetLeftBearing - bounds.minX) * (options.fontSize ?? 1),
      -(options.fontSize ?? 1) * (isNarrow ? 0.48 : 0.28),
      (options.fontSize ?? 1) * (isNarrow ? 0.18 : 0.14),
    ),
    advance: normalizedAdvance,
  };
}

function estimateTextWidth(text, fontSize) {
  let width = 0;
  const chars = Array.from(String(text ?? ""));
  for (const char of chars) {
    const category = classifyChar(char);
    if (category === "space") {
      width += fontSize * 0.32;
    } else if (category === "han") {
      width += fontSize * 0.94;
    } else if (category === "math") {
      width += fontSize * 0.68;
    } else {
      width += fontSize * 0.62;
    }
  }
  if (chars.length > 1) {
    width += (chars.length - 1) * fontSize * 0.06;
  }
  return width;
}

function shouldFallbackHeavyFormulaSkeletonGlyph(char, category, universalGlyph, builtinGlyph) {
  if (!char || category === "han" || !universalGlyph || !builtinGlyph) {
    return false;
  }

  if (
    char === "1" ||
    char === "2" ||
    char === "a" ||
    char === "n" ||
    char === "A" ||
    char === "b" ||
    char === "k" ||
    char === "s" ||
    char === "e"
  ) {
    return true;
  }

  if (!/^[A-Za-z0-9]$/.test(char)) {
    return false;
  }

  const skeletonCount = Array.isArray(universalGlyph.skeletonStrokes) && universalGlyph.skeletonStrokes.length
    ? universalGlyph.skeletonStrokes.length
    : Array.isArray(universalGlyph.strokes)
      ? universalGlyph.strokes.length
      : 0;
  const builtinCount = Array.isArray(builtinGlyph.strokes) ? builtinGlyph.strokes.length : 0;

  if (skeletonCount < 5 || builtinCount < 1) {
    return false;
  }

  const ratio = skeletonCount / builtinCount;
  return ratio >= 2.6;
}

function isLatinWordChar(char) {
  return /[A-Za-z0-9'’\-]/.test(char);
}

function latinPairTightenOffset(prevChar, currChar, fontSize, options = {}) {
  const prev = String(prevChar ?? "").toLowerCase();
  const curr = String(currChar ?? "").toLowerCase();
  if (!/^[a-z0-9]$/.test(prev) || !/^[a-z0-9]$/.test(curr)) {
    return 0;
  }

  const pair = `${prev}${curr}`;
  let factor = 0;

  if (pair === "jk") {
    factor = Math.max(factor, 0.055);
  }
  if (pair === "lm") {
    factor = Math.max(factor, 0.082);
  }
  if (pair === "ij") {
    factor = Math.max(factor, 0.038);
  }

  if (/[ijlrtf1]/.test(prev) && /^[a-z0-9]$/.test(curr)) {
    factor = Math.max(factor, 0.024);
  }
  if (/[ijl]/.test(prev) && /[mwnhbk]/.test(curr)) {
    factor = Math.max(factor, 0.044);
  }

  const docScale = options.documentLayoutMode ? 0.94 : 1;
  const offset = fontSize * factor * docScale;
  return clampValue(offset, 0, fontSize * 0.11);
}

const BUILTIN_PREFERRED_CHARS = new Set([
  ".",
  ",",
  ":",
  ";",
  "!",
  "?",
  "\"",
  "'",
  "(",
  ")",
  "[",
  "]",
  "{",
  "}",
  "|",
  "+",
  "-",
  "=",
  "<",
  ">",
  "≤",
  "≥",
  "≠",
  "≈",
  "±",
  "×",
  "÷",
  "√",
  "∑",
  "Σ",
  "∫",
  "π",
  "∞",
  "∂",
  "∆",
  "→",
  "←",
  "^",
  "_",
  "/",
  "\\",
  "*",
  "·",
  "、",
  "，",
  "。",
  "：",
  "；",
  "（",
  "）",
  "【",
  "】",
  "“",
  "”",
  "‘",
  "’",
  "《",
  "》",
  "？",
  "！",
]);

const HARD_BUILTIN_CHARS = new Set([
  ".",
  ",",
  ":",
  ";",
  "!",
  "?",
  "。",
  "，",
  "、",
  "：",
  "；",
  "！",
  "？",
  "\"",
  "'",
  "“",
  "”",
  "‘",
  "’",
  "《",
  "》",
  "(",
  ")",
  "[",
  "]",
  "{",
  "}",
  "|",
  "+",
  "-",
  "=",
  "<",
  ">",
  "≤",
  "≥",
  "≠",
  "≈",
  "±",
  "×",
  "÷",
  "√",
  "∑",
  "Σ",
  "∫",
  "π",
  "∞",
  "∂",
  "∆",
  "→",
  "←",
  "^",
  "_",
  "/",
  "\\",
  "*",
  "·",
]);

const UNIVERSAL_UNSTABLE_ASCII = new Set(["B", "a", "d", "o", "g", "j", "q", "x", "X"]);

function createCharSet(chars) {
  return new Set(Array.from(String(chars ?? "")));
}

const DEFAULT_LATIN_MIN_SCORE_BY_CHAR = Object.freeze({
  e: 0.66,
  E: 0.66,
  m: 0.68,
  n: 0.67,
  r: 0.66,
  u: 0.67,
  v: 0.67,
  w: 0.7,
});

const LATIN_HANDWRITING_MIN_SCORE_BY_CHAR = Object.freeze({
  ...DEFAULT_LATIN_MIN_SCORE_BY_CHAR,
  h: 0.66,
  k: 0.66,
  x: 0.66,
  y: 0.68,
});

const ZH_MIXED_LATIN_MIN_SCORE_BY_CHAR = Object.freeze({
  ...DEFAULT_LATIN_MIN_SCORE_BY_CHAR,
  h: 0.68,
  k: 0.68,
  x: 0.68,
  y: 0.7,
});

const UNIVERSAL_LATIN_PROFILE_BASE = Object.freeze({
  name: "default",
  minScore: 0.6,
  minScoreByChar: DEFAULT_LATIN_MIN_SCORE_BY_CHAR,
  minLowerCharScore: 0.58,
  minUpperCharScore: 0.6,
  minDigitCharScore: 0.58,
  maxLowerStrokeCount: 4,
  maxUpperStrokeCount: 5,
  maxDigitStrokeCount: 4,
  minLowerHeight: 0.18,
  minUpperHeight: 0.24,
  minDigitHeight: 0.2,
  minAspect: 0.15,
  maxAspect: 3.4,
  maxTinyRatio: 0.78,
  maxDetachedTinyRatio: 0.72,
  maxOutOfBoundsShare: 0.2,
  maxTotalLength: 5.2,
  hardFallbackChars: createCharSet("BdgjqxX"),
  allowContour: false,
  softnessMultiplier: 1.2,
  widthScale: 0.86,
  baselineNudge: 0.09,
  advanceScale: 0.97,
  letterSpacingFactor: 0.98,
  runFallbackLength: 3,
  runMinMappedShare: 0.72,
  runLowMarginThreshold: 0.048,
  runMaxWeakShare: 0.38,
  runMinAverageMargin: 0.06,
  runHardFallbackChars: createCharSet("BdgjqxX"),
});

function mergeUniversalLatinProfile(overrides = {}) {
  const merged = {
    ...UNIVERSAL_LATIN_PROFILE_BASE,
    ...overrides,
  };
  if (overrides.hardFallbackChars) {
    merged.hardFallbackChars = new Set(overrides.hardFallbackChars);
  } else {
    merged.hardFallbackChars = new Set(UNIVERSAL_LATIN_PROFILE_BASE.hardFallbackChars);
  }
  if (overrides.runHardFallbackChars) {
    merged.runHardFallbackChars = new Set(overrides.runHardFallbackChars);
  } else {
    merged.runHardFallbackChars = new Set(UNIVERSAL_LATIN_PROFILE_BASE.runHardFallbackChars);
  }
  merged.minScoreByChar = {
    ...(UNIVERSAL_LATIN_PROFILE_BASE.minScoreByChar ?? {}),
    ...(overrides.minScoreByChar ?? {}),
  };
  return merged;
}

function resolveUniversalLatinProfile(fontDisplayName, options = {}) {
  const name = String(fontDisplayName ?? "").toLowerCase();
  const forceUniversalAll = Boolean(options.forceUniversalAll);
  const preferUniversalLatinMath = Boolean(options.preferUniversalLatinMath);

  let profile = mergeUniversalLatinProfile();

  if (/patrick\s*hand|architects\s*daughter|kalam|indie\s*flower/.test(name)) {
    profile = mergeUniversalLatinProfile({
      name: "latin-handwriting",
      minScore: 0.48,
      minScoreByChar: LATIN_HANDWRITING_MIN_SCORE_BY_CHAR,
      minLowerCharScore: 0.46,
      minUpperCharScore: 0.48,
      minDigitCharScore: 0.44,
      hardFallbackChars: createCharSet(""),
      softnessMultiplier: 1.15,
      widthScale: 0.88,
      baselineNudge: 0.086,
      advanceScale: 0.98,
      letterSpacingFactor: 1.0,
      maxTinyRatio: 0.92,
      maxOutOfBoundsShare: 0.3,
      runMinMappedShare: 0.45,
      runLowMarginThreshold: 0.022,
      runMaxWeakShare: 0.72,
      runMinAverageMargin: 0.018,
      runHardFallbackChars: createCharSet(""),
    });
  } else if (/wenkai|zcool|mashanzheng|source\s*han|noto\s*sans\s*cjk|noto\s*serif\s*cjk/.test(name)) {
    profile = mergeUniversalLatinProfile({
      name: "zh-mixed-font",
      minScore: 0.58,
      minScoreByChar: ZH_MIXED_LATIN_MIN_SCORE_BY_CHAR,
      minLowerCharScore: 0.55,
      minUpperCharScore: 0.58,
      minDigitCharScore: 0.52,
      hardFallbackChars: createCharSet("gjqxX"),
      softnessMultiplier: 1.7,
      widthScale: 0.74,
      baselineNudge: 0.1,
      advanceScale: 0.92,
      letterSpacingFactor: 0.98,
      maxTinyRatio: 0.72,
      maxOutOfBoundsShare: 0.18,
      runMinMappedShare: 0.62,
      runLowMarginThreshold: 0.036,
      runMaxWeakShare: 0.52,
      runMinAverageMargin: 0.03,
      runHardFallbackChars: createCharSet("gjqxX"),
    });
  }

  const allModeRelax = forceUniversalAll ? 0.08 : 0;
  // Keep Latin mapping thresholds identical between LaTeX document mode and plain mode.
  profile.minScore = clampValue(profile.minScore - allModeRelax, 0.45, 0.82);
  if (forceUniversalAll || preferUniversalLatinMath) {
    profile.hardFallbackChars = new Set();
    profile.runHardFallbackChars = new Set();
  }
  return profile;
}

function resolveUniversalLatinMinScore(profile, char) {
  const minScoreByChar = profile.minScoreByChar ?? {};
  let threshold = Number.isFinite(profile.minScore) ? profile.minScore : 0.6;
  if (/^[a-z]$/.test(char) && Number.isFinite(profile.minLowerCharScore)) {
    threshold = Math.max(threshold, profile.minLowerCharScore);
  }
  if (/^[A-Z]$/.test(char) && Number.isFinite(profile.minUpperCharScore)) {
    threshold = Math.max(threshold, profile.minUpperCharScore);
  }
  if (/^[0-9]$/.test(char) && Number.isFinite(profile.minDigitCharScore)) {
    threshold = Math.max(threshold, profile.minDigitCharScore);
  }
  if (Number.isFinite(minScoreByChar[char])) {
    threshold = Math.max(threshold, minScoreByChar[char]);
  }
  return clampValue(threshold, 0.45, 0.9);
}

function evaluateUniversalLatinGlyphQuality(glyph, char, stats, geometry, profile) {
  const isUpper = /^[A-Z]$/.test(char);
  const isLower = /^[a-z]$/.test(char);
  const isDigit = /^[0-9]$/.test(char);

  if (!(isUpper || isLower || isDigit)) {
    return {
      score: 1,
      reasons: [],
    };
  }

  if (profile.hardFallbackChars.has(char)) {
    return {
      score: 0,
      reasons: ["hard-fallback-char"],
    };
  }

  const reasons = [];
  let score = 1;
  const aspect = geometry.height > 1e-6 ? geometry.width / geometry.height : 99;
  const tinyRatio =
    stats.strokeCount > 0 ? stats.lengths.filter((value) => value < 0.045).length / stats.strokeCount : 0;

  const maxStrokeCount = isUpper
    ? profile.maxUpperStrokeCount
    : isLower
      ? profile.maxLowerStrokeCount
      : profile.maxDigitStrokeCount;
  if (stats.strokeCount > maxStrokeCount) {
    const overflow = stats.strokeCount - maxStrokeCount;
    score -= overflow * 0.16;
    reasons.push("too-many-strokes");
  }

  if (stats.strokeCount <= 1 && !/[1IlocCsS]/.test(char)) {
    score -= 0.26;
    reasons.push("single-stroke-too-simple");
  }

  if (isLower && geometry.height < profile.minLowerHeight) {
    score -= 0.32;
    reasons.push("lowercase-height-too-low");
  }
  if (isUpper && geometry.height < profile.minUpperHeight) {
    score -= 0.34;
    reasons.push("uppercase-height-too-low");
  }
  if (isDigit && geometry.height < profile.minDigitHeight) {
    score -= 0.28;
    reasons.push("digit-height-too-low");
  }

  if (aspect < profile.minAspect || aspect > profile.maxAspect) {
    score -= 0.24;
    reasons.push("bad-aspect");
  }
  if (geometry.outOfBoundsShare > profile.maxOutOfBoundsShare) {
    score -= (geometry.outOfBoundsShare - profile.maxOutOfBoundsShare) * 1.1;
    reasons.push("out-of-bounds");
  }
  if (tinyRatio > profile.maxTinyRatio) {
    score -= (tinyRatio - profile.maxTinyRatio) * 0.84;
    reasons.push("too-many-tiny-strokes");
  }
  if (geometry.detachedTinyRatio > profile.maxDetachedTinyRatio) {
    score -= 0.22;
    reasons.push("detached-tiny-strokes");
  }
  if (stats.totalLength > profile.maxTotalLength) {
    score -= Math.min(0.24, (stats.totalLength - profile.maxTotalLength) * 0.06);
    reasons.push("too-long-total-path");
  }

  // Comb-like vertical strokes often read as machine-generated for these letters.
  if (/[mnru]/.test(char) && stats.strokeCount >= 4 && geometry.width < 0.42) {
    score -= 0.2;
    reasons.push("comb-like-lowercase");
  }
  if (/[eE]/.test(char) && stats.strokeCount >= 4 && geometry.width < 0.4) {
    score -= 0.15;
    reasons.push("loop-heavy-e");
  }
  if (glyph.source === "font-map-contour" && !profile.allowContour) {
    score -= 0.22;
    reasons.push("contour-not-allowed");
  }

  return {
    score: clampValue(score, 0, 1),
    reasons,
  };
}

function evaluateUniversalLatinCandidate(glyph, char, profile) {
  const requiredScore = resolveUniversalLatinMinScore(profile, char);
  const stats = glyphStrokeStats(glyph);
  const geometry = glyphGeometryStats(glyph);
  if (!geometry || stats.strokeCount <= 0) {
    return {
      score: 0,
      requiredScore,
      margin: -requiredScore,
      reasons: ["invalid-glyph-geometry"],
      stats,
      geometry,
      rejected: true,
    };
  }

  const quality = evaluateUniversalLatinGlyphQuality(glyph, char, stats, geometry, profile);
  const margin = quality.score - requiredScore;
  return {
    score: quality.score,
    requiredScore,
    margin,
    reasons: quality.reasons,
    stats,
    geometry,
    rejected: margin < 0,
  };
}

function shouldPreferBuiltinGlyph(
  char,
  category,
  forceUniversalAll = false,
  options = {},
) {
  const preferUniversalLatinMath = Boolean(options.preferUniversalLatinMath);
  const preferUniversalLatinText = Boolean(options.preferUniversalLatinText);
  const preferUniversalLatinAlnum = preferUniversalLatinMath || preferUniversalLatinText;

  if (category === "math") {
    if (preferUniversalLatinMath) {
      // Use math-capable runtime fonts for formula symbols whenever possible;
      // keep only tiny punctuation builtin.
      if (/^[.,;:!?]$/.test(char)) {
        return true;
      }
      return false;
    }
    return true;
  }
  if (forceUniversalAll) {
    return HARD_BUILTIN_CHARS.has(char);
  }
  if (preferUniversalLatinAlnum && category === "latin" && /^[A-Za-z0-9]$/.test(char)) {
    return false;
  }
  if (HARD_BUILTIN_CHARS.has(char)) {
    return true;
  }
  if (!preferUniversalLatinAlnum && UNIVERSAL_UNSTABLE_ASCII.has(char)) {
    return true;
  }
  return BUILTIN_PREFERRED_CHARS.has(char);
}

function isWideColonChar(char) {
  return char === ":" || char === "：";
}

function strokePolylineLength(points) {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    total += Math.hypot(dx, dy);
  }
  return total;
}

function glyphStrokeStats(glyph) {
  const lengths = (glyph?.strokes ?? []).map((stroke) => strokePolylineLength(stroke));
  return {
    lengths,
    strokeCount: lengths.length,
    totalLength: lengths.reduce((sum, value) => sum + value, 0),
    longest: lengths.length ? Math.max(...lengths) : 0,
  };
}

function strokeCentroid(stroke) {
  if (!Array.isArray(stroke) || stroke.length === 0) {
    return { x: 0.5, y: 0.5 };
  }
  let sx = 0;
  let sy = 0;
  for (const point of stroke) {
    sx += point.x;
    sy += point.y;
  }
  return {
    x: sx / stroke.length,
    y: sy / stroke.length,
  };
}

function glyphGeometryStats(glyph) {
  const strokes = glyph?.strokes ?? [];
  if (!strokes.length) {
    return null;
  }

  let xMin = Number.POSITIVE_INFINITY;
  let yMin = Number.POSITIVE_INFINITY;
  let xMax = Number.NEGATIVE_INFINITY;
  let yMax = Number.NEGATIVE_INFINITY;
  let pointCount = 0;
  let outOfBoundsCount = 0;

  for (const stroke of strokes) {
    for (const point of stroke) {
      xMin = Math.min(xMin, point.x);
      yMin = Math.min(yMin, point.y);
      xMax = Math.max(xMax, point.x);
      yMax = Math.max(yMax, point.y);
      pointCount += 1;
      if (point.x < -0.06 || point.x > 1.06 || point.y < -0.08 || point.y > 1.14) {
        outOfBoundsCount += 1;
      }
    }
  }

  if (
    !Number.isFinite(xMin) ||
    !Number.isFinite(yMin) ||
    !Number.isFinite(xMax) ||
    !Number.isFinite(yMax)
  ) {
    return null;
  }

  const lengths = strokes.map((stroke) => strokePolylineLength(stroke));
  const tinyThreshold = 0.06;
  const majorThreshold = 0.11;
  const tinyIndexes = [];
  const majorIndexes = [];

  for (let i = 0; i < lengths.length; i += 1) {
    const value = lengths[i];
    if (value < tinyThreshold) {
      tinyIndexes.push(i);
    }
    if (value >= majorThreshold) {
      majorIndexes.push(i);
    }
  }

  let detachedTinyCount = 0;
  if (tinyIndexes.length && majorIndexes.length) {
    const centroids = strokes.map((stroke) => strokeCentroid(stroke));
    for (const tinyIndex of tinyIndexes) {
      let minDistance = Number.POSITIVE_INFINITY;
      for (const majorIndex of majorIndexes) {
        if (majorIndex === tinyIndex) {
          continue;
        }
        const dx = centroids[tinyIndex].x - centroids[majorIndex].x;
        const dy = centroids[tinyIndex].y - centroids[majorIndex].y;
        minDistance = Math.min(minDistance, Math.hypot(dx, dy));
      }
      if (minDistance > 0.24) {
        detachedTinyCount += 1;
      }
    }
  }

  return {
    xMin,
    yMin,
    xMax,
    yMax,
    width: Math.max(0, xMax - xMin),
    height: Math.max(0, yMax - yMin),
    centerY: (yMin + yMax) * 0.5,
    pointCount,
    outOfBoundsShare: pointCount > 0 ? outOfBoundsCount / pointCount : 0,
    tinyRatio: lengths.length > 0 ? tinyIndexes.length / lengths.length : 0,
    detachedTinyRatio: tinyIndexes.length > 0 ? detachedTinyCount / tinyIndexes.length : 0,
    touchesFrame:
      xMin <= 0.02 &&
      xMax >= 0.98 &&
      yMin <= 0.02 &&
      yMax >= 0.98,
  };
}

function isLikelyDegenerateUniversalGlyph(glyph, category, char, options = {}) {
  if (!glyph?.isUniversalFontGlyph) {
    return false;
  }
  const allowLatinContour = Boolean(options.allowLatinContour);
  const fontDisplayName = String(options.fontDisplayName ?? "");
  const profile = resolveUniversalLatinProfile(fontDisplayName, {
    documentLayoutMode: Boolean(options.documentLayoutMode),
    forceUniversalAll: Boolean(options.forceUniversalAll),
    preferUniversalLatinMath: Boolean(options.preferUniversalLatinMath),
  });
  const stats = glyphStrokeStats(glyph);
  const geometry = glyphGeometryStats(glyph);
  if (stats.strokeCount <= 0) {
    return true;
  }
  if (!geometry) {
    return true;
  }

  const isAscii = /^[\u0000-\u007f]$/.test(char);
  const isDigit = /^[0-9]$/.test(char);
  const isAsciiLetter = /^[A-Za-z]$/.test(char);
  const isAsciiUpper = /^[A-Z]$/.test(char);
  const isAsciiPunct = /^[.,:;!?'"()[\]{}|]$/.test(char);
  const isCjkPunct = /[，。、：；（）【】“”‘’《》？！]/.test(char);
  const isMathish = category === "math" || /[=+\-*/<>≤≥≠≈±×÷√∑Σ∫π∞]/.test(char);
  const tinyStrokeRatio =
    stats.strokeCount > 0
      ? stats.lengths.filter((value) => value < 0.05).length / stats.strokeCount
      : 0;
  const longestShare =
    stats.totalLength > 0 ? stats.longest / Math.max(1e-6, stats.totalLength) : 0;

  if (isAscii && stats.totalLength < 0.28) {
    return true;
  }
  if (isAscii && stats.totalLength > 16) {
    return true;
  }
  if (isDigit || isAsciiLetter) {
    if (glyph.source === "font-map-contour" && !allowLatinContour) {
      return true;
    }
    // In stable mode we want font switching to be visible for Latin/digits.
    // Keep only hard safety checks here; do not over-filter stylistic shapes.
    if (stats.longest < 0.03) {
      return true;
    }
    if (stats.strokeCount > 72) {
      return true;
    }
    if (geometry.pointCount > 2600) {
      return true;
    }
    if (geometry.outOfBoundsShare > 0.46) {
      return true;
    }
    if (geometry.detachedTinyRatio > 0.98) {
      return true;
    }
    if (isAsciiUpper && geometry.height < 0.08) {
      return true;
    }
    if (!isAsciiUpper && geometry.height < 0.06) {
      return true;
    }
    if (geometry.width < 0.01) {
      return true;
    }
    if (geometry.width > 1.8 || geometry.height > 1.8) {
      return true;
    }
    if (tinyStrokeRatio > 0.92) {
      return true;
    }
    if (longestShare < 0.02) {
      return true;
    }
    const quality = evaluateUniversalLatinGlyphQuality(glyph, char, stats, geometry, profile);
    const requiredScore = resolveUniversalLatinMinScore(profile, char);
    if (quality.score < requiredScore) {
      return true;
    }
    return false;
  }
  if (isAsciiPunct || isCjkPunct) {
    if (stats.strokeCount > 6) {
      return true;
    }
    if (tinyStrokeRatio > 0.75) {
      return true;
    }
    if (stats.totalLength > 3.8) {
      return true;
    }
  }
  if (isMathish) {
    if (stats.totalLength < 0.22) {
      return true;
    }
    if (stats.strokeCount > 20 || tinyStrokeRatio > 0.8) {
      return true;
    }
  }
  // Contour mode is often valid for real fonts; avoid hard rejecting it.
  if (category === "han" && stats.totalLength < 0.52) {
    return true;
  }
  if (category === "han" && geometry.outOfBoundsShare > 0.38) {
    return true;
  }
  if (stats.strokeCount > 220) {
    return true;
  }

  return false;
}

export async function composeTextPlan(text, options = {}) {
  const fontSize = options.fontSize ?? 72;
  const lineHeight = options.lineHeight ?? fontSize * 1.36;
  const letterSpacing = options.letterSpacing ?? fontSize * 0.06;
  const penWidth = options.penWidth ?? 4;
  const maxWidth = options.maxWidth ?? 1360;
  const pageHeight = Number.isFinite(options.pageHeight) && options.pageHeight > 0
    ? Number(options.pageHeight)
    : null;
  const padding = options.padding ?? 48;
  const allowRemoteHanzi = options.allowRemoteHanzi ?? true;
  const samplingStep = options.samplingStep ?? 28;
  const universalFontMapper = options.universalFontMapper ?? null;
  const forceUniversalAll = options.forceUniversalAll ?? false;
  const preferUniversalLatinMath = options.preferUniversalLatinMath ?? false;
  const preferUniversalLatinText = options.preferUniversalLatinText ?? false;
  const preferBuiltinLatexGlyphs = options.preferBuiltinLatexGlyphs ?? false;
  const enableLatexLayout = options.enableLatexLayout ?? false;
  const preferOpenSourceLatexRenderer = options.preferOpenSourceLatexRenderer ?? true;
  const documentLayoutMode = options.documentLayoutMode ?? false;
  const boardLectureMode = Boolean(options.boardLectureMode);
  const smartLayout = options.smartLayout ?? true;
  const paragraphIndentChars = Math.max(
    0,
    options.paragraphIndentChars ?? (documentLayoutMode ? (boardLectureMode ? 0 : 2) : 0),
  );
  const scribbleLevel = clampValue(Number(options.scribbleLevel), 0, 1) || 0;
  const breathingAmount = clampValue(Number(options.breathingAmount), 0, 1) || 0;
  const layoutDensity = clampValue(
    Number(options.layoutDensity),
    0.3,
    0.98,
  ) || (documentLayoutMode ? 0.78 : 0.72);
  const structureAwareness = clampValue(Number(options.structureAwareness), 0.3, 0.98) || 0.78;
  const latexHandwritingStrength = clampValue(
    Number(options.latexHandwritingStrength ?? (documentLayoutMode ? 0.38 : 0.5)),
    0,
    1,
  );
  const universalFontDisplayName = String(universalFontMapper?.displayName ?? "");
  const universalLatinProfile = resolveUniversalLatinProfile(universalFontDisplayName, {
    documentLayoutMode,
    forceUniversalAll,
    preferUniversalLatinMath,
  });

  const strokes = [];
  const missingChars = new Set();
  const hanziSourceCounts = {
    remote: 0,
    fallback: 0,
  };
  const universalGlyphCounts = {
    total: 0,
    han: 0,
    latin: 0,
    math: 0,
    other: 0,
  };

  let cursorX = padding;
  let cursorY = padding;
  let contentBottom = cursorY;
  let charIndex = 0;
  let activeLeft = padding;
  let activeRight = maxWidth - padding;
  let lineIndex = 0;
  let centerMode = false;
  let multicolLayout = null;
  const structurePlanner = createPageStructurePlanner({
    width: maxWidth,
    padding,
    density: layoutDensity,
    lineHeight,
    fontSize,
    looseness: scribbleLevel,
    lineStartVariance: boardLectureMode ? 0.16 : 1,
  });

  function shouldApplyParagraphIndent(lineText) {
    if (!smartLayout || paragraphIndentChars <= 0) {
      return false;
    }
    if (centerMode || multicolLayout) {
      return false;
    }

    const trimmed = String(lineText ?? "").trimStart();
    if (!trimmed || trimmed.length < 6) {
      return false;
    }

    const firstChar = Array.from(trimmed)[0] ?? "";
    if (!firstChar || isLeadingLinePunctuation(firstChar) || isOpeningPunctuation(firstChar)) {
      return false;
    }

    if (/^[\-\*\d#>]/.test(firstChar)) {
      return false;
    }

    return classifyChar(firstChar) === "han";
  }

  function resolveCompactHeadingNoteCandidate(lines, sourceLineIndex, rawLine, styledLine) {
    if (!isHeadingMarkerLine(rawLine)) {
      return null;
    }

    const nextTrimmed = String(lines[sourceLineIndex + 1] ?? "").trim();
    if (!isCompactBoardNoteLine(nextTrimmed, { boardLectureMode })) {
      return null;
    }

    return {
      text: nextTrimmed,
      fontSize: Math.max(11, Math.min(styledLine.fontSize * 0.52, fontSize * 0.74)),
      gap: Math.max(styledLine.fontSize * 0.24, fontSize * 0.2),
      tracking: documentLayoutMode ? 0.012 : 0.016,
    };
  }

  function updateActiveHorizontalBounds() {
    if (!multicolLayout) {
      activeLeft = padding;
      activeRight = maxWidth - padding;
      cursorX = activeLeft;
      return;
    }
    const columnIndex = Math.max(0, Math.min(multicolLayout.columnCount - 1, multicolLayout.currentColumn));
    multicolLayout.currentColumn = columnIndex;
    activeLeft =
      padding + columnIndex * (multicolLayout.columnWidth + multicolLayout.columnGap);
    activeRight = activeLeft + multicolLayout.columnWidth;
    cursorX = activeLeft;
  }

  function resolveLineStartOffset(index) {
    if (!smartLayout || centerMode || multicolLayout) {
      return 0;
    }
    const suggested = structurePlanner.suggestLineStart({
      lineIndex: index,
      left: activeLeft,
      right: activeRight,
      fontSize,
      centered: centerMode,
      inColumns: Boolean(multicolLayout),
    });
    return suggested - activeLeft;
  }

  function reserveCurrentBand(height, kind) {
    const bandHeight = Math.max(fontSize * 0.9, Number(height) || lineHeight);
    structurePlanner.reserveRect(
      {
        x: activeLeft,
        y: cursorY,
        width: Math.max(24, activeRight - activeLeft),
        height: bandHeight,
      },
      { kind },
    );
  }

  function alignCursorToLineStart() {
    const base = activeLeft + resolveLineStartOffset(lineIndex);
    cursorX = Math.max(activeLeft, Math.min(activeRight - fontSize * 0.24, base));
  }

  function startMulticolLayout(columnCount) {
    const count = Math.max(1, columnCount || 2);
    const gap = documentLayoutMode
      ? Math.max(fontSize * 0.54, 30)
      : Math.max(fontSize * 0.7, 34);
    const fullWidth = maxWidth - padding * 2;
    const safeGap = gap * (count - 1);
    const columnWidth = Math.max(120, (fullWidth - safeGap) / count);
    multicolLayout = {
      columnCount: count,
      columnGap: gap,
      columnWidth,
      startY: cursorY,
      currentColumn: 0,
      columnBottoms: Array.from({ length: count }, () => cursorY),
    };
    updateActiveHorizontalBounds();
  }

  function breakMulticolLayout() {
    if (!multicolLayout) {
      return;
    }
    multicolLayout.columnBottoms[multicolLayout.currentColumn] = Math.max(
      multicolLayout.columnBottoms[multicolLayout.currentColumn],
      cursorY,
    );
    multicolLayout.currentColumn = Math.min(
      multicolLayout.columnCount - 1,
      multicolLayout.currentColumn + 1,
    );
    cursorY = multicolLayout.startY;
    centerMode = false;
    updateActiveHorizontalBounds();
  }

  function endMulticolLayout() {
    if (!multicolLayout) {
      return;
    }
    multicolLayout.columnBottoms[multicolLayout.currentColumn] = Math.max(
      multicolLayout.columnBottoms[multicolLayout.currentColumn],
      cursorY,
    );
    cursorY =
      Math.max(...multicolLayout.columnBottoms, cursorY) +
      Math.max(lineHeight * 0.42, fontSize * 0.4);
    multicolLayout = null;
    centerMode = false;
    updateActiveHorizontalBounds();
  }

  function availableLineWidth() {
    return Math.max(80, activeRight - activeLeft);
  }

  function newLine(advance = lineHeight) {
    cursorY += advance;
    lineIndex += 1;
    if (multicolLayout) {
      multicolLayout.columnBottoms[multicolLayout.currentColumn] = Math.max(
        multicolLayout.columnBottoms[multicolLayout.currentColumn],
        cursorY,
      );
    }
    alignCursorToLineStart();
  }

  function forcePageBreak(extraOffset = 0) {
    if (multicolLayout) {
      endMulticolLayout();
    }
    centerMode = false;
    if (!pageHeight) {
      newLine(Math.max(lineHeight * 1.2, fontSize * 1.1) + extraOffset);
      return;
    }
    const anchorY = Math.max(cursorY, contentBottom, padding);
    const nextPageIndex = Math.floor(Math.max(0, anchorY) / pageHeight) + 1;
    cursorY = nextPageIndex * pageHeight + padding + Math.max(0, extraOffset);
    contentBottom = Math.max(contentBottom, cursorY);
    lineIndex += 1;
    alignCursorToLineStart();
  }

  async function resolveGlyph(char, category, resolveOptions = {}) {
    let glyph = null;
    let isUniversalGlyph = false;
    const preferMathSkeleton = Boolean(resolveOptions.preferMathSkeleton);
    const forceUniversal = Boolean(resolveOptions.forceUniversal) && Boolean(universalFontMapper);
    const forceBuiltinByContext =
      !preferUniversalLatinMath &&
      !forceUniversalAll &&
      category === "latin" &&
      /^[a-z]$/.test(char) &&
      universalLatinProfile.name === "zh-mixed-font";
    const preferBuiltin = forceUniversal
      ? false
      : forceBuiltinByContext ||
        Boolean(resolveOptions.preferBuiltin) ||
        shouldPreferBuiltinGlyph(char, category, forceUniversalAll, {
          preferUniversalLatinMath,
          preferUniversalLatinText,
        });

    async function tryUniversalGlyph() {
      if (!universalFontMapper) {
        return null;
      }
      const candidate = await universalFontMapper.getGlyph(char);
      if (!candidate) {
        return null;
      }
      if (forceUniversal && (category === "math" || category === "latin")) {
        return candidate;
      }
      if (
        isLikelyDegenerateUniversalGlyph(candidate, category, char, {
          allowLatinContour: forceUniversalAll,
          fontDisplayName: universalFontDisplayName,
          documentLayoutMode,
          forceUniversalAll,
          preferUniversalLatinMath,
        })
      ) {
        return null;
      }
      return candidate;
    }

    if (category === "han") {
      if (universalFontMapper && forceUniversalAll) {
        glyph = await tryUniversalGlyph();
        isUniversalGlyph = Boolean(glyph?.isUniversalFontGlyph);
      }

      if (!glyph) {
        glyph = await loadChineseGlyph(char, {
          allowRemote: allowRemoteHanzi,
          samplingStep,
        });
        if (glyph?.source === "remote") {
          hanziSourceCounts.remote += 1;
        } else if (glyph?.source === "fallback") {
          hanziSourceCounts.fallback += 1;
        }
      }

      if (!glyph && universalFontMapper) {
        glyph = await tryUniversalGlyph();
        isUniversalGlyph = Boolean(glyph?.isUniversalFontGlyph);
      }
    } else if (
      universalFontMapper &&
      !preferBuiltin &&
      (forceUniversalAll || preferUniversalLatinMath)
    ) {
      glyph = await tryUniversalGlyph();
      isUniversalGlyph = Boolean(glyph?.isUniversalFontGlyph);
    }

    if (!glyph) {
      glyph = category === "han" ? null : getLatinMathGlyph(char);
    }

    if (!glyph && category !== "han" && universalFontMapper && !preferBuiltin) {
      glyph = await tryUniversalGlyph();
      isUniversalGlyph = Boolean(glyph?.isUniversalFontGlyph);
    }

    if (!glyph) {
      missingChars.add(char);
      glyph = createPlaceholderGlyph();
    }

    if (
      glyph &&
      isUniversalGlyph &&
      preferMathSkeleton &&
      Array.isArray(glyph.skeletonStrokes) &&
      glyph.skeletonStrokes.length
    ) {
      glyph = {
        ...glyph,
        strokes: glyph.skeletonStrokes,
        source: 'font-map-skeleton',
      };
    }

    return {
      glyph,
      isUniversalGlyph,
    };
  }

  async function shouldFallbackWholeLatinRun(runChars) {
    if (forceUniversalAll || !preferUniversalLatinMath || !universalFontMapper) {
      return false;
    }

    const profile = universalLatinProfile;
    const latinAlnumChars = runChars.filter((char) => /^[A-Za-z0-9]$/.test(char));
    if (latinAlnumChars.length < Math.max(2, profile.runFallbackLength ?? 3)) {
      return false;
    }

    const lowMarginThreshold = Math.max(0.02, profile.runLowMarginThreshold ?? 0.048);
    const minMappedShare = clampValue(profile.runMinMappedShare ?? 0.72, 0.45, 1);
    const maxWeakShare = clampValue(profile.runMaxWeakShare ?? 0.38, 0.1, 0.9);
    const minAverageMargin = Math.max(0.01, profile.runMinAverageMargin ?? 0.06);

    let hardFallbackCount = 0;
    let failedUniversalCount = 0;
    let mappedCount = 0;
    let weakCount = 0;
    let veryWeakCount = 0;
    let marginSum = 0;

    for (const char of latinAlnumChars) {
      if (
        shouldPreferBuiltinGlyph(char, "latin", forceUniversalAll, {
          preferUniversalLatinMath,
          preferUniversalLatinText,
        })
      ) {
        if (profile.runHardFallbackChars.has(char)) {
          hardFallbackCount += 1;
        }
        failedUniversalCount += 1;
        continue;
      }

      const candidate = await universalFontMapper.getGlyph(char);
      if (
        !candidate ||
        isLikelyDegenerateUniversalGlyph(candidate, "latin", char, {
          allowLatinContour: forceUniversalAll,
          fontDisplayName: universalFontDisplayName,
          documentLayoutMode,
          forceUniversalAll,
          preferUniversalLatinMath,
        })
      ) {
        failedUniversalCount += 1;
        continue;
      }

      const quality = evaluateUniversalLatinCandidate(candidate, char, profile);
      if (quality.rejected) {
        failedUniversalCount += 1;
        continue;
      }

      mappedCount += 1;
      marginSum += quality.margin;
      if (quality.margin < lowMarginThreshold) {
        weakCount += 1;
      }
      if (quality.margin < lowMarginThreshold * 0.56) {
        veryWeakCount += 1;
      }
    }

    if (hardFallbackCount > 0) {
      return true;
    }
    if (mappedCount === 0) {
      return false;
    }

    const mappedShare = mappedCount / Math.max(1, latinAlnumChars.length);
    const weakShare = weakCount / Math.max(1, mappedCount);
    const averageMargin = marginSum / Math.max(1, mappedCount);

    if (
      failedUniversalCount >=
      Math.max(2, Math.ceil(latinAlnumChars.length * 0.34))
    ) {
      return true;
    }
    if (mappedShare < minMappedShare) {
      return true;
    }
    if (veryWeakCount > 0) {
      return true;
    }
    if (weakShare > maxWeakShare) {
      return true;
    }
    if (averageMargin < minAverageMargin) {
      return true;
    }
    return false;
  }

  async function placeGlyphAt(char, category, placeOptions = {}) {
    const scriptType = placeOptions.scriptType ?? null;
    const isScript = Boolean(scriptType);
    const localFontSize = placeOptions.fontSize ?? fontSize * (isScript ? 0.64 : 1);
    const localPenWidth = Math.max(1, placeOptions.penWidth ?? penWidth * (isScript ? 0.84 : 1));
    const cursorYLocal = placeOptions.cursorY ?? cursorY;
    const cursorXLocal = placeOptions.cursorX ?? cursorX;
    const lockShape = placeOptions.lockShape ?? false;
    const mathStyle = placeOptions.mathStyle ?? null;
    const absolutePlacement = Boolean(placeOptions.absolutePlacement);
    const shapeSoftnessRaw = Number(placeOptions.shapeSoftness);
    const shapeSoftness = Number.isFinite(shapeSoftnessRaw)
      ? clampValue(shapeSoftnessRaw, 0.35, 4.2)
      : 1;
    const boxWidth = Number(placeOptions.boxWidth);
    const mathMicroVariance = clampValue(
      Number(placeOptions.mathMicroVariance) || 0,
      0,
      0.32,
    );

    let glyph = placeOptions.overrideGlyph ?? null;
    let isUniversalGlyph = false;
    if (!glyph) {
      const resolvedGlyph = await resolveGlyph(char, category, {
        preferBuiltin: placeOptions.preferBuiltin,
        forceUniversal: placeOptions.forceUniversal,
        preferMathSkeleton: placeOptions.preferMathSkeleton,
      });
      glyph = resolvedGlyph.glyph;
      isUniversalGlyph = resolvedGlyph.isUniversalGlyph;
    }
    if (isUniversalGlyph && placeOptions.preferMathSkeleton) {
      const builtinGlyph = getLatinMathGlyph(char);
      if (shouldFallbackHeavyFormulaSkeletonGlyph(char, category, glyph, builtinGlyph)) {
        glyph = builtinGlyph;
        isUniversalGlyph = false;
      }
    }
    if (isUniversalGlyph) {
      universalGlyphCounts.total += 1;
      if (category === "han") {
        universalGlyphCounts.han += 1;
      } else if (category === "latin") {
        universalGlyphCounts.latin += 1;
      } else if (category === "math") {
        universalGlyphCounts.math += 1;
      } else {
        universalGlyphCounts.other += 1;
      }
    }

    const lockUniversalShape = isUniversalGlyph && category !== "latin";
    const transform = createCharTransform(
      char,
      charIndex,
      category,
      isScript,
      lockShape || lockUniversalShape,
      (isUniversalGlyph && category === "latin" ? universalLatinProfile.softnessMultiplier : 1) *
        shapeSoftness,
    );
    if (absolutePlacement && placeOptions.fitToBoxY) {
      const bounds = measureGlyphBounds(glyph);
      if (bounds) {
        const rawHeight = Math.max(0.01, bounds.maxY - bounds.minY);
        transform.scaleY *= 1 / rawHeight;
        transform.offsetY += -bounds.minY * transform.scaleY;
      }
    }
    if (absolutePlacement && placeOptions.fitToBoxX) {
      const bounds = measureGlyphBounds(glyph);
      if (bounds) {
        const rawWidth = Math.max(0.01, bounds.maxX - bounds.minX);
        transform.scaleX *= 1 / rawWidth;
        transform.offsetX += -bounds.minX * transform.scaleX;
      }
      if (Number.isFinite(boxWidth) && boxWidth > 0.5 && localFontSize > 0.5) {
        // Absolute placement uses localFontSize for Y; scale X separately by layout box width.
        const xSizeScale = clampValue(boxWidth / localFontSize, 0.08, 4.2);
        transform.scaleX *= xSizeScale;
      }
    }
    if (absolutePlacement && category === "math" && !isScript && mathMicroVariance > 0.0001) {
      const random = mulberry32(hashCode(`${char}:${charIndex}:math-abs`));
      transform.scaleX *= 1 + (random() - 0.5) * 0.12 * mathMicroVariance;
      transform.scaleY *= 1 + (random() - 0.5) * 0.14 * mathMicroVariance;
      transform.slant += (random() - 0.5) * 0.12 * mathMicroVariance;
      transform.offsetY += (random() - 0.5) * 0.06 * mathMicroVariance;
    }
    // Keep mapped Latin closer to notebook handwriting proportions (less tall/narrow).
    if (!absolutePlacement && category === "latin" && isUniversalGlyph && !isScript) {
      // Keep mapped Latin close to Han visual height and reduce wobble.
      transform.scaleX *= 1.02;
      transform.scaleY *= 0.97;
      transform.offsetY += 0.004;
    }
    if (!absolutePlacement && category === "latin" && !isUniversalGlyph && !isScript) {
      // Built-in Latin is our fallback safety net; keep it neat and readable.
      transform.scaleX *= 1.04;
      transform.scaleY *= 0.96;
      transform.offsetY += 0.006;
    }
    if (!absolutePlacement && mathStyle === "mathcal") {
      if (char === "ℒ") {
        transform.scaleX *= 1.01;
        transform.scaleY *= 1.0;
        transform.slant += 0.06;
        transform.offsetY -= 0.004;
      } else {
        transform.scaleX *= 1.03;
        transform.scaleY *= 1.01;
        transform.slant += 0.14;
        transform.offsetY -= 0.008;
      }
    } else if (!absolutePlacement && mathStyle === "mathit") {
      transform.slant += 0.18;
    } else if (!absolutePlacement && mathStyle === "mathbf") {
      transform.scaleX *= 1.03;
      transform.scaleY *= 1.03;
    }
    const widthScale = absolutePlacement
      ? 1
      : isUniversalGlyph
        ? category === "latin"
          ? universalLatinProfile.widthScale
          : 0.72
        : category === "han"
          ? localFontSize < 44
            ? 0.88
            : 0.98
          : category === "latin"
            ? 0.9
            : category === "math"
              ? documentLayoutMode
                ? 0.86
                : 0.92
              : 1;
    const baselineNudge =
      absolutePlacement
        ? 0
        : !isScript && category === "latin"
        ? localFontSize * (isUniversalGlyph ? universalLatinProfile.baselineNudge : 0.085)
        : !isScript && category === "math"
          ? localFontSize * (isUniversalGlyph ? 0.06 : 0.035)
          : 0;
    const shouldNormalizeLatinSpacing =
      category === "latin" &&
      !isScript &&
      !absolutePlacement &&
      !placeOptions.advance &&
      isLatinAlnumChar(char);
    const latinSpacingNormalization =
      shouldNormalizeLatinSpacing
        ? normalizeLatinAdvanceAndOffset(char, glyph, {
            fontSize: localFontSize,
            transform,
          })
        : null;
    const adjustedCursorX = cursorXLocal + (latinSpacingNormalization?.cursorXShift ?? 0);
    const glyphAdvanceValue = latinSpacingNormalization?.advance ?? glyph.advance;

    pushGlyphStrokes(strokes, {
      glyph,
      char,
      category,
      charIndex,
      cursorX: adjustedCursorX,
      cursorY: cursorYLocal + baselineNudge,
      fontSize: localFontSize,
      penWidth: Math.max(1, localPenWidth * widthScale),
      isScript,
      scriptType,
      transform,
      finalizeDisabled: placeOptions.finalizeDisabled,
      isUniversalGlyph,
      layoutLocked: placeOptions.layoutLocked ?? absolutePlacement,
      mathStyle,
      mathMicroVariance,
      charAdvance: glyphAdvanceValue,
    });

    const advanceScale = category === "han" ? 0.95 : 1;
    const spacingByCategory =
      category === "han" ? 0.32 : category === "latin" ? 0.62 : category === "math" ? 0.66 : 0.72;
    const localSpacing =
      placeOptions.letterSpacing ??
      letterSpacing *
        spacingByCategory *
        (isScript ? 0.68 : 1) *
        (isUniversalGlyph && category === "latin" ? universalLatinProfile.letterSpacingFactor : 1);
    const universalAdvanceScale =
      isUniversalGlyph && category === "latin" ? universalLatinProfile.advanceScale : 1;
    const documentScale =
      documentLayoutMode
        ? category === "latin"
          ? 0.94
          : category === "math"
            ? 0.9
            : 1
        : 1;
    const advance =
      placeOptions.advance ??
      glyphAdvanceValue *
        localFontSize *
        advanceScale *
        universalAdvanceScale *
        documentScale +
        localSpacing;

    const trailingPunctuationGap =
      !isScript && !placeOptions.advance
        ? char === "，" || char === "、"
          ? localFontSize * 0.42
          : char === "。"
            ? localFontSize * 0.32
            : char === "：" || char === "；"
              ? localFontSize * 0.36
              : 0
        : 0;

    charIndex += 1;
    return advance + trailingPunctuationGap;
  }

  function pushSyntheticLineStroke(lineData) {
    const x0 = lineData.x;
    const x1 = lineData.x + lineData.width;
    const y = lineData.y;
    const width = Math.max(1, lineData.thickness ?? penWidth * 0.78);

    strokes.push({
      char: " ",
      category: "math",
      charIndex,
      strokeIndexInChar: 0,
      strokeCountInChar: 1,
      isScript: false,
      scriptType: null,
      width,
      points: [
        { x: x0, y },
        { x: x1, y },
      ],
      outlinePathData: null,
      outlinePathScale: 1024,
      outlineX: x0,
      outlineY: y,
      outlineSize: Math.max(6, width * 2),
      charX: x0,
      charY: y,
      charFontSize: Math.max(8, width * 2),
      charAdvance: Math.max(0.2, lineData.width / Math.max(1, fontSize)),
      finalizeDisabled: true,
      syntheticKind: lineData.syntheticKind ?? "line",
      isUniversalGlyph: false,
      layoutLocked: Boolean(lineData.stable),
    });

    charIndex += 1;
  }

  function pushSyntheticVerticalLineStroke(lineData) {
    const x = lineData.x;
    const y0 = lineData.y;
    const y1 = lineData.y + lineData.height;
    const width = Math.max(1, lineData.thickness ?? penWidth * 0.78);

    strokes.push({
      char: " ",
      category: "math",
      charIndex,
      strokeIndexInChar: 0,
      strokeCountInChar: 1,
      isScript: false,
      scriptType: null,
      width,
      points: [
        { x, y: y0 },
        { x, y: y1 },
      ],
      outlinePathData: null,
      outlinePathScale: 1024,
      outlineX: x,
      outlineY: y0,
      outlineSize: Math.max(6, width * 2),
      charX: x,
      charY: y0,
      charFontSize: Math.max(8, width * 2),
      charAdvance: Math.max(0.2, (y1 - y0) / Math.max(1, fontSize)),
      finalizeDisabled: true,
      syntheticKind: lineData.syntheticKind ?? "line",
      isUniversalGlyph: false,
      layoutLocked: Boolean(lineData.stable),
    });

    charIndex += 1;
  }

  function pushSyntheticSegmentStroke(lineData) {
    const x0 = lineData.x0;
    const y0 = lineData.y0;
    const x1 = lineData.x1;
    const y1 = lineData.y1;
    const width = Math.max(1, lineData.thickness ?? penWidth * 0.72);
    const length = Math.hypot(x1 - x0, y1 - y0);

    strokes.push({
      char: " ",
      category: "math",
      charIndex,
      strokeIndexInChar: 0,
      strokeCountInChar: 1,
      isScript: false,
      scriptType: null,
      width,
      points: [
        { x: x0, y: y0 },
        { x: x1, y: y1 },
      ],
      outlinePathData: null,
      outlinePathScale: 1024,
      outlineX: x0,
      outlineY: y0,
      outlineSize: Math.max(6, width * 2),
      charX: x0,
      charY: y0,
      charFontSize: Math.max(8, width * 2),
      charAdvance: Math.max(0.2, length / Math.max(1, fontSize)),
      finalizeDisabled: true,
      syntheticKind: lineData.syntheticKind ?? "line",
      isUniversalGlyph: false,
      layoutLocked: Boolean(lineData.stable),
    });

    charIndex += 1;
  }

  async function drawSketchText(text, x, y, localFontSize, tracking = 0.035, drawOptions = {}) {
    let cursor = x;
    for (const char of Array.from(String(text ?? ""))) {
      const category = classifyChar(char);
      const advance = await placeGlyphAt(char, category, {
        cursorX: cursor,
        cursorY: y,
        fontSize: localFontSize,
        penWidth: Math.max(1, penWidth * 0.64),
        letterSpacing: localFontSize * tracking,
        lockShape: true,
        preferBuiltin: Boolean(drawOptions.preferBuiltin),
      });
      cursor += advance;
    }
  }

  function drawArrow(x0, y0, x1, y1, thickness = Math.max(1, penWidth * 0.6)) {
    pushSyntheticSegmentStroke({
      x0,
      y0,
      x1,
      y1,
      thickness,
      syntheticKind: "figure-arrow",
    });
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const head = Math.max(6, thickness * 2.6);
    const leftX = x1 - ux * head - uy * head * 0.55;
    const leftY = y1 - uy * head + ux * head * 0.55;
    const rightX = x1 - ux * head + uy * head * 0.55;
    const rightY = y1 - uy * head - ux * head * 0.55;
    pushSyntheticSegmentStroke({
      x0: x1,
      y0: y1,
      x1: leftX,
      y1: leftY,
      thickness: Math.max(1, thickness * 0.9),
      syntheticKind: "figure-arrow",
    });
    pushSyntheticSegmentStroke({
      x0: x1,
      y0: y1,
      x1: rightX,
      y1: rightY,
      thickness: Math.max(1, thickness * 0.9),
      syntheticKind: "figure-arrow",
    });
  }

  async function drawImageSketchPanel(x, y, width, height) {
    const edge = Math.max(1, penWidth * 0.58);
    pushSyntheticLineStroke({ x, y, width, thickness: edge });
    pushSyntheticLineStroke({ x, y: y + height, width, thickness: edge });
    pushSyntheticVerticalLineStroke({ x, y, height, thickness: edge });
    pushSyntheticVerticalLineStroke({ x: x + width, y, height, thickness: edge });
    const artLeft = x + width * 0.08;
    const artRight = x + width * 0.92;
    const artTop = y + height * 0.16;
    const artBottom = y + height * 0.7;
    const artW = artRight - artLeft;
    const artH = artBottom - artTop;

    // Draw a simple "embedded image" sketch so includegraphics is visibly represented.
    pushSyntheticLineStroke({ x: artLeft, y: artTop, width: artW, thickness: Math.max(1, edge * 0.8) });
    pushSyntheticLineStroke({
      x: artLeft,
      y: artBottom,
      width: artW,
      thickness: Math.max(1, edge * 0.8),
    });
    pushSyntheticVerticalLineStroke({
      x: artLeft,
      y: artTop,
      height: artH,
      thickness: Math.max(1, edge * 0.8),
    });
    pushSyntheticVerticalLineStroke({
      x: artRight,
      y: artTop,
      height: artH,
      thickness: Math.max(1, edge * 0.8),
    });
    pushSyntheticSegmentStroke({
      x0: artLeft + artW * 0.08,
      y0: artBottom - artH * 0.12,
      x1: artLeft + artW * 0.34,
      y1: artTop + artH * 0.36,
      thickness: Math.max(1, edge * 0.78),
      syntheticKind: "figure-image-line",
      stable: true,
    });
    pushSyntheticSegmentStroke({
      x0: artLeft + artW * 0.34,
      y0: artTop + artH * 0.36,
      x1: artLeft + artW * 0.56,
      y1: artBottom - artH * 0.22,
      thickness: Math.max(1, edge * 0.78),
      syntheticKind: "figure-image-line",
      stable: true,
    });
    pushSyntheticSegmentStroke({
      x0: artLeft + artW * 0.52,
      y0: artBottom - artH * 0.16,
      x1: artRight - artW * 0.08,
      y1: artTop + artH * 0.42,
      thickness: Math.max(1, edge * 0.78),
      syntheticKind: "figure-image-line",
      stable: true,
    });
    pushSyntheticSegmentStroke({
      x0: artLeft + artW * 0.74,
      y0: artTop + artH * 0.2,
      x1: artLeft + artW * 0.86,
      y1: artTop + artH * 0.2,
      thickness: Math.max(1, edge * 0.66),
      syntheticKind: "figure-image-line",
      stable: true,
    });
    pushSyntheticSegmentStroke({
      x0: artLeft + artW * 0.8,
      y0: artTop + artH * 0.14,
      x1: artLeft + artW * 0.8,
      y1: artTop + artH * 0.26,
      thickness: Math.max(1, edge * 0.66),
      syntheticKind: "figure-image-line",
      stable: true,
    });

    const labelSize = Math.max(9, width * 0.062);
    await drawSketchText(
      "diagram.jpg",
      artLeft + artW * 0.16,
      y + height * 0.86,
      labelSize,
      0.012,
      { preferBuiltin: true },
    );
  }

  async function drawFormulaSketchPanel(x, y, width, height) {
    const edge = Math.max(1, penWidth * 0.52);
    const labelSize = Math.max(10, width * 0.094);
    const tinySize = Math.max(9, width * 0.06);
    const labelOptions = { preferBuiltin: true };

    const e = { x: x + width * 0.16, y: y + height * 0.18 };
    const ab = { x: x + width * 0.42, y: y + height * 0.46 };
    const b = { x: x + width * 0.74, y: y + height * 0.46 };
    const a = { x: x + width * 0.42, y: y + height * 0.79 };
    const c = { x: x + width * 0.74, y: y + height * 0.79 };

    function nudgePoint(from, to, offset) {
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const len = Math.hypot(dx, dy) || 1;
      return {
        x: from.x + (dx / len) * offset,
        y: from.y + (dy / len) * offset,
      };
    }

    function connectNodes(from, to, fromPad, toPad) {
      const start = nudgePoint(from, to, Math.max(0, fromPad));
      const end = nudgePoint(to, from, Math.max(0, toPad));
      drawArrow(start.x, start.y, end.x, end.y, edge);
      return [start, end];
    }

    function pointOnSegment(segment, t, normalOffset = 0, tangentOffset = 0) {
      const [start, end] = segment;
      const ratio = Math.max(0, Math.min(1, t));
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len;
      const uy = dy / len;
      const nx = -uy;
      const ny = ux;
      return {
        x: start.x + dx * ratio + nx * normalOffset + ux * tangentOffset,
        y: start.y + dy * ratio + ny * normalOffset + uy * tangentOffset,
      };
    }

    async function drawCenteredLabel(text, center, localFontSize) {
      const labelWidth = estimateTextWidth(text, localFontSize);
      await drawSketchText(
        text,
        center.x - labelWidth * 0.5,
        center.y - localFontSize * 0.48,
        localFontSize,
        0.01,
        labelOptions,
      );
    }

    async function drawSubscriptLabel(baseText, subText, anchor, localFontSize) {
      const baseWidth = estimateTextWidth(baseText, localFontSize);
      const subFontSize = localFontSize * 0.66;
      const subWidth = estimateTextWidth(subText, subFontSize);
      const fullWidth = baseWidth + subWidth * 0.86;
      const startX = anchor.x - fullWidth * 0.5;
      const startY = anchor.y - localFontSize * 0.46;
      await drawSketchText(baseText, startX, startY, localFontSize, 0.01, labelOptions);
      await drawSketchText(
        subText,
        startX + baseWidth - localFontSize * 0.02,
        startY + localFontSize * 0.34,
        subFontSize,
        0.01,
        labelOptions,
      );
    }

    const segEAxB = connectNodes(e, ab, labelSize * 0.38, labelSize * 0.52);
    const segEB = connectNodes(e, b, labelSize * 0.35, labelSize * 0.56);
    const segEA = connectNodes(e, a, labelSize * 0.35, labelSize * 0.54);
    const segAxB_B = connectNodes(ab, b, labelSize * 0.72, labelSize * 0.42);
    const segAxB_A = connectNodes(ab, a, labelSize * 0.32, labelSize * 0.5);
    const segA_C = connectNodes(a, c, labelSize * 0.34, labelSize * 0.42);
    const segB_C = connectNodes(b, c, labelSize * 0.28, labelSize * 0.56);

    await drawCenteredLabel("E", { x: e.x - labelSize * 0.06, y: e.y - labelSize * 0.08 }, labelSize);
    await drawCenteredLabel("A×B", { x: ab.x + labelSize * 0.02, y: ab.y }, labelSize * 0.94);
    await drawCenteredLabel("B", { x: b.x + labelSize * 0.02, y: b.y }, labelSize);
    await drawCenteredLabel("A", { x: a.x + labelSize * 0.02, y: a.y + labelSize * 0.02 }, labelSize);
    await drawCenteredLabel("C", { x: c.x + labelSize * 0.02, y: c.y + labelSize * 0.02 }, labelSize);

    const labelE = pointOnSegment(segEAxB, 0.48, -tinySize * 0.7);
    const labelP2 = pointOnSegment(segEB, 0.58, -tinySize * 0.78, tinySize * 0.08);
    const labelP1 = pointOnSegment(segEA, 0.52, tinySize * 0.84);
    const labelPi2 = pointOnSegment(segAxB_B, 0.52, -tinySize * 0.82);
    const labelPi1 = pointOnSegment(segAxB_A, 0.54, tinySize * 0.82);
    const labelG = pointOnSegment(segB_C, 0.54, tinySize * 0.88);
    const labelF = pointOnSegment(segA_C, 0.52, tinySize * 0.78);

    await drawSketchText(
      "e",
      labelE.x - tinySize * 0.3,
      labelE.y - tinySize * 0.42,
      tinySize,
      0.01,
      labelOptions,
    );
    await drawSubscriptLabel("p", "2", labelP2, tinySize);
    await drawSubscriptLabel("p", "1", labelP1, tinySize);
    await drawSubscriptLabel("π", "2", labelPi2, tinySize);
    await drawSubscriptLabel("π", "1", labelPi1, tinySize);
    await drawSketchText(
      "g",
      labelG.x - tinySize * 0.32,
      labelG.y - tinySize * 0.42,
      tinySize,
      0.01,
      labelOptions,
    );
    await drawSketchText(
      "f",
      labelF.x - tinySize * 0.3,
      labelF.y - tinySize * 0.4,
      tinySize,
      0.01,
      labelOptions,
    );
  }

  async function processFigureSketchLine(lineText) {
    const kinds = parseFigureSketchKinds(lineText);
    if (!kinds || kinds.length === 0) {
      return null;
    }

    const maxContentWidth = Math.max(40, availableLineWidth());
    const panelGap = Math.max(fontSize * 0.5, documentLayoutMode ? 24 : 28);
    const panelCount = kinds.length;
    const panelWidth =
      panelCount === 1
        ? Math.min(maxContentWidth * 0.7, Math.max(fontSize * 4.8, documentLayoutMode ? 238 : 280))
        : (maxContentWidth - panelGap) / 2;
    const safePanelWidth = Math.max(fontSize * 4.6, panelWidth);
    const panelHeight = Math.max(
      fontSize * 3,
      safePanelWidth * (documentLayoutMode ? 0.68 : 0.64),
    );
    const totalWidth = panelCount === 1 ? safePanelWidth : safePanelWidth * 2 + panelGap;
    const startX = activeLeft + Math.max(0, (maxContentWidth - totalWidth) * 0.5);
    const topY = cursorY + fontSize * 0.04;

    for (let i = 0; i < panelCount; i += 1) {
      const kind = kinds[i];
      const panelX = startX + i * (safePanelWidth + panelGap);
      if (kind === "image") {
        await drawImageSketchPanel(panelX, topY, safePanelWidth, panelHeight);
      } else {
        await drawFormulaSketchPanel(panelX, topY, safePanelWidth, panelHeight);
      }
    }

    return panelHeight + fontSize * 0.28;
  }

  async function processPlainLine(lineText, lineOptions = {}) {
    const baseFontSize = lineOptions.fontSize ?? fontSize;
    const baseLetterSpacing = lineOptions.letterSpacing ?? letterSpacing;
    const indentWidth = Math.max(0, lineOptions.indentWidth ?? 0);
    let pendingScript = null;
    let stickyScript = null;
    let stickyScriptDepth = 0;
    let previousLatinChar = null;

    if (indentWidth > 0 && Math.abs(cursorX - activeLeft) <= baseFontSize * 0.16) {
      cursorX += indentWidth;
    }

    const chars = Array.from(lineText);
    for (let i = 0; i < chars.length; i += 1) {
      const char = chars[i];
      const category = classifyChar(char);

      if (category === "space") {
        pendingScript = null;
        cursorX += baseFontSize * 0.34;
        previousLatinChar = null;
        continue;
      }

      if (stickyScript && char === "{") {
        stickyScriptDepth += 1;
        continue;
      }

      if (stickyScript && char === "}") {
        stickyScriptDepth -= 1;
        if (stickyScriptDepth <= 0) {
          stickyScript = null;
          stickyScriptDepth = 0;
        }
        continue;
      }

      if ((char === "^" || char === "_") && i + 1 < chars.length) {
        const nextChar = chars[i + 1];
        const nextCategory = classifyChar(nextChar);
        if (nextChar === "{") {
          stickyScript = char === "^" ? "super" : "sub";
          stickyScriptDepth = 0;
          continue;
        }
        if (
          nextCategory !== "space" &&
          nextCategory !== "newline" &&
          nextChar !== "}" &&
          nextChar !== "{"
        ) {
          pendingScript = stickyScript ?? (char === "^" ? "super" : "sub");
          continue;
        }
      }

      if (char === "}" || char === "{") {
        if (stickyScript) {
          continue;
        }
      }

      // In document mode, keep Latin words together to avoid "Open AI"/"comm ent" splits.
      if (
        documentLayoutMode &&
        !stickyScript &&
        !pendingScript &&
        isLatinWordChar(char)
      ) {
        let runEnd = i + 1;
        while (runEnd < chars.length && isLatinWordChar(chars[runEnd])) {
          runEnd += 1;
        }
        const runChars = chars.slice(i, runEnd);
        const estimatedRunWidth = estimateTextWidth(runChars.join(""), baseFontSize) * 0.86;
        const lineCapacity = Math.max(80, activeRight - activeLeft);

        if (
          estimatedRunWidth <= lineCapacity &&
          cursorX > activeLeft + baseFontSize * 0.16 &&
          cursorX + estimatedRunWidth > activeRight
        ) {
          newLine();
        }

        // If one glyph in a Latin word is weak under the current font map,
        // fallback the whole run to avoid mixed, messy letterforms.
        const preferBuiltinRun = await shouldFallbackWholeLatinRun(runChars);
        let runPrevLatinChar = previousLatinChar;
        for (const runChar of runChars) {
          const runCategory = classifyChar(runChar);
          if (runCategory === "latin" && runPrevLatinChar) {
            cursorX -= latinPairTightenOffset(runPrevLatinChar, runChar, baseFontSize, {
              documentLayoutMode,
            });
          }
          const advance = await placeGlyphAt(runChar, runCategory, {
            scriptType: null,
            cursorY: cursorY,
            fontSize: baseFontSize,
            letterSpacing: baseLetterSpacing,
            preferBuiltin: preferBuiltinRun,
          });
          cursorX += advance;
          runPrevLatinChar = runCategory === "latin" ? runChar : null;
        }
        previousLatinChar = runPrevLatinChar;

        i = runEnd - 1;
        continue;
      }

      const scriptType = stickyScript ?? pendingScript;
      const isScript = Boolean(scriptType);
      pendingScript = null;

      const localFontSize = baseFontSize * (isScript ? 0.64 : 1);
      const scriptYOffset =
        scriptType === "super"
          ? -baseFontSize * 0.46
          : scriptType === "sub"
            ? baseFontSize * 0.2
            : 0;

      const estimatedAdvance =
        localFontSize * (category === "han" ? 0.95 : 0.62) + baseLetterSpacing * 0.8;
      const projectedX = cursorX + estimatedAdvance;
      if (projectedX > activeRight) {
        let keepOnCurrentLine = false;
        if (
          smartLayout &&
          !isScript &&
          isLeadingLinePunctuation(char) &&
          cursorX > activeLeft + baseFontSize * 0.34
        ) {
          const overflow = projectedX - activeRight;
          keepOnCurrentLine = overflow <= baseFontSize * (documentLayoutMode ? 0.46 : 0.38);
        }
        if (!keepOnCurrentLine) {
          newLine();
          previousLatinChar = null;
        }
      }

      if (
        smartLayout &&
        !isScript &&
        isOpeningPunctuation(char) &&
        cursorX > activeLeft + baseFontSize * 0.34
      ) {
        const remainingAfterCurrent = activeRight - (cursorX + estimatedAdvance);
        if (remainingAfterCurrent < baseFontSize * (documentLayoutMode ? 0.52 : 0.44)) {
          newLine();
          previousLatinChar = null;
        }
      }

      if (!isScript && category === "latin" && previousLatinChar) {
        cursorX -= latinPairTightenOffset(previousLatinChar, char, localFontSize, {
          documentLayoutMode,
        });
      }
      const advance = await placeGlyphAt(char, category, {
        scriptType,
        cursorY: cursorY + scriptYOffset,
        fontSize: localFontSize,
        letterSpacing: baseLetterSpacing,
      });
      cursorX += advance;
      previousLatinChar = !isScript && category === "latin" ? char : null;
      if (isWideColonChar(char) && !isScript) {
        const colonExtra =
          char === "："
            ? documentLayoutMode
              ? 0.3
              : 0.26
            : documentLayoutMode
              ? 0.2
              : 0.16;
        cursorX += baseFontSize * colonExtra;
      }
    }
    return baseFontSize * 1.04;
  }

  function splitLatexLineAtTopLevelComma(lineText) {
    const source = String(lineText ?? "");
    if (!source.includes(",") && !source.includes("\\qquad") && !source.includes("\\quad")) {
      return null;
    }

    const normalizeChunk = (value) => value.replace(/\\(?:qquad|quad|,|;|:|!)/g, " ").replace(/\s+/g, " ").trim();
    const chunks = [];
    let current = "";
    let braceDepth = 0;
    let parenDepth = 0;
    let bracketDepth = 0;

    for (let i = 0; i < source.length; i += 1) {
      const char = source[i];
      if (char === "\\") {
        const atTopLevel = braceDepth === 0 && parenDepth === 0 && bracketDepth === 0;
        if (source.startsWith("\\,", i) || source.startsWith("\\;", i) || source.startsWith("\\:", i) || source.startsWith("\\!", i)) {
          current += " ";
          i += 1;
          continue;
        }
        if (atTopLevel && source.startsWith("\\qquad", i)) {
          const head = normalizeChunk(current);
          if (head) {
            chunks.push(head);
          }
          current = "";
          i += "\\qquad".length - 1;
          continue;
        }
        if (atTopLevel && source.startsWith("\\quad", i)) {
          const head = normalizeChunk(current);
          if (head) {
            chunks.push(head);
          }
          current = "";
          i += "\\quad".length - 1;
          continue;
        }
        current += char;
        continue;
      }
      if (char === "{") {
        braceDepth += 1;
        current += char;
        continue;
      }
      if (char === "}") {
        braceDepth = Math.max(0, braceDepth - 1);
        current += char;
        continue;
      }
      if (char === "(") {
        parenDepth += 1;
        current += char;
        continue;
      }
      if (char === ")") {
        parenDepth = Math.max(0, parenDepth - 1);
        current += char;
        continue;
      }
      if (char === "[") {
        bracketDepth += 1;
        current += char;
        continue;
      }
      if (char === "]") {
        bracketDepth = Math.max(0, bracketDepth - 1);
        current += char;
        continue;
      }
      if (char === "," && braceDepth === 0 && parenDepth === 0 && bracketDepth === 0) {
        const head = normalizeChunk(current);
        if (head) {
          chunks.push(head);
        }
        current = "";
        continue;
      }
      current += char;
    }

    const tail = normalizeChunk(current);
    if (tail) {
      chunks.push(tail);
    }
    return chunks.length > 1 ? chunks : null;
  }

  function splitLatexLineAtTopLevelOperators(lineText) {
    const source = String(lineText ?? "");
    if (!/[+\-]/.test(source)) {
      return null;
    }

    const chunks = [];
    let current = "";
    let braceDepth = 0;
    let parenDepth = 0;
    let bracketDepth = 0;
    let escaped = false;

    const pushCurrent = () => {
      const normalized = current.replace(/\s+/g, " ").trim();
      if (normalized) {
        chunks.push(normalized);
      }
      current = "";
    };

    for (let i = 0; i < source.length; i += 1) {
      const char = source[i];

      if (escaped) {
        current += char;
        escaped = false;
        continue;
      }

      if (char === "\\") {
        current += char;
        escaped = true;
        continue;
      }

      if (char === "{") {
        braceDepth += 1;
        current += char;
        continue;
      }
      if (char === "}") {
        braceDepth = Math.max(0, braceDepth - 1);
        current += char;
        continue;
      }
      if (char === "(") {
        parenDepth += 1;
        current += char;
        continue;
      }
      if (char === ")") {
        parenDepth = Math.max(0, parenDepth - 1);
        current += char;
        continue;
      }
      if (char === "[") {
        bracketDepth += 1;
        current += char;
        continue;
      }
      if (char === "]") {
        bracketDepth = Math.max(0, bracketDepth - 1);
        current += char;
        continue;
      }

      if ((char === "+" || char === "-") && braceDepth === 0 && parenDepth === 0 && bracketDepth === 0) {
        const prevChar = current.trimEnd().slice(-1);
        const nextNonSpace = source.slice(i + 1).match(/\S/)?.[0] ?? "";
        if (!prevChar || /[=+\-*/^_,([{]/.test(prevChar) || !nextNonSpace) {
          current += char;
          continue;
        }
        pushCurrent();
        current = char;
        continue;
      }

      current += char;
    }

    pushCurrent();
    return chunks.length > 1 ? chunks : null;
  }

  function splitLatexLineBeforeEquals(lineText) {
    const source = String(lineText ?? "");
    if (!source.includes("=")) {
      return null;
    }

    const chunks = [];
    let current = "";
    let braceDepth = 0;
    let parenDepth = 0;
    let bracketDepth = 0;
    let escaped = false;

    for (let i = 0; i < source.length; i += 1) {
      const char = source[i];

      if (escaped) {
        current += char;
        escaped = false;
        continue;
      }

      if (char === "\\") {
        current += char;
        escaped = true;
        continue;
      }

      if (char === "{") {
        braceDepth += 1;
        current += char;
        continue;
      }
      if (char === "}") {
        braceDepth = Math.max(0, braceDepth - 1);
        current += char;
        continue;
      }
      if (char === "(") {
        parenDepth += 1;
        current += char;
        continue;
      }
      if (char === ")") {
        parenDepth = Math.max(0, parenDepth - 1);
        current += char;
        continue;
      }
      if (char === "[") {
        bracketDepth += 1;
        current += char;
        continue;
      }
      if (char === "]") {
        bracketDepth = Math.max(0, bracketDepth - 1);
        current += char;
        continue;
      }

      if (char === "=" && braceDepth === 0 && parenDepth === 0 && bracketDepth === 0) {
        const prevChar = current.trimEnd().slice(-1);
        if (prevChar && /[<>!~]/.test(prevChar)) {
          current += char;
          continue;
        }
        const head = current.trim();
        if (head) {
          chunks.push(head);
        }
        current = "=";
        continue;
      }

      current += char;
    }

    const tail = current.trim();
    if (tail) {
      chunks.push(tail);
    }
    return chunks.length > 1 ? chunks : null;
  }

  async function drawLatexLayout(layout, topY, scale, centered, lineMeta = {}) {
    const maxContentWidth = Math.max(40, availableLineWidth());
    const explicitLeft = Number(lineMeta.overrideLeft);
    const left = Number.isFinite(explicitLeft)
      ? explicitLeft
      : centered || centerMode
        ? activeLeft + Math.max(0, (maxContentWidth - layout.width * scale) * 0.5)
        : activeLeft;
    const scriptThreshold = Math.max(8, Number(lineMeta.mathFontSize) || fontSize) * 0.72;
    const localHandwritingStrength = clampValue(
      Number(lineMeta.latexHandwritingStrength ?? latexHandwritingStrength),
      0,
      1,
    );

    function shouldKeepLatexGlyphRigid(char, category) {
      if (!char) {
        return true;
      }
      // Formula readability matters more than freehand wobble. Keep non-Han glyphs rigid.
      return category !== "han";
    }

    function estimateLatexCharWidthFactor(char) {
      const normalizedChar = normalizeMathPresentationChar(char);
      const category = classifyChar(normalizedChar);
      if (category === "han") {
        return 0.95;
      }
      if (/[A-Za-z0-9]/.test(normalizedChar)) {
        return 0.64;
      }
      if (/[(){}\[\]]/.test(normalizedChar)) {
        return 0.44;
      }
      if (/[=<>+\-]/.test(normalizedChar)) {
        return 0.72;
      }
      if (normalizedChar === "∫") {
        return 0.42;
      }
      if (normalizedChar === "Σ" || normalizedChar === "∑" || normalizedChar === "∏") {
        return 0.74;
      }
      if (normalizedChar === "/" || normalizedChar === "\\") {
        return 0.52;
      }
      return 0.62;
    }

    function resolveLatexItemFontSize(item) {
      const base = Math.max(8, item.fontSize * scale);
      const targetWidth = Math.max(1, (item.width ?? 0) * scale);
      const targetHeight = Math.max(1, (item.height ?? item.fontSize ?? 0) * scale);
      if (targetWidth <= 1 || !item.char) {
        return clampValue(Math.min(base, targetHeight * 1.04), 8, base);
      }
      const widthFactor = estimateLatexCharWidthFactor(item.char);
      const widthDriven = targetWidth / Math.max(0.24, widthFactor);
      const heightDriven = targetHeight * 1.04;
      let capped = Math.min(base, widthDriven * 1.08, heightDriven);

      if (/[(){}\[\]]/.test(item.char)) {
        capped = Math.min(capped, targetHeight);
      } else if (/[.,;:]/.test(item.char)) {
        capped = Math.min(capped, targetHeight * 0.96);
      }

      return clampValue(capped, 8, base);
    }

    for (const item of layout.items) {
      if (item.type === "line") {
        const lineX = left + item.x * scale;
        const lineY = topY + item.y * scale;
        const lineWidth = item.width * scale;
        const lineThickness = Math.max(1, item.thickness * scale);
        if (localHandwritingStrength > 0.08 && lineWidth > 4) {
          const swaySeed = (item.x + item.y * 3.1 + item.width * 0.73) * 0.17;
          const sway = Math.sin(swaySeed) * Math.min(1.8, lineWidth * 0.006) * localHandwritingStrength;
          pushSyntheticSegmentStroke({
            x0: lineX,
            y0: lineY - sway * 0.4,
            x1: lineX + lineWidth,
            y1: lineY + sway,
            thickness: lineThickness * (1 + localHandwritingStrength * 0.06),
            stable: true,
            syntheticKind: "math-rule",
          });
        } else {
          pushSyntheticLineStroke({
            x: lineX,
            y: lineY,
            width: lineWidth,
            thickness: lineThickness,
            stable: true,
            syntheticKind: "math-rule",
          });
        }
        continue;
      }

      const drawChar = normalizeMathPresentationChar(item.char);
      const category = classifyChar(drawChar);
      const itemFontSize = Math.max(8, item.fontSize * scale);
      const itemTopY = topY + item.y * scale;
      if (!drawChar || /\s/.test(drawChar)) {
        continue;
      }
      const formulaGlyph = hasFormulaGlyph(drawChar) ? getFormulaGlyph(drawChar) : null;
      const isFormulaHandLetter =
        drawChar === "ℒ" ||
        category === "latin" ||
        /^[A-Za-z0-9]$/.test(drawChar) ||
        /[α-ωΑ-Ω]/u.test(drawChar);
      const preferUniversalFormulaHandGlyph =
        Boolean(preferUniversalLatinMath) && isFormulaHandLetter;
      const shouldUseFormulaStrokeGlyph =
        Boolean(formulaGlyph) &&
        (!preferUniversalFormulaHandGlyph ||
          Boolean(preferBuiltinLatexGlyphs) ||
          /[=+\-<>≤≥≠≈±×÷]/.test(drawChar) ||
          /[()[\]{}|/\\\\]/.test(drawChar) ||
          drawChar === "∫" ||
          drawChar === "Σ" ||
          drawChar === "∑" ||
          drawChar === "∏" ||
          drawChar === "√");
      const shouldUseUniversalFormulaSkeleton =
        preferUniversalFormulaHandGlyph && !shouldUseFormulaStrokeGlyph;
      const isFormulaTextGlyph = shouldUseUniversalFormulaSkeleton;
      const isFormulaBuiltinHandLetter =
        shouldUseFormulaStrokeGlyph &&
        (category === "latin" || /^[A-Za-z0-9]$/.test(drawChar));
      const isFormulaAsciiVariable = isFormulaBuiltinHandLetter && /^[A-Za-z0-9]$/.test(drawChar);
      const formulaLockShape = boardLectureMode
        ? shouldUseFormulaStrokeGlyph
        : !(isFormulaTextGlyph || isFormulaBuiltinHandLetter);
      const formulaPenWidthScale = isFormulaTextGlyph
        ? 1.14
        : boardLectureMode && isFormulaAsciiVariable
          ? 1.24
          : boardLectureMode && isFormulaBuiltinHandLetter
            ? 1.12
            : 0.92;
      const formulaCategory = category;
      await placeGlyphAt(drawChar, formulaCategory, {
        cursorX: left + item.x * scale,
        cursorY: itemTopY,
        fontSize: itemFontSize,
        penWidth: Math.max(1, penWidth * formulaPenWidthScale * scale),
        letterSpacing: 0,
        advance: 0,
        lockShape: formulaLockShape,
        shapeSoftness: isFormulaTextGlyph
          ? (/^\d$/.test(drawChar) ? 0.78 : 0.86)
          : isFormulaBuiltinHandLetter
            ? (boardLectureMode ? (/^\d$/.test(drawChar) ? 0.78 : 0.84) : (/^\d$/.test(drawChar) ? 0.92 : 1.18))
            : 1,
        absolutePlacement: true,
        layoutLocked: true,
        preferBuiltin: shouldUseFormulaStrokeGlyph,
        forceUniversal: preferUniversalFormulaHandGlyph,
        overrideGlyph: shouldUseFormulaStrokeGlyph ? formulaGlyph : null,
        preferMathSkeleton: shouldUseUniversalFormulaSkeleton,
        mathStyle: item.style ?? null,
        mathMicroVariance: isFormulaTextGlyph && formulaCategory === "math" ? 0.08 : 0,
      });
    }
  }

  async function processLatexLine(lineText, lineOptions = {}) {
    const mathFontSizeBase = lineOptions.fontSize ?? fontSize;
    const centered = lineOptions.center ?? false;
    const lineSource = String(lineText ?? "").trim();
    const displayMode = documentLayoutMode || /^\s*(\\\[|\$\$)/.test(lineSource);
    const mathFontSize = displayMode
      ? mathFontSizeBase * (documentLayoutMode ? (boardLectureMode ? 1.34 : 1.08) : 1.04)
      : mathFontSizeBase;
    const hasBigLimitOperator = /\\(?:sum|prod|int)\s*(?:_|\\limits)/.test(lineSource);
    const displayBottomPad = displayMode ? Math.max(mathFontSize * 0.05, 5) : 0;

    function resolveDisplayStartX(contentWidth, rowIndex = 0) {
      if (!displayMode || centered || centerMode) {
        return activeLeft + Math.max(0, (maxContentWidth - contentWidth) * 0.5);
      }
      const available = Math.max(0, maxContentWidth - contentWidth);
      const baseIndent = boardLectureMode
        ? Math.min(Math.max(3, mathFontSize * 0.05), Math.max(5, available * 0.03))
        : Math.min(Math.max(6, mathFontSize * 0.12), Math.max(10, available * 0.08));
      const cascade = boardLectureMode
        ? Math.min(rowIndex * mathFontSize * 0.03, Math.max(4, available * 0.04))
        : Math.min(rowIndex * mathFontSize * 0.08, Math.max(8, available * 0.08));
      const random = mulberry32(hashCode(`${lineSource}:${rowIndex}:display-indent`));
      const drift = (random() - 0.5) * Math.min(boardLectureMode ? 1.5 : 4, mathFontSize * (boardLectureMode ? 0.018 : 0.04), available * (boardLectureMode ? 0.03 : 0.08));
      return activeLeft + clampValue(baseIndent + cascade + drift, 0, available);
    }

    async function resolveMathLayout(sourceText, mode = displayMode) {
      let resolvedLayout = layoutLatexMathLine(sourceText, { fontSize: mathFontSize });
      if ((!resolvedLayout || !resolvedLayout.items?.length) && preferOpenSourceLatexRenderer) {
        resolvedLayout = await layoutLatexMathLineWithKatex(sourceText, {
          fontSize: mathFontSize,
          displayMode: mode,
        });
      }
      return resolvedLayout;
    }

    const layout = await resolveMathLayout(lineText, displayMode);
    if (!layout || !layout.items.length) {
      return processPlainLine(lineText, lineOptions);
    }

    const maxContentWidth = Math.max(40, availableLineWidth());
    const commaSegments = splitLatexLineAtTopLevelComma(lineText);
    if (commaSegments?.length) {
      const segmentLayouts = [];
      for (const segment of commaSegments) {
        const segmentLayout = await resolveMathLayout(segment, displayMode);
        if (!segmentLayout || !segmentLayout.items?.length) {
          segmentLayouts.length = 0;
          break;
        }
        segmentLayouts.push(segmentLayout);
      }
      if (segmentLayouts.length === commaSegments.length) {
        const commaLayout = await resolveMathLayout(',', false);
        const commaWidth = commaLayout?.width ?? mathFontSize * 0.16;
        const gap = Math.max(mathFontSize * 0.34, 12);
        const naturalWidth =
          segmentLayouts.reduce((sum, item) => sum + item.width, 0) +
          commaWidth * Math.max(0, segmentLayouts.length - 1) +
          gap * Math.max(0, segmentLayouts.length - 1);
        const rowGroups = [];
        let currentRow = [];
        let currentRowWidth = 0;
        const maxSegmentsPerRow = displayMode ? 2 : Number.POSITIVE_INFINITY;
        for (const segmentLayout of segmentLayouts) {
          const additionalWidth =
            (currentRow.length ? commaWidth + gap : 0) + segmentLayout.width;
          const hasTallMathBlock =
            segmentLayout.height > mathFontSize * 1.45 ||
            currentRow.some((layoutItem) => layoutItem.height > mathFontSize * 1.45);
          if (
            currentRow.length &&
            (currentRowWidth + additionalWidth > maxContentWidth * (displayMode ? 0.94 : 0.98) ||
              currentRow.length >= maxSegmentsPerRow ||
              hasTallMathBlock)
          ) {
            rowGroups.push({ layouts: currentRow, width: currentRowWidth });
            currentRow = [segmentLayout];
            currentRowWidth = segmentLayout.width;
          } else {
            currentRow.push(segmentLayout);
            currentRowWidth += additionalWidth;
          }
        }
        if (currentRow.length) {
          rowGroups.push({ layouts: currentRow, width: currentRowWidth });
        }

        const segmentScale = naturalWidth > maxContentWidth ? maxContentWidth / naturalWidth : 1;
        const shouldWrapRows =
          rowGroups.length > 1 || (displayMode && segmentScale < 0.9) || segmentScale < 0.82;

        if (shouldWrapRows) {
          let offsetY = 0;
          let consumedHeight = 0;
          const wrapGap = Math.max(
            mathFontSize * (documentLayoutMode ? (boardLectureMode ? 0.1 : 0.16) : 0.24),
            boardLectureMode ? 4 : 6,
          );
          for (let rowIndex = 0; rowIndex < rowGroups.length; rowIndex += 1) {
            const row = rowGroups[rowIndex];
            const rowScale = row.width > maxContentWidth ? maxContentWidth / row.width : 1;
            const totalWidth = row.width * rowScale;
            const startX = resolveDisplayStartX(totalWidth, rowIndex);
            let offsetX = 0;
            let rowHeight = 0;
            for (let index = 0; index < row.layouts.length; index += 1) {
              const segmentLayout = row.layouts[index];
              await drawLatexLayout(segmentLayout, cursorY + offsetY, rowScale, false, {
                mathFontSize,
                hasBigLimitOperator,
                latexHandwritingStrength,
                overrideLeft: startX + offsetX,
              });
              offsetX += segmentLayout.width * rowScale;
              rowHeight = Math.max(rowHeight, segmentLayout.height * rowScale);
              if (index < row.layouts.length - 1 && commaLayout?.items?.length) {
                await drawLatexLayout(commaLayout, cursorY + offsetY, rowScale, false, {
                  mathFontSize,
                  hasBigLimitOperator,
                  latexHandwritingStrength,
                  overrideLeft: startX + offsetX,
                });
                offsetX += commaWidth * rowScale + gap * rowScale;
                rowHeight = Math.max(rowHeight, commaLayout.height * rowScale);
              }
            }
            const effectiveRowHeight = Math.max(mathFontSize, rowHeight);
            offsetY += effectiveRowHeight;
            consumedHeight += effectiveRowHeight;
            if (rowIndex < rowGroups.length - 1) {
              offsetY += wrapGap;
              consumedHeight += wrapGap;
            }
          }
          return consumedHeight + displayBottomPad;
        }

        const totalWidth = naturalWidth * segmentScale;
        const startX = resolveDisplayStartX(totalWidth, 0);
        let offsetX = 0;
        let maxHeight = 0;
        for (let index = 0; index < segmentLayouts.length; index += 1) {
          const segmentLayout = segmentLayouts[index];
          await drawLatexLayout(segmentLayout, cursorY, segmentScale, false, {
            mathFontSize,
            hasBigLimitOperator,
            latexHandwritingStrength,
            overrideLeft: startX + offsetX,
          });
          offsetX += segmentLayout.width * segmentScale;
          maxHeight = Math.max(maxHeight, segmentLayout.height * segmentScale);
          if (index < segmentLayouts.length - 1 && commaLayout?.items?.length) {
            await drawLatexLayout(commaLayout, cursorY, segmentScale, false, {
              mathFontSize,
              hasBigLimitOperator,
              latexHandwritingStrength,
              overrideLeft: startX + offsetX,
            });
            offsetX += commaWidth * segmentScale + gap * segmentScale;
            maxHeight = Math.max(maxHeight, commaLayout.height * segmentScale);
          }
        }
        return Math.max(mathFontSize, maxHeight) + displayBottomPad;
      }
    }

    const needsWrap = layout.width > maxContentWidth;
    if (displayMode) {
      const operatorSegments = splitLatexLineAtTopLevelOperators(lineText);
      if (operatorSegments?.length && (needsWrap || operatorSegments.length >= 3)) {
        const segmentLayouts = [];
        for (const segment of operatorSegments) {
          const segmentLayout = await resolveMathLayout(segment, displayMode);
          if (!segmentLayout || !segmentLayout.items?.length) {
            segmentLayouts.length = 0;
            break;
          }
          segmentLayouts.push(segmentLayout);
        }
        if (segmentLayouts.length === operatorSegments.length) {
          let offsetY = 0;
          let consumedHeight = 0;
          const wrapGap = Math.max(
            mathFontSize * (documentLayoutMode ? (boardLectureMode ? 0.1 : 0.16) : 0.24),
            boardLectureMode ? 4 : 6,
          );
          for (let index = 0; index < segmentLayouts.length; index += 1) {
            const segmentLayout = segmentLayouts[index];
            const segmentScale =
              segmentLayout.width > maxContentWidth
                ? maxContentWidth / segmentLayout.width
                : 1;
            await drawLatexLayout(segmentLayout, cursorY + offsetY, segmentScale, centered, {
              mathFontSize,
              hasBigLimitOperator,
              latexHandwritingStrength,
              overrideLeft: resolveDisplayStartX(segmentLayout.width * segmentScale, index),
            });
            const segmentHeight = Math.max(mathFontSize, segmentLayout.height * segmentScale);
            offsetY += segmentHeight;
            consumedHeight += segmentHeight;
            if (index < segmentLayouts.length - 1) {
              offsetY += wrapGap;
              consumedHeight += wrapGap;
            }
          }
          return consumedHeight + displayBottomPad;
        }
      }
    }

    if (needsWrap) {
      const segments = splitLatexLineBeforeEquals(lineText);
      if (segments?.length) {
        const segmentLayouts = [];
        for (const segment of segments) {
          const segmentLayout = await resolveMathLayout(segment, displayMode);
          if (!segmentLayout || !segmentLayout.items?.length) {
            segmentLayouts.length = 0;
            break;
          }
          segmentLayouts.push(segmentLayout);
        }
        if (segmentLayouts.length === segments.length) {
          let offsetY = 0;
          let consumedHeight = 0;
          for (let index = 0; index < segmentLayouts.length; index += 1) {
            const segmentLayout = segmentLayouts[index];
            const segmentScale =
              segmentLayout.width > maxContentWidth
                ? maxContentWidth / segmentLayout.width
                : 1;
            await drawLatexLayout(segmentLayout, cursorY + offsetY, segmentScale, centered, {
              mathFontSize,
              hasBigLimitOperator,
              latexHandwritingStrength,
              overrideLeft: displayMode ? resolveDisplayStartX(segmentLayout.width * segmentScale, index) : undefined,
            });
            const segmentHeight = Math.max(mathFontSize, segmentLayout.height * segmentScale);
            offsetY += segmentHeight;
            consumedHeight += segmentHeight;
            if (index < segmentLayouts.length - 1) {
              const wrapGap = Math.max(
                mathFontSize * (documentLayoutMode ? (boardLectureMode ? 0.1 : 0.16) : 0.24),
                boardLectureMode ? 4 : 6,
              );
              offsetY += wrapGap;
              consumedHeight += wrapGap;
            }
          }
          return consumedHeight + displayBottomPad;
        }
      }
    }

    const scale = layout.width > maxContentWidth ? maxContentWidth / layout.width : 1;
    await drawLatexLayout(layout, cursorY, scale, centered, {
      mathFontSize,
      hasBigLimitOperator,
      latexHandwritingStrength,
      overrideLeft: displayMode ? resolveDisplayStartX(layout.width * scale, 0) : undefined,
    });
    return Math.max(mathFontSize, layout.height * scale) + displayBottomPad;
  }

  async function processAsciiTableRows(rows, tableOptions = {}) {
    if (!rows.length) {
      return fontSize;
    }

    const columnCount = rows.reduce((max, row) => Math.max(max, row.length), 0);
    if (columnCount <= 0) {
      return fontSize;
    }

    const cellFontSizeBase = fontSize * (documentLayoutMode ? 0.78 : 0.84);
    const cellHorizontalPadding = cellFontSizeBase * (documentLayoutMode ? 0.42 : 0.5);
    const cellVerticalPadding = cellFontSizeBase * (documentLayoutMode ? 0.24 : 0.28);
    const rowHeightBase = cellFontSizeBase + cellVerticalPadding * 2;
    const tableLineThicknessBase = Math.max(1, penWidth * (documentLayoutMode ? 0.66 : 0.72));

    const columnWidths = new Array(columnCount).fill(cellFontSizeBase * 1.3);
    for (const row of rows) {
      for (let column = 0; column < columnCount; column += 1) {
        const content = row[column] ?? "";
        const contentWidth = estimateTextWidth(content, cellFontSizeBase);
        columnWidths[column] = Math.max(
          columnWidths[column],
          contentWidth + cellHorizontalPadding * 2,
        );
      }
    }

    const naturalTableWidth = columnWidths.reduce((sum, width) => sum + width, 0);
    const maxContentWidth = Math.max(40, availableLineWidth());
    const scale = naturalTableWidth > maxContentWidth ? maxContentWidth / naturalTableWidth : 1;
    const tableWidth = naturalTableWidth * scale;
    const rowHeight = rowHeightBase * scale;
    const tableHeight = rowHeight * rows.length;
    const lineThickness = Math.max(1, tableLineThicknessBase * scale);
    const cellFontSize = Math.max(10, cellFontSizeBase * scale);

    const startX =
      tableOptions.center ?? centerMode
        ? activeLeft + Math.max(0, (maxContentWidth - tableWidth) * 0.5)
        : activeLeft;
    const xEdges = [startX];
    for (let column = 0; column < columnCount; column += 1) {
      xEdges.push(xEdges.at(-1) + columnWidths[column] * scale);
    }
    const yTop = cursorY + fontSize * 0.14;
    const yEdges = [yTop];
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
      yEdges.push(yEdges.at(-1) + rowHeight);
    }

    for (const y of yEdges) {
      pushSyntheticLineStroke({
        x: xEdges[0],
        y,
        width: tableWidth,
        thickness: lineThickness,
        stable: true,
        syntheticKind: "table-rule",
      });
    }
    for (const x of xEdges) {
      pushSyntheticVerticalLineStroke({
        x,
        y: yEdges[0],
        height: tableHeight,
        thickness: lineThickness,
        stable: true,
        syntheticKind: "table-rule",
      });
    }

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
      const row = rows[rowIndex];
      for (let column = 0; column < columnCount; column += 1) {
        const text = row[column] ?? "";
        if (!text) {
          continue;
        }
        const cellLeft = xEdges[column];
        const cellTop = yEdges[rowIndex];
        const cellWidth = xEdges[column + 1] - xEdges[column];
        const cellHeight = yEdges[rowIndex + 1] - yEdges[rowIndex];
        const estimatedWidth = estimateTextWidth(text, cellFontSize);
        const textStartX = cellLeft + Math.max(cellFontSize * 0.16, (cellWidth - estimatedWidth) * 0.5);
        const textStartY = cellTop + (cellHeight - cellFontSize) * 0.5;

        let cellCursorX = textStartX;
        for (const char of Array.from(text)) {
          const category = classifyChar(char);
          const advance = await placeGlyphAt(char, category, {
            cursorX: cellCursorX,
            cursorY: textStartY,
            fontSize: cellFontSize,
            penWidth: Math.max(1, penWidth * 0.78 * scale),
            letterSpacing: cellFontSize * 0.05,
            absolutePlacement: true,
            lockShape: true,
            layoutLocked: true,
          });
          cellCursorX += advance;
        }
      }
    }

    return tableHeight + fontSize * 0.26;
  }

  alignCursorToLineStart();

  const rawLines = String(text ?? "").split("\n");
  const lines = shouldAutoBoardLectureColumns(rawLines, {
    boardLectureMode,
    documentLayoutMode,
  })
    ? injectBoardLectureColumns(rawLines)
    : rawLines;
  for (let line = 0; line < lines.length; ) {
    const rawLine = lines[line] ?? "";
    const trimmedLine = rawLine.trim();

    const positionMarker = parsePositionMarker(trimmedLine);
    if (positionMarker) {
      const minX = multicolLayout ? activeLeft : padding;
      const maxX = multicolLayout ? activeRight - fontSize * 0.24 : maxWidth - padding - fontSize * 0.24;
      cursorX = clampValue(positionMarker.x, minX, Math.max(minX, maxX));
      cursorY = Math.max(padding, positionMarker.y);
      contentBottom = Math.max(contentBottom, cursorY);
      line += 1;
      continue;
    }

      const gapMarker = parseGapMarker(trimmedLine);
      if (gapMarker != null) {
        newLine(gapMarker);
        line += 1;
      continue;
    }

    const multicolStart = parseMulticolStartMarker(trimmedLine);
    if (multicolStart) {
      startMulticolLayout(multicolStart);
      line += 1;
      continue;
    }
    if (trimmedLine === MARKER_MULTICOL_BREAK) {
      breakMulticolLayout();
      line += 1;
      continue;
    }
    if (trimmedLine === MARKER_MULTICOL_END) {
      endMulticolLayout();
      line += 1;
      continue;
    }
    if (trimmedLine === MARKER_CENTER_START) {
      centerMode = true;
      line += 1;
      continue;
    }
    if (trimmedLine === MARKER_CENTER_END) {
      centerMode = false;
      line += 1;
      continue;
    }
    if (trimmedLine === MARKER_PAR_BREAK) {
      line += 1;
      if (line < lines.length) {
        const previousSourceLine = String(lines[line - 2] ?? "").trim();
        const followsHeading =
          previousSourceLine.startsWith(`${MARKER_SECTION} `) ||
          previousSourceLine.startsWith(`${MARKER_SUBSECTION} `);
        const paragraphGap = structurePlanner.suggestParagraphGap({
          fontSize,
          lineHeight,
          followsHeading,
        });
        newLine(paragraphGap);
      }
      continue;
    }
    if (trimmedLine === MARKER_PAGE_BREAK) {
      line += 1;
      forcePageBreak(Math.max(fontSize * 0.08, 6));
      continue;
    }

    const tableBlock = parseAsciiTableBlock(lines, line);
    if (tableBlock) {
      cursorY = structurePlanner.findClearY(cursorY, lineHeight * 1.2, {
        left: activeLeft,
        right: activeRight,
      });
      const lineConsumedHeight = await processAsciiTableRows(tableBlock.rows, {
        center: true,
      });
      reserveCurrentBand(lineConsumedHeight, "table");
      contentBottom = Math.max(contentBottom, cursorY + lineConsumedHeight);
      line += tableBlock.lineCount;
      if (line < lines.length) {
        newLine(Math.max(lineHeight, lineConsumedHeight * 0.98));
      }
      continue;
    }

    const figureHeight = await processFigureSketchLine(trimmedLine);
    if (figureHeight != null) {
      cursorY = structurePlanner.findClearY(cursorY, figureHeight, {
        left: activeLeft,
        right: activeRight,
      });
      reserveCurrentBand(figureHeight, "figure");
      contentBottom = Math.max(contentBottom, cursorY + figureHeight);
      line += 1;
      if (line < lines.length) {
        newLine(Math.max(lineHeight, figureHeight));
      }
      continue;
    }

    const styled = parseStyledLine(rawLine, fontSize, {
      documentLayoutMode,
      boardLectureMode,
    });
    const lineText = styled.text;
    if (!lineText.trim()) {
      line += 1;
      continue;
    }

    const shouldUseLatexLayout = enableLatexLayout && isLatexMathLine(lineText);
    const compactHeadingNote = resolveCompactHeadingNoteCandidate(lines, line, trimmedLine, styled);
    const paragraphIndentWidth = shouldApplyParagraphIndent(lineText)
      ? styled.fontSize * 0.92 * paragraphIndentChars
      : 0;
    let lineConsumedHeight = styled.fontSize;
    let consumedSourceLines = 1;
    let attachedCompactHeadingNote = false;
    cursorY = structurePlanner.findClearY(cursorY, Math.max(styled.fontSize, lineHeight * 0.92), {
      left: activeLeft,
      right: activeRight,
    });
    if (shouldUseLatexLayout) {
      lineConsumedHeight = await processLatexLine(lineText, {
        fontSize: styled.fontSize,
        center: centerMode,
      });
      reserveCurrentBand(lineConsumedHeight, "latex-line");
    } else {
      const lineAnchorY = cursorY;
      lineConsumedHeight = await processPlainLine(lineText, {
        fontSize: styled.fontSize,
        indentWidth: paragraphIndentWidth,
      });
      if (compactHeadingNote) {
        const noteWidth = estimateTextWidth(compactHeadingNote.text, compactHeadingNote.fontSize);
        const noteX = cursorX + compactHeadingNote.gap;
        const noteFitsOnHeadingRow =
          Math.abs(cursorY - lineAnchorY) <= 0.5 &&
          noteX + noteWidth <= activeRight - compactHeadingNote.fontSize * 0.12;

        if (noteFitsOnHeadingRow) {
          await drawSketchText(
            compactHeadingNote.text,
            noteX,
            lineAnchorY + styled.fontSize * 0.04,
            compactHeadingNote.fontSize,
            compactHeadingNote.tracking,
          );
          consumedSourceLines = 2;
          attachedCompactHeadingNote = true;
        }
      }
      reserveCurrentBand(lineConsumedHeight * styled.lineScale, "text-line");
    }
    contentBottom = Math.max(contentBottom, cursorY + lineConsumedHeight * styled.lineScale);

    line += consumedSourceLines;
    if (line < lines.length) {
      const afterGapFactor = attachedCompactHeadingNote
        ? Math.min(styled.afterGap ?? 0, 0.02)
        : styled.afterGap ?? 0;
      const lineAdvance =
        Math.max(lineHeight, lineConsumedHeight * styled.lineScale) +
        styled.fontSize * afterGapFactor;
      newLine(lineAdvance);
    }
  }

  if (multicolLayout) {
    endMulticolLayout();
  }

  const height = Math.max(
    cursorY + fontSize + padding,
    contentBottom + fontSize * 0.2 + padding,
  );

  return {
    width: maxWidth,
    height,
    strokes,
    missingChars: Array.from(missingChars),
    hanziSourceCounts,
    universalGlyphCounts,
    layoutTelemetry: structurePlanner.buildTelemetry({
      contentBottom: contentBottom + fontSize * 0.2 + padding,
      breathingAmount,
      structureAwareness,
    }),
    strokeCount: strokes.length,
  };
}
