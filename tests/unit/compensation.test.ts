import { describe, expect, it, vi } from "vitest";
import { withCompensation } from "@/lib/portfolio/compensation";

describe("withCompensation", () => {
  it("não executa limpeza quando a operação termina", async () => {
    const cleanup = vi.fn(async () => undefined);
    await expect(withCompensation(async (defer) => { defer(cleanup); return "ok"; })).resolves.toBe("ok");
    expect(cleanup).not.toHaveBeenCalled();
  });

  it("limpa em ordem reversa após falha parcial", async () => {
    const order: string[] = [];
    await expect(withCompensation(async (defer) => {
      defer(async () => { order.push("first"); });
      defer(async () => { order.push("second"); });
      throw new Error("upload parcial");
    })).rejects.toThrow("upload parcial");
    expect(order).toEqual(["second", "first"]);
  });
});

