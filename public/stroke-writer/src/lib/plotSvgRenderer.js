const DEFAULT_DOMAIN = Object.freeze({ min: -5, max: 5 });
const DEFAULT_RANGE = Object.freeze({ min: -5, max: 5 });
const DEFAULT_PALETTE = Object.freeze(["#2c5aa0", "#c9503f", "#2f7d4d", "#7b4bb7"]);
const DEFAULT_GRID_COLOR = "#c6d1da";
const DEFAULT_AXIS_COLOR = "#1f2a30";
const AUTO_RANGE_LIMIT = 10000;
const RENDER_CULL_LIMIT = 1000000;

const SAFE_SCOPE = Object.freeze({
  pi: Math.PI,
  e: Math.E,
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  sqrt: Math.sqrt,
  abs: Math.abs,
  log: Math.log,
  ln: Math.log,
  exp: Math.exp,
  pow: Math.pow,
  min: Math.min,
  max: Math.max,
  floor: Math.floor,
  ceil: Math.ceil,
  round: Math.round,
  sign: Math.sign,
  sec: (value) => 1 / Math.cos(value),
  csc: (value) => 1 / Math.sin(value),
  cot: (value) => 1 / Math.tan(value),
});

const SAFE_IDENTIFIER_NAMES = new Set(["x", ...Object.keys(SAFE_SCOPE)]);
const SAFE_EXPRESSION_PATTERN = /^[0-9a-z+\-*/^().,_\s]+$/i;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function asNumber(value, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function asPlainObject(value, fallback = {}) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : fallback;
}

function roundTo(value, digits = 3) {
  const factor = 10 ** digits;
  return Math.round((Number(value) || 0) * factor) / factor;
}

function isFiniteNumber(value) {
  return Number.isFinite(Number(value));
}

export function isHexColor(value) {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value.trim());
}

function normalizeColor(value, fallback = "") {
  return isHexColor(value) ? value.trim().toLowerCase() : fallback;
}

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function normalizeRangeObject(rawValue, fallback, { allowNull = false } = {}) {
  const source = asPlainObject(rawValue, null);
  if (!source) {
    return allowNull ? null : { ...fallback };
  }
  const min = asNumber(source.min, fallback.min);
  const max = asNumber(source.max, fallback.max);
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) {
    return allowNull ? null : { ...fallback };
  }
  return { min, max };
}

export function normalizePlotContentLoose(rawContent = {}, options = {}) {
  const source = asPlainObject(rawContent, {});
  const expressions = [];

  if (typeof source.expression === "string" && source.expression.trim()) {
    expressions.push(source.expression.trim());
  }
  if (Array.isArray(source.expressions)) {
    for (const value of source.expressions) {
      const text = String(value ?? "").trim();
      if (text) {
        expressions.push(text);
      }
    }
  }

  const dedupedExpressions = Array.from(new Set(expressions)).slice(0, 4);
  const domain = normalizeRangeObject(
    {
      min: source.domainMin ?? asPlainObject(source.domain, {}).min,
      max: source.domainMax ?? asPlainObject(source.domain, {}).max,
    },
    DEFAULT_DOMAIN,
  );

  const explicitRangeMin = source.rangeMin ?? asPlainObject(source.range, {}).min;
  const explicitRangeMax = source.rangeMax ?? asPlainObject(source.range, {}).max;
  const hasExplicitRange = isFiniteNumber(explicitRangeMin) && isFiniteNumber(explicitRangeMax);
  const range = hasExplicitRange
    ? normalizeRangeObject({ min: explicitRangeMin, max: explicitRangeMax }, DEFAULT_RANGE, { allowNull: true })
    : null;

  return {
    expression: dedupedExpressions[0] ?? "",
    expressions: dedupedExpressions,
    domain,
    range,
    samples: clamp(Math.round(asNumber(source.samples, 180)), 40, 720),
    caption: String(source.caption ?? "").trim(),
    showBorder: source.showBorder === true,
    showAxes: source.showAxes !== false,
    showGrid: source.showGrid !== false,
    xLabel: String(source.xLabel ?? "").trim(),
    yLabel: String(source.yLabel ?? "").trim(),
    fallbackLabel: String(source.fallbackLabel ?? "").trim() || "Plot",
    strokeColor: normalizeColor(source.strokeColor, normalizeColor(options.defaultInkColor, DEFAULT_AXIS_COLOR)),
    axisColor: normalizeColor(source.axisColor, normalizeColor(options.defaultInkColor, DEFAULT_AXIS_COLOR)),
    gridColor: normalizeColor(source.gridColor, DEFAULT_GRID_COLOR),
    backgroundColor: normalizeColor(source.backgroundColor, ""),
    strokeWidth: clamp(asNumber(source.strokeWidth, 2.35), 1, 6),
  };
}

function formatCompactNumber(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return "0";
  }
  const rounded = Math.abs(numeric) >= 1000
    ? numeric.toFixed(0)
    : Math.abs(numeric) >= 100
      ? numeric.toFixed(1)
      : Math.abs(numeric) >= 10
        ? numeric.toFixed(2)
        : numeric.toFixed(3);
  return rounded.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1").replace(/^-0(?:\.0+)?$/, "0");
}

export function describePlotContent(rawContent = {}) {
  const content = normalizePlotContentLoose(rawContent);
  const expressionLabel = content.expressions.length
    ? content.expressions.slice(0, 2).join(", ")
    : "function plot";
  return `${expressionLabel} on [${formatCompactNumber(content.domain.min)}, ${formatCompactNumber(content.domain.max)}]`;
}

function canonicalizeExpression(expression) {
  return String(expression ?? "")
    .trim()
    .replace(/^y\s*=\s*/i, "")
    .replace(/\\([a-z]+)/gi, "$1")
    .replace(/π/gi, "pi")
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function compileExpression(expression) {
  const canonical = canonicalizeExpression(expression);
  if (!canonical) {
    throw new Error("Plot expression is empty.");
  }
  if (!SAFE_EXPRESSION_PATTERN.test(canonical)) {
    throw new Error("Plot expression contains unsupported characters.");
  }

  const identifiers = canonical.match(/[a-z_][a-z0-9_]*/g) ?? [];
  for (const identifier of identifiers) {
    if (!SAFE_IDENTIFIER_NAMES.has(identifier)) {
      throw new Error(`Unsupported token "${identifier}" in plot expression.`);
    }
  }

  const jsExpression = canonical.replace(/\^/g, "**");
  const scopeNames = Object.keys(SAFE_SCOPE);
  const scopeValues = scopeNames.map((name) => SAFE_SCOPE[name]);
  const compiled = Function(
    "x",
    ...scopeNames,
    `"use strict"; return (${jsExpression});`,
  );

  return (x) => {
    const result = compiled(x, ...scopeValues);
    return Number.isFinite(result) ? Number(result) : null;
  };
}

function quantile(sortedValues, position) {
  if (!sortedValues.length) {
    return 0;
  }
  const index = clamp(position, 0, 1) * (sortedValues.length - 1);
  const lowerIndex = Math.floor(index);
  const upperIndex = Math.ceil(index);
  if (lowerIndex === upperIndex) {
    return sortedValues[lowerIndex];
  }
  const ratio = index - lowerIndex;
  return sortedValues[lowerIndex] * (1 - ratio) + sortedValues[upperIndex] * ratio;
}

function resolveAutoRange(seriesList) {
  const finiteValues = [];
  for (const series of seriesList) {
    for (const point of series.points) {
      if (!point || !Number.isFinite(point.y)) {
        continue;
      }
      if (Math.abs(point.y) <= AUTO_RANGE_LIMIT) {
        finiteValues.push(point.y);
      }
    }
  }

  if (!finiteValues.length) {
    return { ...DEFAULT_RANGE };
  }

  finiteValues.sort((left, right) => left - right);
  let min = quantile(finiteValues, 0.05);
  let max = quantile(finiteValues, 0.95);

  if (!(max > min)) {
    const center = finiteValues[Math.floor(finiteValues.length / 2)] ?? 0;
    min = center - 1;
    max = center + 1;
  }

  if (min > 0 && min < (max - min) * 0.28) {
    min = 0;
  }
  if (max < 0 && Math.abs(max) < (max - min) * 0.28) {
    max = 0;
  }

  const span = Math.max(0.5, max - min);
  return {
    min: roundTo(min - span * 0.08, 6),
    max: roundTo(max + span * 0.08, 6),
  };
}

function sampleSeries(expression, domain, sampleCount) {
  const fn = compileExpression(expression);
  const points = [];
  const step = sampleCount <= 1 ? 0 : (domain.max - domain.min) / (sampleCount - 1);

  for (let index = 0; index < sampleCount; index += 1) {
    const x = index === sampleCount - 1 ? domain.max : domain.min + step * index;
    let y = null;
    try {
      y = fn(x);
    } catch {
      y = null;
    }
    if (!Number.isFinite(y) || Math.abs(y) > RENDER_CULL_LIMIT) {
      points.push({ x, y: null });
      continue;
    }
    points.push({ x, y });
  }

  return {
    expression,
    points,
  };
}

function resolveSeriesList(expressions, domain, sampleCount) {
  return expressions.map((expression) => sampleSeries(expression, domain, sampleCount));
}

function niceStep(span, desiredTickCount = 5) {
  const safeSpan = Math.max(1e-9, Math.abs(span));
  const roughStep = safeSpan / Math.max(2, desiredTickCount);
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const residual = roughStep / magnitude;

  if (residual <= 1) {
    return magnitude;
  }
  if (residual <= 2) {
    return 2 * magnitude;
  }
  if (residual <= 5) {
    return 5 * magnitude;
  }
  return 10 * magnitude;
}

function buildTicks(min, max, targetCount = 5) {
  const span = max - min;
  if (!(span > 0)) {
    return [];
  }
  const step = niceStep(span, targetCount);
  const start = Math.ceil(min / step) * step;
  const ticks = [];
  for (let value = start; value <= max + step * 0.5; value += step) {
    ticks.push(roundTo(value, 8));
  }
  return ticks;
}

function formatTickLabel(value, step) {
  const decimals = step >= 1 ? 0 : clamp(Math.ceil(-Math.log10(step)) + 1, 1, 4);
  const fixed = Number(value).toFixed(decimals);
  return fixed.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1").replace(/^-0(?:\.0+)?$/, "0");
}

function mapX(value, domain, rect) {
  return rect.x + ((value - domain.min) / (domain.max - domain.min)) * rect.width;
}

function mapY(value, range, rect) {
  return rect.y + rect.height - ((value - range.min) / (range.max - range.min)) * rect.height;
}

function buildSeriesPath(points, domain, range, rect) {
  const rangeSpan = range.max - range.min;
  let previousPoint = null;
  let path = "";

  for (const point of points) {
    if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
      previousPoint = null;
      continue;
    }
    if (point.y < range.min - rangeSpan * 3 || point.y > range.max + rangeSpan * 3) {
      previousPoint = null;
      continue;
    }

    const svgX = roundTo(mapX(point.x, domain, rect), 3);
    const svgY = roundTo(mapY(point.y, range, rect), 3);
    const jumpTooLarge = previousPoint && Math.abs(point.y - previousPoint.y) > rangeSpan * 1.6;
    path += `${previousPoint && !jumpTooLarge ? "L" : "M"}${svgX} ${svgY} `;
    previousPoint = point;
  }

  return path.trim();
}

function buildBase64DataUrl(svgMarkup) {
  if (typeof Buffer !== "undefined") {
    return `data:image/svg+xml;base64,${Buffer.from(svgMarkup, "utf8").toString("base64")}`;
  }
  const bytes = new TextEncoder().encode(svgMarkup);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return `data:image/svg+xml;base64,${btoa(binary)}`;
}

function buildClipId(normalizedContent, width, height) {
  const seed = `${normalizedContent.expressions.join("|")}|${width}x${height}|${normalizedContent.domain.min}|${normalizedContent.domain.max}`;
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return `plot-clip-${hash.toString(16)}`;
}

export function renderPlotToSvgAsset(rawContent = {}, size = {}, options = {}) {
  const width = Math.max(160, Math.round(asNumber(size.width, 320)));
  const height = Math.max(120, Math.round(asNumber(size.height, 220)));
  const normalized = normalizePlotContentLoose(rawContent, options);

  if (!normalized.expressions.length) {
    return {
      ok: false,
      reason: "missing-expression",
      message: "Plot item requires expression or expressions.",
      fallbackLabel: normalized.fallbackLabel,
      summary: describePlotContent(normalized),
    };
  }

  try {
    const seriesList = resolveSeriesList(normalized.expressions, normalized.domain, normalized.samples);
    const range = normalized.range ?? resolveAutoRange(seriesList);
    const clipId = buildClipId(normalized, width, height);
    const padding = {
      left: normalized.yLabel ? 56 : 48,
      right: 18,
      top: 18,
      bottom: normalized.xLabel ? 46 : 38,
    };
    const plotRect = {
      x: padding.left,
      y: padding.top,
      width: Math.max(40, width - padding.left - padding.right),
      height: Math.max(40, height - padding.top - padding.bottom),
    };
    const xTicks = buildTicks(normalized.domain.min, normalized.domain.max, 5);
    const yTicks = buildTicks(range.min, range.max, 5);
    const xStep = xTicks.length > 1 ? Math.abs(xTicks[1] - xTicks[0]) : normalized.domain.max - normalized.domain.min;
    const yStep = yTicks.length > 1 ? Math.abs(yTicks[1] - yTicks[0]) : range.max - range.min;

    const svgParts = [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
      `<defs><clipPath id="${clipId}"><rect x="${plotRect.x}" y="${plotRect.y}" width="${plotRect.width}" height="${plotRect.height}" rx="6" ry="6"/></clipPath></defs>`,
    ];

    if (normalized.backgroundColor) {
      svgParts.push(
        `<rect x="0" y="0" width="${width}" height="${height}" fill="${normalized.backgroundColor}"/>`,
      );
    }

    if (normalized.showGrid) {
      for (const tick of xTicks) {
        const svgX = roundTo(mapX(tick, normalized.domain, plotRect), 3);
        svgParts.push(
          `<line x1="${svgX}" y1="${plotRect.y}" x2="${svgX}" y2="${plotRect.y + plotRect.height}" stroke="${normalized.gridColor}" stroke-width="1" stroke-dasharray="4 5" opacity="0.55"/>`,
        );
      }
      for (const tick of yTicks) {
        const svgY = roundTo(mapY(tick, range, plotRect), 3);
        svgParts.push(
          `<line x1="${plotRect.x}" y1="${svgY}" x2="${plotRect.x + plotRect.width}" y2="${svgY}" stroke="${normalized.gridColor}" stroke-width="1" stroke-dasharray="4 5" opacity="0.55"/>`,
        );
      }
    }

    if (normalized.showAxes) {
      if (normalized.domain.min <= 0 && normalized.domain.max >= 0) {
        const axisX = roundTo(mapX(0, normalized.domain, plotRect), 3);
        svgParts.push(
          `<line x1="${axisX}" y1="${plotRect.y}" x2="${axisX}" y2="${plotRect.y + plotRect.height}" stroke="${normalized.axisColor}" stroke-width="1.45" opacity="0.95"/>`,
        );
      }
      if (range.min <= 0 && range.max >= 0) {
        const axisY = roundTo(mapY(0, range, plotRect), 3);
        svgParts.push(
          `<line x1="${plotRect.x}" y1="${axisY}" x2="${plotRect.x + plotRect.width}" y2="${axisY}" stroke="${normalized.axisColor}" stroke-width="1.45" opacity="0.95"/>`,
        );
      }
    }

    svgParts.push(`<g clip-path="url(#${clipId})">`);
    seriesList.forEach((series, index) => {
      const pathData = buildSeriesPath(series.points, normalized.domain, range, plotRect);
      if (!pathData) {
        return;
      }
      const strokeColor = index === 0
        ? normalized.strokeColor
        : DEFAULT_PALETTE[(index - 1) % DEFAULT_PALETTE.length] ?? normalized.strokeColor;
      svgParts.push(
        `<path d="${pathData}" fill="none" stroke="${strokeColor}" stroke-width="${normalized.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`,
      );
    });
    svgParts.push("</g>");

    svgParts.push(
      `<rect x="${plotRect.x}" y="${plotRect.y}" width="${plotRect.width}" height="${plotRect.height}" fill="none" stroke="${normalized.axisColor}" stroke-width="0.9" opacity="0.35" rx="6" ry="6"/>`,
    );

    for (const tick of xTicks) {
      const svgX = roundTo(mapX(tick, normalized.domain, plotRect), 3);
      const label = escapeXml(formatTickLabel(tick, xStep));
      svgParts.push(
        `<text x="${svgX}" y="${height - 12}" font-size="11" text-anchor="middle" fill="${normalized.axisColor}" opacity="0.88">${label}</text>`,
      );
    }
    for (const tick of yTicks) {
      const svgY = roundTo(mapY(tick, range, plotRect), 3);
      const label = escapeXml(formatTickLabel(tick, yStep));
      svgParts.push(
        `<text x="${plotRect.x - 8}" y="${svgY + 4}" font-size="11" text-anchor="end" fill="${normalized.axisColor}" opacity="0.88">${label}</text>`,
      );
    }

    if (normalized.xLabel) {
      svgParts.push(
        `<text x="${plotRect.x + plotRect.width * 0.5}" y="${height - 4}" font-size="12" text-anchor="middle" fill="${normalized.axisColor}">${escapeXml(normalized.xLabel)}</text>`,
      );
    }
    if (normalized.yLabel) {
      const rotateX = 14;
      const rotateY = plotRect.y + plotRect.height * 0.5;
      svgParts.push(
        `<text x="${rotateX}" y="${roundTo(rotateY, 3)}" font-size="12" text-anchor="middle" fill="${normalized.axisColor}" transform="rotate(-90 ${rotateX} ${roundTo(rotateY, 3)})">${escapeXml(normalized.yLabel)}</text>`,
      );
    }

    svgParts.push("</svg>");
    const svgMarkup = svgParts.join("");

    return {
      ok: true,
      svg: svgMarkup,
      dataUrl: buildBase64DataUrl(svgMarkup),
      width,
      height,
      fallbackLabel: normalized.fallbackLabel,
      summary: describePlotContent(normalized),
      normalized,
      range,
    };
  } catch (error) {
    return {
      ok: false,
      reason: "render-failed",
      message: error instanceof Error ? error.message : String(error),
      fallbackLabel: normalized.fallbackLabel,
      summary: describePlotContent(normalized),
    };
  }
}
