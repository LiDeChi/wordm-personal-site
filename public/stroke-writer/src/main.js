import { composeTextPlan } from "./lib/layoutComposer.js?v=20260319h";
import { classifyChar } from "./lib/charClassifier.js";
import { layoutLatexMathLineWithKatex } from "./lib/katexDomLayout.js?v=20260307c";
import { isLatexMathLine } from "./lib/latexMathLayout.js?v=20260319h";
import { extractLatexDocumentForHandwriting } from "./lib/latexDocumentExtractor.js?v=20260307c";
import { normalizeLatexInput } from "./lib/latexPreprocessor.js?v=20260307c";
import { StrokePlayer } from "./lib/strokePlayer.js?v=20260319g";
import {
  DEFAULT_HANDWRITING_CONTROLS,
  controlsToRenderStyle,
  normalizeHandwritingControls,
  resolveLayoutTuning,
} from "./lib/handwritingProfile.js?v=20260318b";
import { createFontSession } from "./lib/fontSession.js?v=20260307c";
import {
  FONT_PRESETS,
  DEFAULT_FONT_PRESET_ID,
  buildStaticFontStackFromPreset,
  getFontPresetById,
} from "./lib/fontPresets.js?v=20260319b";

const STORAGE_KEYS = {
  selectedPageSize: "ai-stroke-writer.selected-page-size.v1",
  runtimeFontSources: "ai-stroke-writer.runtime-font-sources.v1",
  selectedFontPreset: "ai-stroke-writer.selected-font-preset.v2",
};

const PAGE_PRESETS = {
  "a4-portrait": {
    key: "a4-portrait",
    label: "A4 竖版（210 × 297）",
    width: 1240,
    height: 1754,
  },
  "a4-landscape": {
    key: "a4-landscape",
    label: "A4 横版（297 × 210）",
    width: 1754,
    height: 1240,
  },
  "letter-portrait": {
    key: "letter-portrait",
    label: "Letter 竖版（8.5 × 11）",
    width: 1275,
    height: 1650,
  },
  "letter-landscape": {
    key: "letter-landscape",
    label: "Letter 横版（11 × 8.5）",
    width: 1650,
    height: 1275,
  },
  widescreen: {
    key: "widescreen",
    label: "16:9 宽屏",
    width: 1600,
    height: 900,
  },
};

const DEFAULT_PAGE_KEY = "a4-portrait";
const DEFAULT_CONTROL_SNAPSHOT = DEFAULT_HANDWRITING_CONTROLS;

const MARKER_SECTION = "[[SECTION]]";
const MARKER_SUBSECTION = "[[SUBSECTION]]";
const MARKER_CENTER_START = "[[CENTER_START]]";
const MARKER_CENTER_END = "[[CENTER_END]]";
const MARKER_MULTICOL_BREAK = "[[MCOL_BREAK]]";
const MARKER_MULTICOL_END = "[[MCOL_END]]";
const MARKER_PAR_BREAK = "[[PAR_BREAK]]";
const MARKER_PAGE_BREAK = "[[PAGE_BREAK]]";
const MARKER_POSITION_PREFIX = "[[POS:";
const MARKER_GAP_PREFIX = "[[GAP:";
const STRICT_STATIC_LATEX_REFERENCE = true;
const ENABLE_MATH_BITMAP_REVEAL = false;
const ENABLE_STATIC_MAPPING_PIPELINE = false;
const STATIC_MAPPING_PLAN_LIMITS = {
  latexHandwritingStrength: 0.04,
};
const STATIC_MAPPING_RUNTIME_STYLE_LIMITS = {
  jitter: 0.012,
  speedVariation: 0.018,
  humanize: 0.03,
  scribbleLevel: 0.05,
  breathingAmount: 0.02,
  breathingAmplitude: 0.0016,
  breathingSpeedSwing: 0.004,
  baselineDrift: 0.0012,
};

const LATIN_PRIMARY_FONT_URL = "./assets/fonts/Kalam-Regular.ttf";
const DEFAULT_DYNAMIC_FONT_SOURCES = getFontPresetById(DEFAULT_FONT_PRESET_ID).fontSources;

const STATIC_FONT_DEFS = [
  {
    family: "SW-PatrickHandPrimary",
    url: LATIN_PRIMARY_FONT_URL,
    source:
      'local("Patrick Hand"), local("PatrickHand-Regular"), url(./assets/fonts/PatrickHand-Regular.ttf)',
  },
  {
    family: "SW-ArchitectsDaughter",
    url: "./assets/fonts/ArchitectsDaughter-Regular.ttf",
  },
  {
    family: "SW-PatrickHand",
    url: "./assets/fonts/PatrickHand-Regular.ttf",
  },
  {
    family: "SW-Kalam",
    url: "./assets/fonts/Kalam-Regular.ttf",
  },
  {
    family: "SW-LXGWWenKai",
    url: "./assets/fonts/LXGWWenKai-Regular.ttf",
  },
  {
    family: "SW-Mathilde",
    url: "./assets/fonts/mathilde-ttf.ttf",
  },
  {
    family: "SW-IndieFlower",
    url: "./assets/fonts/IndieFlower-Regular.ttf",
  },
  {
    family: "SW-FiraMath",
    url: "./assets/fonts/FiraMath-Regular.otf",
  },
  {
    family: "SW-XITSMath",
    url: "./assets/fonts/XITSMath-Regular.otf",
  },
];

const DYNAMIC_MAPPER_FONT_DEF = DEFAULT_DYNAMIC_FONT_SOURCES;
let activeStaticFontStack = buildStaticFontStackFromPreset(getFontPresetById(DEFAULT_FONT_PRESET_ID));

const textInput = document.querySelector("#text-input");
const pageSizeInput = document.querySelector("#page-size");
const fontPresetInput = document.querySelector("#font-preset");
const autoPageContinueInput = document.querySelector("#auto-page-continue");
const assistantLogNode = document.querySelector("#assistant-log");
const assistantInput = document.querySelector("#assistant-input");
const assistantSendButton = document.querySelector("#assistant-send-btn");
const assistantClearButton = document.querySelector("#assistant-clear-btn");

const fontSizeInput = document.querySelector("#font-size");
const penWidthInput = document.querySelector("#pen-width");
const styleThicknessInput = document.querySelector("#style-thickness");
const speedInput = document.querySelector("#speed");
const jitterInput = document.querySelector("#jitter");
const speedVariationInput = document.querySelector("#speed-variation");
const humanizeInput = document.querySelector("#humanize");
const scribbleInput = document.querySelector("#scribble");
const breathingInput = document.querySelector("#breathing");
const layoutDensityInput = document.querySelector("#layout-density");
const strokePauseInput = document.querySelector("#stroke-pause");
const charPauseInput = document.querySelector("#char-pause");
const letterSpacingInput = document.querySelector("#letter-spacing");
const lineHeightInput = document.querySelector("#line-height");
const inkColorInput = document.querySelector("#ink-color");

const remoteHanziInput = document.querySelector("#remote-hanzi");
const enableLatexInput = document.querySelector("#enable-latex");

const buildPlayButton = document.querySelector("#build-play-btn");
const pauseButton = document.querySelector("#pause-btn");
const fastFinishButton = document.querySelector("#fast-finish-btn");
const resetButton = document.querySelector("#reset-btn");
const prevPageButton = document.querySelector("#prev-page-btn");
const nextPageButton = document.querySelector("#next-page-btn");
const exportButton = document.querySelector("#export-btn");

const statusNode = document.querySelector("#status");
const pageIndicatorNode = document.querySelector("#page-indicator");
const pageMetaNode = document.querySelector("#page-meta");
const paperStackNode = document.querySelector("#paper-stack");

let currentPlan = null;
let currentPagedPlans = [];
let currentPageIndex = 0;
let currentPageSpec = PAGE_PRESETS[DEFAULT_PAGE_KEY];
let currentRenderStyle = null;
let currentPaperGuide = null;
let lastBuildContext = null;
let pageAdvanceTimer = null;
let assistantHistory = [];
let player = null;
let pageCanvasNodes = [];
let pageFrameNodes = [];
let staticFontsReadyPromise = null;
const staticLoadedFontFamilies = new Set();
let playbackControlsLocked = false;
let dynamicUniversalMapperPromise = null;
let currentFontPresetId = DEFAULT_FONT_PRESET_ID;
let activeStaticFontPreset = getFontPresetById(DEFAULT_FONT_PRESET_ID);
let pendingAssistantLayoutSpec = null;
let pendingAssistantSceneSpec = null;
let staticLatexRenderHost = null;
let katexForeignObjectCssPromise = null;
const snapshotImageCache = new Map();

function getActivePresetBehavior() {
  return activeStaticFontPreset?.behavior && typeof activeStaticFontPreset.behavior === "object"
    ? activeStaticFontPreset.behavior
    : {};
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function applyBoardLectureStyleCaps(style, options = {}) {
  if (!style) {
    return style;
  }
  const boardLectureMode = Boolean(options.boardLectureMode ?? style.boardLectureMode);
  if (!boardLectureMode) {
    return style;
  }
  const documentLayoutMode = Boolean(options.documentLayoutMode ?? style.documentLayoutMode);
  style.boardLectureMode = true;
  style.cleanBoardMode = true;
  style.speedPxPerSec = clamp(style.speedPxPerSec ?? 32, 20, documentLayoutMode ? 34 : 40);
  style.speedVariation = clamp(style.speedVariation ?? 0.02, 0.008, documentLayoutMode ? 0.03 : 0.05);
  style.jitter = clamp(style.jitter ?? 0, 0, documentLayoutMode ? 0.01 : 0.016);
  style.humanize = clamp(style.humanize ?? 0, 0, documentLayoutMode ? 0.035 : 0.05);
  style.scribbleLevel = clamp(style.scribbleLevel ?? 0, 0, 0.018);
  style.breathingAmount = clamp(style.breathingAmount ?? 0, 0, 0.012);
  style.breathingAmplitude = clamp(style.breathingAmplitude ?? 0, 0, documentLayoutMode ? 0.0009 : 0.0013);
  style.breathingSpeedSwing = clamp(style.breathingSpeedSwing ?? 0, 0, 0.0024);
  style.baselineDrift = clamp(style.baselineDrift ?? 0, 0, documentLayoutMode ? 0.0007 : 0.001);
  style.strokePauseMs = Math.max(style.strokePauseMs ?? 0, documentLayoutMode ? 8 : 10);
  style.charPauseMs = Math.max(style.charPauseMs ?? 0, documentLayoutMode ? 18 : 24);
  style.lockStaticAlignment = true;
  style.staticGuideVisible = false;
  style.staticGuideAlpha = 0.16;
  return style;
}

function setStatus(message, isError = false) {
  statusNode.textContent = message;
  statusNode.style.color = isError ? "#b3261e" : "#4a5562";
}

function parseNumericValue(input, fallback) {
  const value = Number(input?.value);
  return Number.isFinite(value) ? value : fallback;
}

function setPlaybackControlsBusy(isBusy) {
  const busy = Boolean(isBusy);
  playbackControlsLocked = busy;
  pauseButton.disabled = busy;
  fastFinishButton.disabled = busy;
  resetButton.disabled = busy;
  prevPageButton.disabled = busy;
  nextPageButton.disabled = busy;
  exportButton.disabled = busy;
}

async function loadStaticFontFace(fontDef) {
  if (staticLoadedFontFamilies.has(fontDef.family)) {
    return true;
  }
  if (typeof FontFace === "undefined" || typeof document === "undefined") {
    return false;
  }

  try {
    const source = typeof fontDef.source === "string" ? fontDef.source : `url(${fontDef.url})`;
    const face = new FontFace(fontDef.family, source, {
      style: "normal",
      weight: "400",
    });
    await face.load();
    document.fonts.add(face);
    staticLoadedFontFamilies.add(fontDef.family);
    return true;
  } catch {
    return false;
  }
}

async function ensureStaticFontsLoaded() {
  if (staticFontsReadyPromise) {
    return staticFontsReadyPromise;
  }

  staticFontsReadyPromise = (async () => {
    await Promise.all(STATIC_FONT_DEFS.map((fontDef) => loadStaticFontFace(fontDef)));
    if (document?.fonts?.ready) {
      await document.fonts.ready;
    }
  })();

  return staticFontsReadyPromise;
}

async function ensureDynamicUniversalMapper() {
  if (dynamicUniversalMapperPromise) {
    return dynamicUniversalMapperPromise;
  }

  dynamicUniversalMapperPromise = (async () => {
    const fontSession = await createFontSession(resolveRuntimeFontSources());
    if (!fontSession?.universalFontMapper) {
      return null;
    }
    return fontSession.universalFontMapper;
  })();

  return dynamicUniversalMapperPromise;
}

function prewarmDynamicUniversalMapper() {
  ensureDynamicUniversalMapper().catch((error) => {
    console.warn('dynamic font prewarm failed', error);
    dynamicUniversalMapperPromise = null;
  });
}

function ensureStaticLatexRenderHost() {
  if (typeof document === "undefined") {
    return null;
  }
  if (staticLatexRenderHost && staticLatexRenderHost.isConnected) {
    return staticLatexRenderHost;
  }
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.position = "fixed";
  host.style.left = "-100000px";
  host.style.top = "0";
  host.style.opacity = "0";
  host.style.pointerEvents = "none";
  host.style.whiteSpace = "nowrap";
  host.style.zIndex = "-1";
  document.body.appendChild(host);
  staticLatexRenderHost = host;
  return host;
}

async function getKatexForeignObjectCss() {
  if (katexForeignObjectCssPromise) {
    return katexForeignObjectCssPromise;
  }
  katexForeignObjectCssPromise = (async () => {
    try {
      const response = await fetch("./assets/vendor/katex/katex.min.css", {
        cache: "force-cache",
      });
      if (!response.ok) {
        return "";
      }
      const css = await response.text();
      // Keep font URLs resolvable when CSS is inlined into an SVG foreignObject.
      return css.replace(/url\((['"]?)(fonts\/)/g, "url($1./assets/vendor/katex/fonts/");
    } catch {
      return "";
    }
  })();
  return katexForeignObjectCssPromise;
}

async function renderKatexLineToImage(latexLine, options = {}) {
  const latex = String(latexLine ?? "").trim();
  if (!latex || typeof window === "undefined" || typeof document === "undefined") {
    return null;
  }
  const katex = window.katex;
  if (!katex || typeof katex.render !== "function") {
    return null;
  }
  const host = ensureStaticLatexRenderHost();
  if (!host) {
    return null;
  }

  const fontSize = Math.max(10, Number(options.fontSize) || 72);
  const displayMode = Boolean(options.displayMode);

  host.innerHTML = "";
  const root = document.createElement("div");
  root.style.display = "inline-block";
  root.style.fontSize = `${fontSize}px`;
  root.style.lineHeight = "1";
  root.style.whiteSpace = "nowrap";
  root.style.margin = "0";
  root.style.padding = "0";
  host.appendChild(root);

  try {
    katex.render(latex, root, {
      displayMode,
      throwOnError: false,
      strict: "ignore",
      output: "html",
      trust: false,
    });
  } catch {
    host.innerHTML = "";
    return null;
  }

  const rect = root.getBoundingClientRect();
  const width = Math.max(1, Math.ceil(rect.width));
  const height = Math.max(1, Math.ceil(rect.height));
  const innerHtml = root.innerHTML;
  host.innerHTML = "";
  if (!innerHtml.trim()) {
    return null;
  }

  const css = await getKatexForeignObjectCss();
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <foreignObject x="0" y="0" width="${width}" height="${height}">
    <div xmlns="http://www.w3.org/1999/xhtml" style="display:inline-block;white-space:nowrap;line-height:1;font-size:${fontSize}px;margin:0;padding:0;">
      <style>${css}</style>
      ${innerHtml}
    </div>
  </foreignObject>
</svg>`;

  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    const image = await new Promise((resolve, reject) => {
      const imageNode = new Image();
      imageNode.onload = () => resolve(imageNode);
      imageNode.onerror = () => reject(new Error("katex svg rasterize failed"));
      imageNode.src = url;
    });
    return {
      image,
      width,
      height,
    };
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
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

  const columnCount = rows.reduce((max, row) => Math.max(max, row.length), 0);
  const normalizedRows = rows.map((row) => {
    if (row.length >= columnCount) {
      return row;
    }
    return row.concat(Array.from({ length: columnCount - row.length }, () => ""));
  });

  return {
    rows: normalizedRows,
    columnCount,
    lineCount: index - startIndex,
  };
}

function toLatexMathSource(lineText) {
  let text = String(lineText ?? "").trim();
  if (!text) {
    return "";
  }
  if (text.startsWith("\\[") && text.endsWith("\\]")) {
    text = text.slice(2, -2).trim();
  } else if (text.startsWith("$$") && text.endsWith("$$")) {
    text = text.slice(2, -2).trim();
  } else if (text.startsWith("$") && text.endsWith("$")) {
    text = text.slice(1, -1).trim();
  }

  if (/^\[\[[A-Z_:\d]+\]\]$/.test(text)) {
    return "";
  }
  return text;
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
  if (asciiOnly.length === 1 && /[+\-=/<>()[\]{}.,:;!?|]/.test(asciiOnly)) {
    return asciiOnly;
  }
  return raw;
}

function estimateFallbackAdvance(char, fontSize, category) {
  if (!char || char === " " || char === "\t") {
    return fontSize * 0.34;
  }
  if (category === "han") {
    return fontSize * 0.94;
  }
  if (category === "math") {
    return fontSize * 0.68;
  }
  return fontSize * 0.58;
}

function resolveStaticFontFamily(charCategory) {
  if (charCategory === "han") {
    return activeStaticFontStack.han;
  }
  if (charCategory === "math") {
    return activeStaticFontStack.math;
  }
  return activeStaticFontStack.latin;
}

function computeStaticCharGap(previousChar, currentChar, fontSize, letterSpacingPx) {
  let gap = letterSpacingPx;
  const prev = String(previousChar ?? "");
  const curr = String(currentChar ?? "");

  if (/^[，。、：；！？]$/.test(curr)) {
    gap -= fontSize * 0.14;
  }
  if (/^[，。、：；！？]$/.test(prev)) {
    gap += fontSize * 0.18;
  }

  if (/^[,.;:!?]$/.test(curr)) {
    gap -= fontSize * 0.09;
  }
  if (/^[,.;:!?]$/.test(prev)) {
    gap += fontSize * 0.14;
  }

  if (/^[A-Za-z0-9]$/.test(prev) && /^[A-Za-z0-9]$/.test(curr)) {
    gap += fontSize * 0.015;
  }

  if ((`${prev}${curr}`).toLowerCase() === "jk") {
    gap -= fontSize * 0.036;
  }
  if ((`${prev}${curr}`).toLowerCase() === "lm") {
    gap -= fontSize * 0.05;
  }

  return clamp(gap, -fontSize * 0.2, fontSize * 0.38);
}

function staticCharSeed(char, drawIndex) {
  const text = `${char ?? ""}:${drawIndex}`;
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function staticRandomFromSeed(seed) {
  let t = seed + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function resolveStaticCharPose(char, category, fontSize, drawIndex) {
  const seed = staticCharSeed(char, drawIndex);
  const r1 = staticRandomFromSeed(seed + 17);
  const r2 = staticRandomFromSeed(seed + 41);
  const r3 = staticRandomFromSeed(seed + 79);
  const r4 = staticRandomFromSeed(seed + 131);

  const base =
    category === "han"
      ? { rot: 0.052, dx: 0.05, dy: 0.06, sx: 0.026, sy: 0.03 }
      : category === "latin"
        ? { rot: 0.028, dx: 0.026, dy: 0.03, sx: 0.016, sy: 0.018 }
        : category === "math"
          ? { rot: 0.022, dx: 0.018, dy: 0.02, sx: 0.012, sy: 0.014 }
          : { rot: 0.018, dx: 0.015, dy: 0.016, sx: 0.01, sy: 0.012 };

  return {
    rotate: (r1 - 0.5) * base.rot,
    offsetX: (r2 - 0.5) * fontSize * base.dx,
    offsetY: (r3 - 0.5) * fontSize * base.dy,
    scaleX: 1 + (r4 - 0.5) * base.sx,
    scaleY: 1 + (r1 - 0.5) * base.sy,
  };
}

function measureStaticCharWidth(context, char, fontSize) {
  const category = classifyChar(char);
  const fontFamily = resolveStaticFontFamily(category);
  context.font = `${fontSize}px ${fontFamily}`;
  const measured = context.measureText(char).width;
  if (Number.isFinite(measured) && measured > 0) {
    return measured;
  }
  return estimateFallbackAdvance(char, fontSize, category);
}

function measureStaticTextWidth(context, text, fontSize, letterSpacingPx) {
  const chars = Array.from(String(text ?? ""));
  if (!chars.length) {
    return 0;
  }
  let width = 0;
  for (let index = 0; index < chars.length; index += 1) {
    const char = chars[index];
    width += measureStaticCharWidth(context, char, fontSize);
    if (index < chars.length - 1) {
      const nextChar = chars[index + 1];
      width += computeStaticCharGap(char, nextChar, fontSize, letterSpacingPx);
    }
  }
  return width;
}

function createStaticPageCanvas(pageSpec, inkColor) {
  const canvas = document.createElement("canvas");
  canvas.width = pageSpec.width;
  canvas.height = pageSpec.height;
  canvas.setAttribute("width", String(pageSpec.width));
  canvas.setAttribute("height", String(pageSpec.height));
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, pageSpec.width, pageSpec.height);
  context.fillStyle = inkColor;
  context.strokeStyle = inkColor;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.imageSmoothingEnabled = true;
  context.textBaseline = "alphabetic";
  return {
    canvas,
    context,
  };
}

function shouldRenderMathLine(lineText, latexEnabled) {
  if (!latexEnabled) {
    return false;
  }
  const line = String(lineText ?? "").trim();
  if (!line) {
    return false;
  }
  return isLatexMathLine(line);
}


function pushStaticMappingBlock(state, block = {}) {
  if (!state || !Array.isArray(state.mappingBlocks)) {
    return;
  }
  const text = String(block.text ?? "");
  if (!text.trim()) {
    return;
  }

  const safeX = Number(block.x);
  const safeY = Number(block.y);
  const safeWidth = Number(block.width);
  const safeHeight = Number(block.height);
  const safePageIndex = Math.max(0, Number(block.pageIndex ?? state.pageIndex) || 0);
  const safeFontSize = Math.max(8, Number(block.fontSize) || state.baseFontSize);
  const safeLineHeight = Math.max(8, Number(block.lineHeight) || state.lineHeight);
  const safeLetterSpacing = Number.isFinite(block.letterSpacing)
    ? block.letterSpacing
    : state.letterSpacingPx;

  state.mappingBlocks.push({
    kind: String(block.kind ?? "text-line"),
    sequence: state.mappingSeq++,
    pageIndex: safePageIndex,
    x: Number.isFinite(safeX) ? safeX : state.left,
    y: Number.isFinite(safeY) ? safeY : Math.max(0, state.baselineY - safeFontSize * 0.92),
    width: Number.isFinite(safeWidth) && safeWidth > 1 ? safeWidth : Math.max(8, state.right - state.left),
    height: Number.isFinite(safeHeight) && safeHeight > 1 ? safeHeight : Math.max(safeFontSize, safeLineHeight),
    text,
    fontSize: safeFontSize,
    lineHeight: safeLineHeight,
    letterSpacing: safeLetterSpacing,
    meta: block.meta ?? null,
  });
}

function serializeAsciiTableRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return "";
  }
  const columnCount = rows.reduce((max, row) => Math.max(max, Array.isArray(row) ? row.length : 0), 0);
  if (columnCount <= 0) {
    return "";
  }

  const normalizedRows = rows.map((row) => {
    const values = Array.isArray(row) ? row.map((cell) => String(cell ?? "")) : [];
    while (values.length < columnCount) {
      values.push("");
    }
    return values;
  });

  const widths = Array.from({ length: columnCount }, () => 1);
  for (const row of normalizedRows) {
    for (let column = 0; column < columnCount; column += 1) {
      widths[column] = Math.max(widths[column], Array.from(row[column]).length);
    }
  }

  const rule = `+${widths.map((width) => "-".repeat(width + 2)).join("+")}+`;
  const lines = [rule];
  for (const row of normalizedRows) {
    const rowLine = `|${row
      .map((cell, column) => ` ${cell.padEnd(widths[column], " ")} `)
      .join("|")}|`;
    lines.push(rowLine, rule);
  }
  return lines.join("\n");
}

function buildMathRevealItemsFromLayout(layout, scale = 1) {
  if (!layout || !Array.isArray(layout.items) || layout.items.length === 0) {
    return [];
  }

  const safeScale = Number.isFinite(scale) ? scale : 1;
  const items = [];
  for (const item of layout.items) {
    if (item?.type === "line") {
      const x = Number(item.x) * safeScale;
      const yCenter = Number(item.y) * safeScale;
      const width = Math.max(0.6, Number(item.width) * safeScale);
      const thickness = Math.max(0.8, Number(item.thickness || 1) * safeScale);
      const height = Math.max(1.2, thickness * 2.4);
      if (!Number.isFinite(x) || !Number.isFinite(yCenter) || !Number.isFinite(width) || width <= 0) {
        continue;
      }
      items.push({
        type: "line",
        x,
        y: yCenter - height * 0.5,
        width,
        height,
      });
      continue;
    }

    if (item?.type === "char" && item.char) {
      const x = Number(item.x) * safeScale;
      const y = Number(item.y) * safeScale;
      const width = Math.max(0.6, Number(item.width || 0) * safeScale);
      const height = Math.max(
        1,
        Number(item.height || item.fontSize || 0) * safeScale,
      );
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(width) || !Number.isFinite(height)) {
        continue;
      }
      items.push({
        type: "char",
        char: String(item.char),
        x,
        y,
        width,
        height,
      });
    }
  }

  return items;
}

function resolveStaticDisplayMathStartX(state, renderWidth, rowIndex = 0) {
  const availableWidth = Math.max(0, state.right - state.left - renderWidth);
  if (!state.documentLayoutMode || !state.boardLectureMode) {
    return state.left + availableWidth * 0.5;
  }
  const baseIndent = Math.min(Math.max(3, state.baseFontSize * 0.05), Math.max(5, availableWidth * 0.03));
  const cascade = Math.min(rowIndex * state.baseFontSize * 0.03, Math.max(4, availableWidth * 0.04));
  return state.left + clamp(baseIndent + cascade, 0, availableWidth);
}

async function drawStaticMathLine(state, latexLine, fontSize) {
  const current = state.pages[state.pageIndex];
  const context = current.context;
  const availableWidth = state.right - state.left;
  const safeFontSize = Math.max(14, fontSize);
  const source = toLatexMathSource(latexLine);
  if (!source) {
    return false;
  }

  if (STRICT_STATIC_LATEX_REFERENCE) {
    const strictImage = await renderKatexLineToImage(source, {
      fontSize: safeFontSize,
      displayMode: true,
    });
    if (strictImage) {
      const scale = Math.min(1, availableWidth / Math.max(1, strictImage.width));
      const renderWidth = strictImage.width * scale;
      const renderHeight = strictImage.height * scale;
      const requiredAdvance = renderHeight + safeFontSize * 0.36;
      const bottomLimit = state.pageSpec.height - state.padding * 0.76;
      if (state.baselineY + requiredAdvance > bottomLimit) {
        state.pageIndex += 1;
        state.pages.push(createStaticPageCanvas(state.pageSpec, state.inkColor));
        state.baselineY = state.padding + state.baseFontSize;
        state.cursorX = state.left;
        state.onPageBreak?.();
      }

      const page = state.pages[state.pageIndex];
      const pageContext = page.context;
      const startX = resolveStaticDisplayMathStartX(state, renderWidth, 0);
      const topY = state.baselineY - safeFontSize * 0.92;
      pageContext.drawImage(strictImage.image, startX, topY, renderWidth, renderHeight);
      let strictRevealItems = [
        {
          type: "block",
          x: 0,
          y: 0,
          width: renderWidth,
          height: renderHeight,
        },
      ];
      const strictLayout = await layoutLatexMathLineWithKatex(source, {
        fontSize: safeFontSize,
        displayMode: true,
      });
      if (strictLayout?.items?.length) {
        const revealItems = buildMathRevealItemsFromLayout(strictLayout, scale);
        if (revealItems.length > 0) {
          strictRevealItems = revealItems;
        }
      }
      pushStaticMappingBlock(state, {
        kind: "math-line",
        text: source,
        pageIndex: state.pageIndex,
        x: startX,
        y: topY,
        width: renderWidth,
        height: renderHeight,
        fontSize: safeFontSize,
        lineHeight: Math.max(state.lineHeight * 1.06, requiredAdvance),
        letterSpacing: 0,
        meta: {
          mathRevealItems: strictRevealItems,
        },
      });
      state.cursorX = state.left;
      state.baselineY += Math.max(state.lineHeight * 1.06, requiredAdvance);
      return true;
    }
  }

  const layout = await layoutLatexMathLineWithKatex(source, {
    fontSize: safeFontSize,
    displayMode: true,
  });

  if (!layout || !Array.isArray(layout.items) || layout.items.length === 0) {
    return false;
  }

  const scale = Math.min(1, availableWidth / Math.max(1, layout.width));
  const renderWidth = layout.width * scale;
  const renderHeight = layout.height * scale;
  const requiredAdvance = renderHeight + safeFontSize * 0.36;
  const bottomLimit = state.pageSpec.height - state.padding * 0.76;
  if (state.baselineY + requiredAdvance > bottomLimit) {
    state.pageIndex += 1;
    state.pages.push(createStaticPageCanvas(state.pageSpec, state.inkColor));
    state.baselineY = state.padding + state.baseFontSize;
    state.cursorX = state.left;
    state.onPageBreak?.();
  }

  const page = state.pages[state.pageIndex];
  const pageContext = page.context;
  const startX = resolveStaticDisplayMathStartX(state, renderWidth, 0);
  const topY = state.baselineY - safeFontSize * 0.92;
  const revealItems = buildMathRevealItemsFromLayout(layout, scale);

  pageContext.fillStyle = state.inkColor;
  pageContext.strokeStyle = state.inkColor;
  pageContext.textBaseline = "top";
  for (const item of layout.items) {
    if (item.type === "line") {
      pageContext.lineWidth = Math.max(1, item.thickness * scale);
      const y = topY + item.y * scale;
      pageContext.beginPath();
      pageContext.moveTo(startX + item.x * scale, y);
      pageContext.lineTo(startX + (item.x + item.width) * scale, y);
      pageContext.stroke();
      continue;
    }

    if (item.type === "char" && item.char) {
      const drawChar = normalizeMathPresentationChar(item.char);
      const category = classifyChar(drawChar);
      const family = resolveStaticFontFamily(category);
      const itemHeight = Math.max(8, (item.height ?? item.fontSize ?? safeFontSize) * scale);
      const drawFontSize = Math.max(10, Math.min(item.fontSize * scale * 0.98, itemHeight * 1.08));
      pageContext.font = `${drawFontSize}px ${family}`;
      const x = startX + item.x * scale;
      const y = topY + item.y * scale;
      pageContext.fillText(drawChar, x, y);
    }
  }

  pushStaticMappingBlock(state, {
    kind: "math-line",
    text: source,
    pageIndex: state.pageIndex,
    x: startX,
    y: topY,
    width: renderWidth,
    height: renderHeight,
    fontSize: safeFontSize,
    lineHeight: Math.max(state.lineHeight * 1.06, requiredAdvance),
    letterSpacing: 0,
    meta: {
      mathRevealItems: revealItems,
    },
  });
  state.cursorX = state.left;
  state.baselineY += Math.max(state.lineHeight * 1.06, requiredAdvance);
  return true;
}

function drawStaticTextLine(state, lineText, options = {}) {
  const text = String(lineText ?? "");
  if (!text) {
    state.baselineY += state.lineHeight * 0.56;
    state.cursorX = state.left;
    return null;
  }

  const fontSize = Math.max(12, Number(options.fontSize) || state.baseFontSize);
  const lineScale = Number.isFinite(options.lineScale) ? options.lineScale : 1;
  let alignCenter = Boolean(options.alignCenter);
  const indentChars = Math.max(0, Number(options.indentChars) || 0);
  const pageBottomLimit = state.pageSpec.height - state.padding * 0.76;

  if (state.baselineY + fontSize * lineScale > pageBottomLimit) {
    state.pageIndex += 1;
    state.pages.push(createStaticPageCanvas(state.pageSpec, state.inkColor));
    state.baselineY = state.padding + state.baseFontSize;
    state.cursorX = state.left;
    state.onPageBreak?.();
  }

  const page = state.pages[state.pageIndex];
  const context = page.context;
  const availableWidth = state.right - state.left;
  const indent = alignCenter ? 0 : indentChars * fontSize;
  const chars = Array.from(text);
  const lineHeight = Math.max(fontSize * 1.18, state.lineHeight * lineScale);
  const baselineToTopOffset = fontSize * 0.92;

  if (alignCenter) {
    const baselineY = state.baselineY;
    const pageIndex = state.pageIndex;
    const lineWidth = measureStaticTextWidth(context, text, fontSize, state.letterSpacingPx);
    const startX = state.left + (availableWidth - lineWidth) * 0.5;
    let drawX = startX;
    for (let index = 0; index < chars.length; index += 1) {
      const char = chars[index];
      const category = classifyChar(char);
      const fontFamily = resolveStaticFontFamily(category);
      context.font = `${fontSize}px ${fontFamily}`;
      if (!/\s/.test(char)) {
        const pose = resolveStaticCharPose(char, category, fontSize, state.charDrawIndex);
        context.save();
        context.translate(drawX + pose.offsetX, state.baselineY + pose.offsetY);
        context.rotate(pose.rotate);
        context.scale(pose.scaleX, pose.scaleY);
        context.fillText(char, 0, 0);
        context.restore();
        state.charDrawIndex += 1;
      }
      const width = measureStaticCharWidth(context, char, fontSize);
      const nextChar = index < chars.length - 1 ? chars[index + 1] : "";
      const gap = nextChar ? computeStaticCharGap(char, nextChar, fontSize, state.letterSpacingPx) : 0;
      drawX += width + gap;
    }
    pushStaticMappingBlock(state, {
      kind: "text-line",
      text,
      pageIndex,
      x: startX,
      y: baselineY - baselineToTopOffset,
      width: Math.max(8, lineWidth),
      height: lineHeight,
      fontSize,
      lineHeight,
      letterSpacing: state.letterSpacingPx,
      meta: {
        alignCenter: true,
      },
    });
    state.baselineY += lineHeight;
    state.cursorX = state.left;
    return {
      pageIndex,
      baselineY,
      startX,
      endX: drawX,
      topY: baselineY - baselineToTopOffset,
      lineHeight,
      fontSize,
      wrapped: false,
    };
  }

  state.cursorX = state.left + indent;
  const anchorPageIndex = state.pageIndex;
  const anchorBaselineY = state.baselineY;
  const anchorStartX = state.cursorX;
  let wrapped = false;
  let segmentText = "";
  let segmentStartX = state.cursorX;
  let segmentBaselineY = state.baselineY;
  let segmentPageIndex = state.pageIndex;

  function flushSegment() {
    if (!segmentText.trim()) {
      segmentText = "";
      segmentStartX = state.cursorX;
      segmentBaselineY = state.baselineY;
      segmentPageIndex = state.pageIndex;
      return;
    }
    const segmentWidth = Math.max(8, state.cursorX - segmentStartX);
    pushStaticMappingBlock(state, {
      kind: "text-line",
      text: segmentText,
      pageIndex: segmentPageIndex,
      x: segmentStartX,
      y: segmentBaselineY - baselineToTopOffset,
      width: segmentWidth,
      height: lineHeight,
      fontSize,
      lineHeight,
      letterSpacing: state.letterSpacingPx,
      meta: {
        alignCenter: false,
      },
    });
    segmentText = "";
    segmentStartX = state.cursorX;
    segmentBaselineY = state.baselineY;
    segmentPageIndex = state.pageIndex;
  }


  for (let index = 0; index < chars.length; index += 1) {
    const char = chars[index];
    const category = classifyChar(char);
    const fontFamily = resolveStaticFontFamily(category);
    context.font = `${fontSize}px ${fontFamily}`;
    const charWidth = measureStaticCharWidth(context, char, fontSize);

    if (
      state.cursorX + charWidth > state.right &&
      state.cursorX > state.left + fontSize * 0.36
    ) {
      wrapped = true;
      flushSegment();
      state.baselineY += lineHeight;
      if (state.baselineY + fontSize > pageBottomLimit) {
        state.pageIndex += 1;
        state.pages.push(createStaticPageCanvas(state.pageSpec, state.inkColor));
        state.baselineY = state.padding + state.baseFontSize;
        state.onPageBreak?.();
      }
      state.cursorX = state.left;
      segmentStartX = state.cursorX;
      segmentBaselineY = state.baselineY;
      segmentPageIndex = state.pageIndex;
    }

    const drawPage = state.pages[state.pageIndex];
    const drawContext = drawPage.context;
    drawContext.font = `${fontSize}px ${fontFamily}`;
    if (!/\s/.test(char)) {
      const pose = resolveStaticCharPose(char, category, fontSize, state.charDrawIndex);
      drawContext.save();
      drawContext.translate(state.cursorX + pose.offsetX, state.baselineY + pose.offsetY);
      drawContext.rotate(pose.rotate);
      drawContext.scale(pose.scaleX, pose.scaleY);
      drawContext.fillText(char, 0, 0);
      drawContext.restore();
      state.charDrawIndex += 1;
    }

    const nextChar = index < chars.length - 1 ? chars[index + 1] : "";
    const gap = nextChar ? computeStaticCharGap(char, nextChar, fontSize, state.letterSpacingPx) : 0;
    state.cursorX += charWidth + gap;
    segmentText += char;
  }

  flushSegment();
  const endX = state.cursorX;
  state.baselineY += lineHeight;
  state.cursorX = state.left;
  return {
    pageIndex: anchorPageIndex,
    baselineY: anchorBaselineY,
    startX: anchorStartX,
    endX,
    topY: anchorBaselineY - baselineToTopOffset,
    lineHeight,
    fontSize,
    wrapped,
  };
}

function drawStaticCompactHeadingNote(state, lineText, options = {}) {
  const text = String(lineText ?? "").trim();
  if (!text) {
    return null;
  }

  const fontSize = Math.max(10, Number(options.fontSize) || state.baseFontSize * 0.56);
  const pageIndex = Math.max(0, Number(options.pageIndex ?? state.pageIndex) || 0);
  const baselineY = Number.isFinite(options.baselineY) ? options.baselineY : state.baselineY;
  const startX = Number.isFinite(options.x) ? options.x : state.left;
  const letterSpacingPx = Number.isFinite(options.letterSpacingPx)
    ? options.letterSpacingPx
    : state.letterSpacingPx * 0.76;
  const page = state.pages[pageIndex];
  if (!page) {
    return null;
  }

  const context = page.context;
  const chars = Array.from(text);
  const topY = baselineY - fontSize * 0.9;
  let drawX = startX;

  for (let index = 0; index < chars.length; index += 1) {
    const char = chars[index];
    const category = classifyChar(char);
    const fontFamily = resolveStaticFontFamily(category);
    context.font = `${fontSize}px ${fontFamily}`;
    if (!/\s/.test(char)) {
      const pose = resolveStaticCharPose(char, category, fontSize, state.charDrawIndex);
      context.save();
      context.translate(drawX + pose.offsetX * 0.8, baselineY + pose.offsetY * 0.75);
      context.rotate(pose.rotate * 0.85);
      context.scale(1 + (pose.scaleX - 1) * 0.7, 1 + (pose.scaleY - 1) * 0.7);
      context.fillText(char, 0, 0);
      context.restore();
      state.charDrawIndex += 1;
    }

    const width = measureStaticCharWidth(context, char, fontSize);
    const nextChar = index < chars.length - 1 ? chars[index + 1] : "";
    const gap = nextChar ? computeStaticCharGap(char, nextChar, fontSize, letterSpacingPx) : 0;
    drawX += width + gap;
  }

  pushStaticMappingBlock(state, {
    kind: "heading-note",
    text,
    pageIndex,
    x: startX,
    y: topY,
    width: Math.max(8, drawX - startX),
    height: Math.max(fontSize * 1.04, fontSize + 2),
    fontSize,
    lineHeight: Math.max(fontSize * 1.04, fontSize + 2),
    letterSpacing: letterSpacingPx,
    meta: {
      compactNote: true,
    },
  });

  return {
    pageIndex,
    baselineY,
    startX,
    endX: drawX,
    topY,
    fontSize,
  };
}

function drawStaticAsciiTable(state, tableBlock, options = {}) {
  const rows = tableBlock?.rows;
  if (!Array.isArray(rows) || rows.length === 0) {
    return;
  }

  const alignCenter = Boolean(options.alignCenter);
  const baseFontSize = Math.max(12, Number(options.fontSize) || state.baseFontSize);
  const availableWidth = state.right - state.left;
  const borderLineWidth = Math.max(1, Math.round(baseFontSize * 0.03));
  const cellPaddingX = baseFontSize * 0.34;
  const cellPaddingY = baseFontSize * 0.22;
  const bottomLimit = state.pageSpec.height - state.padding * 0.76;
  const columnCount = tableBlock.columnCount || rows[0].length;

  const activeContext = state.pages[state.pageIndex].context;
  const columnWidths = Array.from({ length: columnCount }, () => baseFontSize * 1.6);
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
      const cellText = String(rows[rowIndex][columnIndex] ?? "");
      const hasHan = /[\p{Script=Han}]/u.test(cellText);
      activeContext.font = `${baseFontSize}px `;
      const measured = activeContext.measureText(cellText).width;
      columnWidths[columnIndex] = Math.max(columnWidths[columnIndex], measured + cellPaddingX * 2);
    }
  }

  const rawTableWidth =
    columnWidths.reduce((sum, width) => sum + width, 0) + borderLineWidth * (columnCount + 1);
  const tableScale = rawTableWidth > availableWidth ? availableWidth / rawTableWidth : 1;
  const scaledTableWidth = rawTableWidth * tableScale;
  const rowHeight = Math.max(baseFontSize * 1.24, baseFontSize + cellPaddingY * 2) * tableScale;
  const tableHeight = rowHeight * rows.length + borderLineWidth * (rows.length + 1);

  if (state.baselineY + tableHeight > bottomLimit) {
    state.pageIndex += 1;
    state.pages.push(createStaticPageCanvas(state.pageSpec, state.inkColor));
    state.baselineY = state.padding + state.baseFontSize;
    state.cursorX = state.left;
    state.onPageBreak?.();
  }

  const page = state.pages[state.pageIndex];
  const context = page.context;
  const startX = alignCenter
    ? state.left + (availableWidth - scaledTableWidth) * 0.5
    : state.left;
  const topY = state.baselineY - baseFontSize * 0.9;
  context.strokeStyle = state.inkColor;
  context.fillStyle = state.inkColor;
  context.lineWidth = borderLineWidth;
  context.textBaseline = "alphabetic";

  let xCursor = startX;
  const scaledColumnWidths = columnWidths.map((value) => value * tableScale);
  for (let index = 0; index <= columnCount; index += 1) {
    context.beginPath();
    context.moveTo(xCursor, topY);
    context.lineTo(xCursor, topY + tableHeight);
    context.stroke();
    if (index < columnCount) {
      xCursor += scaledColumnWidths[index] + borderLineWidth;
    }
  }

  let yCursor = topY;
  for (let index = 0; index <= rows.length; index += 1) {
    context.beginPath();
    context.moveTo(startX, yCursor);
    context.lineTo(startX + scaledTableWidth, yCursor);
    context.stroke();
    if (index < rows.length) {
      yCursor += rowHeight + borderLineWidth;
    }
  }

  let rowTop = topY + borderLineWidth;
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    let colLeft = startX + borderLineWidth;
    for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
      const cellText = String(rows[rowIndex][columnIndex] ?? "");
      const cellWidth = scaledColumnWidths[columnIndex];
      const hasHan = /[\p{Script=Han}]/u.test(cellText);
      const cellFontSize = baseFontSize * tableScale;
      context.font = `${cellFontSize}px `;
      const measured = context.measureText(cellText).width;
      const textX = colLeft + Math.max(0, (cellWidth - measured) * 0.5);
      const textY = rowTop + rowHeight * 0.72;
      if (cellText) {
        context.fillText(cellText, textX, textY);
      }
      colLeft += cellWidth + borderLineWidth;
    }
    rowTop += rowHeight + borderLineWidth;
  }

  const sourceText =
    typeof options.sourceText === "string" && options.sourceText.trim()
      ? options.sourceText
      : serializeAsciiTableRows(rows);
  pushStaticMappingBlock(state, {
    kind: "ascii-table",
    text: sourceText,
    pageIndex: state.pageIndex,
    x: startX,
    y: topY,
    width: scaledTableWidth,
    height: tableHeight,
    fontSize: baseFontSize * tableScale,
    lineHeight: rowHeight,
    letterSpacing: 0,
    meta: {
      rows: rows.length,
      columns: columnCount,
      alignCenter,
    },
  });

  state.cursorX = state.left;
  state.baselineY = topY + tableHeight + Math.max(baseFontSize * 0.42, state.lineHeight * 0.2);
}

async function renderStaticPreviewPages(inputText, options = {}) {
  const pageSpec = options.pageSpec ?? PAGE_PRESETS[DEFAULT_PAGE_KEY];
  const baseFontSize = Math.max(20, Number(options.fontSize) || 72);
  const lineHeight = Math.max(baseFontSize * 1.12, Number(options.lineHeight) || baseFontSize * 1.3);
  const letterSpacingPx = Number.isFinite(options.letterSpacing) ? options.letterSpacing : baseFontSize * 0.03;
  const padding = Math.max(40, Number(options.padding) || 56);
  const inkColor = String(options.inkColor ?? "#1f2a30");
  const latexEnabled = Boolean(options.latexEnabled);
  const documentLayoutMode = Boolean(options.documentLayoutMode);
  const boardLectureMode = Boolean(options.boardLectureMode);
  const rawLines = String(inputText ?? "").replace(/\r\n?/g, "\n").split("\n");
  const lines = shouldAutoBoardLectureColumns(rawLines, {
    boardLectureMode,
    documentLayoutMode,
  })
    ? injectBoardLectureColumns(rawLines)
    : rawLines;

  const state = {
    pageSpec,
    pages: [createStaticPageCanvas(pageSpec, inkColor)],
    pageIndex: 0,
    baseFontSize,
    lineHeight,
    letterSpacingPx,
    padding,
    inkColor,
    documentLayoutMode,
    boardLectureMode,
    fullLeft: padding,
    fullRight: pageSpec.width - padding,
    left: padding,
    right: pageSpec.width - padding,
    baselineY: padding + baseFontSize,
    cursorX: padding,
    centerMode: false,
    multicol: null,
    paragraphStart: true,
    charDrawIndex: 0,
    mappingBlocks: [],
    mappingSeq: 0,
  };

  function updateStaticActiveHorizontalBounds() {
    if (!state.multicol) {
      state.left = state.fullLeft;
      state.right = state.fullRight;
      state.cursorX = state.left;
      return;
    }
    const columnIndex = Math.max(
      0,
      Math.min(state.multicol.columnCount - 1, state.multicol.currentColumn),
    );
    state.multicol.currentColumn = columnIndex;
    state.left =
      state.fullLeft +
      columnIndex * (state.multicol.columnWidth + state.multicol.columnGap);
    state.right = state.left + state.multicol.columnWidth;
    state.cursorX = state.left;
  }

  function startStaticMulticolLayout(columnCount) {
    const count = Math.max(1, Number(columnCount) || 2);
    const gap = documentLayoutMode
      ? Math.max(baseFontSize * 0.54, 30)
      : Math.max(baseFontSize * 0.7, 34);
    const fullWidth = state.fullRight - state.fullLeft;
    const safeGap = gap * (count - 1);
    const columnWidth = Math.max(120, (fullWidth - safeGap) / count);
    state.multicol = {
      columnCount: count,
      columnGap: gap,
      columnWidth,
      startY: state.baselineY,
      currentColumn: 0,
      columnBottoms: Array.from({ length: count }, () => state.baselineY),
    };
    state.centerMode = false;
    updateStaticActiveHorizontalBounds();
  }

  function breakStaticMulticolLayout() {
    if (!state.multicol) {
      return;
    }
    state.multicol.columnBottoms[state.multicol.currentColumn] = Math.max(
      state.multicol.columnBottoms[state.multicol.currentColumn],
      state.baselineY,
    );
    state.multicol.currentColumn = Math.min(
      state.multicol.columnCount - 1,
      state.multicol.currentColumn + 1,
    );
    state.baselineY = state.multicol.startY;
    state.centerMode = false;
    state.paragraphStart = true;
    updateStaticActiveHorizontalBounds();
  }

  function endStaticMulticolLayout() {
    if (!state.multicol) {
      return;
    }
    state.multicol.columnBottoms[state.multicol.currentColumn] = Math.max(
      state.multicol.columnBottoms[state.multicol.currentColumn],
      state.baselineY,
    );
    state.baselineY =
      Math.max(...state.multicol.columnBottoms, state.baselineY) +
      Math.max(state.lineHeight * 0.42, baseFontSize * 0.4);
    state.multicol = null;
    state.centerMode = false;
    state.paragraphStart = true;
    updateStaticActiveHorizontalBounds();
  }

  state.onPageBreak = () => {
    if (!state.multicol) {
      state.left = state.fullLeft;
      state.right = state.fullRight;
      state.cursorX = state.left;
      return;
    }
    state.multicol.startY = state.baselineY;
    state.multicol.currentColumn = 0;
    state.multicol.columnBottoms = Array.from(
      { length: state.multicol.columnCount },
      () => state.baselineY,
    );
    state.centerMode = false;
    state.paragraphStart = true;
    updateStaticActiveHorizontalBounds();
  };

  function resolveStaticCompactHeadingNoteCandidate(sourceLineIndex, rawLine, headingFontSize) {
    if (!isHeadingMarkerLine(rawLine)) {
      return null;
    }

    const nextTrimmed = String(lines[sourceLineIndex + 1] ?? "").trim();
    if (!isCompactBoardNoteLine(nextTrimmed, { boardLectureMode })) {
      return null;
    }

    return {
      text: nextTrimmed,
      fontSize: Math.max(11, Math.min(headingFontSize * 0.52, baseFontSize * 0.74)),
      gap: Math.max(headingFontSize * 0.24, baseFontSize * 0.2),
      letterSpacingPx: letterSpacingPx * 0.74,
    };
  }

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = String(lines[lineIndex] ?? "");
    const trimmed = line.trim();

    const positionMarker = parsePositionMarker(trimmed);
    if (positionMarker) {
      const maxX = Math.max(state.left, state.right - baseFontSize * 0.24);
      state.cursorX = clamp(positionMarker.x, state.left, maxX);
      state.baselineY = Math.max(state.padding, positionMarker.y);
      state.paragraphStart = true;
      continue;
    }

    const gapMarker = parseGapMarker(trimmed);
    if (gapMarker != null) {
      state.baselineY += gapMarker;
      state.cursorX = state.left;
      state.paragraphStart = true;
      continue;
    }

    if (!trimmed) {
      state.baselineY += state.lineHeight * (boardLectureMode ? 0.34 : 0.5);
      state.cursorX = state.left;
      state.paragraphStart = true;
      continue;
    }

    if (trimmed === MARKER_PAR_BREAK) {
      state.baselineY += state.lineHeight * (boardLectureMode ? 0.34 : 0.5);
      state.cursorX = state.left;
      state.paragraphStart = true;
      continue;
    }
    if (trimmed === MARKER_PAGE_BREAK) {
      state.pageIndex += 1;
      state.pages.push(createStaticPageCanvas(state.pageSpec, state.inkColor));
      state.baselineY = state.padding + state.baseFontSize;
      state.cursorX = state.left;
      state.paragraphStart = true;
      state.onPageBreak?.();
      continue;
    }

    if (trimmed === MARKER_CENTER_START) {
      state.centerMode = true;
      continue;
    }
    if (trimmed === MARKER_CENTER_END) {
      state.centerMode = false;
      continue;
    }
    if (trimmed === MARKER_MULTICOL_BREAK) {
      breakStaticMulticolLayout();
      continue;
    }
    if (trimmed === MARKER_MULTICOL_END) {
      endStaticMulticolLayout();
      continue;
    }
    const multicolStart = parseMulticolStartMarker(trimmed);
    if (multicolStart) {
      startStaticMulticolLayout(multicolStart);
      continue;
    }

    const tableBlock = parseAsciiTableBlock(lines, lineIndex);
    if (tableBlock) {
      const sourceText = lines.slice(lineIndex, lineIndex + tableBlock.lineCount).join("\n");
      drawStaticAsciiTable(state, tableBlock, {
        fontSize: baseFontSize * 0.74,
        alignCenter: state.centerMode,
        sourceText,
      });
      lineIndex += tableBlock.lineCount - 1;
      state.paragraphStart = false;
      continue;
    }

    let lineText = trimmed;
    let fontSize = baseFontSize;
    let lineScale = 1;
    let alignCenter = state.centerMode;
    let paragraphIndent = 0;
    let extraGap = 0;

    if (trimmed.startsWith(`${MARKER_SECTION} `)) {
      lineText = trimmed.slice(`${MARKER_SECTION} `.length).trim();
      fontSize = baseFontSize * (boardLectureMode ? 1.12 : 1.24);
      lineScale = boardLectureMode ? 1.06 : 1.14;
      alignCenter = false;
      extraGap = state.lineHeight * (boardLectureMode ? 0.16 : 0.26);
      state.paragraphStart = true;
    } else if (trimmed.startsWith(`${MARKER_SUBSECTION} `)) {
      lineText = trimmed.slice(`${MARKER_SUBSECTION} `.length).trim();
      fontSize = baseFontSize * (boardLectureMode ? 1.04 : 1.12);
      lineScale = boardLectureMode ? 1.04 : 1.08;
      alignCenter = false;
      extraGap = state.lineHeight * (boardLectureMode ? 0.1 : 0.16);
      state.paragraphStart = true;
    } else if (documentLayoutMode && !boardLectureMode && state.paragraphStart && !state.centerMode) {
      paragraphIndent = 2;
      state.paragraphStart = false;
    } else {
      state.paragraphStart = false;
    }

    const drewMath =
      shouldRenderMathLine(lineText, latexEnabled) &&
      (await drawStaticMathLine(state, lineText, fontSize * 0.98));
    const compactHeadingNote = resolveStaticCompactHeadingNoteCandidate(lineIndex, trimmed, fontSize);
    let attachedCompactHeadingNote = false;

    if (!drewMath) {
      const drawInfo = drawStaticTextLine(state, lineText, {
        fontSize,
        lineScale,
        alignCenter,
        indentChars: paragraphIndent,
      });

      if (compactHeadingNote && drawInfo && !drawInfo.wrapped) {
        const notePage = state.pages[drawInfo.pageIndex];
        if (notePage) {
          const noteWidth = measureStaticTextWidth(
            notePage.context,
            compactHeadingNote.text,
            compactHeadingNote.fontSize,
            compactHeadingNote.letterSpacingPx,
          );
          const noteX = drawInfo.endX + compactHeadingNote.gap;
          if (noteX + noteWidth <= state.right - compactHeadingNote.fontSize * 0.12) {
            drawStaticCompactHeadingNote(state, compactHeadingNote.text, {
              pageIndex: drawInfo.pageIndex,
              x: noteX,
              baselineY: drawInfo.baselineY + fontSize * 0.04,
              fontSize: compactHeadingNote.fontSize,
              letterSpacingPx: compactHeadingNote.letterSpacingPx,
            });
            attachedCompactHeadingNote = true;
            lineIndex += 1;
          }
        }
      }
    }

    if (extraGap > 0) {
      state.baselineY += attachedCompactHeadingNote ? extraGap * 0.45 : extraGap;
      state.cursorX = state.left;
    }
  }

  if (state.multicol) {
    endStaticMulticolLayout();
  }

  return {
    pages: state.pages.map((entry) => entry.canvas),
    mappingBlocks: state.mappingBlocks
      .slice()
      .sort((left, right) => (left.sequence ?? 0) - (right.sequence ?? 0)),
  };
}

function buildStaticPagedPlans(staticCanvases, pageSpec) {
  const list = Array.isArray(staticCanvases) && staticCanvases.length ? staticCanvases : [];
  const total = Math.max(1, list.length || 1);
  const emptyCounters = {
    total: 0,
    han: 0,
    latin: 0,
    math: 0,
    other: 0,
  };

  return Array.from({ length: total }, (_value, index) => ({
    width: pageSpec.width,
    height: pageSpec.height,
    strokes: [],
    images: [],
    strokeCount: 0,
    staticBitmap: list[index] ?? null,
    missingChars: [],
    hanziSourceCounts: { remote: 0, fallback: 0 },
    universalGlyphCounts: { ...emptyCounters },
    pageIndex: index,
    totalPages: total,
  }));
}

function offsetMappedStrokeGeometry(stroke, xOffset, yOffset, charIndexOffset) {
  const mappedStroke = {
    ...stroke,
    points: Array.isArray(stroke?.points)
      ? stroke.points.map((point) => ({
          x: (Number(point?.x) || 0) + xOffset,
          y: (Number(point?.y) || 0) + yOffset,
        }))
      : [],
  };

  if (Number.isFinite(stroke?.charX)) {
    mappedStroke.charX = stroke.charX + xOffset;
  }
  if (Number.isFinite(stroke?.charY)) {
    mappedStroke.charY = stroke.charY + yOffset;
  }
  if (Number.isFinite(stroke?.outlineX)) {
    mappedStroke.outlineX = stroke.outlineX + xOffset;
  }
  if (Number.isFinite(stroke?.outlineY)) {
    mappedStroke.outlineY = stroke.outlineY + yOffset;
  }
  if (Number.isFinite(stroke?.charIndex)) {
    mappedStroke.charIndex = stroke.charIndex + charIndexOffset;
  }
  return mappedStroke;
}

async function composeMappedBlocksPlan(mappingBlocks, options = {}) {
  const blocks = Array.isArray(mappingBlocks)
    ? mappingBlocks.filter((block) => block && typeof block.text === "string" && block.text.trim())
    : [];
  if (!blocks.length) {
    return null;
  }

  const sortedBlocks = blocks.slice().sort((left, right) => {
    const leftSequence = Number(left?.sequence);
    const rightSequence = Number(right?.sequence);
    if (Number.isFinite(leftSequence) && Number.isFinite(rightSequence) && leftSequence !== rightSequence) {
      return leftSequence - rightSequence;
    }
    const leftPage = Number(left?.pageIndex) || 0;
    const rightPage = Number(right?.pageIndex) || 0;
    if (leftPage !== rightPage) {
      return leftPage - rightPage;
    }
    const leftY = Number(left?.y) || 0;
    const rightY = Number(right?.y) || 0;
    if (leftY !== rightY) {
      return leftY - rightY;
    }
    const leftX = Number(left?.x) || 0;
    const rightX = Number(right?.x) || 0;
    return leftX - rightX;
  });

  const pageSpec = options.pageSpec ?? PAGE_PRESETS[DEFAULT_PAGE_KEY];
  const defaultFontSize = Math.max(12, Number(options.fontSize) || 72);
  const defaultLineHeight = Math.max(defaultFontSize * 1.12, Number(options.lineHeight) || defaultFontSize * 1.3);
  const defaultLetterSpacing = Number.isFinite(options.letterSpacing)
    ? options.letterSpacing
    : defaultFontSize * 0.03;
  const mappedStrokes = [];
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

  let charIndexOffset = 0;
  let maxObservedY = pageSpec.height;
  let maxPageIndex = 0;
  for (const block of sortedBlocks) {
    const text = String(block.text ?? "");
    if (!text.trim()) {
      continue;
    }

    const kind = String(block.kind ?? "text-line");
    const isMathBlock = kind === "math-line";
    const pageIndex = Math.max(0, Number(block.pageIndex) || 0);
    const xOffset = Number.isFinite(block.x) ? block.x : 0;
    const yOffset = (Number.isFinite(block.y) ? block.y : 0) + pageIndex * pageSpec.height;
    maxPageIndex = Math.max(maxPageIndex, pageIndex);
    const blockFontSize = Math.max(10, Number(block.fontSize) || defaultFontSize);
    const blockLineHeight = Math.max(blockFontSize * 1.08, Number(block.lineHeight) || defaultLineHeight);
    const blockLetterSpacing = Number.isFinite(block.letterSpacing)
      ? block.letterSpacing
      : defaultLetterSpacing;
    const baseWidth = Math.max(16, Number(block.width) || pageSpec.width * 0.9);
    const isCenteredTextBlock = kind === "text-line" && block?.meta?.alignCenter === true;
    const shortTextLength = Array.from(text.trim()).length;
    const isShortTextBlock = kind === "text-line" && shortTextLength > 0 && shortTextLength <= 18;
    const maxWidth =
      kind === "math-line"
        ? Math.max(24, baseWidth * 1.03)
        : kind === "ascii-table"
          ? Math.max(80, baseWidth * 1.02)
          : isCenteredTextBlock
            ? Math.max(24, baseWidth + blockFontSize * 4.8)
            : isShortTextBlock
              ? Math.max(24, baseWidth + blockFontSize * 2.6)
              : Math.max(24, baseWidth * 1.08);
    const forceBuiltinMapping = options.forceBuiltinMapping === true;
    const forceBuiltinForBlock = forceBuiltinMapping && !isMathBlock;
    const mappedUniversalFontMapper = forceBuiltinForBlock ? null : options.universalFontMapper ?? null;
    const mappedPreferUniversalLatinMath = forceBuiltinForBlock
      ? false
      : Boolean(options.preferUniversalLatinMath);
    const blockSamplingStep = isMathBlock
      ? Math.max(6, Math.min(12, Number(options.samplingStep) || 10))
      : options.samplingStep ?? 14;
    const blockLatexHandwritingStrength = isMathBlock
      ? 0
      : Number.isFinite(options.latexHandwritingStrength)
        ? options.latexHandwritingStrength
        : 0.28;
    const mathRevealItems =
      isMathBlock && Array.isArray(block?.meta?.mathRevealItems)
        ? block.meta.mathRevealItems
        : [];

    if (ENABLE_MATH_BITMAP_REVEAL && isMathBlock && mathRevealItems.length > 0) {
      let revealItems = mathRevealItems;
      const blockWidth = Math.max(1, Number(block.width) || 1);
      const blockHeight = Math.max(1, Number(block.height) || blockFontSize * 1.1);
      const revealArea = revealItems.reduce((sum, item) => {
        const w = Math.max(0, Number(item?.width) || 0);
        const h = Math.max(0, Number(item?.height) || 0);
        return sum + w * h;
      }, 0);
      const minRequiredArea = blockWidth * blockHeight * 0.12;
      if (revealArea < minRequiredArea) {
        revealItems = [
          {
            type: "block",
            x: 0,
            y: 0,
            width: blockWidth,
            height: blockHeight,
          },
        ];
      }

      let localMaxCharIndex = -1;
      let revealIndex = 0;
      for (const item of revealItems) {
        const relX = Number(item?.x);
        const relY = Number(item?.y);
        const relWidth = Number(item?.width);
        const relHeight = Number(item?.height);
        if (!Number.isFinite(relX) || !Number.isFinite(relY) || !Number.isFinite(relWidth) || !Number.isFinite(relHeight)) {
          continue;
        }
        const width = Math.max(1, relWidth);
        const height = Math.max(1, relHeight);
        const rectX = xOffset + relX;
        const rectY = yOffset + relY;
        const charIndex = charIndexOffset + revealIndex;
        localMaxCharIndex = Math.max(localMaxCharIndex, revealIndex);

        mappedStrokes.push({
          char: typeof item?.char === "string" ? item.char : "",
          category: "math",
          charIndex,
          strokeIndexInChar: 0,
          strokeCountInChar: 1,
          isScript: false,
          width: Math.max(1, Number(options.penWidth) || 3),
          points: [
            { x: rectX, y: rectY + height * 0.5 },
            { x: rectX + width, y: rectY + height * 0.5 },
          ],
          charX: rectX,
          charY: rectY,
          charFontSize: Math.max(8, height),
          charAdvance: width / Math.max(8, height),
          layoutLocked: options.lockMappedGeometry !== false,
          syntheticKind: "bitmap-reveal",
          revealRect: {
            x: rectX,
            y: rectY,
            width,
            height,
          },
        });
        maxObservedY = Math.max(maxObservedY, rectY + height + blockFontSize * 0.14);
        revealIndex += 1;
      }
      if (revealIndex > 0) {
        charIndexOffset += Math.max(1, localMaxCharIndex + 1);
        continue;
      }
    }

    const composedBlockPlan = await composeTextPlan(text, {
      fontSize: blockFontSize,
      lineHeight: blockLineHeight,
      letterSpacing: blockLetterSpacing,
      penWidth: options.penWidth,
      maxWidth,
      padding: 0,
      allowRemoteHanzi: options.allowRemoteHanzi,
      samplingStep: blockSamplingStep,
      universalFontMapper: mappedUniversalFontMapper,
      forceUniversalAll: Boolean(options.forceUniversalAll),
      preferUniversalLatinMath: mappedPreferUniversalLatinMath,
      preferUniversalLatinText: true,
      preferBuiltinLatexGlyphs: false,
      smartLayout: false,
      paragraphIndentChars: 0,
      enableLatexLayout: kind === "math-line" ? true : Boolean(options.enableLatexLayout),
      preferOpenSourceLatexRenderer: true,
      documentLayoutMode: isMathBlock ? true : Boolean(options.documentLayoutMode),
      boardLectureMode: Boolean(options.boardLectureMode),
      latexHandwritingStrength: blockLatexHandwritingStrength,
    });

    for (const char of composedBlockPlan.missingChars ?? []) {
      missingChars.add(char);
    }
    hanziSourceCounts.remote += Number(composedBlockPlan.hanziSourceCounts?.remote) || 0;
    hanziSourceCounts.fallback += Number(composedBlockPlan.hanziSourceCounts?.fallback) || 0;
    universalGlyphCounts.total += Number(composedBlockPlan.universalGlyphCounts?.total) || 0;
    universalGlyphCounts.han += Number(composedBlockPlan.universalGlyphCounts?.han) || 0;
    universalGlyphCounts.latin += Number(composedBlockPlan.universalGlyphCounts?.latin) || 0;
    universalGlyphCounts.math += Number(composedBlockPlan.universalGlyphCounts?.math) || 0;
    universalGlyphCounts.other += Number(composedBlockPlan.universalGlyphCounts?.other) || 0;

    let localMaxCharIndex = -1;
    for (const stroke of composedBlockPlan.strokes ?? []) {
      if (Number.isFinite(stroke?.charIndex)) {
        localMaxCharIndex = Math.max(localMaxCharIndex, stroke.charIndex);
      }
      const mappedStroke = offsetMappedStrokeGeometry(stroke, xOffset, yOffset, charIndexOffset);
      mappedStroke.layoutLocked = options.lockMappedGeometry !== false;
      mappedStrokes.push(mappedStroke);

      const anchorY = inferStrokeAnchorY(mappedStroke);
      if (Number.isFinite(anchorY)) {
        maxObservedY = Math.max(maxObservedY, anchorY + blockFontSize * 0.54);
      }
    }

    charIndexOffset += Math.max(1, localMaxCharIndex + 1);
  }

  if (!mappedStrokes.length) {
    return null;
  }

  const nominalHeight = Math.max(1, maxPageIndex + 1) * pageSpec.height;
  const height = Math.max(nominalHeight, maxObservedY + defaultFontSize * 0.4);
  return {
    width: pageSpec.width,
    height,
    strokes: mappedStrokes,
    missingChars: Array.from(missingChars),
    hanziSourceCounts,
    universalGlyphCounts,
    strokeCount: mappedStrokes.length,
  };
}

function detectLatexInput(sourceText) {
  const text = String(sourceText ?? "");
  if (!text.trim()) {
    return false;
  }

  if (/^\s*%+\s*!TEX\b/m.test(text)) {
    return true;
  }
  if (/\\begin\{[A-Za-z*]+\}|\\end\{[A-Za-z*]+\}/.test(text)) {
    return true;
  }
  if (/\\\[|\\\]|\\\(|\\\)/.test(text)) {
    return true;
  }
  if (/\$\$[\s\S]*\$\$/.test(text)) {
    return true;
  }
  if (/(^|[^\\])\$[^$\n]{1,240}\$/.test(text)) {
    return true;
  }
  if (
    /\\(?:frac|sqrt|sum|int|prod|mathcal|mathbb|mathbf|mathrm|mathit|textbf|textit|emph|section|subsection|paragraph|begin|end|usepackage|documentclass|includegraphics|tikzcd|left|right|cdot|times|div|pm|leq|geq|neq|approx|infty|partial|nabla|alpha|beta|gamma|delta|epsilon|varepsilon|zeta|eta|theta|vartheta|iota|kappa|lambda|mu|nu|xi|rho|sigma|phi|chi|psi|omega|pi|tau|Gamma|Lambda|Xi|Phi|Psi|Omega|LaTeX|TeX)\b/.test(
      text,
    )
  ) {
    return true;
  }

  return false;
}

function isStructuredLine(text) {
  const line = String(text ?? "").trim();
  if (!line) {
    return false;
  }
  if (/^\[\[(?:POS:[^\]]+|GAP:[^\]]+|MCOL_START:\d+|MCOL_BREAK|MCOL_END|CENTER_START|CENTER_END|PAR_BREAK)\]\]$/.test(line)) {
    return true;
  }
  if (/^[-*•]\s+/.test(line)) {
    return true;
  }
  if (/^\d+[\).、]\s*/.test(line)) {
    return true;
  }
  if (/^#{1,6}\s+/.test(line)) {
    return true;
  }
  if (/^\|/.test(line) || /^\+[-+]+\+?$/.test(line)) {
    return true;
  }
  if (/^\\begin\{/.test(line) || /^\\end\{/.test(line)) {
    return true;
  }
  return false;
}

function isLikelyMathLine(text) {
  const line = String(text ?? "").trim();
  if (!line) {
    return false;
  }

  if (/\\\[|\\\]|\\\(|\\\)|\$\$|(^|[^\\])\$[^$]+\$/.test(line)) {
    return true;
  }
  if (
    /\\(?:frac|sqrt|sum|int|prod|mathcal|mathbb|mathbf|mathrm|mathit|left|right|cdot|times|div|pm|leq|geq|neq|approx|infty|partial|nabla|alpha|beta|gamma|delta|epsilon|varepsilon|zeta|eta|theta|vartheta|iota|kappa|lambda|mu|nu|xi|rho|sigma|phi|chi|psi|omega|pi|tau|Gamma|Lambda|Xi|Phi|Psi|Omega)\b/.test(
      line,
    )
  ) {
    return true;
  }
  if (/[∫∑√π∞≤≥≈≠±×÷]/.test(line)) {
    return true;
  }
  if (/[=<>^_]/.test(line) && /[A-Za-z0-9)\]}]/.test(line)) {
    return true;
  }
  return false;
}

function shouldKeepParagraphBreak(previousLine, nextLine) {
  const prev = String(previousLine ?? "").trimEnd();
  const next = String(nextLine ?? "").trimStart();
  if (!prev || !next) {
    return true;
  }
  if (isLikelyMathLine(prev) || isLikelyMathLine(next)) {
    return true;
  }
  if (isStructuredLine(prev) || isStructuredLine(next)) {
    return true;
  }
  if (/[。！？!?]$/.test(prev)) {
    return true;
  }
  return false;
}

function normalizeInputForLayout(sourceText) {
  const lines = String(sourceText ?? "").replace(/\r\n?/g, "\n").split("\n");
  if (lines.length <= 1) {
    return String(sourceText ?? "");
  }

  const output = [];
  for (const rawLine of lines) {
    const line = String(rawLine ?? "");
    if (!line.trim()) {
      output.push("");
      continue;
    }
    if (!output.length || output.at(-1) === "") {
      output.push(line.trim());
      continue;
    }

    const previous = output.at(-1);
    if (shouldKeepParagraphBreak(previous, line)) {
      output.push(line.trim());
    } else {
      output[output.length - 1] = `${previous}${line.trimStart()}`;
    }
  }
  return output.join("\n");
}

function asNumber(value, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function normalizeControlSnapshot(input = {}) {
  return normalizeHandwritingControls(input);
}

function collectControlSnapshot() {
  return normalizeControlSnapshot({
    fontSize: parseNumericValue(fontSizeInput, DEFAULT_CONTROL_SNAPSHOT.fontSize),
    penWidth: parseNumericValue(penWidthInput, DEFAULT_CONTROL_SNAPSHOT.penWidth),
    styleThickness: parseNumericValue(styleThicknessInput, DEFAULT_CONTROL_SNAPSHOT.styleThickness),
    speed: parseNumericValue(speedInput, DEFAULT_CONTROL_SNAPSHOT.speed),
    jitter: parseNumericValue(jitterInput, DEFAULT_CONTROL_SNAPSHOT.jitter),
    speedVariation: parseNumericValue(speedVariationInput, DEFAULT_CONTROL_SNAPSHOT.speedVariation),
    humanize: parseNumericValue(humanizeInput, DEFAULT_CONTROL_SNAPSHOT.humanize),
    scribble: parseNumericValue(scribbleInput, DEFAULT_CONTROL_SNAPSHOT.scribble),
    breathing: parseNumericValue(breathingInput, DEFAULT_CONTROL_SNAPSHOT.breathing),
    layoutDensity: parseNumericValue(layoutDensityInput, DEFAULT_CONTROL_SNAPSHOT.layoutDensity),
    strokePause: parseNumericValue(strokePauseInput, DEFAULT_CONTROL_SNAPSHOT.strokePause),
    charPause: parseNumericValue(charPauseInput, DEFAULT_CONTROL_SNAPSHOT.charPause),
    letterSpacing: parseNumericValue(letterSpacingInput, DEFAULT_CONTROL_SNAPSHOT.letterSpacing),
    lineHeight: parseNumericValue(lineHeightInput, DEFAULT_CONTROL_SNAPSHOT.lineHeight),
    inkColor: String(inkColorInput?.value ?? DEFAULT_CONTROL_SNAPSHOT.inkColor),
  });
}

function writeNumericInput(input, value) {
  if (!input) {
    return;
  }
  const min = Number(input.min);
  const max = Number(input.max);
  let numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    numeric = Number(input.value);
  }
  if (Number.isFinite(min)) {
    numeric = Math.max(min, numeric);
  }
  if (Number.isFinite(max)) {
    numeric = Math.min(max, numeric);
  }
  input.value = String(Math.round(numeric));
}

function applyControlSnapshot(snapshot) {
  const safe = normalizeControlSnapshot(snapshot);
  writeNumericInput(fontSizeInput, safe.fontSize);
  writeNumericInput(penWidthInput, safe.penWidth);
  writeNumericInput(styleThicknessInput, safe.styleThickness);
  writeNumericInput(speedInput, safe.speed);
  writeNumericInput(jitterInput, safe.jitter);
  writeNumericInput(speedVariationInput, safe.speedVariation);
  writeNumericInput(humanizeInput, safe.humanize);
  writeNumericInput(scribbleInput, safe.scribble);
  writeNumericInput(breathingInput, safe.breathing);
  writeNumericInput(layoutDensityInput, safe.layoutDensity);
  writeNumericInput(strokePauseInput, safe.strokePause);
  writeNumericInput(charPauseInput, safe.charPause);
  writeNumericInput(letterSpacingInput, safe.letterSpacing);
  writeNumericInput(lineHeightInput, safe.lineHeight);
  inkColorInput.value = safe.inkColor;
}

function getStoredPageSizeKey() {
  if (typeof localStorage === "undefined") {
    return DEFAULT_PAGE_KEY;
  }
  const stored = localStorage.getItem(STORAGE_KEYS.selectedPageSize);
  return stored in PAGE_PRESETS ? stored : DEFAULT_PAGE_KEY;
}

function setStoredPageSizeKey(value) {
  if (typeof localStorage === "undefined") {
    return;
  }
  localStorage.setItem(STORAGE_KEYS.selectedPageSize, value);
}

function normalizeRuntimeFontSources(input = null) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return null;
  }
  const next = {};
  for (const key of ["latinPrimary", "latinFallback", "hanPrimary", "hanFallback", "mathPrimary", "mathFallback"]) {
    const value = typeof input[key] === "string" ? input[key].trim() : "";
    if (value) {
      next[key] = value;
    }
  }
  return Object.keys(next).length ? next : null;
}

function getStoredRuntimeFontSources() {
  if (typeof localStorage === "undefined") {
    return null;
  }
  try {
    return normalizeRuntimeFontSources(JSON.parse(localStorage.getItem(STORAGE_KEYS.runtimeFontSources) || "null"));
  } catch {
    return null;
  }
}

function resolveRuntimeFontSources() {
  const fromWindow = normalizeRuntimeFontSources(globalThis?.__STROKE_WRITER_FONT_SOURCES ?? null);
  return fromWindow ?? getStoredRuntimeFontSources() ?? getFontPresetById(currentFontPresetId).fontSources ?? DYNAMIC_MAPPER_FONT_DEF;
}

function getStoredFontPresetId() {
  if (typeof localStorage === "undefined") {
    return DEFAULT_FONT_PRESET_ID;
  }
  const stored = localStorage.getItem(STORAGE_KEYS.selectedFontPreset);
  return FONT_PRESETS.some((preset) => preset.id === stored) ? stored : DEFAULT_FONT_PRESET_ID;
}

function setStoredFontPresetId(value) {
  if (typeof localStorage === "undefined") {
    return;
  }
  localStorage.setItem(STORAGE_KEYS.selectedFontPreset, value);
}

function applyFontPreset(presetId) {
  const preset = getFontPresetById(presetId);
  currentFontPresetId = preset.id;
  activeStaticFontPreset = preset;
  activeStaticFontStack = buildStaticFontStackFromPreset(preset);
  setStoredFontPresetId(preset.id);
  setRuntimeFontSources(preset.fontSources);
  prewarmDynamicUniversalMapper();
  if (fontPresetInput) {
    fontPresetInput.value = preset.id;
  }
  if (preset.controls) {
    applyControlSnapshot(preset.controls);
  }
  return preset;
}

function setRuntimeFontSources(fontSources) {
  const normalized = normalizeRuntimeFontSources(fontSources);
  dynamicUniversalMapperPromise = null;
  if (typeof localStorage !== "undefined") {
    if (normalized) {
      localStorage.setItem(STORAGE_KEYS.runtimeFontSources, JSON.stringify(normalized));
    } else {
      localStorage.removeItem(STORAGE_KEYS.runtimeFontSources);
    }
  }
  return normalized ?? getFontPresetById(currentFontPresetId).fontSources ?? DYNAMIC_MAPPER_FONT_DEF;
}

function getSelectedPageSpec() {
  const key = String(pageSizeInput.value ?? DEFAULT_PAGE_KEY);
  return PAGE_PRESETS[key] ?? PAGE_PRESETS[DEFAULT_PAGE_KEY];
}

function applyPageSpecToCanvas(pageSpec) {
  if (!paperStackNode) {
    return;
  }
  const boardLectureMode = Boolean(currentRenderStyle?.boardLectureMode || getActivePresetBehavior().boardLectureMode);
  paperStackNode.style.setProperty("--sheet-width", `${pageSpec.width}px`);
  paperStackNode.style.setProperty("--sheet-height", `${pageSpec.height}px`);
  applyPaperGuideStyles(
    paperStackNode,
    currentPaperGuide ??
      resolvePaperGuideFromLayoutMetrics({
        fontSize: 36,
        lineHeight: 38,
        padding: Math.max(24, Math.round(pageSpec.width * 0.03)),
        documentLayoutMode: true,
        boardLectureMode,
      }),
  );
}

function normalizeImageFit(value) {
  const fit = String(value ?? "").trim().toLowerCase();
  return fit === "cover" ? "cover" : "contain";
}

function normalizeImageAlign(value) {
  const align = String(value ?? "").trim().toLowerCase();
  if (align === "left" || align === "right") {
    return align;
  }
  return "center";
}

function resolveSnapshotImageCacheKey(imageAsset) {
  const id = String(imageAsset?.id ?? "").trim();
  if (id) {
    return `id:${id}`;
  }
  const path = String(imageAsset?.path ?? "").trim();
  if (path) {
    return `path:${path}`;
  }
  const dataUrl = String(imageAsset?.dataUrl ?? "").trim();
  if (dataUrl) {
    return `data:${dataUrl.slice(0, 96)}:${dataUrl.length}`;
  }
  return "";
}

function ensureSnapshotImageNode(imageAsset, onReady) {
  if (typeof Image === "undefined") {
    return null;
  }
  const dataUrl = String(imageAsset?.dataUrl ?? "").trim();
  if (!dataUrl || !/^data:image\//i.test(dataUrl)) {
    return null;
  }

  const cacheKey = resolveSnapshotImageCacheKey(imageAsset);
  if (!cacheKey) {
    return null;
  }
  const cached = snapshotImageCache.get(cacheKey);
  if (cached?.status === "ready" && cached.image) {
    return cached.image;
  }
  if (cached?.status === "loading" || cached?.status === "error") {
    return null;
  }

  const imageNode = new Image();
  imageNode.decoding = "async";
  snapshotImageCache.set(cacheKey, {
    status: "loading",
    image: null,
  });
  imageNode.onload = () => {
    snapshotImageCache.set(cacheKey, {
      status: "ready",
      image: imageNode,
    });
    if (typeof onReady === "function") {
      onReady();
    }
  };
  imageNode.onerror = () => {
    snapshotImageCache.set(cacheKey, {
      status: "error",
      image: null,
    });
    if (typeof onReady === "function") {
      onReady();
    }
  };
  imageNode.src = dataUrl;
  return null;
}

function drawSnapshotImagePlaceholder(context, imageAsset, rect, style) {
  const x = rect.x;
  const y = rect.y;
  const width = rect.width;
  const height = rect.height;
  const inkColor = style?.inkColor ?? "#1d2527";
  const fallbackLabel = String(
    imageAsset?.fallbackLabel ?? imageAsset?.path ?? imageAsset?.id ?? "image",
  )
    .trim()
    .slice(0, 72);

  context.save();
  context.fillStyle = "rgba(236,239,242,0.96)";
  context.fillRect(x, y, width, height);

  context.strokeStyle = "rgba(46,56,64,0.34)";
  context.lineWidth = Math.max(1, Math.min(2.8, width * 0.008));
  context.strokeRect(x, y, width, height);
  context.beginPath();
  context.moveTo(x + 4, y + 4);
  context.lineTo(x + width - 4, y + height - 4);
  context.moveTo(x + width - 4, y + 4);
  context.lineTo(x + 4, y + height - 4);
  context.stroke();

  if (fallbackLabel) {
    const labelSize = clamp(Math.round(height * 0.14), 12, 22);
    context.font = `${labelSize}px "SW-PatrickHand","Kalam","Segoe Print",sans-serif`;
    context.fillStyle = inkColor;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(fallbackLabel, x + width * 0.5, y + height * 0.5);
  }
  context.restore();
}

function drawSnapshotImageAsset(context, imageAsset, style, onAsyncInvalidate) {
  const x = Number(imageAsset?.x);
  const y = Number(imageAsset?.y);
  const width = Number(imageAsset?.width);
  const height = Number(imageAsset?.height);
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(width) || !Number.isFinite(height)) {
    return;
  }
  const rect = {
    x,
    y,
    width: Math.max(1, width),
    height: Math.max(1, height),
  };
  const fit = normalizeImageFit(imageAsset?.fit);
  const align = normalizeImageAlign(imageAsset?.align);
  const showBorder = imageAsset?.showBorder !== false;
  const caption = String(imageAsset?.caption ?? "").trim();

  const imageNode = ensureSnapshotImageNode(imageAsset, onAsyncInvalidate);
  if (imageNode && imageNode.naturalWidth > 0 && imageNode.naturalHeight > 0) {
    const imageWidth = imageNode.naturalWidth;
    const imageHeight = imageNode.naturalHeight;
    const scale =
      fit === "cover"
        ? Math.max(rect.width / imageWidth, rect.height / imageHeight)
        : Math.min(rect.width / imageWidth, rect.height / imageHeight);
    const renderWidth = Math.max(1, imageWidth * scale);
    const renderHeight = Math.max(1, imageHeight * scale);
    let drawX = rect.x + (rect.width - renderWidth) * 0.5;
    if (align === "left") {
      drawX = rect.x;
    } else if (align === "right") {
      drawX = rect.x + (rect.width - renderWidth);
    }
    const drawY = rect.y + (rect.height - renderHeight) * 0.5;

    context.save();
    context.beginPath();
    context.rect(rect.x, rect.y, rect.width, rect.height);
    context.clip();
    context.drawImage(imageNode, drawX, drawY, renderWidth, renderHeight);
    context.restore();
  } else {
    drawSnapshotImagePlaceholder(context, imageAsset, rect, style);
  }

  if (showBorder) {
    context.save();
    context.strokeStyle = style?.inkColor ?? "#1d2527";
    context.lineWidth = Math.max(1, (Number(style?.thickness) || 1) * 1.1);
    context.strokeRect(rect.x, rect.y, rect.width, rect.height);
    context.restore();
  }

  if (caption) {
    const captionSize = clamp(Math.round(rect.height * 0.125), 12, 26);
    context.save();
    context.font = `${captionSize}px "SW-LXGWWenKai","SW-PatrickHand","Kalam",sans-serif`;
    context.fillStyle = style?.inkColor ?? "#1d2527";
    context.textAlign = "left";
    context.textBaseline = "top";
    context.fillText(caption, rect.x, rect.y + rect.height + Math.max(4, captionSize * 0.24));
    context.restore();
  }
}

function drawPageSnapshot(canvasNode, pagePlan, style) {
  const context = canvasNode?.getContext?.("2d");
  if (!context) {
    return;
  }

  const width = Number(pagePlan?.width) || Number(canvasNode.getAttribute("width")) || 1;
  const height = Number(pagePlan?.height) || Number(canvasNode.getAttribute("height")) || 1;
  context.clearRect(0, 0, width, height);
  const pageStrokes = Array.isArray(pagePlan?.strokes) ? pagePlan.strokes : [];
  const hasPlayableStrokes = pageStrokes.some((stroke) => stroke?.syntheticKind !== "image-enter");
  const showStaticGuide = style?.staticGuideVisible === true;

  if (pagePlan?.staticBitmap && (!hasPlayableStrokes || showStaticGuide)) {
    context.drawImage(pagePlan.staticBitmap, 0, 0, width, height);
  }

  context.lineCap = "round";
  context.lineJoin = "round";
  context.strokeStyle = style?.inkColor ?? "#1d2527";

  const thicknessScale = Number.isFinite(style?.thickness) ? style.thickness : 1;
  for (const stroke of pageStrokes) {
    if (stroke?.syntheticKind === "image-enter") {
      continue;
    }
    const points = Array.isArray(stroke.points) ? stroke.points : [];
    if (points.length < 2) {
      continue;
    }
    context.lineWidth = Math.max(1, (Number(stroke.width) || 1) * thicknessScale);
    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    for (let index = 1; index < points.length; index += 1) {
      context.lineTo(points[index].x, points[index].y);
    }
    context.stroke();
  }

  const pageImages = Array.isArray(pagePlan?.images) ? pagePlan.images : [];
  if (!pageImages.length) {
    return;
  }

  const refresh = () => {
    if (typeof window === "undefined") {
      return;
    }
    window.requestAnimationFrame(() => drawPageSnapshot(canvasNode, pagePlan, style));
  };
  for (const imageAsset of pageImages) {
    drawSnapshotImageAsset(context, imageAsset, style, refresh);
  }
}

function updateActivePageVisual() {
  for (let index = 0; index < pageFrameNodes.length; index += 1) {
    const frame = pageFrameNodes[index];
    const canvasNode = pageCanvasNodes[index];
    const isActive = index === currentPageIndex;
    frame.classList.toggle("active", isActive);
    if (isActive) {
      canvasNode.id = "stage";
    } else if (canvasNode.id === "stage") {
      canvasNode.removeAttribute("id");
    }
  }
}

function scrollToPage(pageIndex, behavior = "smooth") {
  const frame = pageFrameNodes[pageIndex];
  if (!frame) {
    return;
  }
  frame.scrollIntoView({
    behavior,
    block: "start",
    inline: "nearest",
  });
}

function ensurePlayerForCurrentPage() {
  const canvasNode = pageCanvasNodes[currentPageIndex];
  if (!canvasNode) {
    return null;
  }
  if (player && player.canvas === canvasNode) {
    return player;
  }

  if (player) {
    player.stop({ preserveCanvas: true });
  }
  player = new StrokePlayer(canvasNode);
  player.onFinish = handlePlayerFinish;
  return player;
}

function renderPageStack(pagedPlans, pageSpec) {
  if (!paperStackNode) {
    return;
  }
  const plans = Array.isArray(pagedPlans) && pagedPlans.length
    ? pagedPlans
    : [
        {
          width: pageSpec.width,
          height: pageSpec.height,
          strokes: [],
          images: [],
          pageIndex: 0,
          totalPages: 1,
        },
      ];

  paperStackNode.innerHTML = "";
  pageCanvasNodes = [];
  pageFrameNodes = [];

  plans.forEach((pagePlan, index) => {
    const frame = document.createElement("section");
    frame.className = "page-sheet";
    frame.dataset.pageIndex = String(index);

    const caption = document.createElement("p");
    caption.className = "page-sheet-meta";
    caption.textContent = `第 ${index + 1} / ${plans.length} 页`;

    const width = Number(pagePlan?.width) || pageSpec.width;
    const height = Number(pagePlan?.height) || pageSpec.height;
    const hasStrokes = Array.isArray(pagePlan?.strokes) && pagePlan.strokes.length > 0;
    const hasStaticBitmap = Boolean(pagePlan?.staticBitmap);

    const canvasNode = document.createElement("canvas");
    canvasNode.className = "page-canvas";
    canvasNode.width = width;
    canvasNode.height = height;
    canvasNode.setAttribute("width", String(width));
    canvasNode.setAttribute("height", String(height));
    const pagePaperGuide = resolvePagePaperGuide(pagePlan, currentPaperGuide);
    applyPaperGuideStyles(canvasNode, pagePaperGuide);

    if (hasStaticBitmap && hasStrokes) {
      const compareRow = document.createElement("div");
      compareRow.className = "page-compare-row";

      const staticPane = document.createElement("section");
      staticPane.className = "page-compare-pane";
      const staticLabel = document.createElement("p");
      staticLabel.className = "page-compare-label";
      staticLabel.textContent = "静态参考";
      const staticCanvas = document.createElement("canvas");
      staticCanvas.className = "page-canvas is-static-reference";
      staticCanvas.width = width;
      staticCanvas.height = height;
      staticCanvas.setAttribute("width", String(width));
      staticCanvas.setAttribute("height", String(height));
      applyPaperGuideStyles(staticCanvas, pagePaperGuide);
      drawPageSnapshot(
        staticCanvas,
        {
          ...pagePlan,
          strokes: [],
          images: [],
          staticBitmap: pagePlan.staticBitmap,
        },
        currentRenderStyle,
      );
      staticPane.append(staticLabel, staticCanvas);

      const dynamicPane = document.createElement("section");
      dynamicPane.className = "page-compare-pane";
      const dynamicLabel = document.createElement("p");
      dynamicLabel.className = "page-compare-label";
      dynamicLabel.textContent = "动态笔迹";
      dynamicPane.append(dynamicLabel, canvasNode);

      compareRow.append(staticPane, dynamicPane);
      frame.append(caption, compareRow);
    } else {
      frame.append(caption, canvasNode);
    }

    paperStackNode.appendChild(frame);
    pageFrameNodes.push(frame);
    pageCanvasNodes.push(canvasNode);

    drawPageSnapshot(canvasNode, pagePlan, currentRenderStyle);
  });

  currentPageIndex = clamp(currentPageIndex, 0, plans.length - 1);
  updateActivePageVisual();
}

function clearAutoPageTimer() {
  if (pageAdvanceTimer !== null) {
    window.clearTimeout(pageAdvanceTimer);
    pageAdvanceTimer = null;
  }
}

function updatePageMeta() {
  const totalPages = Math.max(1, currentPagedPlans.length || 1);
  const currentPage = Math.min(totalPages, currentPageIndex + 1);

  pageIndicatorNode.textContent = `页码：${currentPage} / ${totalPages}`;
  pageMetaNode.textContent = `${currentPageSpec.label} · 连续页预览 · ${
    autoPageContinueInput.checked ? "自动翻页" : "手动翻页"
  } · 第 ${currentPage}/${totalPages} 页`;

  if (playbackControlsLocked) {
    prevPageButton.disabled = true;
    nextPageButton.disabled = true;
    return;
  }

  const onlyOnePage = totalPages <= 1;
  prevPageButton.disabled = onlyOnePage || currentPageIndex <= 0;
  nextPageButton.disabled = onlyOnePage || currentPageIndex >= totalPages - 1;
}

function inferStrokeAnchorY(stroke) {
  if (Number.isFinite(stroke.charY)) {
    return stroke.charY;
  }
  if (Array.isArray(stroke.points) && stroke.points.length > 0) {
    const first = stroke.points[0];
    return Number.isFinite(first?.y) ? first.y : 0;
  }
  return 0;
}

function cloneStrokeForPage(stroke, pageIndex, pageHeight) {
  const offsetY = pageIndex * pageHeight;
  const cloned = {
    ...stroke,
    points: Array.isArray(stroke.points)
      ? stroke.points.map((point) => ({
          x: point.x,
          y: point.y - offsetY,
        }))
      : [],
    charY: Number.isFinite(stroke.charY) ? stroke.charY - offsetY : stroke.charY,
    outlineY: Number.isFinite(stroke.outlineY) ? stroke.outlineY - offsetY : stroke.outlineY,
  };
  if (stroke?.revealRect && typeof stroke.revealRect === "object") {
    const revealX = Number(stroke.revealRect.x);
    const revealY = Number(stroke.revealRect.y);
    const revealW = Number(stroke.revealRect.width);
    const revealH = Number(stroke.revealRect.height);
    cloned.revealRect = {
      ...stroke.revealRect,
      x: Number.isFinite(revealX) ? revealX : stroke.revealRect.x,
      y: Number.isFinite(revealY) ? revealY - offsetY : stroke.revealRect.y,
      width: Number.isFinite(revealW) ? revealW : stroke.revealRect.width,
      height: Number.isFinite(revealH) ? revealH : stroke.revealRect.height,
    };
  }
  if (stroke?.imageEnter && typeof stroke.imageEnter === "object") {
    const fromY = Number(stroke.imageEnter.fromY);
    const toY = Number(stroke.imageEnter.toY);
    cloned.imageEnter = {
      ...stroke.imageEnter,
      fromY: Number.isFinite(fromY) ? fromY - offsetY : stroke.imageEnter.fromY,
      toY: Number.isFinite(toY) ? toY - offsetY : stroke.imageEnter.toY,
    };
  }
  return cloned;
}

function cloneImageForPage(imageAsset, pageIndex, pageHeight) {
  const offsetY = pageIndex * pageHeight;
  const y = Number(imageAsset?.y);
  return {
    ...imageAsset,
    pageIndex,
    y: Number.isFinite(y) ? y - offsetY : y,
  };
}

function summarizePageContentBounds(page) {
  const strokes = Array.isArray(page?.strokes) ? page.strokes : [];
  const images = Array.isArray(page?.images) ? page.images : [];
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const stroke of strokes) {
    const points = Array.isArray(stroke?.points) ? stroke.points : [];
    for (const point of points) {
      const y = Number(point?.y);
      if (!Number.isFinite(y)) {
        continue;
      }
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
    if (Number.isFinite(stroke?.charY) && Number.isFinite(stroke?.charFontSize)) {
      minY = Math.min(minY, stroke.charY);
      maxY = Math.max(maxY, stroke.charY + stroke.charFontSize);
    }
  }

  for (const image of images) {
    const y = Number(image?.y);
    const height = Number(image?.height);
    if (!Number.isFinite(y)) {
      continue;
    }
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y + (Number.isFinite(height) ? height : 0));
  }

  if (!Number.isFinite(minY) || !Number.isFinite(maxY)) {
    return null;
  }
  return {
    minY,
    maxY,
    height: Math.max(0, maxY - minY),
  };
}

function shiftStrokeY(stroke, offsetY) {
  const shifted = {
    ...stroke,
    points: Array.isArray(stroke?.points)
      ? stroke.points.map((point) => ({
          ...point,
          y: Number.isFinite(point?.y) ? point.y + offsetY : point?.y,
        }))
      : [],
  };
  if (Number.isFinite(stroke?.charY)) {
    shifted.charY = stroke.charY + offsetY;
  }
  if (Number.isFinite(stroke?.outlineY)) {
    shifted.outlineY = stroke.outlineY + offsetY;
  }
  if (stroke?.revealRect && typeof stroke.revealRect === "object" && Number.isFinite(stroke.revealRect.y)) {
    shifted.revealRect = {
      ...stroke.revealRect,
      y: stroke.revealRect.y + offsetY,
    };
  }
  if (stroke?.imageEnter && typeof stroke.imageEnter === "object") {
    shifted.imageEnter = {
      ...stroke.imageEnter,
      fromY: Number.isFinite(stroke.imageEnter.fromY) ? stroke.imageEnter.fromY + offsetY : stroke.imageEnter.fromY,
      toY: Number.isFinite(stroke.imageEnter.toY) ? stroke.imageEnter.toY + offsetY : stroke.imageEnter.toY,
    };
  }
  return shifted;
}

function shiftStrokeX(stroke, offsetX) {
  const shifted = {
    ...stroke,
    points: Array.isArray(stroke?.points)
      ? stroke.points.map((point) => ({
          ...point,
          x: Number.isFinite(point?.x) ? point.x + offsetX : point?.x,
        }))
      : [],
  };
  if (Number.isFinite(stroke?.charX)) {
    shifted.charX = stroke.charX + offsetX;
  }
  if (Number.isFinite(stroke?.outlineX)) {
    shifted.outlineX = stroke.outlineX + offsetX;
  }
  if (stroke?.revealRect && typeof stroke.revealRect === "object" && Number.isFinite(stroke.revealRect.x)) {
    shifted.revealRect = {
      ...stroke.revealRect,
      x: stroke.revealRect.x + offsetX,
    };
  }
  if (stroke?.imageEnter && typeof stroke.imageEnter === "object") {
    shifted.imageEnter = {
      ...stroke.imageEnter,
      fromX: Number.isFinite(stroke.imageEnter.fromX) ? stroke.imageEnter.fromX + offsetX : stroke.imageEnter.fromX,
      toX: Number.isFinite(stroke.imageEnter.toX) ? stroke.imageEnter.toX + offsetX : stroke.imageEnter.toX,
    };
  }
  return shifted;
}

function shiftImageY(imageAsset, offsetY) {
  return {
    ...imageAsset,
    y: Number.isFinite(imageAsset?.y) ? imageAsset.y + offsetY : imageAsset?.y,
  };
}

function shiftImageX(imageAsset, offsetX) {
  return {
    ...imageAsset,
    x: Number.isFinite(imageAsset?.x) ? imageAsset.x + offsetX : imageAsset?.x,
  };
}

function paginatePlan(plan, pageSpec) {
  const pageHeight = pageSpec.height;
  const pageWidth = pageSpec.width;
  const strokeBuckets = new Map();
  const imageBuckets = new Map();
  let maxPageIndex = 0;
  let maxOccupiedY = 0;

  for (const stroke of plan.strokes ?? []) {
    const y = Math.max(0, inferStrokeAnchorY(stroke));
    const pageIndex = Math.max(0, Math.floor(y / pageHeight));
    maxPageIndex = Math.max(maxPageIndex, pageIndex);
    const strokeBottom = Array.isArray(stroke?.points) && stroke.points.length
      ? stroke.points.reduce((max, point) => {
          const pointY = Number(point?.y);
          return Number.isFinite(pointY) ? Math.max(max, pointY) : max;
        }, y)
      : Number.isFinite(stroke?.charY) && Number.isFinite(stroke?.charFontSize)
        ? stroke.charY + stroke.charFontSize
        : y;
    maxOccupiedY = Math.max(maxOccupiedY, strokeBottom);

    if (!strokeBuckets.has(pageIndex)) {
      strokeBuckets.set(pageIndex, []);
    }
    strokeBuckets.get(pageIndex).push(cloneStrokeForPage(stroke, pageIndex, pageHeight));
  }

  for (const imageAsset of plan.images ?? []) {
    const y = Number(imageAsset?.y);
    const fallbackPage = Number.isFinite(y) ? Math.floor(Math.max(0, y) / pageHeight) : 0;
    const pageIndex = Number.isFinite(Number(imageAsset?.pageIndex))
      ? Math.max(0, Math.round(Number(imageAsset.pageIndex)))
      : Math.max(0, fallbackPage);
    maxPageIndex = Math.max(maxPageIndex, pageIndex);
    const imageHeight = Number(imageAsset?.height);
    maxOccupiedY = Math.max(maxOccupiedY, (Number.isFinite(y) ? y : 0) + (Number.isFinite(imageHeight) ? imageHeight : 0));
    if (!imageBuckets.has(pageIndex)) {
      imageBuckets.set(pageIndex, []);
    }
    imageBuckets.get(pageIndex).push(cloneImageForPage(imageAsset, pageIndex, pageHeight));
  }

  const planHeight = Number(plan?.height);
  const effectiveContentHeight = maxOccupiedY > 0 ? maxOccupiedY : planHeight;
  const pageCountFromContent = Number.isFinite(effectiveContentHeight)
    ? Math.max(1, Math.ceil(effectiveContentHeight / pageHeight))
    : 1;
  const totalPages = Math.max(1, pageCountFromContent, maxPageIndex + 1);

  const pages = [];
  for (let pageIndex = 0; pageIndex < totalPages; pageIndex += 1) {
    const pageStrokes = strokeBuckets.get(pageIndex) ?? [];
    const pageImages = imageBuckets.get(pageIndex) ?? [];
    pages.push({
      width: pageWidth,
      height: pageHeight,
      strokes: pageStrokes,
      images: pageImages,
      strokeCount: pageStrokes.length,
      imageCount: pageImages.length,
      missingChars: plan.missingChars ?? [],
      hanziSourceCounts: plan.hanziSourceCounts ?? { remote: 0, fallback: 0 },
      universalGlyphCounts: plan.universalGlyphCounts ?? {
        total: 0,
        han: 0,
        latin: 0,
        math: 0,
        other: 0,
      },
      pageIndex,
      totalPages,
    });
  }

  while (pages.length > 1) {
    const lastPage = pages.at(-1);
    const previousPage = pages.at(-2);
    const lastBounds = summarizePageContentBounds(lastPage);
    if (!lastBounds) {
      pages.pop();
      continue;
    }
    const previousBounds = summarizePageContentBounds(previousPage);
    const previousBottom = previousBounds?.maxY ?? 0;
    const orphanHeight = lastBounds.height;
    const orphanStrokeCount = Array.isArray(lastPage?.strokes) ? lastPage.strokes.length : 0;
    const orphanImageCount = Array.isArray(lastPage?.images) ? lastPage.images.length : 0;
    const carryGap = Math.max(12, Math.min(28, orphanHeight * 0.2 || 16));
    const fitsPreviousPage = previousBottom + carryGap + orphanHeight <= pageHeight - 24;
    const sparseTrailingPage =
      orphanImageCount === 0 &&
      (orphanStrokeCount <= 40 || orphanHeight <= pageHeight * 0.18);

    if (!sparseTrailingPage || !fitsPreviousPage) {
      break;
    }

    const offsetY = previousBottom + carryGap - lastBounds.minY;
    previousPage.strokes = previousPage.strokes.concat((lastPage.strokes ?? []).map((stroke) => shiftStrokeY(stroke, offsetY)));
    previousPage.images = previousPage.images.concat((lastPage.images ?? []).map((image) => shiftImageY(image, offsetY)));
    previousPage.strokeCount = previousPage.strokes.length;
    previousPage.imageCount = previousPage.images.length;
    pages.pop();
  }

  for (let pageIndex = 1; pageIndex < pages.length; pageIndex += 1) {
    const page = pages[pageIndex];
    const bounds = mergeBounds(summarizeStrokeBounds(page?.strokes), summarizeImageBounds(page?.images));
    if (!bounds) {
      continue;
    }
    const imageCount = Array.isArray(page?.images) ? page.images.length : 0;
    const rightColumnContinuation =
      imageCount === 0 &&
      bounds.x >= pageWidth * 0.42 &&
      bounds.width <= pageWidth * 0.58 &&
      bounds.x + bounds.width >= pageWidth * 0.78;
    if (!rightColumnContinuation) {
      continue;
    }
    const targetLeft = Math.max(24, Math.min(40, pageWidth * 0.026));
    const offsetX = targetLeft - bounds.x;
    if (Math.abs(offsetX) < 4) {
      continue;
    }
    page.strokes = (page.strokes ?? []).map((stroke) => shiftStrokeX(stroke, offsetX));
    page.images = (page.images ?? []).map((imageAsset) => shiftImageX(imageAsset, offsetX));
  }

  const normalizedTotalPages = pages.length;
  for (let index = 0; index < pages.length; index += 1) {
    pages[index].pageIndex = index;
    pages[index].totalPages = normalizedTotalPages;
  }

  return pages;
}

function resolveStyleOverridesFromControls() {
  const controls = collectControlSnapshot();
  return controlsToRenderStyle(controls, {
    boardLectureMode: Boolean(getActivePresetBehavior().boardLectureMode),
  });
}

function resolveApiBaseUrl() {
  const configured = globalThis?.__STROKE_WRITER_API_URL;
  if (typeof configured === "string" && configured.trim()) {
    return configured.trim().replace(/\/+$/, "");
  }
  const host = window.location.hostname || "127.0.0.1";
  return `http://${host}:8791`;
}

function roundTo(value, digits = 3) {
  const factor = 10 ** digits;
  return Math.round((Number(value) || 0) * factor) / factor;
}

function median(values = []) {
  if (!Array.isArray(values) || values.length === 0) {
    return null;
  }
  const sorted = values
    .filter((value) => Number.isFinite(value))
    .slice()
    .sort((a, b) => a - b);
  if (!sorted.length) {
    return null;
  }
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) * 0.5;
}

function resolvePaperBaselineRatio(syntheticKind, category = "han") {
  if (syntheticKind === "scene-math") {
    return category === "latin" ? 0.8 : 0.78;
  }
  if (syntheticKind === "scene-page-title") {
    return category === "latin" ? 0.82 : 0.84;
  }
  if (syntheticKind === "scene-table") {
    return 0.82;
  }
  if (syntheticKind === "arrow-label" || syntheticKind === "scene-icon") {
    return 0.84;
  }
  return category === "latin" ? 0.82 : 0.86;
}

function resolvePaperGuideFromLayoutMetrics(options = {}) {
  const documentLayoutMode = options.documentLayoutMode !== false;
  const boardLectureMode = Boolean(options.boardLectureMode);
  const safeFontSize = Math.max(12, Number(options.fontSize) || 36);
  const safeLineHeight = Math.max(safeFontSize * 0.92, Number(options.lineHeight) || safeFontSize * 1.02);
  const safePadding = Math.max(20, Number(options.padding) || 32);
  return {
    linePitch: roundTo(
      clamp(
        safeLineHeight * (documentLayoutMode ? (boardLectureMode ? 0.92 : 0.98) : 0.94),
        documentLayoutMode ? (boardLectureMode ? 24 : 32) : 34,
        documentLayoutMode ? (boardLectureMode ? 32 : 40) : 46,
      ),
      2,
    ),
    lineOffset: roundTo(
      clamp(
        safeFontSize * (documentLayoutMode ? (boardLectureMode ? 0.76 : 0.82) : 0.84),
        boardLectureMode ? 14 : 18,
        safeLineHeight - (boardLectureMode ? 3 : 4),
      ),
      2,
    ),
    marginTop: safePadding,
  };
}

function resolvePagePaperGuide(pagePlan, fallbackGuide = null, options = {}) {
  const boardLectureMode = Boolean(options.boardLectureMode);
  const fallback =
    fallbackGuide ??
    resolvePaperGuideFromLayoutMetrics({
      fontSize: 36,
      lineHeight: 38,
      padding: 32,
      documentLayoutMode: true,
      boardLectureMode,
    });
  const strokes = Array.isArray(pagePlan?.strokes) ? pagePlan.strokes : [];
  const anchored = strokes
    .filter(
      (stroke) =>
        Number.isFinite(stroke?.charY) &&
        Number.isFinite(stroke?.charFontSize) &&
        !stroke?.isScript &&
        stroke?.char &&
        stroke.char !== " ",
    )
    .map((stroke) => {
      const fontSize = Number(stroke.charFontSize);
      return {
        top: Number(stroke.charY),
        anchor:
          Number(stroke.charY) +
          fontSize * resolvePaperBaselineRatio(stroke.syntheticKind, stroke.category),
        fontSize,
      };
    })
    .filter((sample) => Number.isFinite(sample.top) && Number.isFinite(sample.anchor) && Number.isFinite(sample.fontSize));

  if (anchored.length < 6) {
    return fallback;
  }

  anchored.sort((a, b) => a.anchor - b.anchor);
  const medianFontSize = median(anchored.map((sample) => sample.fontSize)) ?? Math.max(20, fallback.lineOffset / 0.82);
  const rowTolerance = Math.max(8, medianFontSize * 0.26);
  const rows = [];

  for (const sample of anchored) {
    const row = rows.at(-1);
    if (!row || Math.abs(sample.anchor - row.anchor) > rowTolerance) {
      rows.push({
        anchors: [sample.anchor],
        tops: [sample.top],
        anchor: sample.anchor,
      });
      continue;
    }
    row.anchors.push(sample.anchor);
    row.tops.push(sample.top);
    row.anchor = median(row.anchors) ?? sample.anchor;
  }

  const rowAnchors = rows.map((row) => median(row.anchors)).filter((value) => Number.isFinite(value));
  const pitchCandidates = [];
  for (let index = 1; index < rowAnchors.length; index += 1) {
    const diff = rowAnchors[index] - rowAnchors[index - 1];
    if (diff > medianFontSize * 0.56 && diff < medianFontSize * 3.2) {
      pitchCandidates.push(diff);
    }
  }

  const offsetCandidates = rows
    .map((row) => {
      const anchor = median(row.anchors);
      const top = median(row.tops);
      if (!Number.isFinite(anchor) || !Number.isFinite(top)) {
        return null;
      }
      return anchor - top;
    })
    .filter((value) => Number.isFinite(value));

  return {
    linePitch: roundTo(
      clamp(
        median(pitchCandidates) ?? fallback.linePitch,
        Math.max(boardLectureMode ? 22 : 28, fallback.linePitch - (boardLectureMode ? 3 : 4)),
        Math.max(boardLectureMode ? 34 : 42, fallback.linePitch + (boardLectureMode ? 4 : 6)),
      ),
      2,
    ),
    lineOffset: roundTo(
      clamp(
        median(offsetCandidates) ?? fallback.lineOffset,
        Math.max(boardLectureMode ? 12 : 16, fallback.lineOffset - (boardLectureMode ? 4 : 6)),
        Math.max(boardLectureMode ? 24 : 36, fallback.lineOffset + (boardLectureMode ? 4 : 6)),
      ),
      2,
    ),
    marginTop: fallback.marginTop,
  };
}

function applyPaperGuideStyles(target, paperGuide) {
  if (!target || !paperGuide) {
    return;
  }
  target.style.setProperty("--paper-line-pitch", `${roundTo(paperGuide.linePitch ?? 38, 2)}px`);
  target.style.setProperty("--paper-line-offset", `${roundTo(paperGuide.lineOffset ?? 30, 2)}px`);
}

function toGridCoord(value, size) {
  if (!Number.isFinite(value) || !Number.isFinite(size) || size <= 0) {
    return 0;
  }
  return Math.round(clamp((value / size) * 1000, 0, 1000));
}

function summarizeStrokeBounds(strokes = []) {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let pointCount = 0;
  for (const stroke of strokes) {
    if (stroke?.syntheticKind === "image-enter") {
      continue;
    }
    const points = Array.isArray(stroke?.points) ? stroke.points : [];
    for (const point of points) {
      const x = Number(point?.x);
      const y = Number(point?.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        continue;
      }
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      pointCount += 1;
    }
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
    return null;
  }
  return {
    x: minX,
    y: minY,
    width: Math.max(0, maxX - minX),
    height: Math.max(0, maxY - minY),
    pointCount,
  };
}

function summarizeImageBounds(images = []) {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let imageCount = 0;

  for (const imageAsset of images) {
    const x = Number(imageAsset?.x);
    const y = Number(imageAsset?.y);
    const width = Number(imageAsset?.width);
    const height = Number(imageAsset?.height);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(width) || !Number.isFinite(height)) {
      continue;
    }
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + Math.max(0, width));
    maxY = Math.max(maxY, y + Math.max(0, height));
    imageCount += 1;
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
    return null;
  }
  return {
    x: minX,
    y: minY,
    width: Math.max(0, maxX - minX),
    height: Math.max(0, maxY - minY),
    imageCount,
  };
}

function mergeBounds(primary, secondary) {
  if (!primary && !secondary) {
    return null;
  }
  if (!primary) {
    return secondary;
  }
  if (!secondary) {
    return primary;
  }
  const minX = Math.min(primary.x, secondary.x);
  const minY = Math.min(primary.y, secondary.y);
  const maxX = Math.max(primary.x + primary.width, secondary.x + secondary.width);
  const maxY = Math.max(primary.y + primary.height, secondary.y + secondary.height);
  return {
    x: minX,
    y: minY,
    width: Math.max(0, maxX - minX),
    height: Math.max(0, maxY - minY),
    pointCount: (primary.pointCount ?? 0) + (secondary.pointCount ?? 0),
    imageCount: (primary.imageCount ?? 0) + (secondary.imageCount ?? 0),
  };
}

function summarizePageSpace(pagePlan, pageSpec, pageIndex) {
  const width = Math.max(1, Number(pagePlan?.width) || Number(pageSpec?.width) || 1240);
  const height = Math.max(1, Number(pagePlan?.height) || Number(pageSpec?.height) || 1754);
  const strokes = Array.isArray(pagePlan?.strokes) ? pagePlan.strokes : [];
  const pageImages = Array.isArray(pagePlan?.images) ? pagePlan.images : [];
  const strokeCount = strokes.filter((stroke) => stroke?.syntheticKind !== "image-enter").length;
  const imageCount = pageImages.length;
  const estimatedPaddingX = Math.round(Math.max(24, width * 0.045));
  const estimatedPaddingY = Math.round(Math.max(24, height * 0.045));
  const bounds = mergeBounds(summarizeStrokeBounds(strokes), summarizeImageBounds(pageImages));
  const pageArea = width * height;

  if (!bounds) {
    const defaultAnchorX = estimatedPaddingX;
    const defaultAnchorY = estimatedPaddingY;
    return {
      pageIndex,
      strokeCount,
      imageCount,
      occupied: false,
      bbox: null,
      usedAreaRatio: 0,
      usedHeightRatio: 0,
      nextAnchor: {
        x: Math.round(defaultAnchorX),
        y: Math.round(defaultAnchorY),
        grid: {
          x: toGridCoord(defaultAnchorX, width),
          y: toGridCoord(defaultAnchorY, height),
        },
      },
      remaining: {
        bottomHeight: Math.round(height - estimatedPaddingY * 2),
        bottomHeightRatio: roundTo((height - estimatedPaddingY * 2) / height),
      },
    };
  }

  const occupiedArea = Math.max(1, bounds.width * bounds.height);
  const usedAreaRatio = roundTo(occupiedArea / pageArea);
  const usedHeightRatio = roundTo(bounds.height / height);
  const nextY = clamp(
    bounds.y + bounds.height + Math.max(16, height * 0.018),
    estimatedPaddingY,
    Math.max(estimatedPaddingY, height - estimatedPaddingY),
  );
  const nextX = estimatedPaddingX;
  const remainingBottomHeight = Math.max(0, height - estimatedPaddingY - nextY);

  return {
    pageIndex,
    strokeCount,
    imageCount,
    occupied: true,
    bbox: {
      x: Math.round(bounds.x),
      y: Math.round(bounds.y),
      width: Math.round(bounds.width),
      height: Math.round(bounds.height),
      grid: {
        x: toGridCoord(bounds.x, width),
        y: toGridCoord(bounds.y, height),
        w: toGridCoord(bounds.width, width),
        h: toGridCoord(bounds.height, height),
      },
    },
    usedAreaRatio,
    usedHeightRatio,
    nextAnchor: {
      x: Math.round(nextX),
      y: Math.round(nextY),
      grid: {
        x: toGridCoord(nextX, width),
        y: toGridCoord(nextY, height),
      },
    },
    remaining: {
      bottomHeight: Math.round(remainingBottomHeight),
      bottomHeightRatio: roundTo(remainingBottomHeight / height),
    },
  };
}

function buildAssistantLayoutSpaceContext() {
  const pageSpec = currentPageSpec ?? getSelectedPageSpec();
  const plans = Array.isArray(currentPagedPlans) && currentPagedPlans.length
    ? currentPagedPlans
    : [
        {
          width: pageSpec.width,
          height: pageSpec.height,
          strokes: [],
          images: [],
        },
      ];
  const currentIndex = clamp(currentPageIndex, 0, plans.length - 1);
  const fullPages = plans.map((plan, index) => summarizePageSpace(plan, pageSpec, index));
  const active = fullPages[currentIndex] ?? fullPages[0];

  const windowStart = Math.max(0, currentIndex - 1);
  const windowEnd = Math.min(fullPages.length, currentIndex + 3);
  const pages = fullPages.slice(windowStart, windowEnd);

  const candidateBottomHeight = Math.max(60, Math.round((Number(pageSpec?.height) || 1754) * 0.12));
  let preferPageIndex = active?.pageIndex ?? 0;
  for (let index = currentIndex; index < fullPages.length; index += 1) {
    if ((fullPages[index]?.remaining?.bottomHeight ?? 0) >= candidateBottomHeight) {
      preferPageIndex = index;
      break;
    }
  }

  return {
    schemaVersion: "space.v1",
    generatedAt: new Date().toISOString(),
    page: {
      width: Number(pageSpec?.width) || 1240,
      height: Number(pageSpec?.height) || 1754,
      grid: 1000,
    },
    currentPageIndex: currentIndex,
    totalPages: fullPages.length,
    pages,
    activePage: active ?? null,
    recommendation: {
      preferPageIndex,
      nextAnchor: active?.nextAnchor ?? null,
      note:
        preferPageIndex > currentIndex
          ? "current page bottom space is limited, prefer next page"
          : "continue writing from active page nextAnchor",
    },
  };
}

function appendAssistantMessage(role, text, source = "") {
  if (!assistantLogNode) {
    return;
  }
  const messageNode = document.createElement("div");
  messageNode.className = `assistant-msg ${role === "user" ? "user" : "assistant"}`;
  const roleLabel = role === "user" ? "你" : source ? `AI（${source}）` : "AI";
  messageNode.textContent = `${roleLabel}：${text}`;
  assistantLogNode.appendChild(messageNode);
  assistantLogNode.scrollTop = assistantLogNode.scrollHeight;
}

function clearAssistantLog() {
  assistantHistory = [];
  if (assistantLogNode) {
    assistantLogNode.innerHTML = "";
  }
  appendAssistantMessage(
    "assistant",
    "我可以帮你生成手写内容、改写已有文本、或直接调整手写参数（速度、笔宽、行距、字距、墨色等）。",
    "local",
  );
}

function normalizeAssistantStylePatch(inputPatch) {
  if (!inputPatch || typeof inputPatch !== "object") {
    return null;
  }
  const patch = {};
  const assignIfFinite = (key) => {
    const value = Number(inputPatch[key]);
    if (Number.isFinite(value)) {
      patch[key] = value;
    }
  };
  assignIfFinite("fontSize");
  assignIfFinite("penWidth");
  assignIfFinite("styleThickness");
  assignIfFinite("speed");
  assignIfFinite("jitter");
  assignIfFinite("speedVariation");
  assignIfFinite("humanize");
  assignIfFinite("strokePause");
  assignIfFinite("charPause");
  assignIfFinite("letterSpacing");
  assignIfFinite("lineHeight");
  if (typeof inputPatch.inkColor === "string") {
    patch.inkColor = inputPatch.inkColor.trim();
  }
  return Object.keys(patch).length ? patch : null;
}

function applyAssistantResultActions(actions) {
  if (!actions || typeof actions !== "object") {
    return { didApply: false, didRender: false, layoutSpec: null, sceneSpec: null };
  }

  let didApply = false;
  let didRender = false;
  let layoutSpec = null;
  let sceneSpec = null;

  if (typeof actions.textMode === "string" && typeof actions.text === "string" && actions.text.trim()) {
    const nextText = actions.text.trimEnd();
    if (actions.textMode === "replace") {
      textInput.value = nextText;
      didApply = true;
    } else if (actions.textMode === "append") {
      const current = String(textInput.value ?? "");
      textInput.value = current.trim() ? `${current}\n${nextText}` : nextText;
      didApply = true;
    }
  }

  const stylePatch = normalizeAssistantStylePatch(actions.stylePatch);
  if (stylePatch) {
    const merged = {
      ...collectControlSnapshot(),
      ...stylePatch,
    };
    applyControlSnapshot(merged);
    didApply = true;
  }

  if (actions.rebuild === true) {
    didRender = true;
  }

  if (actions.layoutMode === "replace" && actions.layoutSpec && typeof actions.layoutSpec === "object") {
    pendingAssistantLayoutSpec = actions.layoutSpec;
    pendingAssistantSceneSpec = null;
    layoutSpec = actions.layoutSpec;
    didApply = true;
    didRender = true;
  }

  if (actions.sceneMode === "replace" && actions.sceneSpec && typeof actions.sceneSpec === "object") {
    pendingAssistantSceneSpec = actions.sceneSpec;
    pendingAssistantLayoutSpec = null;
    sceneSpec = actions.sceneSpec;
    didApply = true;
    didRender = true;
  }

  return { didApply, didRender, layoutSpec, sceneSpec };
}

function detectAssistantOutputMode(query) {
  const text = String(query ?? "").trim();
  if (!text) {
    return "";
  }
  if (
    /(scene\.v1|手写稿|手写稿脚本|分镜|storyboard|导演层|每页|每一页|分页|page-by-page|page plan|webview|网页槽位|网页内容|网页引用|拉入图片|拉进来一张图|拉进来一张图片|图片槽位|画布外|scene)/i.test(
      text,
    )
  ) {
    return "scene.v1";
  }
  if (/(layout\.v1|排版json|布局json|布局格式|版式|排版|坐标|blocks?|页面结构|知识图谱|flowchart|mindmap)/i.test(text)) {
    return "layout.v1";
  }
  return "";
}

async function sendAssistantQuery() {
  const query = String(assistantInput?.value ?? "").trim();
  if (!query) {
    setStatus("请输入 AI 指令。", true);
    return;
  }

  assistantSendButton.disabled = true;
  appendAssistantMessage("user", query);
  assistantHistory.push({ role: "user", content: query });
  assistantInput.value = "";

  try {
    setStatus("AI 正在分析请求...");
    const outputMode = detectAssistantOutputMode(query);
    const response = await fetch(`${resolveApiBaseUrl()}/v1/assistant`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        outputMode: outputMode || undefined,
        history: assistantHistory.slice(-8),
        context: {
          text: String(textInput.value ?? ""),
          controls: collectControlSnapshot(),
          enableLatex: Boolean(enableLatexInput.checked),
          layoutSpace: buildAssistantLayoutSpaceContext(),
        },
      }),
    });

    const payload = await response.json();
    if (!response.ok || payload?.ok === false) {
      throw new Error(payload?.error || `AI 请求失败（HTTP ${response.status}）`);
    }

    const result = payload?.result ?? {};
    const reply = typeof result.reply === "string" && result.reply.trim()
      ? result.reply.trim()
      : "已处理你的请求。";
    const source = typeof result.source === "string" ? result.source : "";
    appendAssistantMessage("assistant", reply, source);
    assistantHistory.push({ role: "assistant", content: reply });

    const applyResult = applyAssistantResultActions(result.actions);
    if (applyResult.didRender) {
      if (applyResult.sceneSpec || pendingAssistantSceneSpec) {
        await buildPlanAndPlayFromSceneSpec(applyResult.sceneSpec || pendingAssistantSceneSpec);
      } else if (applyResult.layoutSpec || pendingAssistantLayoutSpec) {
        await buildPlanAndPlayFromLayoutSpec(applyResult.layoutSpec || pendingAssistantLayoutSpec);
      } else {
        await buildPlanAndPlay();
      }
      return;
    }

    if (applyResult.didApply) {
      setStatus("AI 建议已应用。你可以点击 Build + Play 查看效果。");
    } else {
      setStatus("AI 已回复。");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    appendAssistantMessage("assistant", `处理失败：${message}`, "error");
    setStatus(`AI 处理失败: ${message}`, true);
  } finally {
    assistantSendButton.disabled = false;
  }
}

function showPage(
  pageIndex,
  { play = false, resetProgress = true, completedView = false, scroll = true } = {},
) {
  if (!currentPagedPlans.length) {
    updatePageMeta();
    return;
  }

  currentPageIndex = clamp(pageIndex, 0, currentPagedPlans.length - 1);
  const pagePlan = currentPagedPlans[currentPageIndex];
  const currentCanvasNode = pageCanvasNodes[currentPageIndex];
  const hasPlayableStrokes = Array.isArray(pagePlan?.strokes) && pagePlan.strokes.length > 0;

  clearAutoPageTimer();
  updateActivePageVisual();

  for (let index = 0; index < pageCanvasNodes.length; index += 1) {
    if (index === currentPageIndex && play) {
      continue;
    }
    drawPageSnapshot(pageCanvasNodes[index], currentPagedPlans[index], currentRenderStyle);
  }

  const activePlayer = ensurePlayerForCurrentPage();
  if (activePlayer && hasPlayableStrokes) {
    activePlayer.setPlan(pagePlan, currentRenderStyle);
    if (!resetProgress) {
      activePlayer.strokeIndex = Math.min(activePlayer.strokeIndex, activePlayer.strokes.length);
    }
    if (play) {
      activePlayer.play();
      pauseButton.textContent = "Pause";
    } else if (completedView) {
      activePlayer.complete();
      pauseButton.textContent = "Pause";
    }
  } else if (activePlayer) {
    activePlayer.stop({ preserveCanvas: true });
    if (currentCanvasNode) {
      drawPageSnapshot(currentCanvasNode, pagePlan, currentRenderStyle);
    }
    pauseButton.textContent = "Pause";
  }

  if (scroll) {
    scrollToPage(currentPageIndex, play ? "smooth" : "auto");
  }

  updatePageMeta();
}

async function buildPlanAndPlay() {
  const rawText = String(textInput.value ?? "");
  if (!rawText.trim()) {
    setStatus("请输入要书写的文本。", true);
    return;
  }
  const likelyLatexFromRaw = detectLatexInput(rawText);
  const layoutText = likelyLatexFromRaw ? rawText : normalizeInputForLayout(rawText);

  const controls = collectControlSnapshot();
  const style = resolveStyleOverridesFromControls();

  const pageSpec = getSelectedPageSpec();
  const latexAutoDetected = likelyLatexFromRaw || detectLatexInput(layoutText);
  const latexEnabled = Boolean(enableLatexInput.checked && latexAutoDetected);
  const normalizedLatex = normalizeLatexInput(layoutText, latexEnabled);
  const extractedLatexCandidate = latexEnabled ? extractLatexDocumentForHandwriting(layoutText) : null;
  const extractedLatexDoc = extractedLatexCandidate?.isDocument ? extractedLatexCandidate : null;

  const planInputText =
    latexEnabled && extractedLatexDoc?.text
      ? extractedLatexDoc.text
      : latexEnabled
        ? layoutText
        : normalizedLatex.text;

  if (!planInputText.trim()) {
    setStatus("输入在 LaTeX 预处理后为空，请检查公式。", true);
    return;
  }

  const documentLayoutMode = Boolean(latexEnabled && extractedLatexDoc?.isDocument);
  const effectiveDocumentLayoutMode = documentLayoutMode;
  const presetBehavior = getActivePresetBehavior();
  const boardLectureMode = Boolean(presetBehavior.boardLectureMode);
  const paragraphIndentChars = Number.isFinite(presetBehavior.paragraphIndentChars)
    ? Math.max(0, presetBehavior.paragraphIndentChars)
    : effectiveDocumentLayoutMode
      ? 2
      : 0;

  const layoutTuning = resolveLayoutTuning(controls, {
    documentLayoutMode: effectiveDocumentLayoutMode,
    boardLectureMode,
  });
  const tunedFontSize = layoutTuning.tunedFontSize;
  const tunedLineHeight = layoutTuning.tunedLineHeight;
  const tunedLetterSpacing = layoutTuning.tunedLetterSpacing;
  const tunedPadding = layoutTuning.tunedPadding;

  style.documentLayoutMode = effectiveDocumentLayoutMode;
  style.speedPxPerSec = clamp(style.speedPxPerSec, 24, 460);
  style.speedVariation = clamp(style.speedVariation, 0.03, 0.6);
  style.jitter = clamp(style.jitter, 0, 1.2);
  style.humanize = clamp(style.humanize, 0, 1);
  style.staticGuideVisible = false;
  style.staticGuideAlpha = 0.2;
  style.lockStaticAlignment = false;
  style.boardLectureMode = boardLectureMode;
  applyBoardLectureStyleCaps(style, {
    boardLectureMode,
    documentLayoutMode: effectiveDocumentLayoutMode,
  });

  let buildSucceeded = false;
  try {
    clearAutoPageTimer();
    buildPlayButton.disabled = true;
    setPlaybackControlsBusy(true);
    if (player) {
      player.stop({ preserveCanvas: true });
    }

    setStatus("正在加载静态手写字体...");
    await ensureStaticFontsLoaded();

    let staticCanvases = [];
    let staticMappingBlocks = [];
    let usedStaticMapping = false;
    let plan = null;
    const shouldUseDynamicUniversalMapper = boardLectureMode;
    let dynamicUniversalMapper = null;

    if (shouldUseDynamicUniversalMapper) {
      setStatus("正在加载板书字形映射...");
      dynamicUniversalMapper = await ensureDynamicUniversalMapper();
      if (!dynamicUniversalMapper) {
        setStatus("动态字体映射器不可用，继续使用内置笔画方案。");
      }
    }

    if (ENABLE_STATIC_MAPPING_PIPELINE) {
      setStatus("正在生成静态排版预览...");
      const staticPreview = await renderStaticPreviewPages(planInputText, {
        pageSpec,
        fontSize: tunedFontSize,
        lineHeight: tunedLineHeight,
        letterSpacing: tunedLetterSpacing,
        padding: tunedPadding,
        inkColor: style.inkColor,
        latexEnabled,
        documentLayoutMode: effectiveDocumentLayoutMode,
        boardLectureMode,
      });
      staticCanvases = Array.isArray(staticPreview?.pages) ? staticPreview.pages : [];
      staticMappingBlocks = Array.isArray(staticPreview?.mappingBlocks)
        ? staticPreview.mappingBlocks
        : [];
      const staticPagedPlans = buildStaticPagedPlans(staticCanvases, pageSpec);

      currentPlan = null;
      currentPagedPlans = staticPagedPlans;
      currentRenderStyle = style;
      currentPageSpec = pageSpec;
      applyPageSpecToCanvas(pageSpec);
      renderPageStack(staticPagedPlans, pageSpec);
      currentPageIndex = 0;
      updateActivePageVisual();
      updatePageMeta();
      scrollToPage(0, "auto");

      setStatus(`静态排版已生成（${staticPagedPlans.length} 页），正在加载字体预设并执行静态映射...`);
      await new Promise((resolve) => window.setTimeout(resolve, 500));

      const staticMappedLatexStrength = clamp(
        style.humanize,
        0,
        STATIC_MAPPING_PLAN_LIMITS.latexHandwritingStrength,
      );
      if (staticMappingBlocks.length > 0) {
        try {
          plan = await composeMappedBlocksPlan(staticMappingBlocks, {
            pageSpec,
            fontSize: tunedFontSize,
            lineHeight: tunedLineHeight,
            letterSpacing: tunedLetterSpacing,
            penWidth: controls.penWidth,
            allowRemoteHanzi: remoteHanziInput.checked,
            samplingStep: 14,
            universalFontMapper: dynamicUniversalMapper,
            forceUniversalAll: false,
            preferUniversalLatinMath: boardLectureMode,
            forceBuiltinMapping: false,
            lockMappedGeometry: true,
            enableLatexLayout: latexEnabled,
            documentLayoutMode: effectiveDocumentLayoutMode,
            boardLectureMode,
            preferBuiltinLatexGlyphs: boardLectureMode,
            scribbleLevel: layoutTuning.profile.scribble,
            breathingAmount: layoutTuning.profile.breathing,
            layoutDensity: layoutTuning.profile.density,
            structureAwareness: layoutTuning.profile.structureAwareness,
            latexHandwritingStrength: staticMappedLatexStrength,
          });
          usedStaticMapping = Boolean(plan?.strokeCount);
        } catch (mappingError) {
          console.warn("static to dynamic mapping failed", mappingError);
        }
      }

      if (!usedStaticMapping || !plan) {
        setStatus("静态映射不可用，回退到常规动态布局...");
        plan = await composeTextPlan(planInputText, {
          fontSize: tunedFontSize,
          lineHeight: tunedLineHeight,
          letterSpacing: tunedLetterSpacing,
          penWidth: controls.penWidth,
          maxWidth: pageSpec.width,
          pageHeight: pageSpec.height,
          padding: tunedPadding,
          allowRemoteHanzi: remoteHanziInput.checked,
          samplingStep: 14,
          universalFontMapper: dynamicUniversalMapper,
        forceUniversalAll: false,
        preferUniversalLatinMath: boardLectureMode,
        preferUniversalLatinText: true,
        preferBuiltinLatexGlyphs: boardLectureMode,
        smartLayout: true,
        paragraphIndentChars,
        enableLatexLayout: latexEnabled,
        documentLayoutMode: effectiveDocumentLayoutMode,
        boardLectureMode,
        scribbleLevel: layoutTuning.profile.scribble,
        breathingAmount: layoutTuning.profile.breathing,
        layoutDensity: layoutTuning.profile.density,
          structureAwareness: layoutTuning.profile.structureAwareness,
          latexHandwritingStrength: style.humanize,
        });
      }
    } else {
      setStatus("正在生成分页笔画计划...");
      plan = await composeTextPlan(planInputText, {
        fontSize: tunedFontSize,
        lineHeight: tunedLineHeight,
        letterSpacing: tunedLetterSpacing,
        penWidth: controls.penWidth,
        maxWidth: pageSpec.width,
        pageHeight: pageSpec.height,
        padding: tunedPadding,
        allowRemoteHanzi: remoteHanziInput.checked,
        samplingStep: 14,
        universalFontMapper: dynamicUniversalMapper,
        forceUniversalAll: false,
        preferUniversalLatinMath: boardLectureMode,
        preferUniversalLatinText: true,
        preferBuiltinLatexGlyphs: boardLectureMode,
        smartLayout: true,
        paragraphIndentChars,
        enableLatexLayout: latexEnabled,
        documentLayoutMode: effectiveDocumentLayoutMode,
        boardLectureMode,
        scribbleLevel: layoutTuning.profile.scribble,
        breathingAmount: layoutTuning.profile.breathing,
        layoutDensity: layoutTuning.profile.density,
        structureAwareness: layoutTuning.profile.structureAwareness,
        latexHandwritingStrength: style.humanize,
      });
    }

    if (usedStaticMapping) {
      style.jitter = Math.min(style.jitter, STATIC_MAPPING_RUNTIME_STYLE_LIMITS.jitter);
      style.speedVariation = Math.min(style.speedVariation, STATIC_MAPPING_RUNTIME_STYLE_LIMITS.speedVariation);
      style.humanize = Math.min(style.humanize, STATIC_MAPPING_RUNTIME_STYLE_LIMITS.humanize);
      style.scribbleLevel = Math.min(style.scribbleLevel ?? 0, STATIC_MAPPING_RUNTIME_STYLE_LIMITS.scribbleLevel);
      style.breathingAmount = Math.min(style.breathingAmount ?? 0, STATIC_MAPPING_RUNTIME_STYLE_LIMITS.breathingAmount);
      style.breathingAmplitude = Math.min(style.breathingAmplitude ?? 0, STATIC_MAPPING_RUNTIME_STYLE_LIMITS.breathingAmplitude);
      style.breathingSpeedSwing = Math.min(style.breathingSpeedSwing ?? 0, STATIC_MAPPING_RUNTIME_STYLE_LIMITS.breathingSpeedSwing);
      style.baselineDrift = Math.min(style.baselineDrift ?? 0, STATIC_MAPPING_RUNTIME_STYLE_LIMITS.baselineDrift);
      style.lockStaticAlignment = true;
    }
    applyBoardLectureStyleCaps(style, {
      boardLectureMode,
      documentLayoutMode: effectiveDocumentLayoutMode,
    });

    const pagedPlans = paginatePlan(plan, pageSpec);
    for (let pageIndex = 0; pageIndex < pagedPlans.length; pageIndex += 1) {
      pagedPlans[pageIndex].staticBitmap = staticCanvases[pageIndex] ?? null;
    }
    currentPlan = plan;
    currentPagedPlans = pagedPlans;
    currentRenderStyle = style;
    currentPageSpec = pageSpec;
    currentPaperGuide = resolvePagePaperGuide(
      pagedPlans[0],
      resolvePaperGuideFromLayoutMetrics({
        fontSize: tunedFontSize,
        lineHeight: tunedLineHeight,
        padding: tunedPadding,
        documentLayoutMode: effectiveDocumentLayoutMode,
        boardLectureMode,
      }),
      { boardLectureMode },
    );
    style.lockStaticAlignment = usedStaticMapping || boardLectureMode;
    lastBuildContext = {
      latexEnabled,
      latexAutoDetected,
      effectiveDocumentLayoutMode,
      extractedLatexDoc,
      normalizedLatex,
      controls,
      usedStaticMapping,
      staticMappingBlockCount: staticMappingBlocks.length,
    };

    applyPageSpecToCanvas(pageSpec);
    renderPageStack(pagedPlans, pageSpec);
    showPage(0, { play: true, scroll: false });
    buildSucceeded = true;

    const unknownLatexInfo =
      !latexEnabled && normalizedLatex.unknownCommands.length > 0
        ? ` 未识别命令: \\${normalizedLatex.unknownCommands.join(", \\")}.`
        : "";
    const sourceInfo =
      plan.hanziSourceCounts.remote || plan.hanziSourceCounts.fallback
        ? ` 汉字来源: remote ${plan.hanziSourceCounts.remote}, fallback ${plan.hanziSourceCounts.fallback}.`
        : "";
    const latexInfo = latexEnabled
      ? latexAutoDetected
        ? " LaTeX 自动识别已启用。"
        : " LaTeX 已启用。"
      : "";
    const pageInfo = ` 分页 ${pagedPlans.length} 页，当前第 1 页。`;
    const mappingInfo = usedStaticMapping
      ? ` 静态映射块 ${staticMappingBlocks.length} 个。`
      : plan.universalGlyphCounts?.total
        ? ` 使用常规动态布局，动态字形 ${plan.universalGlyphCounts.total} 个。`
        : " 使用常规动态布局。";

    setStatus(
      `已生成 ${plan.strokeCount} 笔，速度 ${Math.round(style.speedPxPerSec)} px/s。${pageInfo}${mappingInfo}${sourceInfo}${latexInfo}${unknownLatexInfo}`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setStatus(`构建失败: ${message}`, true);
  } finally {
    buildPlayButton.disabled = false;
    if (buildSucceeded) {
      setPlaybackControlsBusy(false);
      updatePageMeta();
    } else {
      pauseButton.disabled = true;
      fastFinishButton.disabled = true;
      resetButton.disabled = true;
      prevPageButton.disabled = true;
      nextPageButton.disabled = true;
      exportButton.disabled = true;
    }
  }
}

async function buildPlanAndPlayFromLayoutSpec(layoutSpec) {
  if (!layoutSpec || typeof layoutSpec !== "object") {
    setStatus("layoutSpec 无效，无法渲染。", true);
    return;
  }

  const controls = collectControlSnapshot();
  const style = resolveStyleOverridesFromControls();
  style.speedPxPerSec = clamp(style.speedPxPerSec, 24, 460);
  style.speedVariation = clamp(style.speedVariation, 0.03, 0.6);
  style.jitter = clamp(style.jitter, 0, 1.2);
  style.humanize = clamp(style.humanize, 0, 1);
  style.staticGuideVisible = false;
  style.staticGuideAlpha = 0.2;
  style.lockStaticAlignment = false;
  applyBoardLectureStyleCaps(style, {
    boardLectureMode: Boolean(style.boardLectureMode),
    documentLayoutMode: true,
  });

  let buildSucceeded = false;
  try {
    clearAutoPageTimer();
    buildPlayButton.disabled = true;
    setPlaybackControlsBusy(true);
    if (player) {
      player.stop({ preserveCanvas: true });
    }

    setStatus("正在请求 layout.v1 排版渲染...");
    const response = await fetch(`${resolveApiBaseUrl()}/v1/plan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        includePlan: true,
        layoutSpec,
        config: {
          fontSize: controls.fontSize,
          penWidth: controls.penWidth,
          maxWidth: 1800,
          letterSpacingPercent: controls.letterSpacing,
          lineHeightPercent: controls.lineHeight,
          scribblePercent: controls.scribble,
          breathingPercent: controls.breathing,
          layoutDensityPercent: controls.layoutDensity,
          samplingStep: 14,
          allowRemoteHanzi: remoteHanziInput.checked,
          enableLatex: Boolean(enableLatexInput.checked),
          autoDetectLatex: true,
          latexVisualStandard: true,
          smartLayout: true,
          paragraphIndentChars: 2,
        },
      }),
    });

    const payload = await response.json();
    if (!response.ok || payload?.ok === false || !payload?.plan) {
      const message = payload?.error || `渲染请求失败（HTTP ${response.status}）`;
      const details = payload?.details?.errors ? ` ${JSON.stringify(payload.details.errors.slice(0, 2))}` : "";
      throw new Error(`${message}${details}`);
    }

    const apiPlan = payload.plan;
    const layoutPage = payload?.meta?.page ?? {};
    const pageSpec = {
      key: "layout-spec-v1",
      label: `Layout v1 (${Math.round(Number(layoutPage.width) || 1240)} × ${Math.round(Number(layoutPage.height) || 1754)})`,
      width: Math.max(320, Math.round(Number(layoutPage.width) || 1240)),
      height: Math.max(320, Math.round(Number(layoutPage.height) || 1754)),
    };

    const pagedPlans = paginatePlan(apiPlan, pageSpec);
    currentPlan = apiPlan;
    currentPagedPlans = pagedPlans;
    currentRenderStyle = style;
    currentPageSpec = pageSpec;
    currentPaperGuide = resolvePagePaperGuide(
      pagedPlans[0],
      resolvePaperGuideFromLayoutMetrics({
        fontSize: Math.max(18, controls.fontSize * 0.52),
        lineHeight: Math.max(32, controls.fontSize * (controls.lineHeight / 100) * 0.56),
        padding: 32,
        documentLayoutMode: true,
        boardLectureMode: Boolean(style.boardLectureMode),
      }),
      { boardLectureMode: Boolean(style.boardLectureMode) },
    );

    applyPageSpecToCanvas(pageSpec);
    renderPageStack(pagedPlans, pageSpec);
    showPage(0, { play: true, scroll: false });
    buildSucceeded = true;

    const layoutWarnings = Array.isArray(payload?.layoutValidation?.warnings)
      ? payload.layoutValidation.warnings.length
      : 0;
    const assetWarnings = Array.isArray(payload?.meta?.warnings) ? payload.meta.warnings.length : 0;
    const imageCount = Number(payload?.summary?.layout?.imageCount) || 0;
    const imageFallbackCount = Number(payload?.summary?.layout?.imageFallbackCount) || 0;
    const warningCount = layoutWarnings + assetWarnings;
    setStatus(
      `layout.v1 渲染完成：${apiPlan.strokeCount} 笔，${pagedPlans.length} 页。${
        imageCount > 0 ? ` 图片 ${imageCount} 个${imageFallbackCount > 0 ? `（占位回退 ${imageFallbackCount}）` : ""}。` : ""
      }${warningCount > 0 ? ` 警告 ${warningCount} 条。` : ""}`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setStatus(`layout.v1 渲染失败: ${message}`, true);
  } finally {
    buildPlayButton.disabled = false;
    pendingAssistantLayoutSpec = null;
    pendingAssistantSceneSpec = null;
    if (buildSucceeded) {
      setPlaybackControlsBusy(false);
      updatePageMeta();
    } else {
      pauseButton.disabled = true;
      fastFinishButton.disabled = true;
      resetButton.disabled = true;
      prevPageButton.disabled = true;
      nextPageButton.disabled = true;
      exportButton.disabled = true;
    }
  }
}

async function buildPlanAndPlayFromSceneSpec(sceneSpec) {
  if (!sceneSpec || typeof sceneSpec !== "object") {
    setStatus("sceneSpec 无效，无法渲染。", true);
    return;
  }

  const controls = collectControlSnapshot();
  const style = resolveStyleOverridesFromControls();
  style.speedPxPerSec = clamp(style.speedPxPerSec, 24, 460);
  style.speedVariation = clamp(style.speedVariation, 0.03, 0.6);
  style.jitter = clamp(style.jitter, 0, 1.2);
  style.humanize = clamp(style.humanize, 0, 1);
  style.staticGuideVisible = false;
  style.staticGuideAlpha = 0.2;
  style.lockStaticAlignment = false;
  applyBoardLectureStyleCaps(style, {
    boardLectureMode: Boolean(style.boardLectureMode),
    documentLayoutMode: true,
  });

  let buildSucceeded = false;
  try {
    clearAutoPageTimer();
    buildPlayButton.disabled = true;
    setPlaybackControlsBusy(true);
    if (player) {
      player.stop({ preserveCanvas: true });
    }

    setStatus("正在请求 scene.v1 手写稿编译与渲染...");
    const response = await fetch(`${resolveApiBaseUrl()}/v1/plan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        includePlan: true,
        sceneSpec,
        config: {
          fontSize: controls.fontSize,
          penWidth: controls.penWidth,
          maxWidth: 1800,
          letterSpacingPercent: controls.letterSpacing,
          lineHeightPercent: controls.lineHeight,
          scribblePercent: controls.scribble,
          breathingPercent: controls.breathing,
          layoutDensityPercent: controls.layoutDensity,
          samplingStep: 14,
          allowRemoteHanzi: remoteHanziInput.checked,
          enableLatex: Boolean(enableLatexInput.checked),
          autoDetectLatex: true,
          latexVisualStandard: true,
          smartLayout: true,
          paragraphIndentChars: 2,
        },
      }),
    });

    const payload = await response.json();
    if (!response.ok || payload?.ok === false || !payload?.plan) {
      const message = payload?.error || `渲染请求失败（HTTP ${response.status}）`;
      const details = payload?.details?.errors ? ` ${JSON.stringify(payload.details.errors.slice(0, 2))}` : "";
      throw new Error(`${message}${details}`);
    }

    const apiPlan = payload.plan;
    const layoutPage = payload?.meta?.page ?? {};
    const pageSpec = {
      key: "scene-spec-v1",
      label: `Scene v1 (${Math.round(Number(layoutPage.width) || 1240)} × ${Math.round(Number(layoutPage.height) || 1754)})`,
      width: Math.max(320, Math.round(Number(layoutPage.width) || 1240)),
      height: Math.max(320, Math.round(Number(layoutPage.height) || 1754)),
    };

    const pagedPlans = paginatePlan(apiPlan, pageSpec);
    currentPlan = apiPlan;
    currentPagedPlans = pagedPlans;
    currentRenderStyle = style;
    currentPageSpec = pageSpec;
    currentPaperGuide = resolvePagePaperGuide(
      pagedPlans[0],
      resolvePaperGuideFromLayoutMetrics({
        fontSize: Math.max(18, controls.fontSize * 0.52),
        lineHeight: Math.max(32, controls.fontSize * (controls.lineHeight / 100) * 0.56),
        padding: 32,
        documentLayoutMode: true,
        boardLectureMode: Boolean(style.boardLectureMode),
      }),
      { boardLectureMode: Boolean(style.boardLectureMode) },
    );

    applyPageSpecToCanvas(pageSpec);
    renderPageStack(pagedPlans, pageSpec);
    showPage(0, { play: true, scroll: false });
    buildSucceeded = true;

    const scenePages = Number(payload?.summary?.scene?.pageCount) || pagedPlans.length;
    const timelineStepCount = Number(payload?.summary?.scene?.timelineStepCount) || 0;
    const imageCount = Number(payload?.summary?.layout?.imageCount) || 0;
    const imageFallbackCount = Number(payload?.summary?.layout?.imageFallbackCount) || 0;
    const placeholderCount = Number(payload?.meta?.sceneCompilation?.placeholderCount) || 0;
    const warningCount = Array.isArray(payload?.meta?.warnings) ? payload.meta.warnings.length : 0;
    setStatus(
      `scene.v1 渲染完成：${apiPlan.strokeCount} 笔，${scenePages} 页，时间线 ${timelineStepCount} 步。${
        imageCount > 0 ? ` 图片 ${imageCount} 个${imageFallbackCount > 0 ? `（占位回退 ${imageFallbackCount}）` : ""}。` : ""
      }${placeholderCount > 0 ? ` 占位槽位 ${placeholderCount} 个。` : ""}${warningCount > 0 ? ` 警告 ${warningCount} 条。` : ""}`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setStatus(`scene.v1 渲染失败: ${message}`, true);
  } finally {
    buildPlayButton.disabled = false;
    pendingAssistantSceneSpec = null;
    pendingAssistantLayoutSpec = null;
    if (buildSucceeded) {
      setPlaybackControlsBusy(false);
      updatePageMeta();
    } else {
      pauseButton.disabled = true;
      fastFinishButton.disabled = true;
      resetButton.disabled = true;
      prevPageButton.disabled = true;
      nextPageButton.disabled = true;
      exportButton.disabled = true;
    }
  }
}

function pauseOrResume() {
  if (!currentPagedPlans.length) {
    setStatus("请先 Build + Play 生成分页计划。", true);
    return;
  }
  const activePlayer = ensurePlayerForCurrentPage();
  if (!activePlayer) {
    setStatus("当前页面播放器不可用。", true);
    return;
  }

  if (!activePlayer.running) {
    showPage(currentPageIndex, { play: true });
    setStatus(`已从第 ${currentPageIndex + 1} 页重新开始播放。`);
    return;
  }

  activePlayer.togglePause();
  pauseButton.textContent = activePlayer.paused ? "Resume" : "Pause";
}

function resetPlayback() {
  if (!currentPagedPlans.length) {
    if (player) {
      player.reset();
    }
    setStatus("Ready");
    return;
  }

  clearAutoPageTimer();
  showPage(currentPageIndex, { play: false, completedView: false });
  pauseButton.textContent = "Pause";
  setStatus(`已重置第 ${currentPageIndex + 1} 页到起点。`);
}

function fastFinishPlayback() {
  if (!currentPagedPlans.length) {
    setStatus("请先 Build + Play 生成分页计划。", true);
    return;
  }

  if (autoPageContinueInput.checked && currentPageIndex < currentPagedPlans.length - 1) {
    const startIndex = currentPageIndex;
    for (let index = startIndex; index < currentPagedPlans.length; index += 1) {
      showPage(index, { play: false, completedView: true, scroll: false });
    }
    pauseButton.textContent = "Pause";
    scrollToPage(currentPageIndex, "smooth");
    setStatus(`已快进完成第 ${startIndex + 1}-${currentPageIndex + 1} 页。`);
    return;
  }

  const activePlayer = ensurePlayerForCurrentPage();
  if (!activePlayer) {
    setStatus("当前页面播放器不可用。", true);
    return;
  }

  activePlayer.complete();
  pauseButton.textContent = "Pause";
  setStatus(`已快进完成第 ${currentPageIndex + 1} 页。`);
}

function goToPreviousPage() {
  if (!currentPagedPlans.length) {
    setStatus("还没有可翻页的内容，请先 Build + Play。", true);
    return;
  }

  if (currentPageIndex <= 0) {
    setStatus("已经是第一页。", true);
    return;
  }

  showPage(currentPageIndex - 1, { play: false, completedView: true });
  pauseButton.textContent = "Pause";
  setStatus(`已切换到第 ${currentPageIndex + 1} 页。`);
}

function goToNextPage() {
  if (!currentPagedPlans.length) {
    setStatus("还没有可翻页的内容，请先 Build + Play。", true);
    return;
  }

  if (currentPageIndex >= currentPagedPlans.length - 1) {
    setStatus("已经是最后一页。", true);
    return;
  }

  showPage(currentPageIndex + 1, { play: false, completedView: true });
  pauseButton.textContent = "Pause";
  setStatus(`已切换到第 ${currentPageIndex + 1} 页。`);
}

function exportPlan() {
  if (!currentPlan || !currentPagedPlans.length) {
    setStatus("请先 Build + Play 生成计划。", true);
    return;
  }

  const payload = {
    createdAt: new Date().toISOString(),
    inputText: textInput.value,
    settings: {
      pageSize: currentPageSpec,
      autoPageContinue: autoPageContinueInput.checked,
      controls: collectControlSnapshot(),
      allowRemoteHanzi: remoteHanziInput.checked,
      enableLatex: enableLatexInput.checked,
    },
    buildContext: lastBuildContext,
    plan: currentPlan,
    pages: currentPagedPlans,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "stroke-plan-paged.json";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);

  setStatus("已导出 stroke-plan-paged.json。");
}

function handlePageSizeChange() {
  const spec = getSelectedPageSpec();
  currentPageSpec = spec;
  setStoredPageSizeKey(spec.key);
  applyPageSpecToCanvas(spec);

  if (currentPlan) {
    renderPageStack(currentPagedPlans, spec);
    updatePageMeta();
    setStatus("纸张规格已切换，请重新 Build + Play 以按新页面重新排版。", true);
  } else {
    currentPageIndex = 0;
    renderPageStack([], spec);
    updatePageMeta();
    setStatus(`纸张已切换：${spec.label}`);
  }
}

function initializePageSize() {
  const pageKey = getStoredPageSizeKey();
  pageSizeInput.value = pageKey;
  currentPageSpec = getSelectedPageSpec();
  applyPageSpecToCanvas(currentPageSpec);
  renderPageStack([], currentPageSpec);
  updatePageMeta();
}

function handlePlayerFinish() {
  const totalPages = currentPagedPlans.length;
  if (!totalPages) {
    setStatus("播放完成。");
    return;
  }

  if (autoPageContinueInput.checked && currentPageIndex < totalPages - 1) {
    const nextPage = currentPageIndex + 1;
    setStatus(`第 ${currentPageIndex + 1} 页完成，正在翻到第 ${nextPage + 1} 页...`);
    clearAutoPageTimer();
    pageAdvanceTimer = window.setTimeout(() => {
      showPage(nextPage, { play: true });
      setStatus(`已自动翻到第 ${nextPage + 1} 页并继续书写。`);
    }, 220);
    return;
  }

  setStatus(`播放完成（第 ${currentPageIndex + 1}/${totalPages} 页）。`);
}

buildPlayButton.addEventListener("click", buildPlanAndPlay);
pauseButton.addEventListener("click", pauseOrResume);
fastFinishButton.addEventListener("click", fastFinishPlayback);
resetButton.addEventListener("click", resetPlayback);
prevPageButton.addEventListener("click", goToPreviousPage);
nextPageButton.addEventListener("click", goToNextPage);
exportButton.addEventListener("click", exportPlan);
assistantSendButton.addEventListener("click", sendAssistantQuery);
assistantClearButton.addEventListener("click", clearAssistantLog);
assistantInput.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
    event.preventDefault();
    sendAssistantQuery();
  }
});

pageSizeInput.addEventListener("change", handlePageSizeChange);
autoPageContinueInput.addEventListener("change", updatePageMeta);
if (fontPresetInput) {
  fontPresetInput.innerHTML = FONT_PRESETS.map((preset) => `<option value="${preset.id}">${preset.label}</option>`).join("");
  fontPresetInput.addEventListener("change", () => {
    const preset = applyFontPreset(fontPresetInput.value);
    setStatus(`字体预设已切换：${preset.label}`);
  });
}

applyControlSnapshot(DEFAULT_CONTROL_SNAPSHOT);
currentFontPresetId = getStoredFontPresetId();
applyFontPreset(currentFontPresetId);
initializePageSize();
clearAssistantLog();
setStatus("Ready（分页手写 + AI 助手）");

if (typeof window !== "undefined") {
  window.__strokeWriter = {
    buildPlanAndPlay,
    buildPlanAndPlayFromSceneSpec,
    buildPlanAndPlayFromLayoutSpec,
    sendAssistantQuery,
    getCurrentPlan: () => currentPlan,
    getPagedPlans: () => currentPagedPlans,
    getCurrentPageIndex: () => currentPageIndex,
    completePlayback: fastFinishPlayback,
    getRuntimeFontSources: () => resolveRuntimeFontSources(),
    getFontPresets: () => FONT_PRESETS,
    getCurrentFontPreset: () => activeStaticFontPreset,
    applyFontPreset,
    setRuntimeFontSources,
  };
}
