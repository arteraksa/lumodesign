import { describe, expect, it, vi } from "vitest";
import { resolveAuthState } from "@/lib/supabase/auth";
import { createCase, listCases, updateCase, VersionConflictError } from "@/features/cases/api";
import { publishCase, updatePublishedCase } from "@/features/publishing/publishingApi";
import { make36Cases, makeCase, makeMedia } from "./fixtures";
import { toEditableCase } from "@/features/cases/usePortfolioCases";

function queryResult(data: unknown, error: unknown = null) {
  return {
    order: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(async () => ({ data, error })),
    single: vi.fn(async () => ({ data, error })),
    then: (resolve: (value: unknown) => void) => resolve({ data, error }),
  };
}

describe("Portfolio CMS API", () => {
  it("blocks access without login and without permission", async () => {
    const anonymous = { auth: { getSession: vi.fn(async () => ({ data: { session: null }, error: null })) } };
    expect(await resolveAuthState(anonymous as never)).toEqual({ status: "anonymous" });
    const forbidden = {
      auth: { getSession: vi.fn(async () => ({ data: { session: { user: { id: "u" } } }, error: null })) },
      rpc: vi.fn(async () => ({ data: false, error: null })),
    };
    expect((await resolveAuthState(forbidden as never)).status).toBe("forbidden");
  });

  it("lists 36 real migrated slots and opens Leylaw shape", async () => {
    const cases = make36Cases();
    const client = { from: vi.fn(() => ({ select: vi.fn(() => ({ order: vi.fn().mockReturnThis(), then: (resolve: (value: unknown) => void) => resolve({ data: cases, error: null }) })) })) };
    const rows = await listCases(client as never);
    expect(rows).toHaveLength(36);
    expect(rows.some((item) => item.slug === "leylaw")).toBe(true);
  });

  it("creates a single draft with a UUID-derived slug", async () => {
    const inserted = makeCase({ status: "draft", slug: "novo-case-11111111" });
    const insert = vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn(async () => ({ data: inserted, error: null })) })) }));
    const client = { from: vi.fn(() => ({ insert })) };
    const row = await createCase(client as never, "Novo case");
    expect(row.id).toBe(inserted.id);
    expect(insert).toHaveBeenCalledOnce();
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ title: "Novo case", status: "draft", slug: expect.stringMatching(/^novo-case-/) }));
  });

  it("detects version conflict when optimistic update affects no row", async () => {
    const remote = makeCase({ version: 2, title: "Remote" });
    const client = {
      from: vi.fn((table: string) => {
        if (table === "portfolio_cases") {
          return {
            update: vi.fn(() => ({ eq: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(), maybeSingle: vi.fn(async () => ({ data: null, error: null })) })),
            select: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn(async () => ({ data: remote, error: null })) })) })),
          };
        }
        return queryResult(null);
      }),
    };
    await expect(updateCase(client as never, remote.id, 1, { title: "Local" })).rejects.toBeInstanceOf(VersionConflictError);
  });

  it("publishes only after promoting draft cover and media", async () => {
    const current = makeCase({ status: "draft", cover_storage_bucket: "portfolio-drafts", cover_storage_path: "id/cover/a.png" });
    const local = toEditableCase(current);
    const media = [makeMedia({ storage_bucket: "portfolio-drafts", storage_path: "id/gallery/a.png" })];
    const client = {
      storage: {
        from: vi.fn(() => ({
          download: vi.fn(async () => ({ data: new Blob(["x"], { type: "image/png" }), error: null })),
          upload: vi.fn(async () => ({ data: {}, error: null })),
          getPublicUrl: vi.fn(() => ({ data: { publicUrl: "https://example.test/public.png" } })),
        })),
      },
      from: vi.fn(() => ({
        update: vi.fn(() => ({ eq: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(), maybeSingle: vi.fn(async () => ({ data: makeCase({ status: "published", version: 2 }), error: null })), single: vi.fn(async () => ({ data: makeMedia({ storage_bucket: "portfolio-media" }), error: null })) })),
      })),
    };
    const row = await publishCase(client as never, current, local, media);
    expect(row.status).toBe("published");
  });

  it("keeps publish blocked when Storage promotion fails", async () => {
    const current = makeCase({ status: "draft", cover_storage_bucket: "portfolio-drafts", cover_storage_path: "id/cover/a.png" });
    const client = {
      storage: { from: vi.fn(() => ({ download: vi.fn(async () => ({ data: null, error: new Error("storage failed") })) })) },
    };
    await expect(publishCase(client as never, current, toEditableCase(current), [makeMedia()])).rejects.toThrow("storage failed");
  });

  it("updates a published case without unpublishing or replacing published_at", async () => {
    const publishedAt = "2026-07-11T12:00:00Z";
    const current = makeCase({ status: "published", published_at: publishedAt, version: 4, title: "Old" });
    const local = { ...toEditableCase(current), title: "Updated" };
    const update = vi.fn(() => ({
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(async () => ({
        data: makeCase({ ...current, title: "Updated", status: "published", published_at: publishedAt, version: 5 }),
        error: null,
      })),
    }));
    const client = { from: vi.fn(() => ({ update })) };

    const row = await updatePublishedCase(client as never, current, local, [makeMedia()]);
    expect(row.status).toBe("published");
    expect(row.published_at).toBe(publishedAt);
    expect(update).toHaveBeenCalledWith(expect.not.objectContaining({ published_at: expect.anything() }));
  });

  it("promotes draft gallery media during published update before confirming the row", async () => {
    const current = makeCase({ status: "published", version: 2 });
    const local = toEditableCase(current);
    const steps: string[] = [];
    const update = vi.fn(() => ({
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(async () => ({ data: makeCase({ status: "published", version: 3 }), error: null })),
      single: vi.fn(async () => ({ data: makeMedia({ storage_bucket: "portfolio-media" }), error: null })),
    }));
    const client = {
      storage: {
        from: vi.fn(() => ({
          download: vi.fn(async () => ({ data: new Blob(["x"], { type: "image/png" }), error: null })),
          upload: vi.fn(async () => ({ data: {}, error: null })),
          getPublicUrl: vi.fn(() => ({ data: { publicUrl: "https://example.test/public.png" } })),
        })),
      },
      from: vi.fn(() => ({ update })),
    };

    const row = await updatePublishedCase(
      client as never,
      current,
      local,
      [makeMedia({ storage_bucket: "portfolio-drafts", storage_path: "id/gallery/a.png" })],
      { onStep: (step) => steps.push(step) },
    );

    expect(row.status).toBe("published");
    expect(steps).toContain("Promovendo midias");
    expect(steps.at(-1)).toBe("Concluido");
  });
});
