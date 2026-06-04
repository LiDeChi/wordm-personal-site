import {composeTextPlan} from "./layoutComposer.js?v=20260316a";
import {extractLatexDocumentForHandwriting} from "./latexDocumentExtractor.js?v=20260307c";
import {normalizeLatexInput} from "./latexPreprocessor.js?v=20260307c";
import {describePlotContent, renderPlotToSvgAsset} from "./plotSvgRenderer.js?v=20260314a";
import {
  DEFAULT_HANDWRITING_CONTROLS,
  controlsToRenderStyle,
  normalizeHandwritingControls,
  resolveLayoutTuning,
} from "./handwritingProfile.js?v=20260316a";
import {createFontSession} from "./fontSession.js?v=20260307c";
import {StrokePlayer} from "./strokePlayer.js?v=20260307c";
import {validateSceneSpecV1} from "../../server/scene-spec-v1.mjs";

const PAGE_GAP = 64;

export const DEFAULT_RUNTIME_FONT_SOURCES = Object.freeze({
  latinPrimary: "./assets/fonts/Kalam-Regular.ttf",
  latinFallback: "./assets/fonts/ArchitectsDaughter-Regular.ttf",
  hanPrimary: "./assets/fonts/MaShanZheng-Regular.ttf",
  hanFallback: "./assets/fonts/LXGWWenKai-Regular.ttf",
  mathPrimary: "./assets/fonts/XITSMath-Regular.otf",
  mathFallback: "./assets/fonts/FiraMath-Regular.otf",
});

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function asNumber(value, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function asBoolean(value, fallback) {
  return typeof value === "boolean" ? value : fallback;
}

function asPlainObject(value, fallback = {}) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : fallback;
}

function normalizeSceneSpecLoose(sceneSpec) {
  const source = asPlainObject(sceneSpec, {});
  const page = asPlainObject(source.page, {});
  const pages = Array.isArray(source.pages) ? source.pages : [];
  const width = Math.max(320, Math.round(asNumber(page.width, 1240)));
  const height = Math.max(320, Math.round(asNumber(page.height, 1754)));

  return {
    specVersion: String(source.specVersion || "scene.v1"),
    page: {
      size: String(page.size || "a4"),
      orientation: String(page.orientation || "portrait"),
      width,
      height,
      grid: Math.max(width, Math.round(asNumber(page.grid, width))),
      margin: Math.max(0, Math.round(asNumber(page.margin, 48))),
    },
    style: asPlainObject(source.style, {}),
    meta: asPlainObject(source.meta, {}),
    pages: pages.map((rawPage, pageIndex) => {
      const pageObject = asPlainObject(rawPage, {});
      const items = Array.isArray(pageObject.items) ? pageObject.items : [];
      return {
        id: String(pageObject.id || `page-${pageIndex + 1}`),
        notes: typeof pageObject.notes === "string" ? pageObject.notes : "",
        style: asPlainObject(pageObject.style, {}),
        timeline: Array.isArray(pageObject.timeline) ? pageObject.timeline : [],
        items: items.map((rawItem, itemIndex) => {
          const item = asPlainObject(rawItem, {});
          return {
            id: String(item.id || `p${pageIndex + 1}-item-${itemIndex + 1}`),
            type: String(item.type || "text"),
            x: Math.max(0, asNumber(item.x, 0)),
            y: Math.max(0, asNumber(item.y, 0)),
            w: Math.max(1, asNumber(item.w, 1)),
            h: Math.max(1, asNumber(item.h, 1)),
            z: asNumber(item.z, 0),
            enter: asPlainObject(item.enter, {}),
            content: asPlainObject(item.content, {}),
          };
        }),
      };
    }),
  };
}

function roundTo(value, digits = 3) {
  const factor = 10 ** digits;
  return Math.round((Number(value) || 0) * factor) / factor;
}

function nextCharIndexAfterStrokes(strokes, fallback) {
  let maxValue = -1;
  for (const stroke of strokes) {
    if (Number.isFinite(stroke?.charIndex)) {
      maxValue = Math.max(maxValue, stroke.charIndex);
    }
  }
  if (maxValue < 0) {
    return fallback;
  }
  return Math.max(fallback, maxValue + 1);
}

function createEmptyCounters() {
  return {
    missingChars: new Set(),
    hanziSourceCounts: {
      remote: 0,
      fallback: 0,
    },
    universalGlyphCounts: {
      total: 0,
      han: 0,
      latin: 0,
      math: 0,
      other: 0,
    },
  };
}

function mergePlanCounters(target, blockPlan) {
  for (const char of blockPlan?.missingChars ?? []) {
    target.missingChars.add(char);
  }
  target.hanziSourceCounts.remote += Number(blockPlan?.hanziSourceCounts?.remote) || 0;
  target.hanziSourceCounts.fallback += Number(blockPlan?.hanziSourceCounts?.fallback) || 0;
  target.universalGlyphCounts.total += Number(blockPlan?.universalGlyphCounts?.total) || 0;
  target.universalGlyphCounts.han += Number(blockPlan?.universalGlyphCounts?.han) || 0;
  target.universalGlyphCounts.latin += Number(blockPlan?.universalGlyphCounts?.latin) || 0;
  target.universalGlyphCounts.math += Number(blockPlan?.universalGlyphCounts?.math) || 0;
  target.universalGlyphCounts.other += Number(blockPlan?.universalGlyphCounts?.other) || 0;
}

function resolveRuntimeConfig(rawConfig = {}) {
  const fontSize = asNumber(rawConfig.fontSize, 72);
  const penWidth = asNumber(rawConfig.penWidth, 4);
  const maxWidth = asNumber(rawConfig.maxWidth, 1400);
  const pageHeight = asNumber(rawConfig.pageHeight, 0);
  const letterSpacingPercent = asNumber(rawConfig.letterSpacingPercent, 3);
  const lineHeightPercent = asNumber(rawConfig.lineHeightPercent, 132);
  const padding = asNumber(rawConfig.padding, 70);
  const samplingStep = asNumber(rawConfig.samplingStep, 14);
  const scribblePercent = asNumber(rawConfig.scribblePercent, 28);
  const breathingPercent = asNumber(rawConfig.breathingPercent, 18);
  const layoutDensityPercent = asNumber(rawConfig.layoutDensityPercent, 74);

  const allowRemoteHanzi = asBoolean(rawConfig.allowRemoteHanzi, false);
  const enableLatex = asBoolean(rawConfig.enableLatex, true);
  const autoDetectLatex = asBoolean(rawConfig.autoDetectLatex, true);
  const latexVisualStandard = asBoolean(rawConfig.latexVisualStandard, true);
  const forceUniversalAll = asBoolean(rawConfig.forceUniversalAll, false);
  const preferUniversalLatinMath = asBoolean(rawConfig.preferUniversalLatinMath, false);
  const preferBuiltinLatexGlyphs = asBoolean(rawConfig.preferBuiltinLatexGlyphs, false);
  const preferOpenSourceLatexRenderer = asBoolean(rawConfig.preferOpenSourceLatexRenderer, true);
  const smartLayout = asBoolean(rawConfig.smartLayout, true);
  const paragraphIndentChars = asNumber(rawConfig.paragraphIndentChars, 2);
  const latexHandwritingStrength = asNumber(rawConfig.latexHandwritingStrength, 0.04);

  return {
    fontSize,
    penWidth,
    maxWidth,
    pageHeight,
    letterSpacingPercent,
    lineHeightPercent,
    padding,
    samplingStep,
    scribblePercent,
    breathingPercent,
    layoutDensityPercent,
    allowRemoteHanzi,
    enableLatex,
    autoDetectLatex,
    latexVisualStandard,
    forceUniversalAll,
    preferUniversalLatinMath,
    preferBuiltinLatexGlyphs,
    preferOpenSourceLatexRenderer,
    smartLayout,
    paragraphIndentChars,
    latexHandwritingStrength,
  };
}

async function buildSingleTextPlanRuntime(sourceText, config, universalFontMapper) {
  const text = String(sourceText ?? "");
  if (!text.trim()) {
    throw new Error("`text` is required.");
  }

  const latexAutoDetected = config.autoDetectLatex && !config.enableLatex && /\\|\$|\^|_/.test(text);
  const latexEnabled = config.enableLatex || latexAutoDetected;
  const normalizedLatex = normalizeLatexInput(text, latexEnabled);
  const extractedLatexDoc = latexEnabled ? extractLatexDocumentForHandwriting(text) : null;

  const planInputText =
    latexEnabled && extractedLatexDoc?.text
      ? extractedLatexDoc.text
      : latexEnabled
        ? text
        : normalizedLatex.text;
  const documentLayoutMode = Boolean(latexEnabled && extractedLatexDoc?.isDocument);
  const effectiveDocumentLayoutMode = config.latexVisualStandard || documentLayoutMode;

  if (!planInputText.trim()) {
    throw new Error("Input is empty after LaTeX normalization.");
  }

  const layoutTuning = resolveLayoutTuning(
    {
      fontSize: config.fontSize,
      penWidth: config.penWidth,
      styleThickness: 100,
      speed: 118,
      jitter: 6,
      speedVariation: 6,
      humanize: 12,
      strokePause: 28,
      charPause: 84,
      letterSpacing: config.letterSpacingPercent,
      lineHeight: config.lineHeightPercent,
      scribble: config.scribblePercent,
      breathing: config.breathingPercent,
      layoutDensity: config.layoutDensityPercent,
      inkColor: "#1f2a30",
    },
    {
      documentLayoutMode: effectiveDocumentLayoutMode,
    },
  );

  const tunedFontSize = layoutTuning.tunedFontSize;
  const tunedLineHeight = layoutTuning.tunedLineHeight;
  const tunedLetterSpacing = layoutTuning.tunedLetterSpacing;
  const tunedPadding = effectiveDocumentLayoutMode
    ? Math.max(24, config.padding * 0.7)
    : Math.min(config.padding, layoutTuning.tunedPadding);

  const plan = await composeTextPlan(planInputText, {
    fontSize: tunedFontSize,
    lineHeight: tunedLineHeight,
    letterSpacing: tunedLetterSpacing,
    penWidth: config.penWidth,
    maxWidth: config.maxWidth,
    pageHeight: config.pageHeight,
    padding: tunedPadding,
    allowRemoteHanzi: config.allowRemoteHanzi,
    samplingStep: config.samplingStep,
    universalFontMapper,
    forceUniversalAll: config.forceUniversalAll,
    preferUniversalLatinMath: config.preferUniversalLatinMath && Boolean(universalFontMapper),
    preferBuiltinLatexGlyphs: config.preferBuiltinLatexGlyphs,
    preferOpenSourceLatexRenderer: config.preferOpenSourceLatexRenderer,
    smartLayout: config.smartLayout,
    paragraphIndentChars: config.paragraphIndentChars,
    enableLatexLayout: true,
    documentLayoutMode: effectiveDocumentLayoutMode,
    scribbleLevel: layoutTuning.profile.scribble,
    breathingAmount: layoutTuning.profile.breathing,
    layoutDensity: layoutTuning.profile.density,
    latexHandwritingStrength: config.latexHandwritingStrength,
  });
  plan.images = [];

  return {
    plan,
    meta: {
      config,
      latexEnabled,
      latexAutoDetected,
      documentLayoutMode,
      effectiveDocumentLayoutMode,
      rawTextLength: text.length,
      planInputLength: planInputText.length,
    },
  };
}

function buildTimelineOrder(page) {
  const order = new Map();
  const timeline = Array.isArray(page?.timeline) ? page.timeline : [];
  for (const step of timeline) {
    const target = String(step?.target ?? "").trim();
    if (!target || order.has(target)) {
      continue;
    }
    order.set(target, order.size);
  }
  return order;
}

function sortSceneItems(page) {
  const order = buildTimelineOrder(page);
  return (Array.isArray(page?.items) ? page.items : [])
    .map((item, index) => ({item, index}))
    .sort((left, right) => {
      const leftOrder = order.has(left.item.id) ? order.get(left.item.id) : Number.POSITIVE_INFINITY;
      const rightOrder = order.has(right.item.id) ? order.get(right.item.id) : Number.POSITIVE_INFINITY;
      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }
      const leftZ = Number(left.item?.z) || 0;
      const rightZ = Number(right.item?.z) || 0;
      if (leftZ !== rightZ) {
        return leftZ - rightZ;
      }
      return left.index - right.index;
    })
    .map(({item}) => item);
}

function createSyntheticSegmentStroke({
  x0,
  y0,
  x1,
  y1,
  width = 2,
  charIndex = 0,
  syntheticKind = "layout-shape",
  layoutBlockId = "",
}) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const length = Math.max(1, Math.hypot(dx, dy));
  return {
    char: " ",
    category: "math",
    charIndex,
    strokeIndexInChar: 0,
    strokeCountInChar: 1,
    isScript: false,
    scriptType: null,
    width: Math.max(1, width),
    points: [
      {x: x0, y: y0},
      {x: x1, y: y1},
    ],
    outlinePathData: null,
    outlinePathScale: 1024,
    outlineX: x0,
    outlineY: y0,
    outlineSize: Math.max(6, width * 2),
    charX: x0,
    charY: y0,
    charFontSize: Math.max(8, width * 2),
    charAdvance: Math.max(0.2, length / 42),
    finalizeDisabled: true,
    syntheticKind,
    isUniversalGlyph: true,
    layoutLocked: true,
    layoutBlockId,
  };
}

function resolveImageEnterStart({
  enter = "pull-right",
  pageWidth,
  pageTopY,
  pageHeight,
  targetX,
  targetY,
  targetWidth,
  targetHeight,
}) {
  const safeEnter = String(enter ?? "pull-right").toLowerCase();
  const centerX = targetX + targetWidth * 0.5;
  const centerY = targetY + targetHeight * 0.5;
  const outsideGap = Math.max(28, Math.min(180, Math.max(targetWidth, targetHeight) * 0.34));

  if (safeEnter === "pull-left") {
    return {
      x: -targetWidth - outsideGap,
      y: centerY - targetHeight * 0.5,
    };
  }
  if (safeEnter === "pull-top") {
    return {
      x: centerX - targetWidth * 0.5,
      y: pageTopY - targetHeight - outsideGap,
    };
  }
  if (safeEnter === "pull-bottom") {
    return {
      x: centerX - targetWidth * 0.5,
      y: pageTopY + pageHeight + outsideGap,
    };
  }
  if (safeEnter === "fade") {
    return {
      x: targetX,
      y: targetY,
    };
  }
  return {
    x: pageWidth + outsideGap,
    y: centerY - targetHeight * 0.5,
  };
}

function createImageEnterStroke({
  charIndex,
  layoutBlockId,
  fromX,
  fromY,
  targetX,
  targetY,
  targetWidth,
  targetHeight,
  imageAssetId,
  enter,
  enterDurationMs,
  showBorder,
  caption = "",
}) {
  const centerFromX = fromX + targetWidth * 0.5;
  const centerFromY = fromY + targetHeight * 0.5;
  const centerToX = targetX + targetWidth * 0.5;
  const centerToY = targetY + targetHeight * 0.5;
  const stroke = createSyntheticSegmentStroke({
    x0: centerFromX,
    y0: centerFromY,
    x1: centerToX,
    y1: centerToY,
    width: 1.8,
    charIndex,
    syntheticKind: "image-enter",
    layoutBlockId,
  });
  stroke.charX = targetX;
  stroke.charY = targetY;
  stroke.charFontSize = Math.max(8, targetHeight * 0.12);
  stroke.imageAssetId = imageAssetId;
  stroke.imageEnter = {
    fromX,
    fromY,
    toX: targetX,
    toY: targetY,
    width: targetWidth,
    height: targetHeight,
    enter: String(enter ?? "pull-right").toLowerCase(),
    durationMs: Math.max(120, Math.min(3000, Number(enterDurationMs) || 700)),
    showBorder: showBorder !== false,
    caption: String(caption ?? ""),
  };
  return stroke;
}

function normalizeRuntimeMathLatex(latex, displayMode = true) {
  let source = String(latex ?? "").trim();
  if (!source) {
    return "";
  }
  if (source.startsWith("\\[") && source.endsWith("\\]")) {
    source = source.slice(2, -2).trim();
  } else if (source.startsWith("$$") && source.endsWith("$$")) {
    source = source.slice(2, -2).trim();
  } else if (source.startsWith("$") && source.endsWith("$")) {
    source = source.slice(1, -1).trim();
  }
  if (/^\[\[[A-Z_:\d]+\]\]$/.test(source)) {
    return "";
  }
  if (!displayMode) {
    return source;
  }
  return source;
}

function buildAsciiTableFromRows(rows = []) {
  const columnCount = rows.reduce((max, row) => Math.max(max, Array.isArray(row) ? row.length : 0), 0);
  if (columnCount <= 0) {
    return "";
  }
  const normalizedRows = rows.map((row) => {
    const source = Array.isArray(row) ? row : [];
    const next = [];
    for (let column = 0; column < columnCount; column += 1) {
      next.push(String(source[column] ?? ""));
    }
    return next;
  });

  const widths = new Array(columnCount).fill(3);
  for (const row of normalizedRows) {
    for (let column = 0; column < columnCount; column += 1) {
      const cell = row[column] ?? "";
      widths[column] = Math.max(widths[column], Math.min(24, cell.length));
    }
  }

  const rule = `+${widths.map((widthValue) => "-".repeat(Math.max(3, widthValue + 2))).join("+")}+`;
  const lines = [rule];
  for (const row of normalizedRows) {
    const body = row
      .map((cell, column) => ` ${String(cell).slice(0, widths[column]).padEnd(widths[column], " ")} `)
      .join("|");
    lines.push(`|${body}|`);
    lines.push(rule);
  }
  return lines.join("\n");
}

function inferStrokeAnchorY(stroke) {
  if (Number.isFinite(stroke?.charY)) {
    return stroke.charY;
  }
  if (Array.isArray(stroke?.points) && stroke.points.length > 0) {
    const first = stroke.points[0];
    return Number.isFinite(first?.y) ? first.y : 0;
  }
  return 0;
}

function cloneStrokeForPage(stroke, pageIndex, pageStride) {
  const offsetY = pageIndex * pageStride;
  const cloned = {
    ...stroke,
    points: Array.isArray(stroke?.points)
      ? stroke.points.map((point) => ({
          x: point.x,
          y: point.y - offsetY,
        }))
      : [],
    charY: Number.isFinite(stroke?.charY) ? stroke.charY - offsetY : stroke?.charY,
    outlineY: Number.isFinite(stroke?.outlineY) ? stroke.outlineY - offsetY : stroke?.outlineY,
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

function cloneImageForPage(imageAsset, pageIndex, pageStride) {
  const offsetY = pageIndex * pageStride;
  const y = Number(imageAsset?.y);
  return {
    ...imageAsset,
    pageIndex,
    y: Number.isFinite(y) ? y - offsetY : y,
  };
}

function paginatePlan(plan, pageSpec) {
  const pageHeight = pageSpec.height;
  const pageWidth = pageSpec.width;
  const pageGap = Math.max(0, Number(pageSpec.pageGap) || 0);
  const pageStride = pageHeight + pageGap;
  const strokeBuckets = new Map();
  const imageBuckets = new Map();
  let maxPageIndex = 0;

  for (const stroke of plan.strokes ?? []) {
    const y = Math.max(0, inferStrokeAnchorY(stroke));
    const explicitPageIndex = Number(stroke?.pageIndex);
    const pageIndex = Number.isFinite(explicitPageIndex)
      ? Math.max(0, Math.round(explicitPageIndex))
      : Math.max(0, Math.floor(y / Math.max(1, pageStride)));
    maxPageIndex = Math.max(maxPageIndex, pageIndex);

    if (!strokeBuckets.has(pageIndex)) {
      strokeBuckets.set(pageIndex, []);
    }
    strokeBuckets.get(pageIndex).push(cloneStrokeForPage(stroke, pageIndex, pageStride));
  }

  for (const imageAsset of plan.images ?? []) {
    const y = Number(imageAsset?.y);
    const fallbackPage = Number.isFinite(y) ? Math.floor(Math.max(0, y) / Math.max(1, pageStride)) : 0;
    const pageIndex = Number.isFinite(Number(imageAsset?.pageIndex))
      ? Math.max(0, Math.round(Number(imageAsset.pageIndex)))
      : Math.max(0, fallbackPage);
    maxPageIndex = Math.max(maxPageIndex, pageIndex);
    if (!imageBuckets.has(pageIndex)) {
      imageBuckets.set(pageIndex, []);
    }
    imageBuckets.get(pageIndex).push(cloneImageForPage(imageAsset, pageIndex, pageStride));
  }

  const planHeight = Number(plan?.height);
  const pageCountFromHeight = Number.isFinite(planHeight)
    ? Math.max(1, Math.ceil((planHeight + pageGap) / Math.max(1, pageStride)))
    : 1;
  const totalPages = Math.max(1, pageCountFromHeight, maxPageIndex + 1);

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
      hanziSourceCounts: plan.hanziSourceCounts ?? {remote: 0, fallback: 0},
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

  return pages;
}

function createRenderStyle(config, options = {}) {
  const mergedControls = normalizeHandwritingControls({
    ...DEFAULT_HANDWRITING_CONTROLS,
    fontSize: config.fontSize,
    penWidth: config.penWidth,
    letterSpacing: config.letterSpacingPercent,
    lineHeight: config.lineHeightPercent,
    scribble: config.scribblePercent,
    breathing: config.breathingPercent,
    layoutDensity: config.layoutDensityPercent,
    allowRemoteHanzi: config.allowRemoteHanzi,
    enableLatex: config.enableLatex,
    ...(options.controls ?? {}),
  });

  const style = controlsToRenderStyle(mergedControls);
  style.staticGuideVisible = false;
  style.staticGuideAlpha = 0.16;
  style.lockStaticAlignment = false;
  style.liveLectureMode = options.liveLectureMode !== false;
  style.renderSeed = Number.isFinite(Number(options.renderSeed))
    ? Math.round(Number(options.renderSeed))
    : 20260312;
  return {
    controls: mergedControls,
    style,
  };
}

function createSceneMediaAsset(item, page, pageIndex, pageTopY, pageWidth, pageHeight, index, options = {}) {
  const targetX = Math.max(0, Number(item?.x) || 0);
  const targetY = pageTopY + Math.max(0, Number(item?.y) || 0);
  const targetWidth = Math.max(64, Number(item?.w) || 64);
  const targetHeight = Math.max(64, Number(item?.h) || 64);
  const enter = String(item?.enter?.kind ?? "pull-right").toLowerCase();
  const content = asPlainObject(item?.content, {});
  const isWebview = item?.type === "webview";
  const isPlot = item?.type === "plot";

  const enterStart = resolveImageEnterStart({
    enter,
    pageWidth,
    pageTopY,
    pageHeight,
    targetX,
    targetY,
    targetWidth,
    targetHeight,
  });

  if (isPlot) {
    const rendered = renderPlotToSvgAsset(content, {width: targetWidth, height: targetHeight}, {
      defaultInkColor: options.defaultInkColor ?? "#1f2a30",
    });
    if (rendered.ok && rendered.dataUrl) {
      return {
        id: `${String(item?.id ?? `asset-${index}`)}#asset`,
        elementId: String(item?.id ?? `asset-${index}`),
        assetType: "image",
        pageId: String(page?.id ?? `page-${pageIndex + 1}`),
        pageIndex,
        x: targetX,
        y: targetY,
        width: targetWidth,
        height: targetHeight,
        fit: "contain",
        align: "center",
        showBorder: content.showBorder === true,
        caption: String(content.caption ?? "").trim(),
        fallbackLabel: String(content.fallbackLabel ?? "").trim() || rendered.fallbackLabel || "Plot",
        promptText: rendered.summary,
        status: "ok",
        dataUrl: rendered.dataUrl,
        enter,
        enterDurationMs: Math.max(120, Math.min(3000, Number(item?.enter?.durationMs) || 760)),
        fromX: enterStart.x,
        fromY: enterStart.y,
      };
    }

    return {
      id: `${String(item?.id ?? `asset-${index}`)}#asset`,
      elementId: String(item?.id ?? `asset-${index}`),
      assetType: "image",
      pageId: String(page?.id ?? `page-${pageIndex + 1}`),
      pageIndex,
      x: targetX,
      y: targetY,
      width: targetWidth,
      height: targetHeight,
      fit: "contain",
      align: "center",
      showBorder: content.showBorder === true,
      caption: String(content.caption ?? "").trim() || "Plot placeholder",
      fallbackLabel: String(content.fallbackLabel ?? "").trim() || "Plot",
      promptText: `函数图占位\n${describePlotContent(content)}`,
      status: "placeholder",
      dataUrl: null,
      enter,
      enterDurationMs: Math.max(120, Math.min(3000, Number(item?.enter?.durationMs) || 760)),
      fromX: enterStart.x,
      fromY: enterStart.y,
    };
  }

  const promptText = isWebview
    ? String(content.url ?? "").trim()
    : String(content.aiPrompt ?? content.searchQuery ?? content.url ?? "").trim();
  const sourceLabel = isWebview
    ? `网页占位\n${promptText || "URL 未设置"}`
    : promptText
      ? `图片 prompt\n${promptText}`
      : "图片 prompt 未设置";
  const caption = String(content.caption ?? "").trim() || (isWebview ? "网页占位" : "占位图");
  const fallbackLabel = String(content.fallbackLabel ?? "").trim() || (isWebview ? "Webview placeholder" : "AI image prompt");

  return {
    id: `${String(item?.id ?? `asset-${index}`)}#asset`,
    elementId: String(item?.id ?? `asset-${index}`),
    assetType: isWebview ? "webview" : "image",
    pageId: String(page?.id ?? `page-${pageIndex + 1}`),
    pageIndex,
    x: targetX,
    y: targetY,
    width: targetWidth,
    height: targetHeight,
    fit: String(content.fit ?? "contain").toLowerCase() === "cover" ? "cover" : "contain",
    align: ["left", "right"].includes(String(content.align ?? "").toLowerCase())
      ? String(content.align).toLowerCase()
      : "center",
    showBorder: content.showBorder !== false,
    caption,
    fallbackLabel,
    promptText: sourceLabel,
    status: "placeholder",
    dataUrl: null,
    enter,
    enterDurationMs: Math.max(120, Math.min(3000, Number(item?.enter?.durationMs) || 760)),
    fromX: enterStart.x,
    fromY: enterStart.y,
  };
}

async function buildPlanFromSceneSpec(sceneSpec, options) {
  const ABSOLUTE_MIN_FONT_SIZE = 8.5;
  const FIT_HEIGHT_TOLERANCE = 3;
  const mergedStrokes = [];
  const counters = createEmptyCounters();
  const imageAssets = [];
  const itemMetas = [];

  const config = options.config;
  const universalFontMapper = options.universalFontMapper ?? null;
  const pageWidth = Math.max(320, Number(sceneSpec?.page?.width) || 1240);
  const requestedPageHeight = Math.max(320, Number(sceneSpec?.page?.height) || 1754);
  const pageHeight = pageWidth >= requestedPageHeight ? Math.max(900, requestedPageHeight) : requestedPageHeight;

  let charIndexOffset = 0;
  let rawTextLength = 0;
  let planInputLength = 0;
  let latexEnabled = false;
  let latexAutoDetected = false;
  let documentLayoutMode = false;
  let effectiveDocumentLayoutMode = false;

  function mergeTextMeta(meta) {
    rawTextLength += meta.rawTextLength;
    planInputLength += meta.planInputLength;
    latexEnabled = latexEnabled || meta.latexEnabled;
    latexAutoDetected = latexAutoDetected || meta.latexAutoDetected;
    documentLayoutMode = documentLayoutMode || meta.documentLayoutMode;
    effectiveDocumentLayoutMode = effectiveDocumentLayoutMode || meta.effectiveDocumentLayoutMode;
  }

  async function buildFittedTextPlan({
    page,
    item,
    text,
    width,
    height,
    fontSize,
    minFontSize,
    configPatch = {},
  }) {
    const safeText = String(text ?? "");
    if (!safeText.trim()) {
      return null;
    }

    const safeWidth = Math.max(48, Math.round(width));
    const safeHeight = Number.isFinite(height) ? Math.max(24, height) : Number.POSITIVE_INFINITY;
    const maxFontSize = Math.max(10, Number(fontSize) || config.fontSize);
    const minSize = Math.max(
      ABSOLUTE_MIN_FONT_SIZE,
      Math.min(maxFontSize, Number(minFontSize) || maxFontSize * 0.42),
    );

    const runCandidate = async (candidateFontSize, tightenLevel = 0) => {
      const penScale = clamp(candidateFontSize / Math.max(1, config.fontSize), 0.34, 1);
      const requestedPenWidth = asNumber(configPatch.penWidth, config.penWidth);
      const paperLinePitch = Number(configPatch.paperLinePitch);
      const alignToPaper = configPatch.alignToPaper !== false && Number.isFinite(paperLinePitch) && paperLinePitch > 8;
      const baseLineHeightPercent = asNumber(
        configPatch.lineHeightPercent,
        asNumber(page?.style?.lineHeightPercent, asNumber(sceneSpec?.style?.lineHeightPercent, config.lineHeightPercent)),
      );
      const baseLetterSpacingPercent = asNumber(
        configPatch.letterSpacingPercent,
        asNumber(
          page?.style?.letterSpacingPercent,
          asNumber(sceneSpec?.style?.letterSpacingPercent, config.letterSpacingPercent),
        ),
      );
      const tightenedPatch = {
        ...asPlainObject(configPatch, {}),
        lineHeightPercent: alignToPaper
          ? clamp((paperLinePitch / Math.max(1, candidateFontSize)) * 100, 104, 220)
          : Math.max(96, baseLineHeightPercent - tightenLevel * 6),
        letterSpacingPercent: Math.max(0, baseLetterSpacingPercent - tightenLevel * 0.25),
      };
      const itemConfig = resolveRuntimeConfig({
        ...config,
        ...asPlainObject(sceneSpec.style, {}),
        ...asPlainObject(page.style, {}),
        ...tightenedPatch,
        fontSize: candidateFontSize,
        penWidth: Math.max(1, roundTo(requestedPenWidth * penScale, 2)),
        maxWidth: safeWidth,
        padding: 0,
        enableLatex: true,
        forceUniversalAll: asBoolean(tightenedPatch.forceUniversalAll, config.forceUniversalAll),
        preferUniversalLatinMath: asBoolean(
          tightenedPatch.preferUniversalLatinMath,
          config.preferUniversalLatinMath,
        ),
      });
      const result = await buildSingleTextPlanRuntime(safeText, itemConfig, universalFontMapper);
      return {
        ...result,
        usedFontSize: candidateFontSize,
      };
    };

    if (!Number.isFinite(safeHeight)) {
      return runCandidate(maxFontSize);
    }

    let smallest = await runCandidate(minSize);
    let best = smallest.plan.height <= safeHeight + FIT_HEIGHT_TOLERANCE ? smallest : null;

    const topProbe = await runCandidate(maxFontSize);
    if (topProbe.plan.height <= safeHeight + FIT_HEIGHT_TOLERANCE) {
      best = topProbe;
    } else if (topProbe.usedFontSize < smallest.usedFontSize) {
      smallest = topProbe;
    }

    let low = minSize;
    let high = maxFontSize;
    for (let step = 0; step < 7; step += 1) {
      const candidateFontSize = roundTo((low + high) / 2, 2);
      const candidate = await runCandidate(candidateFontSize);
      if (candidate.usedFontSize < smallest.usedFontSize) {
        smallest = candidate;
      }
      if (candidate.plan.height <= safeHeight + FIT_HEIGHT_TOLERANCE) {
        best = candidate;
        low = candidateFontSize;
      } else {
        high = candidateFontSize;
      }
    }

    if (best) {
      return best;
    }

    for (let tightenLevel = 1; tightenLevel <= 3; tightenLevel += 1) {
      const tightened = await runCandidate(minSize, tightenLevel);
      if (tightened.plan.height <= safeHeight + FIT_HEIGHT_TOLERANCE) {
        return tightened;
      }
      if (tightened.usedFontSize < smallest.usedFontSize || tightened.plan.height < smallest.plan.height) {
        smallest = tightened;
      }
    }

    return smallest;
  }

  async function appendTextLikeItem({
    pageIndex,
    page,
    item,
    x,
    y,
    width,
    height,
    text,
    syntheticKind,
    align = "left",
    fontSize = null,
    minFontSize = null,
    configPatch = {},
    alignToPaper = true,
  }) {
    const fitted = await buildFittedTextPlan({
      page,
      item,
      text,
      width: Math.max(120, Math.round(width)),
      height,
      fontSize: fontSize ?? (Number(item?.content?.fontSize) || config.fontSize),
      minFontSize,
      configPatch: {
        smartLayout: false,
        paragraphIndentChars: 0,
        alignToPaper,
        paperLinePitch: alignToPaper ? paperGuide.linePitch : null,
        ...asPlainObject(configPatch, {}),
      },
    });
    if (!fitted) {
      return null;
    }

    const {plan: blockPlan, meta, usedFontSize} = fitted;
    const pageTopY = pageIndex * (pageHeight + PAGE_GAP);
    let offsetX = 0;
    if (align === "center") {
      offsetX = Math.max(0, (width - blockPlan.width) / 2);
    } else if (align === "right") {
      offsetX = Math.max(0, width - blockPlan.width);
    }
    const alignedTopY = alignToPaper
      ? resolvePaperAlignedTopY(pageTopY, y, blockPlan.strokes, syntheticKind)
      : roundTo(y, 2);

    const shifted = blockPlan.strokes.map((stroke) => ({
      ...stroke,
      points: Array.isArray(stroke.points)
        ? stroke.points.map((point) => ({
            x: point.x + x + offsetX,
            y: point.y + alignedTopY,
          }))
        : [],
      charX: Number.isFinite(stroke.charX) ? stroke.charX + x + offsetX : stroke.charX,
      charY: Number.isFinite(stroke.charY) ? stroke.charY + alignedTopY : stroke.charY,
      outlineX: Number.isFinite(stroke.outlineX) ? stroke.outlineX + x + offsetX : stroke.outlineX,
      outlineY: Number.isFinite(stroke.outlineY) ? stroke.outlineY + alignedTopY : stroke.outlineY,
      charIndex: Number.isFinite(stroke.charIndex) ? stroke.charIndex + charIndexOffset : stroke.charIndex,
      pageIndex,
      layoutBlockId: item.id,
      syntheticKind,
    }));

    mergedStrokes.push(...shifted);
    charIndexOffset = nextCharIndexAfterStrokes(shifted, charIndexOffset);
    mergePlanCounters(counters, blockPlan);
    mergeTextMeta(meta);

    itemMetas.push({
      id: item.id,
      type: item.type,
      pageId: page.id,
      x: Math.round(x + offsetX),
      y: Math.round(alignedTopY),
      width: Math.round(Math.max(width, blockPlan.width)),
      height: Math.round(blockPlan.height),
      strokeCount: blockPlan.strokeCount,
      syntheticKind,
    });

    return {
      width: blockPlan.width,
      height: blockPlan.height,
      topY: alignedTopY,
      bottomY: roundTo(alignedTopY + blockPlan.height, 2),
      fontSize: usedFontSize,
    };
  }

  async function appendLabeledBlockItem({
    pageIndex,
    page,
    item,
    x,
    y,
    width,
    height,
    titleText,
    bodyText,
    padding,
    titleKind,
    bodyKind,
    dividerKind = "section-divider",
    divider = true,
  }) {
    const innerX = x + padding;
    const innerY = y + padding;
    const innerWidth = Math.max(120, width - padding * 2);
    const hasFiniteHeight = Number.isFinite(height);
    const innerHeight = hasFiniteHeight ? Math.max(32, height - padding * 2) : Number.POSITIVE_INFINITY;
    let cursorY = innerY;
    let remainingHeight = innerHeight;
    let blockBottom = innerY;

    const safeTitle = String(titleText ?? "").trim();
    const safeBody = String(bodyText ?? "").trim();

    if (safeTitle) {
      const titleBudget = safeBody
        ? clamp(hasFiniteHeight ? innerHeight * 0.16 : config.fontSize * 1.04, 24, 62)
        : innerHeight;
      const titleResult = await appendTextLikeItem({
        pageIndex,
        page,
        item,
        x: innerX,
        y: cursorY,
        width: innerWidth,
        height: titleBudget,
        text: safeTitle,
        syntheticKind: titleKind,
        fontSize: Math.min(config.fontSize * 0.44, titleBudget * 0.5, innerWidth * 0.118, 20),
        minFontSize: Math.max(11.5, Math.min(14.5, innerWidth * 0.062)),
        configPatch: {
          lineHeightPercent: 102,
          letterSpacingPercent: Math.max(0, Math.min(config.letterSpacingPercent, 0.45)),
        },
      });
      if (titleResult) {
        const titleBottom = titleResult.bottomY;
        const titleGap = safeBody ? Math.max(4, titleResult.fontSize * 0.12) : 0;
        if (safeBody && divider !== false) {
          const dividerY = titleBottom + Math.max(2, titleGap * 0.34);
          const dividerWidth = Math.min(innerWidth * 0.54, Math.max(96, titleResult.width + 28));
          appendSegment(
            pageIndex,
            page,
            item,
            innerX,
            dividerY,
            innerX + dividerWidth,
            dividerY,
            Math.max(1, config.penWidth * 0.42),
            dividerKind,
          );
          blockBottom = Math.max(blockBottom, dividerY);
        }
        cursorY = titleBottom + titleGap;
        remainingHeight = hasFiniteHeight ? Math.max(24, innerY + innerHeight - cursorY) : Number.POSITIVE_INFINITY;
        blockBottom = Math.max(blockBottom, titleBottom);
      }
    }

    let bodyResult = null;
    if (safeBody && (remainingHeight > 16 || !hasFiniteHeight)) {
      bodyResult = await appendTextLikeItem({
        pageIndex,
        page,
        item,
        x: innerX,
        y: cursorY,
        width: innerWidth,
        height: remainingHeight,
        text: safeBody,
        syntheticKind: bodyKind,
        fontSize: Math.min(config.fontSize * 0.33, innerWidth * 0.068, 17.2),
        minFontSize: Math.max(8.8, Math.min(10.8, innerWidth * 0.046)),
        configPatch: {
          lineHeightPercent: 102,
          letterSpacingPercent: 0.04,
        },
      });
      if (bodyResult) {
        blockBottom = Math.max(blockBottom, bodyResult.bottomY);
      }
    }

    const finalBottom = Math.max(y + padding * 2, blockBottom + padding);
    return {
      width,
      height: Math.max(padding * 2, finalBottom - y),
      bottomY: roundTo(finalBottom, 2),
    };
  }

  function appendSegment(pageIndex, page, item, x0, y0, x1, y1, thickness, syntheticKind) {
    const stroke = createSyntheticSegmentStroke({
      x0,
      y0,
      x1,
      y1,
      width: Math.max(1, thickness),
      charIndex: charIndexOffset,
      syntheticKind,
      layoutBlockId: item.id,
    });
    stroke.pageIndex = pageIndex;
    mergedStrokes.push(stroke);
    charIndexOffset += 1;
    itemMetas.push({
      id: `${item.id}#${syntheticKind}`,
      type: item.type,
      pageId: page.id,
      x: Math.round(Math.min(x0, x1)),
      y: Math.round(Math.min(y0, y1)),
      width: Math.round(Math.abs(x1 - x0)),
      height: Math.round(Math.abs(y1 - y0)),
      strokeCount: 1,
      syntheticKind,
    });
  }

  const paperGuide = {
    marginLeft: 96,
    marginRight: 40,
    marginTop: 20,
    marginBottom: 26,
    marginLineX: 68,
    linePitch: roundTo(clamp(config.fontSize * 0.78, 34, 38), 2),
    lineOffset: roundTo(clamp(config.fontSize * 0.42, 18, 22), 2),
    rowGap: roundTo(clamp(config.fontSize * 0.08, 3, 5), 2),
    sectionGap: roundTo(clamp(config.fontSize * 0.11, 4, 7), 2),
    columnGap: 30,
  };
  paperGuide.lineOriginY = roundTo(paperGuide.marginTop + paperGuide.lineOffset, 2);

  function snapBlockY(pageTopY, absoluteY) {
    const origin = pageTopY + paperGuide.marginTop;
    const steps = Math.round((absoluteY - origin) / Math.max(1, paperGuide.linePitch));
    return roundTo(origin + steps * paperGuide.linePitch, 2);
  }

  function snapRuleY(pageTopY, absoluteY) {
    const origin = pageTopY + paperGuide.lineOriginY;
    const pitch = Math.max(1, paperGuide.linePitch);
    const steps = Math.max(0, Math.ceil((absoluteY - origin) / pitch - 1e-6));
    return roundTo(origin + steps * pitch, 2);
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

  function median(values = []) {
    if (!Array.isArray(values) || values.length === 0) {
      return null;
    }
    const sorted = values
      .filter((value) => Number.isFinite(value))
      .slice()
      .sort((a, b) => a - b);
    if (sorted.length === 0) {
      return null;
    }
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 1) {
      return sorted[mid];
    }
    return (sorted[mid - 1] + sorted[mid]) * 0.5;
  }

  function resolveBlockLineMetrics(strokes, syntheticKind) {
    const anchored = (Array.isArray(strokes) ? strokes : []).filter(
      (stroke) => Number.isFinite(stroke?.charY) && Number.isFinite(stroke?.charFontSize),
    );
    if (anchored.length === 0) {
      return null;
    }

    const firstLineTop = anchored.reduce((minValue, stroke) => Math.min(minValue, stroke.charY), Infinity);
    const largestFontSize = anchored.reduce(
      (maxValue, stroke) => Math.max(maxValue, Number(stroke.charFontSize) || 0),
      0,
    );
    const firstLineBand = Math.max(16, largestFontSize * 0.72);
    const firstLine = anchored.filter((stroke) => stroke.charY <= firstLineTop + firstLineBand);
    if (firstLine.length === 0) {
      return null;
    }

    const primaryFontSize = firstLine.reduce(
      (maxValue, stroke) => Math.max(maxValue, Number(stroke.charFontSize) || 0),
      0,
    );
    const primaryLine = firstLine.filter(
      (stroke) => !stroke?.isScript && (Number(stroke?.charFontSize) || 0) >= primaryFontSize * 0.82,
    );
    const sample = primaryLine.length > 0 ? primaryLine : firstLine;
    const anchorOffsets = sample.map(
      (stroke) => stroke.charY + stroke.charFontSize * resolvePaperBaselineRatio(syntheticKind, stroke.category),
    );
    const firstLineAnchorOffset = median(anchorOffsets);
    if (!Number.isFinite(firstLineAnchorOffset)) {
      return null;
    }
    return {
      firstLineAnchorOffset,
    };
  }

  function resolvePaperAlignedTopY(pageTopY, requestedTopY, strokes, syntheticKind) {
    const metrics = resolveBlockLineMetrics(strokes, syntheticKind);
    if (!metrics) {
      return roundTo(requestedTopY, 2);
    }
    const requestedBaselineY = requestedTopY + metrics.firstLineAnchorOffset;
    const snappedBaselineY = snapRuleY(pageTopY, requestedBaselineY);
    const alignedTopY = requestedTopY + (snappedBaselineY - requestedBaselineY);
    return roundTo(Math.max(pageTopY + paperGuide.marginTop, alignedTopY), 2);
  }

  function isTopTitleItem(item) {
    return (
      item?.type === "text" &&
      (Number(item?.y) || 0) <= 120 &&
      (Number(item?.w) || 0) >= pageWidth * 0.5
    );
  }

  function isTopDividerItem(item) {
    return item?.type === "line" && (Number(item?.y) || 0) <= 170 && (Number(item?.w) || 0) >= pageWidth * 0.6;
  }

  function buildRowEntries(items) {
    const entries = [];
    let currentRow = null;
    for (const item of items) {
      if (isTopTitleItem(item) || isTopDividerItem(item)) {
        continue;
      }
      if (item?.type === "line") {
        currentRow = null;
        entries.push({kind: "divider", item});
        continue;
      }

      const itemTop = Math.max(0, Number(item?.y) || 0);
      const itemBottom = itemTop + Math.max(1, Number(item?.h) || 1);
      const itemIsAsset = item?.type === "image" || item?.type === "webview";
      const itemIsMath = item?.type === "math";

      if (itemIsMath) {
        currentRow = {
          kind: "items",
          items: [item],
          sourceTop: itemTop,
          sourceBottom: itemBottom,
          contentBottom: itemBottom,
        };
        entries.push(currentRow);
        currentRow = null;
        continue;
      }

      const currentBottom = currentRow ? currentRow.contentBottom ?? currentRow.sourceBottom : 0;
      const overlapsCurrent =
        currentRow &&
        (itemTop <= currentBottom - 28 ||
          itemTop - currentBottom <= Math.max(32, paperGuide.linePitch * 0.42));

      if (overlapsCurrent) {
        currentRow.items.push(item);
        currentRow.sourceTop = Math.min(currentRow.sourceTop, itemTop);
        currentRow.sourceBottom = Math.max(currentRow.sourceBottom, itemBottom);
        if (!itemIsAsset) {
          currentRow.contentBottom = Math.max(currentRow.contentBottom ?? itemBottom, itemBottom);
        }
        continue;
      }

      currentRow = {
        kind: "items",
        items: [item],
        sourceTop: itemTop,
        sourceBottom: itemBottom,
        contentBottom: itemIsAsset ? null : itemBottom,
      };
      entries.push(currentRow);
    }
    return entries;
  }

  function layoutWeightedPlacements(items, left, availableWidth) {
    const sorted = items.slice().sort((a, b) => (Number(a?.x) || 0) - (Number(b?.x) || 0));
    if (sorted.length === 1) {
      return [{item: sorted[0], x: left, width: availableWidth, height: null}];
    }

    const gap = paperGuide.columnGap;
    const usableWidth = Math.max(220, availableWidth - gap * Math.max(0, sorted.length - 1));
    const weights = sorted.map((item) => {
      const raw = Math.max(1, Number(item?.w) || 180);
      if (item?.type === "math") {
        return Math.max(raw, 420);
      }
      if (item?.type === "text" && raw >= pageWidth * 0.66) {
        return raw * 1.12;
      }
      return raw;
    });
    const totalWeight = weights.reduce((sum, value) => sum + value, 0) || sorted.length;
    const placements = [];
    let cursorX = left;
    for (let index = 0; index < sorted.length; index += 1) {
      const item = sorted[index];
      const remainingGap = gap * Math.max(0, sorted.length - index - 1);
      const remainingRight = left + availableWidth - remainingGap;
      const minWidth = item?.type === "math" ? 320 : item?.type === "text" ? 220 : 180;
      const width =
        index === sorted.length - 1
          ? Math.max(minWidth, remainingRight - cursorX)
          : clamp(roundTo((usableWidth * weights[index]) / totalWeight, 2), minWidth, remainingRight - cursorX);
      placements.push({
        item,
        x: roundTo(cursorX, 2),
        width: roundTo(width, 2),
        height: null,
      });
      cursorX += width + gap;
    }
    return placements;
  }

  function computeRowPlacements(items, contentLeft, contentWidth) {
    const sorted = items.slice().sort((a, b) => (Number(a?.x) || 0) - (Number(b?.x) || 0));
    const imageItem = sorted.find((item) => item?.type === "image" || item?.type === "webview" || item?.type === "plot") ?? null;

    if (!imageItem) {
      return layoutWeightedPlacements(sorted, contentLeft, contentWidth);
    }

    const textLikeItems = sorted.filter((item) => item !== imageItem);
    const rawImageWidth = Math.max(180, Number(imageItem?.w) || 240);
    const imageWidth = roundTo(clamp((rawImageWidth / Math.max(pageWidth, 1)) * contentWidth * 1.02, 188, 246), 2);
    const imageHeight = roundTo(
      clamp((Math.max(120, Number(imageItem?.h) || 180) / rawImageWidth) * imageWidth, 140, 228),
      2,
    );
    const leftWidth = textLikeItems.length > 0 ? Math.max(240, contentWidth - imageWidth - paperGuide.columnGap) : contentWidth;
    const textPlacements = layoutWeightedPlacements(textLikeItems, contentLeft, leftWidth);
    return [
      ...textPlacements,
      {
        item: imageItem,
        x: roundTo(contentLeft + contentWidth - imageWidth, 2),
        width: imageWidth,
        height: imageHeight,
      },
    ].sort((a, b) => a.x - b.x);
  }

  for (let pageIndex = 0; pageIndex < sceneSpec.pages.length; pageIndex += 1) {
    const page = sceneSpec.pages[pageIndex];
    const pageTopY = pageIndex * (pageHeight + PAGE_GAP);
    const orderedItems = sortSceneItems(page);
    const contentLeft = paperGuide.marginLeft;
    const contentWidth = pageWidth - paperGuide.marginLeft - paperGuide.marginRight;
    const pageBottomY = pageTopY + pageHeight - paperGuide.marginBottom;
    const pageInkColor = String(page?.style?.inkColor ?? sceneSpec?.style?.inkColor ?? "#1f2a30");

    let cursorY = roundTo(pageTopY + paperGuide.marginTop, 2);
    const titleItem = orderedItems.find(isTopTitleItem) ?? null;
    if (titleItem) {
      const titleText = String(asPlainObject(titleItem?.content, {}).text ?? "").trim();
      if (titleText) {
        const titleResult = await appendTextLikeItem({
          pageIndex,
          page,
          item: titleItem,
          x: contentLeft,
          y: cursorY,
          width: contentWidth,
          height: paperGuide.linePitch * 2.2,
          text: titleText,
          syntheticKind: "scene-page-title",
          align: "left",
          fontSize: Math.min(config.fontSize * 1.04, paperGuide.linePitch * 0.92),
          minFontSize: Math.max(24, config.fontSize * 0.52),
          configPatch: {
            lineHeightPercent: 104,
            letterSpacingPercent: Math.max(0, Math.min(config.letterSpacingPercent, 0.55)),
            penWidth: config.penWidth * 1.06,
          },
        });
        if (titleResult) {
          cursorY = roundTo(titleResult.bottomY + paperGuide.rowGap, 2);
        }
      }
    }

    cursorY = roundTo(cursorY + paperGuide.sectionGap * 0.7, 2);

    const rowEntries = buildRowEntries(orderedItems);
    const firstContentEntry = rowEntries.find((entry) => entry.kind === "items") ?? null;
    const sourceRowOffset = firstContentEntry
      ? cursorY - (pageTopY + firstContentEntry.sourceTop)
      : 0;
    for (let itemIndex = 0; itemIndex < rowEntries.length; itemIndex += 1) {
      const entry = rowEntries[itemIndex];

      if (entry.kind === "divider") {
        const dividerItem = entry.item;
        const dividerWidthRatio = clamp((Number(dividerItem?.w) || contentWidth) / Math.max(contentWidth, 1), 0.32, 0.96);
        const dividerY = snapRuleY(pageTopY, cursorY + paperGuide.rowGap * 0.2);
        appendSegment(
          pageIndex,
          page,
          dividerItem,
          contentLeft,
          dividerY,
          contentLeft + contentWidth * dividerWidthRatio,
          dividerY,
          Math.max(1, config.penWidth * 0.48),
          "scene-divider",
        );
        cursorY = roundTo(dividerY + paperGuide.sectionGap * 0.84, 2);
        continue;
      }

      const sourceGuidedY = pageTopY + entry.sourceTop + sourceRowOffset;
      const rowY = roundTo(Math.max(cursorY, sourceGuidedY), 2);
      const placements = computeRowPlacements(entry.items, contentLeft, contentWidth);
      let rowHeight = 0;

      for (const placement of placements) {
        const item = placement.item;
        const content = asPlainObject(item?.content, {});
        const x = placement.x;
        const y = rowY;
        const width = Math.max(120, placement.width);
        const height = placement.height ?? Number.POSITIVE_INFINITY;

        if (item.type === "text") {
          const textValue = String(content.text ?? "").trim();
          if (textValue) {
            const textResult = await appendTextLikeItem({
              pageIndex,
              page,
              item,
              x,
              y,
              width,
              height,
              text: textValue,
              syntheticKind: "scene-text",
              align:
                String(content.align ?? "").toLowerCase() === "center" || (placements.length === 1 && textValue.length <= 38)
                  ? "center"
                  : "left",
              fontSize: Math.min(config.fontSize * 0.8, paperGuide.linePitch * 0.72),
              minFontSize: Math.max(16, config.fontSize * 0.34),
              configPatch: {
                lineHeightPercent: config.lineHeightPercent,
                letterSpacingPercent: Math.max(0, Math.min(config.letterSpacingPercent, 0.85)),
              },
            });
            rowHeight = Math.max(rowHeight, textResult ? textResult.bottomY - rowY : 0);
          }
          continue;
        }

        if (item.type === "math") {
          const mathText = normalizeRuntimeMathLatex(content.latex, content.display !== false);
          if (!mathText) {
            continue;
          }
          const mathResult = await appendTextLikeItem({
            pageIndex,
            page,
            item,
            x,
            y,
            width,
            height,
            text: mathText,
            syntheticKind: "scene-math",
            align: "center",
            fontSize: Math.min(config.fontSize * 0.72, paperGuide.linePitch * 0.76),
            minFontSize: Math.max(18, config.fontSize * 0.38),
            configPatch: {
              lineHeightPercent: 100,
              letterSpacingPercent: 0,
              penWidth: config.penWidth * 0.82,
              scribblePercent: 0,
              breathingPercent: 0,
              latexHandwritingStrength: 0,
              forceUniversalAll: false,
              preferUniversalLatinMath: true,
              preferBuiltinLatexGlyphs: false,
              preferOpenSourceLatexRenderer: true,
            },
          });
          rowHeight = Math.max(rowHeight, mathResult ? mathResult.bottomY - rowY : 0);
          continue;
        }

        if (item.type === "table") {
          const tableResult = await appendTextLikeItem({
            pageIndex,
            page,
            item,
            x,
            y,
            width,
            height,
            text: buildAsciiTableFromRows(Array.isArray(content.rows) ? content.rows : []),
            syntheticKind: "scene-table",
            fontSize: Math.min(config.fontSize * 0.62, paperGuide.linePitch * 0.62),
            minFontSize: Math.max(11, config.fontSize * 0.28),
            configPatch: {
              lineHeightPercent: 108,
              letterSpacingPercent: 0,
            },
          });
          rowHeight = Math.max(rowHeight, tableResult ? tableResult.bottomY - rowY : 0);
          continue;
        }

        if (item.type === "icon") {
          const label = content.label ? `${content.label}` : "";
          const iconText = label ? `[${content.name}] ${label}` : `[${content.name}]`;
          const iconResult = await appendTextLikeItem({
            pageIndex,
            page,
            item,
            x,
            y,
            width,
            height,
            text: iconText,
            syntheticKind: "scene-icon",
            fontSize: Math.min(config.fontSize * 0.58, paperGuide.linePitch * 0.54),
            minFontSize: Math.max(12, config.fontSize * 0.28),
          });
          rowHeight = Math.max(rowHeight, iconResult ? iconResult.bottomY - rowY : 0);
          continue;
        }

        if (item.type === "image" || item.type === "webview" || item.type === "plot") {
          const virtualItem = {
            ...item,
            x,
            y: y - pageTopY,
            w: width,
            h: placement.height ?? (Number(item?.h) || 180),
          };
          const asset = createSceneMediaAsset(virtualItem, page, pageIndex, pageTopY, pageWidth, pageHeight, itemIndex, {
            defaultInkColor: pageInkColor,
          });
          imageAssets.push(asset);
          mergedStrokes.push(
            createImageEnterStroke({
              charIndex: charIndexOffset,
              layoutBlockId: item.id,
              fromX: asset.fromX,
              fromY: asset.fromY,
              targetX: asset.x,
              targetY: asset.y,
              targetWidth: asset.width,
              targetHeight: asset.height,
              imageAssetId: asset.id,
              enter: asset.enter,
              enterDurationMs: asset.enterDurationMs,
              showBorder: asset.showBorder,
              caption: asset.caption,
            }),
          );
          mergedStrokes[mergedStrokes.length - 1].pageIndex = pageIndex;
          charIndexOffset += 1;
          itemMetas.push({
            id: item.id,
            type: item.type,
            pageId: page.id,
            x: Math.round(asset.x),
            y: Math.round(asset.y),
            width: Math.round(asset.width),
            height: Math.round(asset.height),
            strokeCount: 1,
            syntheticKind: item.type === "webview"
              ? "scene-webview-enter"
              : item.type === "plot"
                ? "scene-plot-enter"
                : "scene-image-enter",
          });
          rowHeight = Math.max(rowHeight, asset.height);
          continue;
        }

        if (item.type === "box" || item.type === "group") {
          const padding = Math.max(5, Number(content.padding) || (item.type === "box" ? 8 : 9));
          const boundedHeight = Number.isFinite(Number(item?.h)) ? Math.max(64, Number(item.h)) : height;
          const labeledResult = await appendLabeledBlockItem({
            pageIndex,
            page,
            item,
            x,
            y,
            width,
            height: boundedHeight,
            titleText: item.type === "box" ? content.label : content.title,
            bodyText: content.text,
            padding,
            titleKind: item.type === "box" ? "box-title" : "group-title",
            bodyKind: item.type === "box" ? "box-text" : "group-text",
            dividerKind: item.type === "box" ? "box-divider" : "group-divider",
            divider: content.border !== false,
          });
          rowHeight = Math.max(rowHeight, labeledResult ? labeledResult.bottomY - rowY : 0);
          continue;
        }

        if (item.type === "arrow") {
          const thickness = Math.max(1, Number(content.thickness) || config.penWidth * 0.72);
          appendSegment(pageIndex, page, item, x, y, x + width, y + paperGuide.linePitch * 0.7, thickness, "arrow-body");
          const x1 = x + width;
          const y1 = y + paperGuide.linePitch * 0.7;
          const head = Math.max(8, Number(content.headSize) || 12);
          appendSegment(pageIndex, page, item, x1, y1, x1 - head, y1 - head * 0.42, thickness, "arrow-head-left");
          appendSegment(pageIndex, page, item, x1, y1, x1 - head, y1 + head * 0.42, thickness, "arrow-head-right");
          if (content.label) {
            const labelResult = await appendTextLikeItem({
              pageIndex,
              page,
              item,
              x,
              y: y - paperGuide.linePitch * 0.78,
              width: Math.max(120, width * 0.72),
              height: paperGuide.linePitch * 1.2,
              text: String(content.label),
              syntheticKind: "arrow-label",
              fontSize: Math.max(14, config.fontSize * 0.46),
              minFontSize: 12,
            });
            rowHeight = Math.max(
              rowHeight,
              (labelResult ? labelResult.bottomY - rowY : 0) + paperGuide.linePitch * 0.86,
            );
          } else {
            rowHeight = Math.max(rowHeight, paperGuide.linePitch * 1.2);
          }
        }
      }

      rowHeight = Math.max(rowHeight, paperGuide.linePitch * 1.2);
      cursorY = roundTo(Math.min(pageBottomY, rowY + rowHeight + paperGuide.sectionGap), 2);
      if (cursorY >= pageBottomY - paperGuide.linePitch) {
        cursorY = pageBottomY - paperGuide.linePitch;
      }
    }
  }

  return {
    plan: {
      width: Math.ceil(pageWidth),
      height: Math.ceil(sceneSpec.pages.length * pageHeight + Math.max(0, sceneSpec.pages.length - 1) * PAGE_GAP),
      strokes: mergedStrokes,
      images: imageAssets,
      missingChars: Array.from(counters.missingChars),
      hanziSourceCounts: counters.hanziSourceCounts,
      universalGlyphCounts: counters.universalGlyphCounts,
      strokeCount: mergedStrokes.length,
    },
    meta: {
      pageWidth,
      pageHeight,
      pageCount: sceneSpec.pages.length,
      pageGap: PAGE_GAP,
      paperGuide,
      itemMetas,
      rawTextLength,
      planInputLength,
      latexEnabled,
      latexAutoDetected,
      documentLayoutMode,
      effectiveDocumentLayoutMode,
    },
  };
}

function clonePlain(value) {
  return JSON.parse(JSON.stringify(value));
}

function trimPoint(point) {
  return {
    x: roundTo(point?.x, 2),
    y: roundTo(point?.y, 2),
  };
}

function trimImageEnter(imageEnter) {
  if (!imageEnter || typeof imageEnter !== "object") {
    return null;
  }
  return {
    fromX: roundTo(imageEnter.fromX, 2),
    fromY: roundTo(imageEnter.fromY, 2),
    toX: roundTo(imageEnter.toX, 2),
    toY: roundTo(imageEnter.toY, 2),
    width: roundTo(imageEnter.width, 2),
    height: roundTo(imageEnter.height, 2),
    enter: String(imageEnter.enter ?? "pull-right"),
    durationMs: roundTo(imageEnter.durationMs, 2),
    showBorder: imageEnter.showBorder !== false,
    caption: String(imageEnter.caption ?? ""),
  };
}

function trimPlaybackStroke(stroke) {
  return {
    category: String(stroke?.category ?? "other"),
    charIndex: Number.isFinite(stroke?.charIndex) ? Math.round(stroke.charIndex) : 0,
    charX: Number.isFinite(stroke?.charX) ? roundTo(stroke.charX, 2) : null,
    charY: Number.isFinite(stroke?.charY) ? roundTo(stroke.charY, 2) : null,
    charFontSize: Number.isFinite(stroke?.charFontSize) ? roundTo(stroke.charFontSize, 2) : null,
    outlineX: Number.isFinite(stroke?.outlineX) ? roundTo(stroke.outlineX, 2) : null,
    outlineY: Number.isFinite(stroke?.outlineY) ? roundTo(stroke.outlineY, 2) : null,
    width: roundTo(stroke?.width, 2),
    length: roundTo(stroke?.length, 2),
    durationMs: roundTo(stroke?.durationMs, 2),
    pauseAfterMs: roundTo(stroke?.pauseAfterMs, 2),
    syntheticKind: stroke?.syntheticKind ? String(stroke.syntheticKind) : null,
    points: Array.isArray(stroke?.points) ? stroke.points.map(trimPoint) : [],
    isImageEnter: stroke?.isImageEnter === true,
    imageAssetId: stroke?.imageAssetId ? String(stroke.imageAssetId) : null,
    imageEnter: trimImageEnter(stroke?.imageEnter),
    isBitmapReveal: stroke?.isBitmapReveal === true,
    revealRect:
      stroke?.revealRect && typeof stroke.revealRect === "object"
        ? {
            x: roundTo(stroke.revealRect.x, 2),
            y: roundTo(stroke.revealRect.y, 2),
            width: roundTo(stroke.revealRect.width, 2),
            height: roundTo(stroke.revealRect.height, 2),
          }
        : null,
    easeInPower: roundTo(stroke?.easeInPower, 3),
    easeOutPower: roundTo(stroke?.easeOutPower, 3),
    easeMidBias: roundTo(stroke?.easeMidBias, 3),
    microHolds: Array.isArray(stroke?.microHolds)
      ? stroke.microHolds.map((hold) => ({
          at: roundTo(hold?.at, 3),
          width: roundTo(hold?.width, 3),
          depth: roundTo(hold?.depth, 3),
        }))
      : [],
  };
}

function trimPlaybackImage(image) {
  return {
    id: String(image?.id ?? ""),
    assetType: String(image?.assetType ?? "image"),
    pageIndex: Number.isFinite(image?.pageIndex) ? Math.round(image.pageIndex) : 0,
    x: roundTo(image?.x, 2),
    y: roundTo(image?.y, 2),
    width: roundTo(image?.width, 2),
    height: roundTo(image?.height, 2),
    fit: String(image?.fit ?? "contain"),
    align: String(image?.align ?? "center"),
    showBorder: image?.showBorder !== false,
    caption: String(image?.caption ?? ""),
    fallbackLabel: String(image?.fallbackLabel ?? ""),
    promptText: String(image?.promptText ?? ""),
    status: String(image?.status ?? "placeholder"),
    enter: String(image?.enter ?? "pull-right"),
    enterDurationMs: roundTo(image?.enterDurationMs, 2),
  };
}

function enrichPageForPlayback(pagePlan, style) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(320, Number(pagePlan?.width) || 1240);
  canvas.height = Math.max(320, Number(pagePlan?.height) || 1754);
  const player = new StrokePlayer(canvas);
  player.setPlan(pagePlan, style);
  const playbackStrokes = player.strokes.map(trimPlaybackStroke);
  const playbackDurationMs = playbackStrokes.reduce(
    (sum, stroke) => sum + (Number(stroke?.durationMs) || 0) + (Number(stroke?.pauseAfterMs) || 0),
    0,
  );

  return {
    ...clonePlain(pagePlan),
    strokes: playbackStrokes,
    images: Array.isArray(pagePlan?.images) ? pagePlan.images.map(trimPlaybackImage) : [],
    playbackDurationMs: roundTo(playbackDurationMs, 3),
  };
}

export async function buildRuntimeSceneExport(sceneSpec, options = {}) {
  const validation = validateSceneSpecV1(sceneSpec);
  const normalizedScene = validation.ok && validation.spec ? validation.spec : normalizeSceneSpecLoose(sceneSpec);
  const runtimeFontSources = {
    ...DEFAULT_RUNTIME_FONT_SOURCES,
    ...asPlainObject(options.fontSources, {}),
  };
  const fontSession = await createFontSession(runtimeFontSources);
  const config = resolveRuntimeConfig({
    ...asPlainObject(normalizedScene.style, {}),
    ...asPlainObject(options.config, {}),
    forceUniversalAll: options.forceUniversalAll ?? false,
    preferUniversalLatinMath: options.preferUniversalLatinMath ?? false,
    allowRemoteHanzi: options.allowRemoteHanzi ?? false,
  });
  const {controls, style} = createRenderStyle(config, options);
  const {plan, meta} = await buildPlanFromSceneSpec(normalizedScene, {
    config,
    universalFontMapper: fontSession?.universalFontMapper ?? null,
  });

  const pageSpec = {
    width: meta.pageWidth,
    height: meta.pageHeight,
    pageGap: PAGE_GAP,
  };
  const pagedPlans = paginatePlan(plan, pageSpec);
  const playbackPages = pagedPlans.map((pagePlan) => enrichPageForPlayback(pagePlan, style));
  const totalPlaybackDurationMs = playbackPages.reduce(
    (sum, page) => sum + (Number(page.playbackDurationMs) || 0),
    0,
  );

  return {
    createdAt: new Date().toISOString(),
    scene: {
      meta: normalizedScene.meta ?? {},
      page: normalizedScene.page,
      pageCount: normalizedScene.pages.length,
      pageIds: normalizedScene.pages.map((page) => page.id),
      validationWarnings: validation.ok ? [] : validation.errors ?? [],
    },
    fontSources: runtimeFontSources,
    fontSession: {
      displayName: String(fontSession?.displayName ?? ""),
      hasUniversalFontMapper: Boolean(fontSession?.universalFontMapper),
    },
    config,
    renderControls: controls,
    renderStyle: clonePlain(style),
    pageSpec,
    pageGap: PAGE_GAP,
    strokeCount: plan.strokeCount,
    missingChars: plan.missingChars,
    hanziSourceCounts: plan.hanziSourceCounts,
    universalGlyphCounts: plan.universalGlyphCounts,
    totalPlaybackDurationMs: roundTo(totalPlaybackDurationMs, 3),
    meta,
    pages: playbackPages,
  };
}
