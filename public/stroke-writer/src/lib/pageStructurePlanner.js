function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeRect(rect) {
  const x = Number(rect?.x);
  const y = Number(rect?.y);
  const width = Number(rect?.width);
  const height = Number(rect?.height);
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(width) || !Number.isFinite(height)) {
    return null;
  }
  if (width <= 0 || height <= 0) {
    return null;
  }
  return { x, y, width, height };
}

function intersectsHorizontally(left, right, rect, slack = 0) {
  return left < rect.x + rect.width + slack && right > rect.x - slack;
}

export function createPageStructurePlanner(options = {}) {
  const width = Math.max(320, Number(options.width) || 1360);
  const padding = Math.max(0, Number(options.padding) || 48);
  const density = clamp(Number(options.density) || 0.72, 0.3, 0.98);
  const lineHeight = Math.max(12, Number(options.lineHeight) || 96);
  const fontSize = Math.max(10, Number(options.fontSize) || 72);
  const looseness = clamp(Number(options.looseness) || 0.2, 0, 1);
  const lineStartVariance = clamp(Number(options.lineStartVariance) || 1, 0, 1.2);
  const occupiedRects = [];
  let occupiedArea = 0;
  let maxY = padding;

  function reserveRect(rawRect, meta = {}) {
    const rect = normalizeRect(rawRect);
    if (!rect) {
      return null;
    }
    occupiedRects.push({ ...rect, kind: String(meta.kind ?? "content") });
    occupiedArea += rect.width * rect.height;
    maxY = Math.max(maxY, rect.y + rect.height);
    return rect;
  }

  function findClearY(rawY, height, bounds = {}) {
    const bandHeight = Math.max(8, Number(height) || lineHeight);
    const left = Number.isFinite(bounds.left) ? bounds.left : padding;
    const right = Number.isFinite(bounds.right) ? bounds.right : width - padding;
    const slack = Math.max(fontSize * (0.06 + (1 - density) * 0.08), 4);
    let y = Math.max(padding, Number(rawY) || padding);

    for (let guard = 0; guard < 96; guard += 1) {
      const collision = occupiedRects.find((rect) => {
        if (!intersectsHorizontally(left, right, rect, slack)) {
          return false;
        }
        return y < rect.y + rect.height + slack && y + bandHeight > rect.y - slack;
      });
      if (!collision) {
        break;
      }
      y = collision.y + collision.height + Math.max(lineHeight * (0.08 + (1 - density) * 0.08), 6);
    }

    maxY = Math.max(maxY, y + bandHeight);
    return y;
  }

  function suggestLineStart(input = {}) {
    if (input.centered || input.inColumns) {
      return Number(input.left) || padding;
    }
    const left = Number.isFinite(input.left) ? input.left : padding;
    const right = Number.isFinite(input.right) ? input.right : width - padding;
    const localFontSize = Math.max(10, Number(input.fontSize) || fontSize);
    const lineIndex = Number(input.lineIndex) || 0;
    const driftStrength =
      localFontSize * (0.04 + looseness * 0.1) * (1 - density * 0.55) * lineStartVariance;
    const wave = Math.sin(lineIndex * 0.82) * 0.62 + Math.cos(lineIndex * 0.31) * 0.38;
    const start = left + clamp(wave * driftStrength, -localFontSize * 0.16, localFontSize * 0.16);
    return clamp(start, left, Math.max(left, right - localFontSize * 0.24));
  }

  function suggestParagraphGap(input = {}) {
    const localFontSize = Math.max(10, Number(input.fontSize) || fontSize);
    const localLineHeight = Math.max(localFontSize, Number(input.lineHeight) || lineHeight);
    const followsHeading = Boolean(input.followsHeading);
    const base = followsHeading
      ? Math.max(localFontSize * 0.26, localLineHeight * 0.16)
      : Math.max(localLineHeight * 0.72, localFontSize * 0.82);
    return base * clamp(0.94 - density * 0.16, 0.62, 0.9);
  }

  function buildTelemetry(input = {}) {
    const contentBottom = Math.max(maxY, Number(input.contentBottom) || maxY);
    const availableHeight = Math.max(lineHeight, contentBottom - padding * 2);
    const usableArea = Math.max(width - padding * 2, 1) * availableHeight;
    const densityRatio = clamp(occupiedArea / Math.max(usableArea, 1), 0, 1);
    const remainingBands = [];
    const sortedRects = occupiedRects.slice().sort((leftRect, rightRect) => leftRect.y - rightRect.y);
    let cursorY = padding;
    for (const rect of sortedRects) {
      const gap = rect.y - cursorY;
      if (gap >= lineHeight * 0.9) {
        remainingBands.push({ y: cursorY, height: gap });
      }
      cursorY = Math.max(cursorY, rect.y + rect.height);
    }
    if (contentBottom - cursorY >= lineHeight * 0.9) {
      remainingBands.push({ y: cursorY, height: contentBottom - cursorY });
    }
    return {
      densityTarget: density,
      occupiedAreaRatio: Number(densityRatio.toFixed(4)),
      occupiedRects: occupiedRects.map((rect) => ({
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        kind: rect.kind,
      })),
      remainingBands: remainingBands
        .slice(0, 16)
        .map((band) => ({ y: Math.round(band.y), height: Math.round(band.height) })),
    };
  }

  return {
    reserveRect,
    findClearY,
    suggestLineStart,
    suggestParagraphGap,
    buildTelemetry,
  };
}
