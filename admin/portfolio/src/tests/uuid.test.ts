import { afterEach, describe, expect, it, vi } from "vitest";
import { createUuid } from "@shared/uuid";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

afterEach(() => vi.unstubAllGlobals());

describe("createUuid", () => {
  it("uses crypto.randomUUID when it is available", () => {
    const randomUUID = vi.fn(() => "11111111-1111-4111-8111-111111111111");
    vi.stubGlobal("crypto", { randomUUID, getRandomValues: vi.fn() });
    expect(createUuid()).toBe("11111111-1111-4111-8111-111111111111");
    expect(randomUUID).toHaveBeenCalledOnce();
  });

  it("creates valid, unique v4 UUIDs with secure getRandomValues fallback", () => {
    let seed = 0;
    vi.stubGlobal("crypto", {
      getRandomValues: (bytes: Uint8Array) => {
        seed += 1;
        bytes.fill(seed);
        return bytes;
      },
    });
    const first = createUuid();
    const second = createUuid();
    expect(first).toMatch(UUID_V4);
    expect(second).toMatch(UUID_V4);
    expect(first).not.toBe(second);
  });
});
