function distance(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.hypot(dx, dy);
}

function polylineLength(points) {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += distance(points[i - 1], points[i]);
  }
  return total;
}

function sharpTurnCount(points) {
  if (points.length < 3) {
    return 0;
  }

  let count = 0;
  for (let i = 1; i < points.length - 1; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    const c = points[i + 1];
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const bcx = c.x - b.x;
    const bcy = c.y - b.y;
    const ab = Math.hypot(abx, aby);
    const bc = Math.hypot(bcx, bcy);
    if (ab < 0.001 || bc < 0.001) {
      continue;
    }
    const dot = (abx * bcx + aby * bcy) / (ab * bc);
    const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
    if (angle > 0.75) {
      count += 1;
    }
  }
  return count;
}

function mulberry32(seed) {
  let t = seed + 0x6d2b79f5;
  return function random() {
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function jitterPoints(points, amount, seed) {
  if (amount <= 0) {
    return points;
  }

  const random = mulberry32(seed);
  return points.map((point, index) => {
    if (index === 0 || index === points.length - 1) {
      return point;
    }
    return {
      x: point.x + (random() - 0.5) * amount,
      y: point.y + (random() - 0.5) * amount,
    };
  });
}

function transformStrokePoints(points, options = {}) {
  if (!Array.isArray(points) || points.length < 2) {
    return points;
  }
  const rotate = Number(options.rotateRad) || 0;
  const scaleX = Number(options.scaleX) || 1;
  const scaleY = Number(options.scaleY) || 1;
  const shiftX = Number(options.shiftX) || 0;
  const shiftY = Number(options.shiftY) || 0;

  if (
    Math.abs(rotate) < 0.00001 &&
    Math.abs(scaleX - 1) < 0.00001 &&
    Math.abs(scaleY - 1) < 0.00001 &&
    Math.abs(shiftX) < 0.00001 &&
    Math.abs(shiftY) < 0.00001
  ) {
    return points;
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const point of points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }
  const cx = (minX + maxX) * 0.5;
  const cy = (minY + maxY) * 0.5;
  const cos = Math.cos(rotate);
  const sin = Math.sin(rotate);

  return points.map((point) => {
    const ox = (point.x - cx) * scaleX;
    const oy = (point.y - cy) * scaleY;
    const rx = ox * cos - oy * sin;
    const ry = ox * sin + oy * cos;
    return {
      x: cx + rx + shiftX,
      y: cy + ry + shiftY,
    };
  });
}

function chaikinSmooth(points, passes = 1) {
  if (!Array.isArray(points) || points.length < 3 || passes <= 0) {
    return points;
  }

  let refined = points;
  for (let pass = 0; pass < passes; pass += 1) {
    if (refined.length < 3) {
      break;
    }
    const next = [refined[0]];
    for (let i = 0; i < refined.length - 1; i += 1) {
      const p = refined[i];
      const q = refined[i + 1];
      next.push({
        x: p.x * 0.75 + q.x * 0.25,
        y: p.y * 0.75 + q.y * 0.25,
      });
      next.push({
        x: p.x * 0.25 + q.x * 0.75,
        y: p.y * 0.25 + q.y * 0.75,
      });
    }
    next.push(refined[refined.length - 1]);
    refined = next;
  }
  return refined;
}

function smoothRenderPoints(points, category, isUniversalGlyph = false) {
  if (!Array.isArray(points) || points.length < 3) {
    return points;
  }
  if (category === "han") {
    return points;
  }
  if (isUniversalGlyph && category !== "latin") {
    return points;
  }
  if (isUniversalGlyph && category === "latin") {
    return chaikinSmooth(points, 1);
  }
  const passes = category === "math" ? 1 : 2;
  return chaikinSmooth(points, passes);
}

function drawPolyline(ctx, points) {
  if (points.length < 2) {
    return null;
  }

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
  return points[points.length - 1];
}

function drawCompletedStroke(ctx, stroke) {
  drawPolyline(ctx, stroke.points);
}

function drawPartialPolyline(ctx, points, lengthLimit) {
  if (points.length < 2 || lengthLimit <= 0) {
    return points[0] ?? null;
  }

  let consumed = 0;
  let tip = points[0];

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i += 1) {
    const from = points[i - 1];
    const to = points[i];
    const segmentLength = distance(from, to);

    if (consumed + segmentLength <= lengthLimit) {
      consumed += segmentLength;
      ctx.lineTo(to.x, to.y);
      tip = to;
      continue;
    }

    const remain = lengthLimit - consumed;
    const ratio = Math.max(0, Math.min(1, remain / segmentLength));
    const x = from.x + (to.x - from.x) * ratio;
    const y = from.y + (to.y - from.y) * ratio;
    ctx.lineTo(x, y);
    tip = { x, y };
    break;
  }

  ctx.stroke();
  return tip;
}

function applyMicroHolds(progress, microHolds) {
  if (!Array.isArray(microHolds) || microHolds.length === 0) {
    return progress;
  }

  let adjusted = progress;
  for (const hold of microHolds) {
    const at = hold.at ?? 0.5;
    const width = Math.max(0.015, hold.width ?? 0.06);
    const depth = Math.max(0, Math.min(0.9, hold.depth ?? 0.2));
    const delta = adjusted - at;
    const distanceFromHold = Math.abs(delta);
    if (distanceFromHold >= width) {
      continue;
    }
    const pull = 1 - distanceFromHold / width;
    adjusted = at + delta * (1 - depth * pull);
  }

  return Math.max(0, Math.min(1, adjusted));
}

function easeProgress(raw, stroke) {
  const t = Math.max(0, Math.min(1, raw));
  if (t <= 0 || t >= 1) {
    return t;
  }

  const midBias = Math.max(-0.32, Math.min(0.32, stroke?.easeMidBias ?? 0));
  const warpedT = Math.max(0, Math.min(1, t + midBias * t * (1 - t)));
  const easeInPower = Math.max(1.05, stroke?.easeInPower ?? 1.7);
  const easeOutPower = Math.max(1.05, stroke?.easeOutPower ?? 1.6);
  const head = Math.pow(warpedT, easeInPower);
  const tail = Math.pow(1 - warpedT, easeOutPower);
  const blended = head / (head + tail);
  return applyMicroHolds(blended, stroke?.microHolds);
}

function clampNumber(value, min, max, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, numeric));
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

function isImageEnterStroke(stroke) {
  return stroke?.syntheticKind === "image-enter" && stroke?.imageEnter && typeof stroke.imageEnter === "object";
}

function isBitmapRevealStroke(stroke) {
  if (stroke?.syntheticKind !== "bitmap-reveal") {
    return false;
  }
  const rect = stroke?.revealRect;
  if (!rect || typeof rect !== "object") {
    return false;
  }
  return (
    Number.isFinite(Number(rect.x)) &&
    Number.isFinite(Number(rect.y)) &&
    Number.isFinite(Number(rect.width)) &&
    Number.isFinite(Number(rect.height))
  );
}

const DEFAULT_STYLE = {
  inkColor: "#1d2527",
  thickness: 1,
  jitter: 0,
  humanize: 0.12,
  scribbleLevel: 0.04,
  breathingAmount: 0.04,
  breathingAmplitude: 0.0035,
  breathingPeriodMs: 5400,
  breathingSpeedSwing: 0.008,
  baselineDrift: 0.0015,
  layoutDensity: 0.78,
  structureAwareness: 0.78,
  speedPxPerSec: 165,
  speedVariation: 0.14,
  strokePauseMs: 30,
  charPauseMs: 84,
  staticGuideVisible: true,
  staticGuideAlpha: 0.34,
  liveLectureMode: true,
};

export class StrokePlayer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.logicalWidth = Number(canvas.getAttribute("width")) || 1400;
    this.logicalHeight = Number(canvas.getAttribute("height")) || 840;

    this.style = { ...DEFAULT_STYLE };
    this.strokes = [];
    this.strokeIndex = 0;
    this.strokeElapsedMs = 0;
    this.running = false;
    this.paused = false;
    this.lastTimestamp = 0;
    this.frameId = null;
    this.onFinish = null;
    this.renderSeed = 0;
    this.staticBitmap = null;
    this.imageAssets = [];
    this.imageAssetById = new Map();
    this.imageEnterIndexByAssetId = new Map();
    this.imageCache = new Map();
  }

  setPlan(plan, style) {
    const planWidth = Number(plan?.width);
    const planHeight = Number(plan?.height);
    if (Number.isFinite(planWidth) && Number.isFinite(planHeight)) {
      this.logicalWidth = Math.max(360, Math.ceil(planWidth));
      this.logicalHeight = Math.max(360, Math.ceil(planHeight));
      this.canvas.width = this.logicalWidth;
      this.canvas.height = this.logicalHeight;
      this.canvas.setAttribute("width", String(this.logicalWidth));
      this.canvas.setAttribute("height", String(this.logicalHeight));
    }

    this.style = {
      ...DEFAULT_STYLE,
      ...(style ?? {}),
    };
    this.staticBitmap = plan?.staticBitmap ?? null;
    const sourceImages = Array.isArray(plan?.images) ? plan.images : [];
    this.imageAssets = sourceImages.map((asset) => {
      const x = Number(asset?.x);
      const y = Number(asset?.y);
      const width = Number(asset?.width);
      const height = Number(asset?.height);
      return {
        ...asset,
        x: Number.isFinite(x) ? x : 0,
        y: Number.isFinite(y) ? y : 0,
        width: Number.isFinite(width) ? Math.max(1, width) : 1,
        height: Number.isFinite(height) ? Math.max(1, height) : 1,
        fit: normalizeImageFit(asset?.fit),
        align: normalizeImageAlign(asset?.align),
        showBorder: asset?.showBorder !== false,
        caption: String(asset?.caption ?? ""),
        fallbackLabel: String(asset?.fallbackLabel ?? asset?.path ?? asset?.id ?? "image"),
      };
    });
    this.imageAssetById = new Map();
    for (const asset of this.imageAssets) {
      const assetId = String(asset?.id ?? "").trim();
      if (assetId) {
        this.imageAssetById.set(assetId, asset);
      }
    }
    this.imageEnterIndexByAssetId.clear();
    this.imageCache.clear();

    const jitter = this.style.jitter ?? 0;
    const humanize = Math.max(0, Math.min(1, this.style.humanize ?? DEFAULT_STYLE.humanize));
    const scribbleLevel = clampNumber(
      this.style.scribbleLevel,
      0,
      1,
      DEFAULT_STYLE.scribbleLevel,
    );
    const renderSeed =
      Number.isFinite(this.style.renderSeed) && this.style.renderSeed > 0
        ? Math.floor(this.style.renderSeed)
        : Math.floor(Date.now() % 1000000000);
    this.renderSeed = renderSeed;
    const baseSpeed = Math.max(24, this.style.speedPxPerSec ?? DEFAULT_STYLE.speedPxPerSec);
    const documentLayoutMode = Boolean(this.style.documentLayoutMode);
    const boardLectureMode = Boolean(this.style.boardLectureMode);
    const cleanBoardMode = Boolean(this.style.cleanBoardMode || boardLectureMode);
    const speedVariation = Math.max(
      cleanBoardMode ? 0.008 : 0.02,
      this.style.speedVariation ?? DEFAULT_STYLE.speedVariation,
    );
    const breathingAmplitude = clampNumber(
      this.style.breathingAmplitude,
      0,
      0.08,
      DEFAULT_STYLE.breathingAmplitude,
    );
    const breathingSpeedSwing = clampNumber(
      this.style.breathingSpeedSwing,
      0,
      0.2,
      DEFAULT_STYLE.breathingSpeedSwing,
    );
    const baselineDrift = clampNumber(
      this.style.baselineDrift,
      0,
      0.08,
      DEFAULT_STYLE.baselineDrift,
    );
    const lockStaticAlignment = Boolean(this.style.lockStaticAlignment);
    const lectureMode = this.style.liveLectureMode !== false;
    const motionDamp = lectureMode ? (cleanBoardMode ? 0.16 : 0.56) : 1;
    const transformDamp = lectureMode ? (cleanBoardMode ? 0.1 : 0.44) : 1;
    const speedVariationDamp = lectureMode ? (cleanBoardMode ? 0.24 : 0.62) : 1;
    const widthVariationDamp = lectureMode ? (cleanBoardMode ? 0.14 : 0.35) : 1;
    const pauseScale = lectureMode ? (cleanBoardMode ? 0.98 : 0.92) : 1;
    const strokePauseBase = Math.max(
      documentLayoutMode ? 4 : 8,
      this.style.strokePauseMs ?? DEFAULT_STYLE.strokePauseMs,
    );
    const charPauseBase = Math.max(
      documentLayoutMode ? 8 : 10,
      this.style.charPauseMs ?? DEFAULT_STYLE.charPauseMs,
    );
    const sourceStrokes = Array.isArray(plan?.strokes) ? plan.strokes : [];

    this.strokes = sourceStrokes.map((stroke, index, allStrokes) => {
      if (isImageEnterStroke(stroke)) {
        const imageEnter = stroke.imageEnter;
        const width = Math.max(1, Number(imageEnter.width) || 120);
        const height = Math.max(1, Number(imageEnter.height) || 90);
        const fromX = clampNumber(imageEnter.fromX, -this.logicalWidth * 3, this.logicalWidth * 3, 0);
        const fromY = clampNumber(imageEnter.fromY, -this.logicalHeight * 3, this.logicalHeight * 3, 0);
        const toX = clampNumber(imageEnter.toX, -this.logicalWidth * 3, this.logicalWidth * 3, fromX);
        const toY = clampNumber(imageEnter.toY, -this.logicalHeight * 3, this.logicalHeight * 3, fromY);
        const centerPoints = [
          { x: fromX + width * 0.5, y: fromY + height * 0.5 },
          { x: toX + width * 0.5, y: toY + height * 0.5 },
        ];
        const durationMs = clampNumber(imageEnter.durationMs, 80, 5000, 700);
        const pauseAfterMs = Math.max(0, strokePauseBase * 0.26);
        return {
          ...stroke,
          category: "other",
          points: centerPoints,
          width: Math.max(1, (Number(stroke.width) || 1.8) * this.style.thickness),
          length: Math.max(1, polylineLength(centerPoints)),
          durationMs,
          pauseAfterMs,
          imageEnter: {
            ...imageEnter,
            fromX,
            fromY,
            toX,
            toY,
            width,
            height,
            enter: String(imageEnter.enter ?? "pull-right").toLowerCase(),
            showBorder: imageEnter.showBorder !== false,
            caption: String(imageEnter.caption ?? ""),
          },
          isImageEnter: true,
          isUniversalGlyph: false,
          easeInPower: 1.08,
          easeOutPower: 1.08,
          easeMidBias: 0,
          microHolds: [],
        };
      }
      if (isBitmapRevealStroke(stroke)) {
        const rect = stroke.revealRect;
        const revealX = Number(rect.x);
        const revealY = Number(rect.y);
        const revealWidth = Math.max(1, Number(rect.width) || 1);
        const revealHeight = Math.max(1, Number(rect.height) || 1);
        const points = [
          { x: revealX, y: revealY + revealHeight * 0.5 },
          { x: revealX + revealWidth, y: revealY + revealHeight * 0.5 },
        ];
        const length = Math.max(1, revealWidth);
        const durationMs = Math.max(
          documentLayoutMode ? 16 : 42,
          (length / Math.max(20, baseSpeed * 0.96)) * 1000,
        );
        const pauseAfterMs = Math.max(0, strokePauseBase * 0.18 + charPauseBase * 0.16);
        return {
          ...stroke,
          category: "math",
          points,
          width: Math.max(1, (Number(stroke.width) || 1.6) * this.style.thickness),
          length,
          durationMs,
          pauseAfterMs,
          revealRect: {
            x: revealX,
            y: revealY,
            width: revealWidth,
            height: revealHeight,
          },
          isBitmapReveal: true,
          isUniversalGlyph: false,
          easeInPower: 1.06,
          easeOutPower: 1.06,
          easeMidBias: 0,
          microHolds: [],
        };
      }
      const random = mulberry32(
        (index + 1) * 97531 + (stroke.charIndex ?? 0) * 104729 + renderSeed,
      );
      const category = stroke.category ?? "other";
      const isUniversalGlyph = Boolean(stroke.isUniversalGlyph);
      const universalLatin = isUniversalGlyph && category === "latin";
      const layoutLocked = Boolean(stroke.layoutLocked);
      const cleanBoardPrecisionLock =
        cleanBoardMode && documentLayoutMode && (category === "math" || isUniversalGlyph);
      const effectiveLocked = layoutLocked || lockStaticAlignment || cleanBoardPrecisionLock;
      const lockedMathMicro =
        effectiveLocked && category === "math"
          ? clampNumber(stroke?.mathMicroVariance, 0, 0.35, 0.1)
          : 0;
      const strokeHumanize = effectiveLocked
        ? category === "math"
          ? humanize * (cleanBoardMode ? 0.0015 : 0.01)
          : humanize * (cleanBoardMode ? 0.008 + scribbleLevel * 0.02 : 0.02 + scribbleLevel * 0.05)
        : cleanBoardMode
          ? Math.min(0.08, humanize * (0.16 + scribbleLevel * 0.08) + scribbleLevel * 0.02)
          : Math.min(1, humanize * (0.68 + scribbleLevel * 0.46) + scribbleLevel * 0.05);
      const charScale = Math.max(10, stroke.charFontSize ?? 20);
      const breathingPhase =
        ((stroke.charIndex ?? 0) * 0.41 + index * 0.11 + (renderSeed % 4096) * 0.0009) * Math.PI;
      const breathingShiftX =
        cleanBoardMode || (category === "math" && effectiveLocked)
          ? 0
          : Math.cos(breathingPhase * 0.7) * charScale * breathingAmplitude * 0.04;
      const breathingShiftY =
        cleanBoardMode || (category === "math" && effectiveLocked)
          ? 0
          : Math.sin(breathingPhase) * charScale * breathingAmplitude * 0.18 +
            Math.cos(breathingPhase * 0.45) * charScale * baselineDrift * 0.16;
      const jitterAmount =
        effectiveLocked
          ? category === "math"
            ? 0
            : jitter * charScale * 0.0016 * scribbleLevel
          : isUniversalGlyph
          ? category === "latin"
            ? jitter * charScale * (documentLayoutMode ? 0.009 : 0.012) * (1 + strokeHumanize * 0.38)
            : 0
          : category === "han"
          ? jitter * charScale * (documentLayoutMode ? 0.028 : 0.034) * (1 + strokeHumanize * 1.06)
          : category === "latin"
            ? jitter * charScale * (documentLayoutMode ? 0.009 : 0.012) * (1 + strokeHumanize * 0.46)
          : category === "math"
            ? jitter * charScale * (documentLayoutMode ? 0.006 : 0.008) * (1 + strokeHumanize * 0.3)
            : jitter * charScale * 0.01 * (1 + strokeHumanize * 0.32);
      const tunedJitterAmount =
        jitterAmount * motionDamp * (cleanBoardMode ? (effectiveLocked ? 0.12 : 0.28) : 1);
      const jittered = jitterPoints(
        stroke.points,
        tunedJitterAmount,
        (index + 1) * 97531 + renderSeed * 13,
      );
      const transformed = effectiveLocked && category !== "math"
        ? scribbleLevel <= 0.001
          ? jittered
          : transformStrokePoints(jittered, {
              rotateRad: (random() - 0.5) * (cleanBoardMode ? 0.008 : 0.024) * scribbleLevel * transformDamp,
              scaleX: 1 + (random() - 0.5) * (cleanBoardMode ? 0.003 : 0.01) * scribbleLevel * transformDamp,
              scaleY: 1 + (random() - 0.5) * (cleanBoardMode ? 0.003 : 0.01) * scribbleLevel * transformDamp,
              shiftX: (random() - 0.5) * charScale * (cleanBoardMode ? 0.0012 : 0.004) * scribbleLevel * transformDamp,
              shiftY: (random() - 0.5) * charScale * (cleanBoardMode ? 0.0018 : 0.006) * scribbleLevel * transformDamp,
            })
        : transformStrokePoints(jittered, {
            rotateRad:
              (random() - 0.5) *
              (cleanBoardMode ? 0.06 : 0.22) *
              strokeHumanize *
              transformDamp *
              (effectiveLocked ? 0.28 : 1),
            scaleX:
              1 +
              (random() - 0.5) *
                (cleanBoardMode ? 0.02 : 0.08) *
                strokeHumanize *
                transformDamp *
                (effectiveLocked ? 0.32 : 1),
            scaleY:
              1 +
              (random() - 0.5) *
                (cleanBoardMode ? 0.018 : 0.07) *
                strokeHumanize *
                transformDamp *
                (effectiveLocked ? 0.32 : 1),
            shiftX:
              (random() - 0.5) *
              charScale *
              (cleanBoardMode ? 0.01 : 0.035) *
              strokeHumanize *
              transformDamp *
              (effectiveLocked ? 0.28 : 1) +
              breathingShiftX,
            shiftY:
              (random() - 0.5) *
              charScale *
              (cleanBoardMode ? 0.016 : 0.065) *
              strokeHumanize *
              transformDamp *
              (effectiveLocked ? 0.28 : 1) +
              breathingShiftY,
          });
      const points = effectiveLocked && category !== "math"
        ? transformed
        : smoothRenderPoints(transformed, category, isUniversalGlyph);
      const categorySpeedFactor =
        category === "han"
          ? 0.92
          : category === "latin"
            ? 1.0
            : category === "math"
              ? 1.02
              : 1;
      const scriptSpeedFactor = stroke.isScript ? 1.16 : 1;
      const categorySpeedVariation =
        speedVariation *
        speedVariationDamp *
        (1 + strokeHumanize * (cleanBoardMode ? 0.08 : 0.28)) *
        (category === "han"
          ? 1.36
          : category === "latin"
            ? universalLatin
              ? 1.02
              : 0.5
            : category === "math"
              ? 0.82
              : 1);
      const randomSpeedFactor = 1 + (random() - 0.5) * categorySpeedVariation * 2;
      const length = polylineLength(points);
      const turns = sharpTurnCount(points);
      const turnPenaltyMs = turns * (category === "han" ? 14 : 8);
      const effectiveSpeed = Math.max(
        20,
        baseSpeed *
          categorySpeedFactor *
          scriptSpeedFactor *
          randomSpeedFactor *
          (1 + Math.sin(breathingPhase * 0.9) * breathingSpeedSwing),
      );
      const durationFloor = documentLayoutMode
        ? category === "han"
          ? 36
          : 22
        : category === "han"
          ? 92
          : 62;
      const humanizedDurationFactor = cleanBoardMode
        ? 0.99 + random() * (universalLatin ? 0.04 : 0.05)
        : universalLatin
          ? 0.88 + random() * 0.32
          : 0.96 + random() * (0.08 + strokeHumanize * 0.22);
      const durationMs = Math.max(
        durationFloor,
        ((length / effectiveSpeed) * 1000 + turnPenaltyMs) * humanizedDurationFactor,
      );
      const nextStroke = allStrokes[index + 1];
      const sameCharNext = nextStroke && nextStroke.charIndex === stroke.charIndex;
      const strokePauseScale = documentLayoutMode ? 0.36 : 1;
      const strokePauseMs =
        strokePauseBase *
        (0.62 + random() * 0.84) *
        strokePauseScale *
        pauseScale *
        (1 + Math.abs(Math.sin(breathingPhase * 0.8)) * breathingSpeedSwing * 0.5);
      const charPauseScale = cleanBoardMode
        ? category === "han"
          ? 0.82 + random() * 0.28
          : category === "latin"
            ? universalLatin
              ? 0.88 + random() * 0.12
              : 0.86 + random() * 0.16
            : 0.84 + random() * 0.2
        : category === "han"
          ? 0.64 + random() * 0.96
          : category === "latin"
            ? universalLatin
              ? 0.72 + random() * 0.58
              : 0.76 + random() * 0.42
            : 0.68 + random() * 0.64;
      const charPauseMs = sameCharNext
        ? 0
        : charPauseBase *
          charPauseScale *
          (documentLayoutMode ? 0.42 : 1) *
          pauseScale *
          (1 + Math.abs(Math.cos(breathingPhase * 0.74)) * breathingSpeedSwing * 0.65);
      const widthVariation = cleanBoardMode
        ? category === "han"
          ? 0.94 + random() * (0.08 + strokeHumanize * 0.06)
          : category === "latin"
            ? 0.98 + random() * (0.04 + strokeHumanize * 0.04)
            : 0.96 + random() * (0.06 + strokeHumanize * 0.05)
        : category === "han"
          ? 0.74 + random() * (0.48 + strokeHumanize * 0.26)
          : category === "latin"
            ? 0.94 + random() * (0.1 + strokeHumanize * 0.08)
            : 0.9 + random() * (0.2 + strokeHumanize * 0.08);
      const effectiveWidthVariation =
        effectiveLocked
           ? 1 + scribbleLevel * (cleanBoardMode ? 0.004 : 0.015)
          : universalLatin
          ? cleanBoardMode
            ? 0.98 + random() * 0.04
            : 0.9 + random() * 0.2
          : isUniversalGlyph
            ? 1
            : widthVariation;
      const tunedWidthVariation = 1 + (effectiveWidthVariation - 1) * widthVariationDamp;
      const charFontSize = Number(stroke.charFontSize) || charScale;
      const tinyScriptGlyph =
        Boolean(stroke.isScript) ||
        (category === "math" && Number.isFinite(charFontSize) && charFontSize < 20);
      const minRenderableWidth = tinyScriptGlyph
        ? 0.54
        : category === "latin"
          ? 0.72
          : category === "math"
            ? 0.74
            : 0.86;
      const easeInPower =
        (category === "han" ? 1.35 : category === "latin" ? (universalLatin ? 1.06 : 1.12) : 1.15) +
        random() * (category === "latin" ? (universalLatin ? 0.34 : 0.26) : 0.82) +
        (turns > 1 ? 0.12 : 0);
      const easeOutPower =
        (category === "han" ? 1.25 : category === "latin" ? (universalLatin ? 1.04 : 1.08) : 1.1) +
        random() * (category === "latin" ? (universalLatin ? 0.38 : 0.3) : 0.88) +
        (turns > 2 ? 0.2 : 0);
      const easeMidBias =
        (random() - 0.5) * (category === "han" ? 0.24 : category === "latin" ? (universalLatin ? 0.11 : 0.06) : 0.14) * (cleanBoardMode ? 0.18 : motionDamp) +
        (turns > 2 ? -0.04 : 0.02);
      const microHoldCountBase =
        effectiveLocked
          ? 0
          : length > Math.max(24, (stroke.charFontSize ?? 0) * 0.26)
          ? category === "han"
            ? Math.min(3, 1 + Math.floor(random() * 3))
            : category === "latin"
              ? universalLatin
                ? Math.min(3, 1 + Math.floor(random() * 3))
                : Math.min(1, Math.floor(random() * 2))
              : Math.min(2, Math.floor(random() * 3))
          : 0;
      const microHoldCount = cleanBoardMode
        ? 0
        : lectureMode
        ? Math.min(1, Math.floor(microHoldCountBase * 0.5))
        : microHoldCountBase;
      const microHolds = [];
      for (let holdIndex = 0; holdIndex < microHoldCount; holdIndex += 1) {
        microHolds.push({
          at: 0.28 + random() * 0.52,
          width: 0.04 + random() * 0.05,
          depth:
            (category === "han" ? 0.18 : category === "latin" ? (universalLatin ? 0.1 : 0.08) : 0.11) +
            random() * (category === "han" ? 0.17 : category === "latin" ? (universalLatin ? 0.08 : 0.05) : 0.1) *
              (lectureMode ? 0.7 : 1),
        });
      }

      return {
        ...stroke,
        char: stroke.char,
        category,
        points,
        width: Math.max(
          minRenderableWidth,
          (Number(stroke.width) || 1) * this.style.thickness * tunedWidthVariation,
        ),
        length,
        durationMs,
        pauseAfterMs: strokePauseMs + charPauseMs,
        outlinePathData: stroke.outlinePathData ?? null,
        outlinePathScale: stroke.outlinePathScale ?? 1024,
        outlineX: stroke.outlineX ?? 0,
        outlineY: stroke.outlineY ?? 0,
        outlineSize: stroke.outlineSize ?? 0,
        charX: stroke.charX ?? 0,
        charY: stroke.charY ?? 0,
        charFontSize: stroke.charFontSize ?? 0,
        charAdvance: stroke.charAdvance ?? 0.9,
        easeInPower,
        easeOutPower,
        easeMidBias,
        microHolds,
        isUniversalGlyph,
      };
    });

    for (let index = 0; index < this.strokes.length; index += 1) {
      const stroke = this.strokes[index];
      if (!stroke?.isImageEnter) {
        continue;
      }
      const imageAssetId = String(stroke?.imageAssetId ?? "").trim();
      if (imageAssetId) {
        this.imageEnterIndexByAssetId.set(imageAssetId, index);
      }
    }

    this.reset();
    this.draw();
  }

  resolveImageAsset(imageAssetId, imageEnter = null) {
    const key = String(imageAssetId ?? "").trim();
    const fromMap = key ? this.imageAssetById.get(key) ?? null : null;
    const labelCandidate =
      fromMap?.fallbackLabel ??
      imageEnter?.caption ??
      imageEnter?.path ??
      key ??
      "image";
    const fallbackLabel = String(labelCandidate || "image").trim().slice(0, 72);
    return {
      id: key || fromMap?.id || "",
      dataUrl: fromMap?.dataUrl ?? null,
      path: fromMap?.path ?? "",
      fit: normalizeImageFit(fromMap?.fit ?? imageEnter?.fit),
      align: normalizeImageAlign(fromMap?.align ?? imageEnter?.align),
      showBorder: (imageEnter?.showBorder ?? fromMap?.showBorder) !== false,
      caption: String(imageEnter?.caption ?? fromMap?.caption ?? ""),
      fallbackLabel,
    };
  }

  ensureImageNode(asset) {
    if (typeof Image === "undefined") {
      return null;
    }
    const dataUrl = String(asset?.dataUrl ?? "").trim();
    if (!dataUrl || !/^data:image\//i.test(dataUrl)) {
      return null;
    }
    const cacheKey = String(asset?.id ?? "").trim() || `data:${dataUrl.slice(0, 96)}:${dataUrl.length}`;
    const cached = this.imageCache.get(cacheKey);
    if (cached?.status === "ready" && cached.image) {
      return cached.image;
    }
    if (cached?.status === "loading" || cached?.status === "error") {
      return null;
    }

    const imageNode = new Image();
    imageNode.decoding = "async";
    this.imageCache.set(cacheKey, {
      status: "loading",
      image: null,
    });
    imageNode.onload = () => {
      this.imageCache.set(cacheKey, {
        status: "ready",
        image: imageNode,
      });
      this.draw();
    };
    imageNode.onerror = () => {
      this.imageCache.set(cacheKey, {
        status: "error",
        image: null,
      });
      this.draw();
    };
    imageNode.src = dataUrl;
    return null;
  }

  drawImagePlaceholder(rect, label, alpha = 1) {
    this.ctx.save();
    this.ctx.globalAlpha *= Math.max(0.05, Math.min(1, alpha));
    this.ctx.fillStyle = "rgba(236,239,242,0.96)";
    this.ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    this.ctx.strokeStyle = "rgba(46,56,64,0.36)";
    this.ctx.lineWidth = Math.max(1, Math.min(2.8, rect.width * 0.008));
    this.ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    this.ctx.beginPath();
    this.ctx.moveTo(rect.x + 4, rect.y + 4);
    this.ctx.lineTo(rect.x + rect.width - 4, rect.y + rect.height - 4);
    this.ctx.moveTo(rect.x + rect.width - 4, rect.y + 4);
    this.ctx.lineTo(rect.x + 4, rect.y + rect.height - 4);
    this.ctx.stroke();

    const text = String(label ?? "").trim();
    if (text) {
      const labelSize = clampNumber(rect.height * 0.14, 12, 22, 14);
      this.ctx.font = `${Math.round(labelSize)}px "Kalam","Segoe Print",sans-serif`;
      this.ctx.fillStyle = this.style.inkColor;
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(text.slice(0, 72), rect.x + rect.width * 0.5, rect.y + rect.height * 0.5);
    }
    this.ctx.restore();
  }

  drawImageAssetRect(asset, rect, options = {}) {
    const x = Number(rect?.x);
    const y = Number(rect?.y);
    const width = Number(rect?.width);
    const height = Number(rect?.height);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(width) || !Number.isFinite(height)) {
      return;
    }
    const safeRect = {
      x,
      y,
      width: Math.max(1, width),
      height: Math.max(1, height),
    };
    const fit = normalizeImageFit(options.fit ?? asset?.fit);
    const align = normalizeImageAlign(options.align ?? asset?.align);
    const showBorder = (options.showBorder ?? asset?.showBorder) !== false;
    const showCaption = options.showCaption === true;
    const caption = String(options.caption ?? asset?.caption ?? "").trim();
    const alpha = clampNumber(options.alpha, 0, 1, 1);
    const imageNode = this.ensureImageNode(asset);

    if (imageNode && imageNode.naturalWidth > 0 && imageNode.naturalHeight > 0) {
      const imageWidth = imageNode.naturalWidth;
      const imageHeight = imageNode.naturalHeight;
      const scale =
        fit === "cover"
          ? Math.max(safeRect.width / imageWidth, safeRect.height / imageHeight)
          : Math.min(safeRect.width / imageWidth, safeRect.height / imageHeight);
      const renderWidth = Math.max(1, imageWidth * scale);
      const renderHeight = Math.max(1, imageHeight * scale);
      let drawX = safeRect.x + (safeRect.width - renderWidth) * 0.5;
      if (align === "left") {
        drawX = safeRect.x;
      } else if (align === "right") {
        drawX = safeRect.x + (safeRect.width - renderWidth);
      }
      const drawY = safeRect.y + (safeRect.height - renderHeight) * 0.5;

      this.ctx.save();
      this.ctx.globalAlpha *= alpha;
      this.ctx.beginPath();
      this.ctx.rect(safeRect.x, safeRect.y, safeRect.width, safeRect.height);
      this.ctx.clip();
      this.ctx.drawImage(imageNode, drawX, drawY, renderWidth, renderHeight);
      this.ctx.restore();
    } else {
      this.drawImagePlaceholder(safeRect, asset?.fallbackLabel ?? "image", alpha);
    }

    if (showBorder) {
      this.ctx.save();
      this.ctx.globalAlpha *= alpha;
      this.ctx.strokeStyle = this.style.inkColor;
      this.ctx.lineWidth = Math.max(1, (this.style.thickness ?? 1) * 1.1);
      this.ctx.strokeRect(safeRect.x, safeRect.y, safeRect.width, safeRect.height);
      this.ctx.restore();
    }

    if (showCaption && caption) {
      const captionSize = clampNumber(safeRect.height * 0.125, 12, 26, 14);
      this.ctx.save();
      this.ctx.globalAlpha *= alpha;
      this.ctx.font = `${Math.round(captionSize)}px "Kalam","Segoe Print",sans-serif`;
      this.ctx.fillStyle = this.style.inkColor;
      this.ctx.textAlign = "left";
      this.ctx.textBaseline = "top";
      this.ctx.fillText(caption, safeRect.x, safeRect.y + safeRect.height + Math.max(4, captionSize * 0.24));
      this.ctx.restore();
    }
  }

  drawImageEnterFrame(stroke, progress = 1, { showCaption = false } = {}) {
    const imageEnter = stroke?.imageEnter;
    if (!imageEnter || typeof imageEnter !== "object") {
      return;
    }
    const clampedProgress = Math.max(0, Math.min(1, Number(progress) || 0));
    const width = Math.max(1, Number(imageEnter.width) || 1);
    const height = Math.max(1, Number(imageEnter.height) || 1);
    const fromX = Number(imageEnter.fromX) || 0;
    const fromY = Number(imageEnter.fromY) || 0;
    const toX = Number(imageEnter.toX) || 0;
    const toY = Number(imageEnter.toY) || 0;
    const x = fromX + (toX - fromX) * clampedProgress;
    const y = fromY + (toY - fromY) * clampedProgress;
    const enterMode = String(imageEnter.enter ?? "pull-right").toLowerCase();
    const alpha = enterMode === "fade" ? 0.14 + clampedProgress * 0.86 : 1;
    const asset = this.resolveImageAsset(stroke?.imageAssetId, imageEnter);

    this.drawImageAssetRect(
      asset,
      {
        x,
        y,
        width,
        height,
      },
      {
        alpha,
        showBorder: imageEnter.showBorder !== false,
        showCaption,
        caption: imageEnter.caption || asset.caption,
      },
    );
  }

  drawStandaloneImages(drawnImageIds) {
    for (const asset of this.imageAssets) {
      const assetId = String(asset?.id ?? "").trim();
      if (assetId && drawnImageIds?.has(assetId)) {
        continue;
      }

      const enterIndex = assetId ? this.imageEnterIndexByAssetId.get(assetId) : null;
      if (Number.isFinite(enterIndex)) {
        if (enterIndex > this.strokeIndex) {
          continue;
        }
        if (enterIndex === this.strokeIndex) {
          const currentStroke = this.strokes[this.strokeIndex];
          if (currentStroke?.isImageEnter && this.strokeElapsedMs <= currentStroke.durationMs) {
            continue;
          }
        }
      }

      this.drawImageAssetRect(
        asset,
        {
          x: asset.x,
          y: asset.y,
          width: asset.width,
          height: asset.height,
        },
        {
          showCaption: true,
        },
      );
      if (assetId) {
        drawnImageIds?.add(assetId);
      }
    }
  }

  drawBitmapRevealStroke(stroke, progress = 1) {
    const rect = stroke?.revealRect;
    if (!rect || !this.staticBitmap) {
      return null;
    }
    const x = Number(rect.x);
    const y = Number(rect.y);
    const width = Math.max(1, Number(rect.width) || 1);
    const height = Math.max(1, Number(rect.height) || 1);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return null;
    }

    const clampedProgress = clampNumber(progress, 0, 1, 1);
    const revealWidth = Math.max(0.2, width * clampedProgress);
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.rect(x, y, revealWidth, height);
    this.ctx.clip();
    this.ctx.drawImage(this.staticBitmap, x, y, width, height, x, y, width, height);
    this.ctx.restore();
    return {
      x: x + revealWidth,
      y: y + height * 0.5,
    };
  }

  complete() {
    this.running = false;
    this.paused = false;
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
    this.strokeIndex = this.strokes.length;
    this.strokeElapsedMs = 0;
    this.draw();
  }

  play() {
    if (!this.strokes.length) {
      return;
    }

    this.running = true;
    this.paused = false;
    this.lastTimestamp = 0;
    this.scheduleFrame();
  }

  pause() {
    this.paused = true;
  }

  resume() {
    if (!this.running) {
      return;
    }
    this.paused = false;
    this.lastTimestamp = 0;
    this.scheduleFrame();
  }

  togglePause() {
    if (this.paused) {
      this.resume();
    } else {
      this.pause();
    }
  }

  reset() {
    this.running = false;
    this.paused = false;
    this.strokeIndex = 0;
    this.strokeElapsedMs = 0;
    this.lastTimestamp = 0;
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
    this.draw();
  }

  stop({ preserveCanvas = true } = {}) {
    this.running = false;
    this.paused = false;
    this.strokeElapsedMs = 0;
    this.lastTimestamp = 0;
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
    if (!preserveCanvas) {
      this.strokeIndex = 0;
      this.draw();
    }
  }

  stepStroke() {
    if (!this.strokes.length || this.strokeIndex >= this.strokes.length) {
      return;
    }

    this.strokeIndex += 1;
    this.strokeElapsedMs = 0;
    this.draw();
  }

  scheduleFrame() {
    if (this.frameId) {
      return;
    }
    this.frameId = requestAnimationFrame((timestamp) => this.loop(timestamp));
  }

  loop(timestamp) {
    this.frameId = null;

    if (!this.running) {
      return;
    }

    if (this.paused) {
      this.scheduleFrame();
      return;
    }

    if (!this.lastTimestamp) {
      this.lastTimestamp = timestamp;
      this.scheduleFrame();
      return;
    }

    const deltaMs = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;
    let budgetMs = deltaMs;

    while (budgetMs > 0 && this.strokeIndex < this.strokes.length) {
      const stroke = this.strokes[this.strokeIndex];
      const totalMs = stroke.durationMs + stroke.pauseAfterMs;
      const remainingMs = totalMs - this.strokeElapsedMs;

      if (budgetMs >= remainingMs) {
        budgetMs -= remainingMs;
        this.strokeIndex += 1;
        this.strokeElapsedMs = 0;
      } else {
        this.strokeElapsedMs += budgetMs;
        budgetMs = 0;
      }
    }

    this.draw();

    if (this.strokeIndex >= this.strokes.length) {
      this.running = false;
      if (typeof this.onFinish === "function") {
        this.onFinish();
      }
      return;
    }

    this.scheduleFrame();
  }

  draw() {
    this.ctx.clearRect(0, 0, this.logicalWidth, this.logicalHeight);
    if (this.staticBitmap && this.style.staticGuideVisible !== false) {
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0.08, Math.min(1, this.style.staticGuideAlpha ?? 0.34));
      this.ctx.drawImage(this.staticBitmap, 0, 0, this.logicalWidth, this.logicalHeight);
      this.ctx.restore();
    }
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";
    this.ctx.strokeStyle = this.style.inkColor;
    this.ctx.fillStyle = this.style.inkColor;
    const drawnImageIds = new Set();

    for (let i = 0; i < this.strokeIndex; i += 1) {
      const stroke = this.strokes[i];
      if (stroke?.isImageEnter) {
        this.drawImageEnterFrame(stroke, 1, { showCaption: true });
        const imageAssetId = String(stroke?.imageAssetId ?? "").trim();
        if (imageAssetId) {
          drawnImageIds.add(imageAssetId);
        }
        continue;
      }
      if (isBitmapRevealStroke(stroke)) {
        this.drawBitmapRevealStroke(stroke, 1);
        continue;
      }
      this.ctx.lineWidth = stroke.width;
      drawCompletedStroke(this.ctx, stroke);
    }

    const currentStroke = this.strokes[this.strokeIndex];
    if (currentStroke) {
      if (currentStroke?.isImageEnter) {
        const strokeElapsed = Math.min(this.strokeElapsedMs, currentStroke.durationMs);
        const rawProgress =
          currentStroke.durationMs <= 0 ? 1 : strokeElapsed / currentStroke.durationMs;
        const easedProgress = easeProgress(rawProgress, currentStroke);
        const inStrokePhase = this.strokeElapsedMs <= currentStroke.durationMs;
        const imageAssetId = String(currentStroke?.imageAssetId ?? "").trim();

        if (!inStrokePhase) {
          this.drawImageEnterFrame(currentStroke, 1, { showCaption: true });
          if (imageAssetId) {
            drawnImageIds.add(imageAssetId);
          }
          this.drawStandaloneImages(drawnImageIds);
          return;
        }

        this.drawImageEnterFrame(currentStroke, easedProgress, {
          showCaption: easedProgress >= 0.98,
        });
        if (imageAssetId) {
          drawnImageIds.add(imageAssetId);
        }
        this.drawStandaloneImages(drawnImageIds);
        return;
      }

      this.ctx.lineWidth = currentStroke.width;
      const strokeElapsed = Math.min(this.strokeElapsedMs, currentStroke.durationMs);
      const rawProgress =
        currentStroke.durationMs <= 0 ? 1 : strokeElapsed / currentStroke.durationMs;
      const easedProgress = easeProgress(rawProgress, currentStroke);
      const lengthLimit = currentStroke.length * easedProgress;
      const inStrokePhase = this.strokeElapsedMs <= currentStroke.durationMs;

      if (!inStrokePhase) {
        if (isBitmapRevealStroke(currentStroke)) {
          this.drawBitmapRevealStroke(currentStroke, 1);
          this.drawStandaloneImages(drawnImageIds);
          return;
        }
        drawCompletedStroke(this.ctx, currentStroke);
        this.drawStandaloneImages(drawnImageIds);
        return;
      }

      if (isBitmapRevealStroke(currentStroke)) {
        const tip = this.drawBitmapRevealStroke(currentStroke, easedProgress);
        if (tip && inStrokePhase && easedProgress < 1) {
          this.ctx.beginPath();
          this.ctx.fillStyle = this.style.inkColor;
          this.ctx.arc(tip.x, tip.y, Math.max(1.25, currentStroke.width * 0.48), 0, Math.PI * 2);
          this.ctx.fill();
        }
        this.drawStandaloneImages(drawnImageIds);
        return;
      }

      let tip = null;
      if (currentStroke.category === "han") {
        tip = drawPartialPolyline(
          this.ctx,
          currentStroke.points,
          lengthLimit,
        );
      } else {
        tip = drawPartialPolyline(
          this.ctx,
          currentStroke.points,
          lengthLimit,
        );
      }

      if (tip && inStrokePhase && easedProgress < 1) {
        this.ctx.beginPath();
        this.ctx.fillStyle = this.style.inkColor;
        this.ctx.arc(
          tip.x,
          tip.y,
          Math.max(1.5, currentStroke.width * 0.55),
          0,
          Math.PI * 2,
        );
        this.ctx.fill();
      }
    }

    this.drawStandaloneImages(drawnImageIds);
  }
}
