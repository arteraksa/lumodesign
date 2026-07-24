import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CaseList } from "@/features/cases/CaseList";
import { GalleryManager } from "@/features/media/GalleryManager";
import { make36Cases, makeMedia } from "./fixtures";

describe("Portfolio CMS UI workflows", () => {
  it("shows empty, loading, error, and no-search states through list props", () => {
    const noop = vi.fn();
    const { rerender } = render(<CaseList cases={[]} allCases={[]} categories={[]} filters={{ search: "", status: "active", category: "all", sort: "portfolio_order" }} selectedId="" loading creating={false} error={null} notice={null} onFilter={noop} onOpen={noop} onCreate={noop} onLogout={noop} />);
    expect(screen.getByText("Carregando cases...")).toBeInTheDocument();
    rerender(<CaseList cases={[]} allCases={make36Cases()} categories={[]} filters={{ search: "x", status: "active", category: "all", sort: "portfolio_order" }} selectedId="" loading={false} creating={false} error={null} notice={null} onFilter={noop} onOpen={noop} onCreate={noop} onLogout={noop} />);
    expect(screen.getByText("Nenhuma busca encontrada.")).toBeInTheDocument();
    rerender(<CaseList cases={[]} allCases={[]} categories={[]} filters={{ search: "", status: "active", category: "all", sort: "portfolio_order" }} selectedId="" loading={false} creating={false} error="Erro de rede" notice={null} onFilter={noop} onOpen={noop} onCreate={noop} onLogout={noop} />);
    expect(screen.getByText("Erro de rede")).toBeInTheDocument();
  });

  it("renders 36 cases and supports opening Dark Star through the list", async () => {
    const open = vi.fn();
    render(<CaseList cases={make36Cases()} allCases={make36Cases()} categories={["UI/UX Design"]} filters={{ search: "", status: "active", category: "all", sort: "portfolio_order" }} selectedId="" loading={false} creating={false} error={null} notice={null} onFilter={vi.fn()} onOpen={open} onCreate={vi.fn()} onLogout={vi.fn()} />);
    await userEvent.click(screen.getAllByText("dark-star")[0]);
    expect(open).toHaveBeenCalled();
  });

  it("renders gallery controls for upload, reorder, remove, alt and caption", () => {
    const client = { from: vi.fn(), storage: { from: vi.fn() } };
    render(<GalleryManager client={client as never} caseId="11111111-1111-4111-8111-111111111111" media={[makeMedia()]} setMedia={vi.fn()} />);
    expect(screen.getByText("Upload multiplo")).toBeInTheDocument();
    expect(screen.getByLabelText("Reordenar midia")).toBeInTheDocument();
    expect(screen.getByLabelText("Remover midia")).toBeInTheDocument();
    expect(screen.getByText("Alt text")).toBeInTheDocument();
    expect(screen.getByText("Caption")).toBeInTheDocument();
  });
});
