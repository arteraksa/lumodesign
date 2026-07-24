"use client";

import { motion, useReducedMotion } from "framer-motion";

export function AnimatedTitle({ lines }: { lines: string[] }) {
  const reduceMotion = useReducedMotion();
  return (
    <h1 className="hero-title">
      {lines.map((line, lineIndex) => (
        <span className="hero-title__line" key={line}>
          {line.split(" ").map((word, wordIndex) => (
            <motion.span
              className="hero-title__word"
              key={`${line}-${word}`}
              initial={reduceMotion ? false : { opacity: 0.35, y: 18, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{
                duration: 0.7,
                delay: 0.08 + lineIndex * 0.12 + wordIndex * 0.045,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {word}&nbsp;
            </motion.span>
          ))}
        </span>
      ))}
    </h1>
  );
}
