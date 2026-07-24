import { describe, expect, it } from "vitest";
import { normalizeCaseSlug } from "@/lib/portfolio/slug";

describe("normalizeCaseSlug", () => {
  it("normaliza acentos, espaços e pontuação", () => {
    expect(normalizeCaseSlug("  Identidade Ágil — Lumo 2026! ")).toBe("identidade-agil-lumo-2026");
  });

  it("não cria hífens vazios", () => {
    expect(normalizeCaseSlug("---///---")).toBe("");
  });
});

