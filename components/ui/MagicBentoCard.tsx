"use client";

import { gsap } from "gsap";
import { useEffect, useRef, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

const MOBILE_BREAKPOINT = 768;
const GLOW_COLOR = "90, 60, 255";

export function MagicBentoCard({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const element = cardRef.current;
    if (!element || reduceMotion || window.innerWidth <= MOBILE_BREAKPOINT) return;

    const setGlow = (event: MouseEvent, intensity: number) => {
      const rect = element.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;

      element.style.setProperty("--glow-x", `${x}%`);
      element.style.setProperty("--glow-y", `${y}%`);
      element.style.setProperty("--glow-intensity", intensity.toString());
    };

    const handleMouseMove = (event: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -2.6;
      const rotateY = ((x - centerX) / centerX) * 2.6;
      const magnetX = (x - centerX) * 0.012;
      const magnetY = (y - centerY) * 0.012;

      setGlow(event, 1);

      gsap.to(element, {
        x: magnetX,
        y: magnetY,
        rotateX,
        rotateY,
        duration: 0.72,
        delay: 0.06,
        ease: "power4.out",
        transformPerspective: 1000,
      });
    };

    const handleMouseEnter = (event: MouseEvent) => {
      setGlow(event, 1);
      gsap.to(element, {
        z: 10,
        duration: 0.72,
        delay: 0.06,
        ease: "power4.out",
        transformPerspective: 1000,
      });
    };

    const handleMouseLeave = () => {
      element.style.setProperty("--glow-intensity", "0");
      gsap.to(element, {
        x: 0,
        y: 0,
        z: 0,
        rotateX: 0,
        rotateY: 0,
        duration: 0.82,
        ease: "power4.out",
      });
    };

    const handleClick = (event: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const maxDistance = Math.max(
        Math.hypot(x, y),
        Math.hypot(x - rect.width, y),
        Math.hypot(x, y - rect.height),
        Math.hypot(x - rect.width, y - rect.height),
      );

      const ripple = document.createElement("span");
      ripple.className = "service-card__ripple";
      ripple.style.width = `${maxDistance * 2}px`;
      ripple.style.height = `${maxDistance * 2}px`;
      ripple.style.left = `${x - maxDistance}px`;
      ripple.style.top = `${y - maxDistance}px`;
      ripple.style.setProperty("--ripple-color", GLOW_COLOR);
      element.appendChild(ripple);

      gsap.fromTo(
        ripple,
        { scale: 0, opacity: 1 },
        {
          scale: 1,
          opacity: 0,
          duration: 1.1,
          ease: "power4.out",
          onComplete: () => ripple.remove(),
        },
      );
    };

    element.addEventListener("mouseenter", handleMouseEnter);
    element.addEventListener("mousemove", handleMouseMove);
    element.addEventListener("mouseleave", handleMouseLeave);
    element.addEventListener("click", handleClick);

    return () => {
      element.removeEventListener("mouseenter", handleMouseEnter);
      element.removeEventListener("mousemove", handleMouseMove);
      element.removeEventListener("mouseleave", handleMouseLeave);
      element.removeEventListener("click", handleClick);
    };
  }, [reduceMotion]);

  return (
    <motion.div
      ref={cardRef}
      className={`${className} service-card--magic`}
      initial={reduceMotion ? false : { opacity: 0.72, y: 24 }}
      animate={reduceMotion ? { opacity: 1, y: 0 } : undefined}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
