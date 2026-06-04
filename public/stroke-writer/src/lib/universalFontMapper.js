const OPEN_TYPE_MODULE_URLS = [
  "../../assets/vendor/opentype.module.js",
  "https://cdn.jsdelivr.net/npm/opentype.js@1.3.4/dist/opentype.module.js",
];

let openTypeRuntimePromise = null;
const RASTER_SIZE = 256;
const RASTER_PADDING = 12;
const ALPHA_THRESHOLD = 26;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function distance(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.hypot(dx, dy);
}

function quadraticAt(p0, p1, p2, t) {
  const inv = 1 - t;
  return {
    x: inv * inv * p0.x + 2 * inv * t * p1.x + t * t * p2.x,
    y: inv * inv * p0.y + 2 * inv * t * p1.y + t * t * p2.y,
  };
}

function cubicAt(p0, p1, p2, p3, t) {
  const inv = 1 - t;
  return {
    x:
      inv * inv * inv * p0.x +
      3 * inv * inv * t * p1.x +
      3 * inv * t * t * p2.x +
      t * t * t * p3.x,
    y:
      inv * inv * inv * p0.y +
      3 * inv * inv * t * p1.y +
      3 * inv * t * t * p2.y +
      t * t * t * p3.y,
  };
}

function approximateCurveLength(points) {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += distance(points[i - 1], points[i]);
  }
  return total;
}

function estimateSegments(points, minSegments, maxSegments) {
  const length = approximateCurveLength(points);
  const target = Math.ceil(length / 28);
  return clamp(target, minSegments, maxSegments);
}

function dedupePoints(points, epsilon = 0.5) {
  if (points.length <= 2) {
    return points.slice();
  }
  const output = [points[0]];
  for (let i = 1; i < points.length; i += 1) {
    const prev = output[output.length - 1];
    const current = points[i];
    if (distance(prev, current) >= epsilon) {
      output.push(current);
    }
  }
  return output;
}

function strokeLength(points) {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += distance(points[i - 1], points[i]);
  }
  return total;
}

function turnAngle(a, b, c) {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const bcx = c.x - b.x;
  const bcy = c.y - b.y;
  const ab = Math.hypot(abx, aby);
  const bc = Math.hypot(bcx, bcy);
  if (ab < 1e-5 || bc < 1e-5) {
    return 0;
  }
  const dot = (abx * bcx + aby * bcy) / (ab * bc);
  return Math.acos(Math.max(-1, Math.min(1, dot)));
}

function splitAtSharpCorners(points) {
  if (points.length < 5) {
    return [points];
  }

  const result = [];
  let current = [points[0]];
  for (let i = 1; i < points.length - 1; i += 1) {
    current.push(points[i]);
    const angle = turnAngle(points[i - 1], points[i], points[i + 1]);
    if (angle > 2.25 && current.length >= 4) {
      result.push(current);
      current = [points[i]];
    }
  }
  current.push(points[points.length - 1]);
  if (current.length >= 2) {
    result.push(current);
  }
  return result.filter((stroke) => strokeLength(stroke) > 2);
}

function rotateClosedStrokeStart(points) {
  if (points.length < 4) {
    return points;
  }
  const first = points[0];
  const last = points[points.length - 1];
  if (distance(first, last) > 0.02) {
    return points;
  }

  const openPoints = points.slice(0, -1);
  let bestIndex = 0;
  let bestScore = Number.POSITIVE_INFINITY;
  for (let i = 0; i < openPoints.length; i += 1) {
    const point = openPoints[i];
    const score = point.y * 1.7 + point.x;
    if (score < bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  return openPoints
    .slice(bestIndex)
    .concat(openPoints.slice(0, bestIndex));
}

function normalizePoint(point, box) {
  return {
    x: (point.x - box.xMin) / box.width,
    y: (point.y - box.yMin) / box.height,
  };
}

function contourOrderScore(points) {
  let xMin = Number.POSITIVE_INFINITY;
  let yMin = Number.POSITIVE_INFINITY;
  for (const point of points) {
    xMin = Math.min(xMin, point.x);
    yMin = Math.min(yMin, point.y);
  }
  return yMin * 2 + xMin;
}

function deriveBoxFromContours(contours) {
  let xMin = Number.POSITIVE_INFINITY;
  let yMin = Number.POSITIVE_INFINITY;
  let xMax = Number.NEGATIVE_INFINITY;
  let yMax = Number.NEGATIVE_INFINITY;

  for (const contour of contours) {
    for (const point of contour) {
      xMin = Math.min(xMin, point.x);
      yMin = Math.min(yMin, point.y);
      xMax = Math.max(xMax, point.x);
      yMax = Math.max(yMax, point.y);
    }
  }

  if (!Number.isFinite(xMin) || !Number.isFinite(yMin) || !Number.isFinite(xMax) || !Number.isFinite(yMax)) {
    return null;
  }

  return {
    xMin,
    yMin,
    xMax,
    yMax,
    width: Math.max(1, xMax - xMin),
    height: Math.max(1, yMax - yMin),
  };
}

function normalizeContours(rawContours, box, options = {}) {
  const splitAtCorners = options.splitAtCorners !== false;
  const normalizedContours = rawContours
    .map((contour) => contour.map((point) => normalizePoint(point, box)))
    .map((contour) =>
      contour.filter(
        (point) =>
          Number.isFinite(point.x) &&
          Number.isFinite(point.y) &&
          point.x >= -0.4 &&
          point.x <= 1.4 &&
          point.y >= -0.4 &&
          point.y <= 1.4,
      ),
    )
    .filter((contour) => contour.length >= 2)
    .map((contour) => dedupePoints(contour, 0.003))
    .filter((contour) => contour.length >= 2)
    .sort((a, b) => contourOrderScore(a) - contourOrderScore(b));

  const strokes = [];
  for (const contour of normalizedContours) {
    const contourStroke = rotateClosedStrokeStart(contour);
    const derivedStrokes = splitAtCorners ? splitAtSharpCorners(contourStroke) : [contourStroke];
    for (const stroke of derivedStrokes) {
      if (stroke.length >= 2 && strokeLength(stroke) > 0.02) {
        strokes.push(stroke);
      }
    }
  }

  return strokes;
}

function buildContoursFromCommands(commands) {
  const contours = [];
  let current = [];
  let cursor = { x: 0, y: 0 };
  let contourStart = null;

  function commitContour() {
    if (current.length >= 2) {
      contours.push(current);
    }
    current = [];
    contourStart = null;
  }

  for (const command of commands) {
    if (command.type === "M") {
      commitContour();
      cursor = { x: command.x, y: command.y };
      contourStart = { ...cursor };
      current.push({ ...cursor });
      continue;
    }

    if (command.type === "L") {
      cursor = { x: command.x, y: command.y };
      current.push({ ...cursor });
      continue;
    }

    if (command.type === "Q") {
      const from = { ...cursor };
      const control = { x: command.x1, y: command.y1 };
      const to = { x: command.x, y: command.y };
      const segments = estimateSegments([from, control, to], 4, 24);
      for (let step = 1; step <= segments; step += 1) {
        const t = step / segments;
        current.push(quadraticAt(from, control, to, t));
      }
      cursor = to;
      continue;
    }

    if (command.type === "C") {
      const from = { ...cursor };
      const control1 = { x: command.x1, y: command.y1 };
      const control2 = { x: command.x2, y: command.y2 };
      const to = { x: command.x, y: command.y };
      const segments = estimateSegments([from, control1, control2, to], 6, 30);
      for (let step = 1; step <= segments; step += 1) {
        const t = step / segments;
        current.push(cubicAt(from, control1, control2, to, t));
      }
      cursor = to;
      continue;
    }

    if (command.type === "Z") {
      if (contourStart) {
        current.push({ ...contourStart });
      }
      commitContour();
    }
  }

  commitContour();
  return contours.map((contour) => dedupePoints(contour, 0.4)).filter((contour) => contour.length >= 2);
}

function createRasterCanvas(width, height) {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(width, height);
  }
  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }
  throw new Error("Canvas runtime is unavailable for font rasterization.");
}

function drawCommandsAsFill(ctx, commands) {
  ctx.beginPath();
  for (const command of commands) {
    if (command.type === "M") {
      ctx.moveTo(command.x, command.y);
      continue;
    }
    if (command.type === "L") {
      ctx.lineTo(command.x, command.y);
      continue;
    }
    if (command.type === "Q") {
      ctx.quadraticCurveTo(command.x1, command.y1, command.x, command.y);
      continue;
    }
    if (command.type === "C") {
      ctx.bezierCurveTo(command.x1, command.y1, command.x2, command.y2, command.x, command.y);
      continue;
    }
    if (command.type === "Z") {
      ctx.closePath();
    }
  }
  ctx.fill();
}

function rasterizeGlyphToBinary(commands, box) {
  const width = Math.max(1, box.xMax - box.xMin);
  const height = Math.max(1, box.yMax - box.yMin);
  const inner = RASTER_SIZE - RASTER_PADDING * 2;
  const scale = inner / Math.max(width, height);
  const tx = RASTER_PADDING + (inner - width * scale) * 0.5 - box.xMin * scale;
  const ty = RASTER_PADDING + (inner - height * scale) * 0.5 + box.yMax * scale;

  const canvas = createRasterCanvas(RASTER_SIZE, RASTER_SIZE);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new Error("2D context is unavailable for glyph rasterization.");
  }

  ctx.clearRect(0, 0, RASTER_SIZE, RASTER_SIZE);
  ctx.fillStyle = "#000";
  ctx.save();
  ctx.translate(tx, ty);
  ctx.scale(scale, -scale);
  drawCommandsAsFill(ctx, commands);
  ctx.restore();

  const data = ctx.getImageData(0, 0, RASTER_SIZE, RASTER_SIZE).data;
  const binary = new Uint8Array(RASTER_SIZE * RASTER_SIZE);
  for (let i = 0; i < RASTER_SIZE * RASTER_SIZE; i += 1) {
    binary[i] = data[i * 4 + 3] > ALPHA_THRESHOLD ? 1 : 0;
  }

  return {
    binary,
    width: RASTER_SIZE,
    height: RASTER_SIZE,
    scale,
    tx,
    ty,
  };
}

const NEIGHBOR_OFFSETS = [
  [0, -1],
  [1, -1],
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
];

function countZeroToOneTransitions(neighbors) {
  let transitions = 0;
  for (let i = 0; i < neighbors.length; i += 1) {
    const current = neighbors[i];
    const next = neighbors[(i + 1) % neighbors.length];
    if (current === 0 && next === 1) {
      transitions += 1;
    }
  }
  return transitions;
}

function zhangSuenThinning(binary, width, height) {
  const data = binary.slice();
  const marked = new Uint8Array(data.length);
  const maxIterations = 92;

  function pixel(x, y) {
    return data[y * width + x];
  }

  function shouldRemove(x, y, phase) {
    const p2 = pixel(x, y - 1);
    const p3 = pixel(x + 1, y - 1);
    const p4 = pixel(x + 1, y);
    const p5 = pixel(x + 1, y + 1);
    const p6 = pixel(x, y + 1);
    const p7 = pixel(x - 1, y + 1);
    const p8 = pixel(x - 1, y);
    const p9 = pixel(x - 1, y - 1);
    const neighbors = [p2, p3, p4, p5, p6, p7, p8, p9];
    const blackNeighbors = neighbors.reduce((sum, value) => sum + value, 0);
    if (blackNeighbors < 2 || blackNeighbors > 6) {
      return false;
    }
    if (countZeroToOneTransitions(neighbors) !== 1) {
      return false;
    }
    if (phase === 1) {
      if (p2 * p4 * p6 !== 0) {
        return false;
      }
      if (p4 * p6 * p8 !== 0) {
        return false;
      }
      return true;
    }
    if (p2 * p4 * p8 !== 0) {
      return false;
    }
    if (p2 * p6 * p8 !== 0) {
      return false;
    }
    return true;
  }

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    let changed = false;

    marked.fill(0);
    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const idx = y * width + x;
        if (!data[idx]) {
          continue;
        }
        if (shouldRemove(x, y, 1)) {
          marked[idx] = 1;
        }
      }
    }
    for (let i = 0; i < data.length; i += 1) {
      if (!marked[i]) {
        continue;
      }
      data[i] = 0;
      changed = true;
    }

    marked.fill(0);
    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const idx = y * width + x;
        if (!data[idx]) {
          continue;
        }
        if (shouldRemove(x, y, 2)) {
          marked[idx] = 1;
        }
      }
    }
    for (let i = 0; i < data.length; i += 1) {
      if (!marked[i]) {
        continue;
      }
      data[i] = 0;
      changed = true;
    }

    if (!changed) {
      break;
    }
  }

  return data;
}

function buildNeighborMap(binary, width, height) {
  const map = new Map();
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const idx = y * width + x;
      if (!binary[idx]) {
        continue;
      }
      const neighbors = [];
      for (const [dx, dy] of NEIGHBOR_OFFSETS) {
        const nx = x + dx;
        const ny = y + dy;
        const nIdx = ny * width + nx;
        if (binary[nIdx]) {
          neighbors.push(nIdx);
        }
      }
      map.set(idx, neighbors);
    }
  }
  return map;
}

function edgeKey(a, b) {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

function nodeSortScore(index, width) {
  const x = index % width;
  const y = Math.floor(index / width);
  return y * 3 + x;
}

function traceSkeletonPath(start, firstNeighbor, neighborMap, visitedEdges) {
  const path = [start, firstNeighbor];
  visitedEdges.add(edgeKey(start, firstNeighbor));
  let prev = start;
  let current = firstNeighbor;

  while (true) {
    const neighbors = neighborMap.get(current) ?? [];
    const degree = neighbors.length;
    const available = neighbors.filter(
      (candidate) =>
        candidate !== prev && !visitedEdges.has(edgeKey(current, candidate)),
    );

    if (degree !== 2) {
      if (!available.length) {
        break;
      }
      break;
    }

    if (!available.length) {
      break;
    }

    const next = available[0];
    path.push(next);
    visitedEdges.add(edgeKey(current, next));
    prev = current;
    current = next;
  }

  return path;
}

function traceCyclePath(start, neighborMap, visitedEdges) {
  const neighbors = neighborMap.get(start) ?? [];
  if (!neighbors.length) {
    return [start];
  }
  const path = [start];
  let prev = null;
  let current = start;

  for (let guard = 0; guard < 4096; guard += 1) {
    const options = (neighborMap.get(current) ?? []).filter((candidate) => candidate !== prev);
    const next = options.find((candidate) => !visitedEdges.has(edgeKey(current, candidate)));
    if (next == null) {
      break;
    }
    visitedEdges.add(edgeKey(current, next));
    path.push(next);
    prev = current;
    current = next;
    if (current === start) {
      break;
    }
  }

  return path;
}

function extractSkeletonPixelPaths(binary, width, height) {
  const neighborMap = buildNeighborMap(binary, width, height);
  const visitedEdges = new Set();
  const paths = [];

  const importantNodes = Array.from(neighborMap.keys())
    .filter((index) => (neighborMap.get(index) ?? []).length !== 2)
    .sort((a, b) => nodeSortScore(a, width) - nodeSortScore(b, width));

  for (const start of importantNodes) {
    const neighbors = neighborMap.get(start) ?? [];
    for (const neighbor of neighbors) {
      const key = edgeKey(start, neighbor);
      if (visitedEdges.has(key)) {
        continue;
      }
      const path = traceSkeletonPath(start, neighbor, neighborMap, visitedEdges);
      if (path.length >= 2) {
        paths.push(path);
      }
    }
  }

  const allNodes = Array.from(neighborMap.keys()).sort(
    (a, b) => nodeSortScore(a, width) - nodeSortScore(b, width),
  );
  for (const start of allNodes) {
    const neighbors = neighborMap.get(start) ?? [];
    for (const neighbor of neighbors) {
      const key = edgeKey(start, neighbor);
      if (visitedEdges.has(key)) {
        continue;
      }
      const path = traceCyclePath(start, neighborMap, visitedEdges);
      if (path.length >= 2) {
        paths.push(path);
      }
    }
  }

  return paths;
}

function smoothStroke(points) {
  if (points.length < 4) {
    return points;
  }
  const output = [points[0]];
  for (let i = 0; i < points.length - 1; i += 1) {
    const p = points[i];
    const q = points[i + 1];
    output.push({
      x: p.x * 0.76 + q.x * 0.24,
      y: p.y * 0.76 + q.y * 0.24,
    });
    output.push({
      x: p.x * 0.24 + q.x * 0.76,
      y: p.y * 0.24 + q.y * 0.76,
    });
  }
  output.push(points[points.length - 1]);
  return output;
}

function simplifyStrokePoints(points, step = 0.004) {
  if (points.length < 3) {
    return points.slice();
  }
  const output = [points[0]];
  let last = points[0];
  for (let i = 1; i < points.length - 1; i += 1) {
    const point = points[i];
    if (distance(last, point) >= step) {
      output.push(point);
      last = point;
    }
  }
  output.push(points[points.length - 1]);
  return output;
}

function reverseStroke(points) {
  return points.slice().reverse();
}

function mergeStrokePair(a, b, maxGap = 0.03) {
  if (a.length < 2 || b.length < 2) {
    return null;
  }

  const aStart = a[0];
  const aEnd = a[a.length - 1];
  const bStart = b[0];
  const bEnd = b[b.length - 1];

  const candidates = [
    {
      gap: distance(aEnd, bStart),
      build: () => a.concat(b.slice(1)),
    },
    {
      gap: distance(aEnd, bEnd),
      build: () => a.concat(reverseStroke(b).slice(1)),
    },
    {
      gap: distance(aStart, bStart),
      build: () => reverseStroke(a).concat(b.slice(1)),
    },
    {
      gap: distance(aStart, bEnd),
      build: () => b.concat(a.slice(1)),
    },
  ];

  const best = candidates.reduce((winner, current) =>
    current.gap < winner.gap ? current : winner,
  );
  if (best.gap > maxGap) {
    return null;
  }

  return dedupePoints(best.build(), 0.0014);
}

function median(values) {
  if (!values.length) {
    return 0;
  }
  const sorted = values.slice().sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[middle];
  }
  return (sorted[middle - 1] + sorted[middle]) * 0.5;
}

function postProcessSkeletonStrokes(strokes) {
  if (!strokes.length) {
    return [];
  }

  let merged = strokes
    .map((stroke) => simplifyStrokePoints(stroke, 0.0028))
    .filter((stroke) => stroke.length >= 2 && strokeLength(stroke) > 0.012);

  for (let pass = 0; pass < 72; pass += 1) {
    let changed = false;
    for (let i = 0; i < merged.length; i += 1) {
      for (let j = i + 1; j < merged.length; j += 1) {
        const fused = mergeStrokePair(merged[i], merged[j], 0.028);
        if (!fused) {
          continue;
        }
        merged[i] = simplifyStrokePoints(smoothStroke(fused), 0.0034);
        merged.splice(j, 1);
        changed = true;
        break;
      }
      if (changed) {
        break;
      }
    }
    if (!changed) {
      break;
    }
  }

  const lengths = merged.map((stroke) => strokeLength(stroke));
  const medianLength = median(lengths);
  const adaptiveMin = Math.max(0.016, medianLength * 0.24);
  let filtered = merged.filter((stroke) => strokeLength(stroke) >= adaptiveMin);

  if (!filtered.length && merged.length) {
    const longest = merged
      .slice()
      .sort((a, b) => strokeLength(b) - strokeLength(a))[0];
    filtered = longest ? [longest] : [];
  }

  const maxStrokeCount = 80;
  if (filtered.length > maxStrokeCount) {
    filtered = filtered
      .slice()
      .sort((a, b) => strokeLength(b) - strokeLength(a))
      .slice(0, maxStrokeCount);
  }

  return filtered
    .map((stroke) => simplifyStrokePoints(stroke, 0.0038))
    .filter((stroke) => stroke.length >= 2 && strokeLength(stroke) > 0.016);
}

function shortStrokeRatio(strokes, threshold = 0.03) {
  if (!strokes.length) {
    return 0;
  }
  let shortCount = 0;
  for (const stroke of strokes) {
    if (strokeLength(stroke) < threshold) {
      shortCount += 1;
    }
  }
  return shortCount / strokes.length;
}

function compactLatinMathStrokes(strokes, char) {
  if (!Array.isArray(strokes) || strokes.length === 0) {
    return [];
  }

  const prepared = strokes
    .map((stroke) => simplifyStrokePoints(stroke, 0.0042))
    .filter((stroke) => stroke.length >= 2 && strokeLength(stroke) > 0.016);
  if (!prepared.length) {
    return [];
  }

  const lengths = prepared.map((stroke) => strokeLength(stroke));
  const longest = lengths.length ? Math.max(...lengths) : 0;
  const isPunctuation = /^[.,:;!?'"()[\]{}|，。、：；（）【】“”‘’《》？！]$/.test(char);
  const isLowercase = /^[a-z]$/.test(char);
  const isUppercase = /^[A-Z]$/.test(char);
  const isDigit = /^[0-9]$/.test(char);
  const isAlnum = isLowercase || isUppercase || isDigit;
  const keepDot = char === "i" || char === "j";

  function strokeCentroidY(stroke) {
    let sy = 0;
    for (const point of stroke) {
      sy += point.y;
    }
    return sy / Math.max(1, stroke.length);
  }

  if (keepDot) {
    const ranked = prepared
      .map((stroke, index) => ({
        stroke,
        length: lengths[index],
        centroidY: strokeCentroidY(stroke),
      }))
      .sort((a, b) => b.length - a.length);
    const main = ranked[0];
    const dot = ranked.find(
      (item, index) =>
        index > 0 &&
        item.length >= Math.max(0.03, main.length * 0.06) &&
        item.length <= main.length * 0.45 &&
        item.centroidY < main.centroidY - 0.18,
    );
    const selected = dot ? [main.stroke, dot.stroke] : [main.stroke];
    return selected.sort((a, b) => contourOrderScore(a) - contourOrderScore(b));
  }

  if (isAlnum) {
    const ranked = prepared
      .map((stroke, index) => ({
        stroke,
        length: lengths[index],
      }))
      .sort((a, b) => b.length - a.length);
    const dominantLength = ranked[0]?.length ?? 0;
    const minLength = Math.max(
      0.022,
      dominantLength *
        (isUppercase ? 0.12 : isDigit ? 0.1 : 0.085),
    );
    let maxStrokeCount = isUppercase ? 4 : isDigit ? 4 : 3;
    if (/[MWmw]/.test(char)) {
      maxStrokeCount += 1;
    }
    if (/[8BQRabdegpqy]/.test(char)) {
      maxStrokeCount = Math.max(maxStrokeCount, 4);
    }

    let selected = ranked.filter((item) => item.length >= minLength);
    if (!selected.length && ranked.length) {
      selected = [ranked[0]];
    }

    selected = selected.slice(0, maxStrokeCount);

    // For glyphs where the longest segment dominates too much, keep at least one
    // secondary segment to avoid turning letters into a single abstract curve.
    if (selected.length === 1 && ranked.length > 1) {
      const helper = ranked.find(
        (item, index) =>
          index > 0 &&
          item.length >= Math.max(0.028, dominantLength * 0.18),
      );
      if (helper) {
        selected.push(helper);
      }
    }

    return selected
      .map((item) => item.stroke)
      .sort((a, b) => contourOrderScore(a) - contourOrderScore(b));
  }

  const minLength = isPunctuation
    ? Math.max(0.02, longest * 0.42)
    : Math.max(0.024, longest * 0.1);

  let kept = prepared.filter((stroke, index) => lengths[index] >= minLength);
  if (!kept.length && prepared.length) {
    const longestIndex = lengths.indexOf(longest);
    kept = longestIndex >= 0 ? [prepared[longestIndex]] : [];
  }

  const maxStrokeCount = isPunctuation ? 2 : 8;
  if (kept.length > maxStrokeCount) {
    kept = kept
      .slice()
      .sort((a, b) => strokeLength(b) - strokeLength(a))
      .slice(0, maxStrokeCount);
  }

  return kept
    .sort((a, b) => contourOrderScore(a) - contourOrderScore(b));
}

function isLikelyHanChar(char) {
  if (!char) {
    return false;
  }
  const codePoint = char.codePointAt(0);
  if (!codePoint) {
    return false;
  }
  return (
    (codePoint >= 0x3400 && codePoint <= 0x4dbf) ||
    (codePoint >= 0x4e00 && codePoint <= 0x9fff) ||
    (codePoint >= 0xf900 && codePoint <= 0xfaff) ||
    (codePoint >= 0x20000 && codePoint <= 0x2a6df)
  );
}

function isLikelyLatinMathChar(char) {
  if (!char) {
    return false;
  }
  return /^[A-Za-z0-9]$/.test(char) || /[+\-*/=<>()[\]{}_^.,:;!?|\\√∑Σ∫π∞≈≤≥≠±×÷]/.test(char);
}

function shouldPreferSkeleton(skeletonStrokes, contourStrokes, char) {
  if (!skeletonStrokes.length) {
    return false;
  }
  if (!contourStrokes.length) {
    return true;
  }

  const skeletonCount = skeletonStrokes.length;
  const contourCount = contourStrokes.length;
  const hanChar = isLikelyHanChar(char);
  const latinMathChar = isLikelyLatinMathChar(char);
  const latinAlnumChar = /^[A-Za-z0-9]$/.test(char);
  const punctuationChar = /^[.,:;!?'"()[\]{}|，。、：；（）【】“”‘’《》？！]$/.test(char);
  const shortRatio = shortStrokeRatio(skeletonStrokes, hanChar ? 0.036 : 0.03);

  if (hanChar) {
    if (skeletonCount > 72) {
      return false;
    }
    if (contourCount >= 3 && skeletonCount > contourCount * 4.2) {
      return false;
    }
    if (shortRatio > 0.58) {
      return false;
    }
    return true;
  }

  // For Latin/digits/math, centerline skeleton usually looks far more like
  // human pen movement than contour tracing.
  if (latinMathChar) {
    // For alnum glyphs we prefer contour first: it preserves font identity better,
    // which is required when static and dynamic rendering should stay visually aligned.
    if (latinAlnumChar) {
      return false;
    }
    if (punctuationChar) {
      if (skeletonCount > 4) {
        return false;
      }
      if (shortRatio > 0.36) {
        return false;
      }
      return true;
    }
    if (skeletonCount > 34) {
      return false;
    }
    if (shortRatio > 0.62) {
      return false;
    }
    return true;
  }

  if (skeletonCount > 44) {
    return false;
  }
  if (skeletonCount > contourCount * 3.2) {
    return false;
  }
  if (shortRatio > 0.46) {
    return false;
  }
  return true;
}

function mapPixelIndexToNormalizedPoint(index, raster, box) {
  const x = (index % raster.width) + 0.5;
  const y = Math.floor(index / raster.width) + 0.5;
  const fontX = (x - raster.tx) / raster.scale;
  const fontY = (raster.ty - y) / raster.scale;
  return {
    x: (fontX - box.xMin) / box.width,
    y: (fontY - box.yMin) / box.height,
  };
}

function normalizeSkeletonPaths(pixelPaths, raster, box) {
  return pixelPaths
    .map((path) => path.map((index) => mapPixelIndexToNormalizedPoint(index, raster, box)))
    .map((path) => dedupePoints(path, 0.0018))
    .map((path) => smoothStroke(path))
    .map((path) => simplifyStrokePoints(path, 0.0028))
    .map((path) =>
      path.filter(
        (point) =>
          Number.isFinite(point.x) &&
          Number.isFinite(point.y) &&
          point.x >= -0.35 &&
          point.x <= 1.35 &&
          point.y >= -0.35 &&
          point.y <= 1.35,
      ),
    )
    .filter((path) => path.length >= 2 && strokeLength(path) > 0.018)
    .sort((a, b) => contourOrderScore(a) - contourOrderScore(b));
}

function extractSkeletonStrokes(commands, box) {
  const raster = rasterizeGlyphToBinary(commands, box);
  const thinned = zhangSuenThinning(raster.binary, raster.width, raster.height);
  const pixelPaths = extractSkeletonPixelPaths(thinned, raster.width, raster.height);
  if (!pixelPaths.length) {
    return [];
  }
  return normalizeSkeletonPaths(pixelPaths, raster, box);
}

async function loadOpenTypeRuntime() {
  if (globalThis.opentype?.parse) {
    return globalThis.opentype;
  }

  if (!openTypeRuntimePromise) {
    openTypeRuntimePromise = (async () => {
      const failures = [];
      for (const moduleUrl of OPEN_TYPE_MODULE_URLS) {
        try {
          const module = await import(moduleUrl);
          const runtime = module?.default ?? module;
          if (!runtime?.parse) {
            failures.push(`no-parse@${moduleUrl}`);
            continue;
          }
          return runtime;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          failures.push(`${message}@${moduleUrl}`);
        }
      }
      throw new Error(`opentype.js runtime is unavailable: ${failures.join(" | ")}`);
    })();
  }

  return openTypeRuntimePromise;
}

function detectFontDisplayName(font) {
  return (
    font?.names?.preferredFamily?.en ||
    font?.names?.fontFamily?.en ||
    font?.names?.fullName?.en ||
    "CustomUploadedFont"
  );
}

export async function createUniversalFontMapper(arrayBuffer) {
  if (!(arrayBuffer instanceof ArrayBuffer)) {
    throw new Error("Expected ArrayBuffer for font parsing.");
  }

  const opentype = await loadOpenTypeRuntime();
  const font = opentype.parse(arrayBuffer);
  const unitsPerEm = Math.max(256, font.unitsPerEm || 1000);
  const glyphCache = new Map();

  return {
    displayName: detectFontDisplayName(font),
    async getGlyph(char) {
      if (!char || char === " " || char === "\t" || char === "\n" || char === "\r") {
        return null;
      }

      if (glyphCache.has(char)) {
        return glyphCache.get(char);
      }

      const glyph = font.charToGlyph(char);
      if (!glyph) {
        glyphCache.set(char, null);
        return null;
      }

      if (glyph.index === 0) {
        glyphCache.set(char, null);
        return null;
      }

      const path = glyph.getPath(0, 0, unitsPerEm);
      const contours = buildContoursFromCommands(path.commands || []);
      if (!contours.length) {
        glyphCache.set(char, null);
        return null;
      }
      const latinMathChar = isLikelyLatinMathChar(char);

      const contourBox = deriveBoxFromContours(contours);
      const glyphBox = glyph.getBoundingBox();
      // In opentype.js, glyph.getPath() uses Y direction opposite to glyph.getBoundingBox().
      // So fallback metrics box must flip Y to align with actual path command coordinates.
      const metricsXMin = Number.isFinite(glyphBox.x1) ? glyphBox.x1 : 0;
      const metricsXMax = Number.isFinite(glyphBox.x2)
        ? glyphBox.x2
        : metricsXMin + unitsPerEm * 0.65;
      const metricsYMin = Number.isFinite(glyphBox.y1) ? glyphBox.y1 : -unitsPerEm * 0.2;
      const metricsYMax = Number.isFinite(glyphBox.y2) ? glyphBox.y2 : unitsPerEm * 0.8;
      const fallbackMetricsBox = {
        xMin: metricsXMin,
        xMax: metricsXMax,
        yMin: -metricsYMax,
        yMax: -metricsYMin,
        width: Math.max(1, metricsXMax - metricsXMin),
        height: Math.max(1, metricsYMax - metricsYMin),
      };
      const boxInfo = contourBox ?? fallbackMetricsBox;
      const skeletonStrokesRaw = extractSkeletonStrokes(path.commands || [], boxInfo);
      const skeletonStrokes = postProcessSkeletonStrokes(skeletonStrokesRaw);
      let contourStrokes = normalizeContours(contours, boxInfo, {
        splitAtCorners: !latinMathChar,
      });
      if (!contourStrokes.length) {
        const fallbackBox = deriveBoxFromContours(contours);
        if (fallbackBox) {
          contourStrokes = normalizeContours(contours, fallbackBox, {
            splitAtCorners: !latinMathChar,
          });
        }
      }
      let useSkeleton = shouldPreferSkeleton(skeletonStrokes, contourStrokes, char);
      let normalizedStrokes = useSkeleton
        ? skeletonStrokes
        : contourStrokes.length
          ? contourStrokes
          : skeletonStrokes;
      let source = useSkeleton ? "font-map-skeleton" : "font-map-contour";

      if (!normalizedStrokes.length && skeletonStrokesRaw.length) {
        normalizedStrokes = skeletonStrokesRaw;
        source = "font-map-skeleton";
      }

      if (latinMathChar) {
        normalizedStrokes = compactLatinMathStrokes(normalizedStrokes, char);
      }

      if (!normalizedStrokes.length) {
        glyphCache.set(char, null);
        return null;
      }

      const boxWidthUnits = Math.max(
        1,
        Number.isFinite(boxInfo.width) ? boxInfo.width : fallbackMetricsBox.width,
      );
      const rawAdvanceWidth = glyph.advanceWidth || boxWidthUnits;
      const normalizedAdvance = rawAdvanceWidth / boxWidthUnits;
      const advance = clamp(
        normalizedAdvance,
        latinMathChar ? 0.5 : 0.34,
        latinMathChar ? 1.18 : 1.38,
      );

      const result = {
        advance,
        strokes: normalizedStrokes,
        isUniversalFontGlyph: true,
        source,
        preferredStrokes: normalizedStrokes,
        skeletonStrokes: skeletonStrokes.length ? skeletonStrokes : normalizedStrokes,
        contourStrokes: contourStrokes.length ? contourStrokes : normalizedStrokes,
      };
      glyphCache.set(char, result);
      return result;
    },
  };
}
