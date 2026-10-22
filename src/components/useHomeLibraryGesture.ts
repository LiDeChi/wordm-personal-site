import { useEffect, useRef } from "react";

type HomeLibrary = "projects" | "articles";

/** Home-only, passive recognition; the browser owns scrolling and touch panning. */
export function useHomeLibraryGesture(onOpen: (surface: HomeLibrary) => void) {
  const landingRef = useRef<HTMLDivElement>(null);
  const triggered = useRef(false);

  useEffect(() => {
    const node = landingRef.current;
    if (!node) return;
    let touch: { id: number; x: number; y: number; surface: HomeLibrary } | null = null;
    let wheel: { start: number; distance: number; surface: HomeLibrary } | null = null;
    const surfaceAt = (target: EventTarget | null): HomeLibrary | null => {
      const surface = target instanceof Element ? target.closest<HTMLElement>("[data-home-surface]")?.dataset.homeSurface : null;
      return surface === "projects" || surface === "articles" ? surface : null;
    };
    const open = (surface: HomeLibrary) => {
      if (triggered.current) return;
      triggered.current = true;
      touch = null;
      wheel = null;
      onOpen(surface);
    };
    const onWheel = (event: WheelEvent) => {
      const surface = surfaceAt(event.target);
      if (!surface || touch || event.ctrlKey || event.shiftKey || event.deltaY <= 0 || Math.abs(event.deltaX) * 1.3 >= event.deltaY) {
        wheel = null;
        return;
      }
      const distance = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? node.clientHeight : 1);
      if (distance < 1) return;
      const now = performance.now();
      if (!wheel || wheel.surface !== surface || now - wheel.start > 180) wheel = { start: now, distance: 0, surface };
      wheel.distance += distance;
      if (wheel.distance >= 72) open(surface);
    };
    const onTouchStart = (event: TouchEvent) => {
      wheel = null;
      touch = null;
      const surface = surfaceAt(event.target);
      if (event.ctrlKey || event.touches.length !== 1 || !surface) return;
      const finger = event.touches[0];
      touch = { id: finger.identifier, x: finger.clientX, y: finger.clientY, surface };
    };
    const onTouchMove = (event: TouchEvent) => {
      if (event.ctrlKey || event.touches.length !== 1) touch = null;
    };
    const onTouchEnd = (event: TouchEvent) => {
      const start = touch;
      touch = null;
      if (!start || event.ctrlKey || event.touches.length !== 0) return;
      const finger = Array.from(event.changedTouches).find((item) => item.identifier === start.id);
      if (!finger) return;
      const upward = start.y - finger.clientY;
      if (upward >= 56 && upward > Math.abs(finger.clientX - start.x) * 1.3) open(start.surface);
    };
    const cancel = () => { touch = null; wheel = null; };
    node.addEventListener("wheel", onWheel, { passive: true });
    node.addEventListener("touchstart", onTouchStart, { passive: true });
    node.addEventListener("touchmove", onTouchMove, { passive: true });
    node.addEventListener("touchend", onTouchEnd, { passive: true });
    node.addEventListener("touchcancel", cancel, { passive: true });
    return () => {
      node.removeEventListener("wheel", onWheel);
      node.removeEventListener("touchstart", onTouchStart);
      node.removeEventListener("touchmove", onTouchMove);
      node.removeEventListener("touchend", onTouchEnd);
      node.removeEventListener("touchcancel", cancel);
    };
  }, [onOpen]);

  return landingRef;
}
