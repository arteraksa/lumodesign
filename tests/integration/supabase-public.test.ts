import { describe, expect, it } from "vitest";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const enabled = Boolean(url && key);

describe.skipIf(!enabled)("Supabase público remoto", () => {
  const headers = { apikey: key!, Authorization: `Bearer ${key!}` };

  it("expõe exatamente os 36 cases publicados e oculta rascunhos", async () => {
    const response = await fetch(`${url}/rest/v1/portfolio_cases?select=id,status`, {
      headers: { ...headers, Prefer: "count=exact" },
    });
    expect(response.ok).toBe(true);
    const rows = await response.json() as Array<{ status: string }>;
    expect(rows).toHaveLength(36);
    expect(rows.every((row) => row.status === "published")).toBe(true);
  });

  it("bloqueia escrita anônima sem persistir fixture", async () => {
    const response = await fetch(`${url}/rest/v1/portfolio_cases`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ title: "blocked", slug: `blocked-${crypto.randomUUID()}` }),
    });
    expect([401, 403]).toContain(response.status);
  });
});

