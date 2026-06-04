const SVG_NS = "http://www.w3.org/2000/svg";
const HANZI_COORDINATE_SCALE = 1024;
const HANZI_TOP_Y = 900;

let hiddenPathNode = null;

function ensurePathNode() {
  if (hiddenPathNode) {
    return hiddenPathNode;
  }

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("width", "0");
  svg.setAttribute("height", "0");
  svg.setAttribute("aria-hidden", "true");
  svg.style.position = "absolute";
  svg.style.opacity = "0";
  svg.style.pointerEvents = "none";
  svg.style.overflow = "hidden";

  const path = document.createElementNS(SVG_NS, "path");
  svg.appendChild(path);
  document.body.appendChild(svg);

  hiddenPathNode = path;
  return path;
}

export function sampleSvgPath(pathData, step = 28, scale = HANZI_COORDINATE_SCALE) {
  const pathNode = ensurePathNode();
  pathNode.setAttribute("d", pathData);

  let totalLength = 0;
  try {
    totalLength = pathNode.getTotalLength();
  } catch (error) {
    return [];
  }

  if (!Number.isFinite(totalLength) || totalLength <= 0) {
    return [];
  }

  const segmentCount = Math.max(3, Math.ceil(totalLength / step));
  const points = [];

  for (let i = 0; i <= segmentCount; i += 1) {
    const lengthAt = (totalLength * i) / segmentCount;
    const point = pathNode.getPointAtLength(lengthAt);
    points.push({
      x: point.x / scale,
      // make-me-a-hanzi paths use y-up style coordinates (top near 900).
      y: (HANZI_TOP_Y - point.y) / scale,
    });
  }

  return points;
}
