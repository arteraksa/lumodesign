import { describe, expect, it } from "vitest";
import { normalizeMediaUrl } from "@/lib/portfolio/media-url";

describe("normalizeMediaUrl", () => {
  it.each([
    "https://arteraksa.github.io/raksadesign/framerusercontent.com/images/example.jpg",
    "/raksadesign/framerusercontent.com/images/example.jpg",
    "raksadesign/framerusercontent.com/images/example.jpg",
  ])("converts legacy Framer references: %s", (url) => {
    expect(normalizeMediaUrl(url)).toBe("https://framerusercontent.com/images/example.jpg");
  });

  it("keeps current media URLs unchanged", () => {
    const url = "https://framerusercontent.com/images/current.jpg?width=1920";
    expect(normalizeMediaUrl(url)).toBe(url);
  });
});
