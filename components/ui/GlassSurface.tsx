import type { ReactNode } from "react";

export function GlassSurface({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`glass-surface ${className}`}>{children}</div>;
}
