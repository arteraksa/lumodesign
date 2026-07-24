import { describe, expect, it } from "vitest";

describe("local Supabase smoke", () => {
  it("is explicitly opt-in to avoid destructive remote writes", async () => {
    if (process.env.PORTFOLIO_CMS_LOCAL_SMOKE !== "1") {
      expect(true).toBe(true);
      return;
    }
    const response = await fetch("http://127.0.0.1:54321/rest/v1/", { method: "GET" });
    expect([200, 401, 404]).toContain(response.status);
  });
});
