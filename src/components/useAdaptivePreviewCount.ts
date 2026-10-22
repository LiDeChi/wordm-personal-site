import { useEffect, useRef, useState } from "react";

/** Fill the available panel with a small buffer, independent of scrolling. */
export function useAdaptivePreviewCount(total: number) {
  const previewsRef = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(12);

  useEffect(() => {
    const node = previewsRef.current;
    if (!node) return;
    const observer = new ResizeObserver(() => {
      // Preview rows are at least 88px tall; 80px leaves room for font reflow.
      setCount(Math.min(total, Math.max(4, Math.ceil(node.clientHeight / 80) + 2)));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [total]);

  return { previewsRef, previewCount: Math.min(total, count) };
}
