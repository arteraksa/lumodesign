import type { ReactNode } from "react";
import { Container } from "./Container";

export function Section({
  id,
  children,
  className = "",
  labelledBy,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  labelledBy?: string;
}) {
  return (
    <section id={id} className={`site-section ${className}`} aria-labelledby={labelledBy}>
      <Container>{children}</Container>
    </section>
  );
}
