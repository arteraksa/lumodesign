"use client";

import { useEffect, useRef } from "react";

export function PointerGlow() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (matchMedia("(pointer: coarse), (prefers-reduced-motion: reduce)").matches) return;
    const move = (event: PointerEvent) => {
      ref.current?.style.setProperty("--pointer-x", `${event.clientX}px`);
      ref.current?.style.setProperty("--pointer-y", `${event.clientY}px`);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);
  return <div ref={ref} className="pointer-glow" aria-hidden="true" />;
}
