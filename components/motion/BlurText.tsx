"use client";

import { motion, useReducedMotion, type HTMLMotionProps, type TargetAndTransition } from "motion/react";
import { useEffect, useMemo, useRef, useState, type ComponentType, type ElementType } from "react";

const MotionSpan = motion.span as ComponentType<HTMLMotionProps<"span">>;

type BlurTextProps = {
  text?: string;
  delay?: number;
  startDelay?: number;
  className?: string;
  animateBy?: "words" | "letters";
  direction?: "top" | "bottom";
  threshold?: number;
  rootMargin?: string;
  stepDuration?: number;
  as?: ElementType;
  id?: string;
};

export function BlurText({
  text = "",
  delay = 200,
  startDelay = 0,
  className = "",
  animateBy = "words",
  direction = "top",
  threshold = 0.1,
  rootMargin = "0px",
  stepDuration = 0.35,
  as: Component = "p",
  id,
}: BlurTextProps) {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const reducedMotion = useReducedMotion();
  const elements = animateBy === "words" ? text.split(" ") : [...text];
  const from = useMemo<TargetAndTransition>(
    () => direction === "top"
      ? { filter: "blur(10px)", opacity: 0, y: -50 }
      : { filter: "blur(10px)", opacity: 0, y: 50 },
    [direction],
  );
  const to = useMemo(() => [
    { filter: "blur(5px)", opacity: 0.5, y: direction === "top" ? 5 : -5 },
    { filter: "blur(0px)", opacity: 1, y: 0 },
  ], [direction]);

  useEffect(() => {
    if (!ref.current || reducedMotion) {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        observer.disconnect();
      }
    }, { threshold, rootMargin });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [reducedMotion, rootMargin, threshold]);

  return (
    <Component ref={ref} id={id} className={`blur-text ${className}`}>
      {elements.map((segment, index) => (
        <MotionSpan
          className="blur-text__segment"
          key={`${segment}-${index}`}
          initial={reducedMotion ? false : from}
          animate={reducedMotion || inView ? to[to.length - 1] : from}
          transition={{ duration: stepDuration * 2, delay: (startDelay + index * delay) / 1000, ease: [0.16, 1, 0.3, 1] }}
        >
          {segment === " " ? "\u00a0" : segment}
          {animateBy === "words" && index < elements.length - 1 ? "\u00a0" : null}
        </MotionSpan>
      ))}
    </Component>
  );
}
