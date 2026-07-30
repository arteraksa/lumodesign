"use client";

import { gsap } from "gsap";
import { useEffect, useRef, type ReactNode } from "react";

const MOBILE_BREAKPOINT = 768;

export function MagicBentoGrid({
  children,
  className = "",
  enableSpotlight = true,
  spotlightRadius = 300,
  glowColor = "132, 0, 255",
}: {
  children: ReactNode;
  className?: string;
  enableSpotlight?: boolean;
  spotlightRadius?: number;
  glowColor?: string;
}) {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || !enableSpotlight || window.innerWidth <= MOBILE_BREAKPOINT) return;

    const spotlight = document.createElement("div");
    spotlight.className = "global-spotlight";
    spotlight.style.background = `radial-gradient(circle, rgba(${glowColor}, .15) 0%, rgba(${glowColor}, .08) 15%, rgba(${glowColor}, .04) 25%, transparent 70%)`;
    document.body.appendChild(spotlight);

    const clearGlow = () => {
      grid.querySelectorAll<HTMLElement>(".magic-bento-card").forEach((card) => {
        card.style.setProperty("--glow-intensity", "0");
      });
    };

    const handleMouseMove = (event: MouseEvent) => {
      const rect = grid.getBoundingClientRect();
      const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
      if (!inside) {
        clearGlow();
        gsap.to(spotlight, { opacity: 0, duration: 0.3, ease: "power2.out" });
        return;
      }

      const proximity = spotlightRadius * 0.5;
      const fadeDistance = spotlightRadius * 0.75;
      let minDistance = Infinity;

      grid.querySelectorAll<HTMLElement>(".magic-bento-card").forEach((card) => {
        const cardRect = card.getBoundingClientRect();
        const centerX = cardRect.left + cardRect.width / 2;
        const centerY = cardRect.top + cardRect.height / 2;
        const distance = Math.max(0, Math.hypot(event.clientX - centerX, event.clientY - centerY) - Math.max(cardRect.width, cardRect.height) / 2);
        minDistance = Math.min(minDistance, distance);

        const intensity = distance <= proximity ? 1 : distance <= fadeDistance ? (fadeDistance - distance) / (fadeDistance - proximity) : 0;
        card.style.setProperty("--glow-x", `${((event.clientX - cardRect.left) / cardRect.width) * 100}%`);
        card.style.setProperty("--glow-y", `${((event.clientY - cardRect.top) / cardRect.height) * 100}%`);
        card.style.setProperty("--glow-intensity", intensity.toString());
        card.style.setProperty("--glow-radius", `${spotlightRadius}px`);
      });

      gsap.to(spotlight, { left: event.clientX, top: event.clientY, duration: 0.1, ease: "power2.out" });
      gsap.to(spotlight, { opacity: minDistance <= fadeDistance ? 0.8 : 0, duration: 0.2, ease: "power2.out" });
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", clearGlow);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", clearGlow);
      spotlight.remove();
    };
  }, [enableSpotlight, glowColor, spotlightRadius]);

  return <div ref={gridRef} className={`${className} bento-section`}>{children}</div>;
}

export function MagicBentoCard({
  children,
  className = "",
  delay: _delay = 0,
  enableTilt = true,
  enableMagnetism = true,
  clickEffect = true,
  enableBorderGlow = true,
  glowColor = "132, 0, 255",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  enableTilt?: boolean;
  enableMagnetism?: boolean;
  clickEffect?: boolean;
  enableBorderGlow?: boolean;
  glowColor?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = cardRef.current;
    if (!element || window.innerWidth <= MOBILE_BREAKPOINT) return;

    // Clear transforms left by a previous interactive configuration or hot reload.
    if (!enableTilt && !enableMagnetism) {
      gsap.set(element, { x: 0, y: 0, rotateX: 0, rotateY: 0, transformPerspective: 0 });
    }

    const handleMouseMove = (event: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      if (enableTilt) {
        gsap.to(element, { rotateX: ((y - centerY) / centerY) * -10, rotateY: ((x - centerX) / centerX) * 10, duration: 0.1, ease: "power2.out", transformPerspective: 1000 });
      }
      if (enableMagnetism) {
        gsap.to(element, { x: (x - centerX) * 0.05, y: (y - centerY) * 0.05, duration: 0.3, ease: "power2.out" });
      }
    };

    const handleMouseLeave = () => {
      gsap.to(element, { x: 0, y: 0, rotateX: 0, rotateY: 0, duration: 0.3, ease: "power2.out" });
    };

    const handleClick = (event: MouseEvent) => {
      if (!clickEffect) return;
      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const maxDistance = Math.max(Math.hypot(x, y), Math.hypot(x - rect.width, y), Math.hypot(x, y - rect.height), Math.hypot(x - rect.width, y - rect.height));
      const ripple = document.createElement("span");
      ripple.className = "magic-bento__ripple";
      ripple.style.width = `${maxDistance * 2}px`;
      ripple.style.height = `${maxDistance * 2}px`;
      ripple.style.left = `${x - maxDistance}px`;
      ripple.style.top = `${y - maxDistance}px`;
      ripple.style.setProperty("--magic-bento-glow", glowColor);
      element.appendChild(ripple);
      gsap.fromTo(ripple, { scale: 0, opacity: 1 }, { scale: 1, opacity: 0, duration: 0.8, ease: "power2.out", onComplete: () => ripple.remove() });
    };

    element.addEventListener("mousemove", handleMouseMove);
    element.addEventListener("mouseleave", handleMouseLeave);
    element.addEventListener("click", handleClick);
    return () => {
      element.removeEventListener("mousemove", handleMouseMove);
      element.removeEventListener("mouseleave", handleMouseLeave);
      element.removeEventListener("click", handleClick);
      if (!enableTilt && !enableMagnetism) {
        gsap.set(element, { x: 0, y: 0, rotateX: 0, rotateY: 0, transformPerspective: 0 });
      }
    };
  }, [clickEffect, enableMagnetism, enableTilt, glowColor]);

  return (
    <div
      ref={cardRef}
      className={`${className} magic-bento-card${enableBorderGlow ? " magic-bento-card--border-glow" : ""}`}
      style={{ "--glow-color": glowColor } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
