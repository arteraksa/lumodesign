import { describe, expect, it } from "vitest";
import { portfolioPathsForSlugs } from "@/lib/portfolio/revalidation";

describe("portfolioPathsForSlugs", () => {
  it("inclui home, listagem, slug atual e antigo sem duplicar", () => {
    expect(portfolioPathsForSlugs("antigo", "novo", "novo", null)).toEqual([
      "/", "/cases", "/cases/antigo", "/cases/novo",
    ]);
  });
});

