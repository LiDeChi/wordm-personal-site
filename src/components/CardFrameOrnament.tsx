/** Small printer's ornaments, drawn into the same interrupted page rule. */
const MOTIFS: Record<string, string> = {
  alife:
    "M49 3h4v4h-4z M55 9h4v4h-4z M43 15h4v4h-4z M49 15h4v4h-4z M55 15h4v4h-4z",
  ringbook:
    "M65 14c-3 4-15 4-18 0s0-10 9-10 15 6 11 10 M61 12c-2 3-8 3-10 0s0-5 5-5 8 3 6 5",
  "museum-book":
    "M40 17h32 M44 17V9a5 5 0 0 1 10 0v8 M58 17V9a5 5 0 0 1 10 0v8 M48 17v-6 M64 17v-6",
  flipook:
    "M56 18c-5-3-10-4-17-3V5c7-1 12 0 17 3v10c5-3 10-4 17-3V5c-5-1-10 0-14 2 M56 18c0-7 3-12 9-15v10c-4 1-7 3-9 5",
  shijing:
    "M37 16q5-3 10 0t10 0t10 0t10 0 M43 19h26 M52 14V4m0 7-5-5m5 2 4-5 M62 14V7m0 5 5-5",
  wanjuan:
    "M37 18h38 M41 18v-4h10v4 M48 14v-4h12v8 M57 10V6h13v12 M44 16h4 M51 12h6 M60 8h7 M63 12h4 M63 15h4",
  manuscript:
    "M40 5h15 M40 9h11 M40 13h8 M40 17h16 M56 18C58 9 64 4 73 3c-1 8-6 13-15 13 M57 17 68 7",
};

export function CardFrameOrnament({ projectKey }: { projectKey?: string }) {
  return (
    <div className="father-card-ornament" aria-hidden="true">
      <svg
        className="father-card-ornament-mark"
        width="112"
        height="22"
        viewBox="0 0 112 22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <path className="father-card-ornament-rule" d="M1 1h25m60 0h25 M29 1h4 M79 1h4" />
        <path d={MOTIFS[projectKey ?? "manuscript"] ?? MOTIFS.manuscript} />
      </svg>
      <svg
        className="father-card-ornament-corner"
        width="22"
        height="22"
        viewBox="0 0 22 22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M4 1v11a6 6 0 0 0 6 6h11 M8 9v3a2 2 0 0 0 2 2h3" />
      </svg>
    </div>
  );
}
