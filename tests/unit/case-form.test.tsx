// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { serializeRichTextDocument } from "@/lib/content/rich-text";
import { CaseForm } from "@/app/admin/cases/CaseForm";
import type { PortfolioCase } from "@/lib/supabase/database.types";

vi.mock("@/components/admin/RichTextEditor", () => ({
  RichTextEditor: ({ onChange, invalid }: { onChange: (value: string) => void; invalid?: boolean }) => <textarea data-testid="case-content" aria-invalid={invalid} onChange={(event) => onChange(serializeRichTextDocument({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: event.target.value }] }] }))} />,
}));

const itemWithCover = {
  id: "00000000-0000-4000-8000-000000000001",
  slug: "",
  title: "",
  status: "draft",
  client_name: "",
  categories: [],
  excerpt: "",
  content_json: {},
  content_html: "",
  cover_url: "",
  cover_storage_bucket: "portfolio-media",
  cover_storage_path: "covers/capa.webp",
  external_url: "",
  featured_on_home: false,
  home_order: 999,
  portfolio_order: 999,
  seo_title: "",
  seo_description: "",
  published_at: null,
  archived_at: null,
  version: 1,
  created_at: "2026-07-23T00:00:00.000Z",
  updated_at: "2026-07-23T00:00:00.000Z",
} satisfies PortfolioCase;

describe("CaseForm", () => {
  afterEach(cleanup);
  it("inicia o salvamento de um rascunho e mostra o modal de progresso", async () => {
    const action = vi.fn((data: FormData) => { void data; return new Promise<never>(() => {}); });
    render(<CaseForm categoryOptions={["Branding"]} action={action} createCategoryAction={vi.fn()} />);

    await userEvent.type(screen.getByTestId("case-title"), "Case de teste");
    await waitFor(() => expect(screen.getByTestId("case-slug")).toHaveValue("case-de-teste"));
    await userEvent.click(screen.getByTestId("save-case"));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    expect(action.mock.calls[0]?.[0].get("status")).toBe("draft");
    expect(action.mock.calls[0]?.[0].get("media_manifest")).toBe("[]");
    expect(screen.getByRole("heading", { name: "Salvando seu rascunho" })).toBeVisible();
  });

  it("salva um rascunho completamente vazio", async () => {
    const action = vi.fn((data: FormData) => { void data; return new Promise<never>(() => {}); });
    render(<CaseForm categoryOptions={["Branding"]} action={action} createCategoryAction={vi.fn()} />);

    await userEvent.click(screen.getByTestId("save-case"));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    expect(action.mock.calls[0]?.[0].get("status")).toBe("draft");
    expect(action.mock.calls[0]?.[0].get("cover_manifest")).toBe('{"source":"none"}');
  });

  it("explica e marca os campos obrigatórios para publicar", async () => {
    const action = vi.fn();
    render(<CaseForm item={itemWithCover} coverPreviewUrl="https://example.com/capa.webp" categoryOptions={["Branding"]} action={action} createCategoryAction={vi.fn()} />);

    await userEvent.type(screen.getByTestId("case-title"), "Case de teste");
    await userEvent.click(screen.getByTestId("publish-case"));

    expect(action).not.toHaveBeenCalled();
    expect(screen.getByTestId("case-form-error")).toHaveTextContent("Revise os campos marcados");
    expect(screen.getByTestId("case-content")).toHaveAttribute("aria-invalid", "true");
  });

  it("envia a intenção de publicação e mostra o progresso", async () => {
    const action = vi.fn((data: FormData) => { void data; return new Promise<never>(() => {}); });
    render(<CaseForm item={itemWithCover} coverPreviewUrl="https://example.com/capa.webp" categoryOptions={["Branding"]} action={action} createCategoryAction={vi.fn()} />);

    await userEvent.type(screen.getByTestId("case-title"), "Case de teste");
    await userEvent.click(screen.getByRole("checkbox", { name: "Branding" }));
    await userEvent.type(screen.getByTestId("case-content"), "Descrição completa do case.");
    await userEvent.click(screen.getByTestId("publish-case"));
    expect(action).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Confirmar atualização" }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    expect(action.mock.calls[0]?.[0].get("status")).toBe("published");
    expect(screen.getByRole("heading", { name: "Publicando seu case" })).toBeVisible();
  });
});
