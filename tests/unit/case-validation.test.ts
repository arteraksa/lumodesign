import { describe, expect, it } from "vitest";
import { caseInputFromFormData, caseSchema } from "@/lib/validation/case";

const valid = { title: "Case temporário", slug: "case-temporario" };

describe("caseSchema", () => {
  it("aceita um rascunho completamente vazio", () => {
    expect(caseSchema.parse({ title: "", slug: "" })).toMatchObject({ status: "draft", title: "", slug: "", categories: [] });
  });

  it.each([
    ["slug com barra", { ...valid, slug: "case/invalido" }],
    ["título acima do limite", { ...valid, title: "x".repeat(121) }],
    ["SEO acima do limite", { ...valid, seo_title: "x".repeat(71) }],
    ["publicação sem campos obrigatórios", { ...valid, status: "published", categories: [], content_html: "" }],
    ["publicação sem título", { ...valid, title: "", status: "published", categories: ["Branding"], content_html: "Conteúdo" }],
    ["publicação sem slug", { ...valid, slug: "", status: "published", categories: ["Branding"], content_html: "Conteúdo" }],
  ])("rejeita %s", (_label, input) => {
    expect(caseSchema.safeParse(input).success).toBe(false);
  });

  it("rejeita categoria que não existe no cadastro", () => {
    const data = new FormData();
    data.set("title", valid.title);
    data.set("slug", valid.slug);
    data.set("categories", "Outra");
    expect(() => caseInputFromFormData(data, ["Branding"])).toThrow("Categorias indisponíveis");
  });
});
