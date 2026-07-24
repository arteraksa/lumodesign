"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const LiquidEther = dynamic(() => import("@/components/effects/LiquidEther"), {
  ssr: false,
  loading: () => null,
});

function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export function HeroEffect() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || !supportsWebGL() || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "180px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="hero-effect" aria-hidden="true">
      {visible ? (
        <LiquidEther
          mouseForce={40}
          cursorSize={100}
          isViscous={false}
          viscous={30}
          colors={["#1d1353", "#9A3CFF", "#9A3CFF"]}
          autoDemo
          autoSpeed={0.5}
          autoIntensity={2.2}
          isBounce={false}
          resolution={0.25}
          className="hero-effect__liquid"
        />
      ) : null}
    </div>
  );
}
