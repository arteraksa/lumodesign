"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

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

export function LandingBackground() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(supportsWebGL() && !matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  return (
    <div className="landing-background" aria-hidden="true">
      {enabled ? (
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
          className="landing-background__liquid"
        />
      ) : null}
    </div>
  );
}
