import { File } from "node:buffer";
import { describe, expect, it } from "vitest";
import { assertImageFile, detectImageMime, maxUploadBytes, safeFilename } from "@/lib/portfolio/media-validation";

const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);

describe("validação de mídia", () => {
  it("aceita conteúdo, MIME e extensão compatíveis", async () => {
    await expect(assertImageFile(new File([png], "fixture.png", { type: "image/png" }) as globalThis.File)).resolves.toBeUndefined();
  });

  it("rejeita arquivo vazio", async () => {
    await expect(assertImageFile(new File([], "empty.png", { type: "image/png" }) as globalThis.File)).rejects.toThrow(/vazio/);
  });

  it("rejeita arquivo acima de 25 MB", async () => {
    const file = new File([new Uint8Array(maxUploadBytes + 1)], "large.png", { type: "image/png" });
    await expect(assertImageFile(file as globalThis.File)).rejects.toThrow(/25 MB/);
  });

  it("rejeita MIME não permitido", async () => {
    await expect(assertImageFile(new File([png], "fixture.svg", { type: "image/svg+xml" }) as globalThis.File)).rejects.toThrow(/recusado/);
  });

  it("rejeita extensão incompatível", async () => {
    await expect(assertImageFile(new File([png], "fixture.jpg", { type: "image/png" }) as globalThis.File)).rejects.toThrow(/extensão/);
  });

  it("rejeita conteúdo incompatível com MIME", async () => {
    await expect(assertImageFile(new File(["not an image"], "fixture.png", { type: "image/png" }) as globalThis.File)).rejects.toThrow(/conteúdo/);
  });

  it("detecta assinaturas e higieniza nomes", () => {
    expect(detectImageMime(png)).toBe("image/png");
    expect(safeFilename(" Capa Ágil FINAL.png ")).toBe("capa-agil-final.png");
  });
});
