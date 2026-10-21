import katex from "katex";

export function MathText({ text }: { text: string }) {
  const segments = text.split(/(\$\$[\s\S]+?\$\$|\$(?:\\.|[^$\n])+\$)/g);
  return segments.map((segment, index) => {
    const displayMode = segment.startsWith("$$") && segment.endsWith("$$");
    const inlineMode = !displayMode && segment.startsWith("$") && segment.endsWith("$");
    if (!displayMode && !inlineMode) return segment;
    const expression = displayMode ? segment.slice(2, -2) : segment.slice(1, -1);
    return (
      <span
        key={`math-${index}`}
        className={displayMode ? "father-math-display" : "father-math"}
        dangerouslySetInnerHTML={{
          __html: katex.renderToString(expression, {
            displayMode,
            throwOnError: false,
            trust: false,
          }),
        }}
      />
    );
  });
}
