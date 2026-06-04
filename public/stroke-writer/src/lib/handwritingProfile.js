function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function asNumber(value, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function roundTo(value, digits = 4) {
  const factor = 10 ** digits;
  return Math.round((Number(value) || 0) * factor) / factor;
}

export const DEFAULT_HANDWRITING_CONTROLS = Object.freeze({
  fontSize: 72,
  penWidth: 4,
  styleThickness: 100,
  speed: 118,
  jitter: 3,
  speedVariation: 3,
  humanize: 6,
  strokePause: 28,
  charPause: 84,
  letterSpacing: 2,
  lineHeight: 138,
  scribble: 4,
  breathing: 4,
  layoutDensity: 78,
  inkColor: "#1f2a30",
});

export function normalizeHandwritingControls(input = {}) {
  const next = { ...DEFAULT_HANDWRITING_CONTROLS };
  next.fontSize = clamp(asNumber(input.fontSize, next.fontSize), 34, 116);
  next.penWidth = clamp(asNumber(input.penWidth, next.penWidth), 1, 10);
  next.styleThickness = clamp(asNumber(input.styleThickness, next.styleThickness), 35, 220);
  next.speed = clamp(asNumber(input.speed, next.speed), 20, 420);
  next.jitter = clamp(asNumber(input.jitter, next.jitter), 0, 100);
  next.speedVariation = clamp(asNumber(input.speedVariation, next.speedVariation), 2, 60);
  next.humanize = clamp(asNumber(input.humanize, next.humanize), 0, 100);
  next.strokePause = clamp(asNumber(input.strokePause, next.strokePause), 0, 160);
  next.charPause = clamp(asNumber(input.charPause, next.charPause), 0, 260);
  next.letterSpacing = clamp(asNumber(input.letterSpacing, next.letterSpacing), -10, 20);
  next.lineHeight = clamp(asNumber(input.lineHeight, next.lineHeight), 105, 190);
  next.scribble = clamp(asNumber(input.scribble, next.scribble), 0, 100);
  next.breathing = clamp(asNumber(input.breathing, next.breathing), 0, 100);
  next.layoutDensity = clamp(asNumber(input.layoutDensity, next.layoutDensity), 30, 96);
  next.inkColor = /^#[0-9a-f]{6}$/i.test(String(input.inkColor ?? ""))
    ? String(input.inkColor)
    : next.inkColor;
  return next;
}

export function buildHandwritingProfile(rawControls = {}, options = {}) {
  const controls = normalizeHandwritingControls(rawControls);
  const documentLayoutMode = Boolean(options.documentLayoutMode);
  const boardLectureMode = Boolean(options.boardLectureMode);
  const scribble = clamp(controls.scribble / 100, 0, 1);
  const breathing = clamp(controls.breathing / 100, 0, 1);
  const density = clamp(controls.layoutDensity / 100, 0, 1);
  const humanize = clamp(controls.humanize / 100, 0, 1);
  const structureAwareness = clamp(
    0.95 - scribble * 0.26 + (1 - density) * 0.06 + (boardLectureMode ? 0.055 : 0),
    0.5,
    0.992,
  );
  const compactness = clamp(0.72 + density * 0.36 + (boardLectureMode ? 0.06 : 0), 0.66, 1.08);
  const baselineDrift = roundTo(
    (documentLayoutMode ? 0.008 : 0.012) * (boardLectureMode ? 0.02 + scribble * 0.05 : 0.18 + scribble * 0.38),
  );
  const breathingAmplitude = roundTo(
    (documentLayoutMode ? 0.004 : 0.007) * (boardLectureMode ? 0.12 : 1) +
      breathing * (boardLectureMode ? 0.0012 : 0.009),
  );
  const breathingPeriodMs = Math.round((boardLectureMode ? 9200 : 6800) - breathing * (boardLectureMode ? 400 : 1600));
  const breathingSpeedSwing = roundTo((boardLectureMode ? 0.0012 : 0.008) + breathing * (boardLectureMode ? 0.005 : 0.032));
  const spacingTightness = roundTo(
    clamp(
      (boardLectureMode ? 0.97 : 0.98) - density * (boardLectureMode ? 0.1 : 0.14) + scribble * (boardLectureMode ? 0.015 : 0.03),
      boardLectureMode ? 0.82 : 0.78,
      1.02,
    ),
  );
  const lineCompression = roundTo(clamp((boardLectureMode ? 0.98 : 1.01) - density * 0.1, 0.86, 1.01));

  return {
    controls,
    documentLayoutMode,
    boardLectureMode,
    scribble,
    breathing,
    density,
    humanize,
    compactness,
    structureAwareness,
    baselineDrift,
    breathingAmplitude,
    breathingPeriodMs,
    breathingSpeedSwing,
    spacingTightness,
    lineCompression,
  };
}

export function controlsToRenderStyle(rawControls = {}, options = {}) {
  const profile = buildHandwritingProfile(rawControls, options);
  const { controls } = profile;
  const humanizeBase = controls.humanize / 100;
  return {
    speedPxPerSec: profile.boardLectureMode ? Math.min(controls.speed, 52) : controls.speed,
    thickness: controls.styleThickness / 100,
    jitter: clamp(
      (controls.jitter / 100) *
        (profile.boardLectureMode ? 0.08 + profile.scribble * 0.08 : 0.42 + profile.scribble * 0.38),
      0,
      profile.boardLectureMode ? 0.018 : 0.72,
    ),
    speedVariation: clamp(
      (controls.speedVariation / 100) *
        (profile.boardLectureMode ? 0.16 + profile.breathing * 0.06 : 0.54 + profile.breathing * 0.32),
      profile.boardLectureMode ? 0.01 : 0.02,
      profile.boardLectureMode ? 0.06 : 0.32,
    ),
    humanize: clamp(
      humanizeBase *
        (
          profile.boardLectureMode
            ? 0.18 + profile.scribble * 0.05 + profile.breathing * 0.03
            : 0.58 + profile.scribble * 0.24 + profile.breathing * 0.08
        ),
      0,
      profile.boardLectureMode ? 0.08 : 0.42,
    ),
    strokePauseMs: Math.round(controls.strokePause * (0.92 + profile.breathing * 0.12)),
    charPauseMs: Math.round(controls.charPause * (0.9 + profile.breathing * 0.18)),
    inkColor: controls.inkColor,
    liveLectureMode: true,
    boardLectureMode: profile.boardLectureMode,
    cleanBoardMode: profile.boardLectureMode,
    scribbleLevel: profile.scribble,
    breathingAmount: profile.breathing,
    breathingAmplitude: profile.breathingAmplitude,
    breathingPeriodMs: profile.breathingPeriodMs,
    breathingSpeedSwing: profile.breathingSpeedSwing,
    baselineDrift: profile.baselineDrift,
    layoutDensity: profile.density,
    structureAwareness: profile.structureAwareness,
  };
}

export function resolveLayoutTuning(rawControls = {}, options = {}) {
  const profile = buildHandwritingProfile(rawControls, options);
  const { controls, documentLayoutMode } = profile;
  const fontScale = documentLayoutMode ? 0.52 : 1;
  const baseFontSize = documentLayoutMode
    ? clamp(controls.fontSize * fontScale, 16, 84)
    : controls.fontSize;
  const densityLineScale = documentLayoutMode
    ? clamp((profile.boardLectureMode ? 0.93 : 0.96) - profile.density * 0.08, 0.82, 0.96)
    : clamp((profile.boardLectureMode ? 0.96 : 0.99) - profile.density * 0.08, 0.84, 1.01);
  const densityLetterScale = documentLayoutMode
    ? clamp((profile.boardLectureMode ? 0.82 : 0.88) - profile.density * 0.08, 0.62, 0.9)
    : clamp((profile.boardLectureMode ? 0.92 : 1) - profile.density * 0.08, 0.76, 1.01);
  const baseLineHeight = documentLayoutMode
    ? baseFontSize * (clamp(controls.lineHeight, 102, 188) / 100) * (profile.boardLectureMode ? 0.82 : 0.82)
    : controls.fontSize * (clamp(controls.lineHeight, 102, 210) / 100);
  const baseLetterSpacing = documentLayoutMode
    ? baseFontSize * (clamp(controls.letterSpacing, -20, 24) / 100) * (profile.boardLectureMode ? 0.6 : 0.72)
    : controls.fontSize * (clamp(controls.letterSpacing, -20, 28) / 100);
  const padding = Math.round(
    (documentLayoutMode ? (profile.boardLectureMode ? 34 : 40) : 56) *
      clamp(1.05 - profile.density * 0.18, profile.boardLectureMode ? 0.72 : 0.8, 1.05),
  );

  return {
    profile,
    tunedFontSize: baseFontSize,
    tunedLineHeight: roundTo(baseLineHeight * densityLineScale, 3),
    tunedLetterSpacing: roundTo(baseLetterSpacing * densityLetterScale * profile.spacingTightness, 3),
    tunedPadding: padding,
    paragraphIndentChars: documentLayoutMode ? (profile.boardLectureMode ? 0 : 2) : 0,
    layoutDensity: profile.density,
    structureAwareness: profile.structureAwareness,
    compactness: profile.compactness,
  };
}
