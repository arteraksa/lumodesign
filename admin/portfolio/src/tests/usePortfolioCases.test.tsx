import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { editableCaseSnapshot, usePortfolioCases } from "@/features/cases/usePortfolioCases";
import { makeCase } from "./fixtures";

function thenable(data: unknown, error: unknown = null) {
  return {
    order: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    then: (resolve: (value: unknown) => void) => resolve({ data, error }),
  };
}

function updateBuilder(result: Promise<{ data: unknown; error: unknown }>) {
  return {
    eq: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(() => result),
  };
}

describe("usePortfolioCases save stability", () => {
  it("does not mark an empty editor as having unsaved changes", () => {
    const { result } = renderHook(() => usePortfolioCases(null));
    expect(result.current.hasUnsavedChanges).toBe(false);
  });

  it("normalizes dirty snapshots without volatile database fields", () => {
    const first = makeCase({ version: 1, updated_at: "2026-07-11T00:00:00Z" });
    const second = makeCase({ version: 99, updated_at: "2026-07-14T00:00:00Z" });
    expect(editableCaseSnapshot(first)).toBe(editableCaseSnapshot(second));
  });

  it("keeps archived cases out of the default active view and exposes them through Arquivados", async () => {
    const draft = makeCase({ id: "11111111-1111-4111-8111-111111111111", status: "draft" });
    const archived = makeCase({ id: "22222222-2222-4222-8222-222222222222", status: "archived" });
    const client = {
      from: vi.fn(() => ({ select: vi.fn(() => ({ order: vi.fn().mockReturnThis(), then: (resolve: (value: unknown) => void) => resolve({ data: [draft, archived], error: null }) })) })),
    };
    const { result } = renderHook(() => usePortfolioCases(client as never));
    await act(async () => { await result.current.refreshCases(); });
    expect(result.current.filters.status).toBe("active");
    expect(result.current.filteredCases.map((item) => item.id)).toEqual([draft.id]);
    act(() => result.current.setFilters({ ...result.current.filters, status: "archived" }));
    expect(result.current.filteredCases.map((item) => item.id)).toEqual([archived.id]);
  });

  it("keeps one save in flight for repeated save calls", async () => {
    const opened = makeCase({ status: "draft", version: 1, title: "Original" });
    const saved = makeCase({ status: "draft", version: 2, title: "Edited" });
    let resolveUpdate: (value: { data: unknown; error: unknown }) => void = () => {};
    const updateResult = new Promise<{ data: unknown; error: unknown }>((resolve) => {
      resolveUpdate = resolve;
    });
    const update = vi.fn(() => updateBuilder(updateResult));

    const client = {
      from: vi.fn((table: string) => {
        if (table === "portfolio_cases") {
          return {
            select: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn(async () => ({ data: opened, error: null })) })) })),
            update,
          };
        }
        return {
          select: vi.fn(() => ({ eq: vi.fn(() => thenable([])) })),
        };
      }),
    };

    const { result } = renderHook(() => usePortfolioCases(client as never));
    await act(async () => {
      await result.current.openCase(opened.id);
    });
    await waitFor(() => expect(result.current.draft?.title).toBe("Original"));

    act(() => {
      result.current.setDraft({ ...result.current.draft!, title: "Edited" });
    });

    let first: Promise<unknown>;
    let second: Promise<unknown>;
    await act(async () => {
      first = result.current.saveDraft();
      second = result.current.saveDraft();
      resolveUpdate({ data: saved, error: null });
      await Promise.all([first, second]);
    });

    expect(update).toHaveBeenCalledTimes(1);
    expect(result.current.selected?.version).toBe(2);
  });
});
