import { useEffect, useRef } from "react";

type DemoHandle = { destroy: () => void };
type DemoFactory = (canvas: HTMLCanvasElement, toolbar: HTMLElement) => DemoHandle;

/** Run the exhibition's own simulation, then retain a real frame as the thumbnail. */
export function AlifeDemoPreview({ demo, label }: { demo: string; label: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    let started = false;
    let handle: DemoHandle | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || started) return;
      started = true;
      const moduleUrl = new URL("/alife/js/demos/index.js", window.location.origin).href;
      void import(/* @vite-ignore */ moduleUrl)
        .then((module: { loadDemoFactory: (id: string) => Promise<DemoFactory | null> }) => module.loadDemoFactory(demo))
        .then((factory) => {
          if (disposed || !factory) return;
          const toolbar = document.createElement("div");
          handle = factory(canvas, toolbar);
          // Keep only the captured canvas frame; no ongoing work for 188 catalog entries.
          timer = setTimeout(() => { handle?.destroy(); handle = undefined; }, 1800);
        })
        .catch(() => {
          if (disposed) return;
          const context = canvas.getContext("2d");
          if (context) { context.fillStyle = "#263d34"; context.fillRect(0, 0, 320, 180); context.fillStyle = "#fff"; context.font = "16px sans-serif"; context.fillText("Demo unavailable", 70, 95); }
        });
    }, { threshold: 0.05 });
    observer.observe(canvas);
    return () => { disposed = true; observer.disconnect(); clearTimeout(timer); handle?.destroy(); };
  }, [demo]);
  return <canvas ref={canvasRef} width={320} height={180} role="img" aria-label={label} />;
}
