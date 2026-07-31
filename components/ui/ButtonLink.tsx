"use client";

import type { ReactNode } from "react";
import { SpecularButton } from "@/components/ui/SpecularButton";

export function ButtonLink({
  href,
  children,
  variant = "primary",
  external = false,
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "tertiary";
  external?: boolean;
  className?: string;
}) {
  if (variant === "primary") {
    return <SpecularButton href={href} external={external} className={`specular-button--primary ${className}`.trim()}>{children}</SpecularButton>;
  }

  return (
    <a
      href={href}
      className={`button button--${variant} ${className}`.trim()}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
    >
      {children}
    </a>
  );
}
