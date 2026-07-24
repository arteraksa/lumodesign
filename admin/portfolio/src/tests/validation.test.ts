import { describe, expect, it } from "vitest";
import { sanitizeHtml } from "@/lib/validation/html";
import { buildDraftPath, validateImageFile } from "@/lib/validation/media";
import { normalizeSlug, validateSlug } from "@/lib/validation/slug";
import { validateCaseForPublish } from "@/lib/validation/case";
import { makeCase, makeMedia } from "./fixtures";
import { toEditableCase } from "@/features/cases/usePortfolioCases";

describe("Portfolio CMS validation", () => {
  it("preserves accents and removes route-unsafe slug characters", () => {
    expect(normalizeSlug(" Atitus Educação / nova?x#y ")).toBe("atitus-educação-nova-x-y");
    expect(validateSlug("bad/slug")).toContain("Slug nao pode conter slash, query ou hash.");
  });

  it("sanitizes scripts, inline handlers, and javascript links", () => {
    const html = sanitizeHtml('<p onclick="x">A</p><script>x</script><a href="javascript:alert(1)">bad</a>');
    expect(html).not.toContain("script");
    expect(html).not.toContain("onclick");
    expect(html).not.toContain("javascript:");
  });

  it("validates MIME, size, and UUID-first draft paths", () => {
    const file = new File(["x"], "cover.png", { type: "image/png" });
    const avif = new File(["x"], "cover.avif", { type: "image/avif" });
    const gif = new File(["x"], "legacy.gif", { type: "image/gif" });
    const tooLarge = new File([new Uint8Array(10 * 1024 * 1024 + 1)], "large.png", { type: "image/png" });
    expect(validateImageFile(file)).toEqual([]);
    expect(validateImageFile(avif)).toEqual([]);
    expect(validateImageFile(gif)).toContain("Formato invalido. Use PNG, JPEG, WEBP ou AVIF.");
    expect(validateImageFile(tooLarge)).toContain("Arquivo maior que 10 MB.");
    expect(buildDraftPath("11111111-1111-4111-8111-111111111111", "cover", file, "abc")).toBe("11111111-1111-4111-8111-111111111111/cover/abc.png");
    expect(() => buildDraftPath("../bad", "cover", file, "abc")).toThrow();
  });

  it("blocks publish without valid content, cover, categories, or promoted media", () => {
    const draft = toEditableCase(makeCase({ status: "draft", categories: [], content_html: "", cover_url: "" }));
    const errors = validateCaseForPublish(draft, [makeMedia({ storage_bucket: "portfolio-drafts", storage_path: "x/y.jpg" })]);
    expect(errors.join(" ")).toContain("categoria");
    expect(errors.join(" ")).toContain("Conteudo");
    expect(errors.join(" ")).toContain("portfolio-drafts");
  });
});
