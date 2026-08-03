import { describe, expect, it } from "vitest";
import { documentFromStoredContent, documentHasText, richTextDocumentJson } from "@/lib/content/rich-text";

describe("rich text content", () => {
  it("preserva cada quebra de linha legada como um parágrafo", () => {
    expect(documentFromStoredContent("Primeiro parágrafo\nSegundo parágrafo").content).toEqual([
      { type: "paragraph", content: [{ type: "text", text: "Primeiro parágrafo" }] },
      { type: "paragraph", content: [{ type: "text", text: "Segundo parágrafo" }] },
    ]);
  });

  it("mantém marcas e listas do editor para a renderização pública", () => {
    const source = JSON.stringify({ type: "doc", content: [{ type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Destaque", marks: [{ type: "bold" }, { type: "underline" }] }] }] }] }] });
    expect(richTextDocumentJson(source)).toEqual(JSON.parse(source));
    expect(documentHasText(source)).toBe(true);
  });

  it("não considera um documento vazio como conteúdo para publicação", () => {
    expect(documentHasText(JSON.stringify({ type: "doc", content: [{ type: "paragraph" }]}))).toBe(false);
  });
});
