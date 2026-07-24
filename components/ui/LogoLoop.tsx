"use client";

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import "./LogoLoop.css";

type LogoItem = {
  node: ReactNode;
  title: string;
};

type LogoLoopProps = {
  logos: readonly LogoItem[];
  speed?: number;
  gap?: number;
  logoHeight?: number;
  fadeOut?: boolean;
  fadeOutColor?: string;
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
};

const MIN_COPIES = 2;

export const LogoLoop = memo(function LogoLoop({
  logos,
  speed = 44,
  gap = 84,
  logoHeight = 20,
  fadeOut = false,
  fadeOutColor,
  ariaLabel = "Marcas parceiras",
  className,
  style,
}: LogoLoopProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const sequenceRef = useRef<HTMLUListElement>(null);
  const offsetRef = useRef(0);
  const velocityRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);
  const [sequenceWidth, setSequenceWidth] = useState(0);
  const [copyCount, setCopyCount] = useState(MIN_COPIES);
  const [isHovered, setIsHovered] = useState(false);

  const updateDimensions = useCallback(() => {
    const width = sequenceRef.current?.getBoundingClientRect().width ?? 0;
    const viewport = containerRef.current?.clientWidth ?? 0;
    if (!width) return;

    setSequenceWidth(Math.ceil(width));
    setCopyCount(Math.max(MIN_COPIES, Math.ceil(viewport / width) + 2));
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const sequence = sequenceRef.current;
    if (!container || !sequence) return;

    const observer = new ResizeObserver(updateDimensions);
    observer.observe(container);
    observer.observe(sequence);
    updateDimensions();
    return () => observer.disconnect();
  }, [updateDimensions, logos, gap, logoHeight]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !sequenceWidth) return;

    const animate = (timestamp: number) => {
      if (lastTimeRef.current === null) lastTimeRef.current = timestamp;
      const delta = Math.max(0, timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      const targetVelocity = isHovered ? 0 : speed;
      const smoothing = 1 - Math.exp(-delta / 0.2);
      velocityRef.current += (targetVelocity - velocityRef.current) * smoothing;
      offsetRef.current = (offsetRef.current + velocityRef.current * delta) % sequenceWidth;
      track.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      lastTimeRef.current = null;
    };
  }, [isHovered, sequenceWidth, speed]);

  const lists = useMemo(
    () => Array.from({ length: copyCount }, (_, copyIndex) => (
      <ul
        aria-hidden={copyIndex > 0}
        className="logoloop__list"
        key={copyIndex}
        ref={copyIndex === 0 ? sequenceRef : undefined}
        role="list"
      >
        {logos.map((logo) => (
          <li className="logoloop__item" key={`${copyIndex}-${logo.title}`} role="listitem">
            <span className="logoloop__node">{logo.node}</span>
          </li>
        ))}
      </ul>
    )),
    [copyCount, logos],
  );

  const rootClassName = ["logoloop", fadeOut && "logoloop--fade", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      aria-label={ariaLabel}
      className={rootClassName}
      ref={containerRef}
      role="region"
      style={{
        "--logoloop-gap": `${gap}px`,
        "--logoloop-logoHeight": `${logoHeight}px`,
        ...(fadeOutColor ? { "--logoloop-fadeColor": fadeOutColor } : {}),
        ...style,
      } as CSSProperties}
    >
      <div
        className="logoloop__track"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        ref={trackRef}
      >
        {lists}
      </div>
    </div>
  );
});
