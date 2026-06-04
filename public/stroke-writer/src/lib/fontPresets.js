export const FONT_PRESETS = Object.freeze([
  {
    id: "kalam-fira",
    label: "工整手稿 · Kalam + Fira Math",
    fontSources: {
      latinPrimary: "./assets/fonts/Kalam-Regular.ttf",
      latinFallback: "./assets/fonts/PatrickHand-Regular.ttf",
      hanPrimary: "./assets/fonts/LXGWWenKai-Regular.ttf",
      mathPrimary: "./assets/fonts/FiraMath-Regular.otf",
      mathFallback: "./assets/fonts/XITSMath-Regular.otf",
    },
    staticFamilies: {
      latin: ["SW-Kalam", "Kalam", "SW-PatrickHandPrimary", "SW-PatrickHand", "Patrick Hand", "Segoe Print", "sans-serif"],
      han: ["SW-LXGWWenKai", "LXGWWenKai", "KaiTi", "PingFang SC", "Hiragino Sans GB", "Noto Sans CJK SC", "sans-serif"],
      math: ["SW-FiraMath", "SW-XITSMath", "Cambria Math", "STIX Two Math", "Times New Roman", "serif"],
    },
  },
  {
    id: "mathilde-xits",
    label: "轻盈手稿 · Mathilde + XITS Math",
    fontSources: {
      latinPrimary: "./assets/fonts/mathilde-ttf.ttf",
      latinFallback: "./assets/fonts/Kalam-Regular.ttf",
      hanPrimary: "./assets/fonts/LXGWWenKai-Regular.ttf",
      mathPrimary: "./assets/fonts/XITSMath-Regular.otf",
      mathFallback: "./assets/fonts/FiraMath-Regular.otf",
    },
    staticFamilies: {
      latin: ["SW-Mathilde", "Mathilde", "SW-Kalam", "Kalam", "SW-PatrickHandPrimary", "Patrick Hand", "sans-serif"],
      han: ["SW-LXGWWenKai", "LXGWWenKai", "KaiTi", "PingFang SC", "Hiragino Sans GB", "Noto Sans CJK SC", "sans-serif"],
      math: ["SW-XITSMath", "SW-FiraMath", "Cambria Math", "STIX Two Math", "Times New Roman", "serif"],
    },
  },
  {
    id: "indie-fira",
    label: "松弛手稿 · Indie Flower + Fira Math",
    fontSources: {
      latinPrimary: "./assets/fonts/IndieFlower-Regular.ttf",
      latinFallback: "./assets/fonts/Kalam-Regular.ttf",
      hanPrimary: "./assets/fonts/LXGWWenKai-Regular.ttf",
      mathPrimary: "./assets/fonts/FiraMath-Regular.otf",
      mathFallback: "./assets/fonts/XITSMath-Regular.otf",
    },
    staticFamilies: {
      latin: ["SW-IndieFlower", "Indie Flower", "SW-Kalam", "Kalam", "SW-PatrickHandPrimary", "Patrick Hand", "sans-serif"],
      han: ["SW-LXGWWenKai", "LXGWWenKai", "KaiTi", "PingFang SC", "Hiragino Sans GB", "Noto Sans CJK SC", "sans-serif"],
      math: ["SW-FiraMath", "SW-XITSMath", "Cambria Math", "STIX Two Math", "Times New Roman", "serif"],
    },
  },
  {
    id: "board-lecture",
    label: "名校板书 · Kalam + XITS Math",
    fontSources: {
      latinPrimary: "./assets/fonts/Kalam-Regular.ttf",
      latinFallback: "./assets/fonts/ArchitectsDaughter-Regular.ttf",
      hanPrimary: "./assets/fonts/LXGWWenKai-Regular.ttf",
      mathPrimary: "./assets/fonts/XITSMath-Regular.otf",
      mathFallback: "./assets/fonts/FiraMath-Regular.otf",
    },
    staticFamilies: {
      latin: [
        "SW-Kalam",
        "Kalam",
        "SW-ArchitectsDaughter",
        "Architects Daughter",
        "SW-PatrickHandPrimary",
        "Patrick Hand",
        "SW-PatrickHand",
        "sans-serif",
      ],
      han: ["SW-LXGWWenKai", "LXGWWenKai", "KaiTi", "PingFang SC", "Hiragino Sans GB", "Noto Sans CJK SC", "sans-serif"],
      math: ["SW-XITSMath", "SW-FiraMath", "Cambria Math", "STIX Two Math", "Times New Roman", "serif"],
    },
    controls: {
      fontSize: 64,
      penWidth: 2.4,
      styleThickness: 80,
      speed: 28,
      jitter: 0,
      speedVariation: 2,
      humanize: 2,
      strokePause: 10,
      charPause: 24,
      letterSpacing: 2,
      lineHeight: 114,
      scribble: 0,
      breathing: 0,
      layoutDensity: 90,
      inkColor: "#182126",
    },
    behavior: {
      boardLectureMode: true,
      paragraphIndentChars: 0,
    },
  },
]);

export const DEFAULT_FONT_PRESET_ID = "board-lecture";

export function getFontPresetById(presetId) {
  return FONT_PRESETS.find((preset) => preset.id === presetId) ?? FONT_PRESETS[0];
}

export function buildStaticFontStackFromPreset(preset) {
  return {
    latin: preset.staticFamilies.latin.map((name) => `"${name}"`).join(","),
    han: preset.staticFamilies.han.map((name) => `"${name}"`).join(","),
    math: preset.staticFamilies.math.map((name) => `"${name}"`).join(","),
  };
}
