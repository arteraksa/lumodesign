import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "@/app/App";
import { resolveAuthState } from "@/lib/supabase/auth";
import { usePortfolioCases } from "@/features/cases/usePortfolioCases";

const authMock = {
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChange: vi.fn((_callback?: (event: string) => void) => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
};

const clientMock = {
  auth: authMock,
  rpc: vi.fn(),
};

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseClient: () => clientMock,
}));

vi.mock("@/lib/supabase/auth", () => ({
  resolveAuthState: vi.fn(),
}));

vi.mock("@/features/cases/usePortfolioCases", () => ({
  usePortfolioCases: vi.fn(),
}));

vi.mock("@/features/cases/CaseList", () => ({
  CaseList: ({ onLogout, onCreate, creating, notice }: { onLogout: () => void; onCreate: () => void; creating?: boolean; notice?: { message: string } | null }) => (
    <aside>
      Lista de cases
      <button onClick={onCreate} disabled={creating}>Novo case</button>
      {notice?.message && <p role="status">{notice.message}</p>}
      <button onClick={onLogout}>Sair</button>
    </aside>
  ),
}));

vi.mock("@/features/cases/CaseEditor", () => ({
  CaseEditor: () => <main>Editor de case</main>,
}));

const portfolioMock = {
  filteredCases: [],
  cases: [],
  categories: [],
  filters: { search: "", status: "active", category: "all", sort: "portfolio_order" },
  selected: null,
  loading: false,
  error: null,
  setFilters: vi.fn(),
  refreshCases: vi.fn(),
  openCase: vi.fn(),
  createNewCase: vi.fn(),
};

describe("Portfolio CMS routing and auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
    authMock.signOut.mockResolvedValue({ error: null });
    vi.mocked(usePortfolioCases).mockReturnValue(portfolioMock as never);
  });

  it("redirects an anonymous user to the real login form", async () => {
    window.history.replaceState(null, "", "/admin/portfolio/");
    vi.mocked(resolveAuthState).mockResolvedValue({ status: "anonymous" });

    render(<App />);

    await screen.findByRole("heading", { name: "Entrar no Portfolio CMS" });
    expect(screen.getByLabelText("Email")).toHaveAttribute("autocomplete", "email");
    expect(screen.getByLabelText("Senha")).toHaveAttribute("autocomplete", "current-password");
    expect(window.location.pathname).toBe("/admin/portfolio/login");
  });

  it("validates an empty form before calling Supabase", async () => {
    window.history.replaceState(null, "", "/admin/portfolio/login");
    vi.mocked(resolveAuthState).mockResolvedValue({ status: "anonymous" });

    render(<App />);
    await userEvent.click(await screen.findByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("Informe email e senha para entrar.")).toBeInTheDocument();
    expect(authMock.signInWithPassword).not.toHaveBeenCalled();
  });

  it("shows invalid credential errors", async () => {
    window.history.replaceState(null, "", "/admin/portfolio/login");
    vi.mocked(resolveAuthState).mockResolvedValue({ status: "anonymous" });
    authMock.signInWithPassword.mockResolvedValue({ error: { message: "Invalid login credentials" } });

    render(<App />);
    await userEvent.type(await screen.findByLabelText("Email"), "user@example.com");
    await userEvent.type(screen.getByLabelText("Senha"), "wrong-password");
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(authMock.signInWithPassword).toHaveBeenCalledWith({ email: "user@example.com", password: "wrong-password" });
    expect(await screen.findByText("Credenciais invalidas. Confira email e senha.")).toBeInTheDocument();
  });

  it("shows network errors during login", async () => {
    window.history.replaceState(null, "", "/admin/portfolio/login");
    vi.mocked(resolveAuthState).mockResolvedValue({ status: "anonymous" });
    authMock.signInWithPassword.mockRejectedValue(new Error("Failed to fetch"));

    render(<App />);
    await userEvent.type(await screen.findByLabelText("Email"), "user@example.com");
    await userEvent.type(screen.getByLabelText("Senha"), "secret");
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("Erro de rede ao tentar entrar. Verifique a conexao e tente novamente.")).toBeInTheDocument();
  });

  it("logs out and redirects when a valid login has no permission", async () => {
    window.history.replaceState(null, "", "/admin/portfolio/login");
    vi.mocked(resolveAuthState)
      .mockResolvedValueOnce({ status: "anonymous" })
      .mockResolvedValueOnce({ status: "forbidden", session: {} as never });
    authMock.signInWithPassword.mockResolvedValue({ error: null });

    render(<App />);
    await userEvent.type(await screen.findByLabelText("Email"), "user@example.com");
    await userEvent.type(screen.getByLabelText("Senha"), "secret");
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => expect(authMock.signOut).toHaveBeenCalled());
    expect(await screen.findByText("Sem permissao")).toBeInTheDocument();
    expect(window.location.pathname).toBe("/admin/portfolio/unauthorized");
  });

  it("redirects a valid authorized login to the CMS base", async () => {
    window.history.replaceState(null, "", "/admin/portfolio/login");
    vi.mocked(resolveAuthState)
      .mockResolvedValueOnce({ status: "anonymous" })
      .mockResolvedValueOnce({ status: "authorized", session: {} as never });
    authMock.signInWithPassword.mockResolvedValue({ error: null });

    render(<App />);
    await userEvent.type(await screen.findByLabelText("Email"), "admin@example.com");
    await userEvent.type(screen.getByLabelText("Senha"), "secret");
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));

    await screen.findByText("Lista de cases");
    expect(screen.getByText("Editor de case")).toBeInTheDocument();
    expect(window.location.pathname).toBe("/admin/portfolio/");
  });

  it("restores an authorized session after refresh", async () => {
    window.history.replaceState(null, "", "/admin/portfolio/");
    vi.mocked(resolveAuthState).mockResolvedValue({ status: "authorized", session: {} as never });

    render(<App />);

    await screen.findByText("Lista de cases");
    expect(portfolioMock.refreshCases).toHaveBeenCalled();
    expect(window.location.pathname).toBe("/admin/portfolio/");
  });

  it("logs out from the CMS header", async () => {
    window.history.replaceState(null, "", "/admin/portfolio/");
    vi.mocked(resolveAuthState).mockResolvedValue({ status: "authorized", session: {} as never });

    render(<App />);
    await userEvent.click(await screen.findByRole("button", { name: "Sair" }));

    expect(authMock.signOut).toHaveBeenCalled();
    expect(window.location.pathname).toBe("/admin/portfolio/login");
  });

  it("shows session expired after Supabase signs out an authorized session", async () => {
    let listener: ((event: string) => void) | null = null;
    authMock.onAuthStateChange.mockImplementation((callback?: (event: string) => void) => {
      listener = callback || null;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
    window.history.replaceState(null, "", "/admin/portfolio/");
    vi.mocked(resolveAuthState).mockResolvedValue({ status: "authorized", session: {} as never });

    render(<App />);
    await screen.findByText("Lista de cases");
    act(() => {
      listener?.("SIGNED_OUT");
    });

    expect(await screen.findByText("Sua sessao expirou. Entre novamente para continuar.")).toBeInTheDocument();
    expect(window.location.pathname).toBe("/admin/portfolio/login");
  });

  it("redirects direct /cases/:id access without a session to login", async () => {
    window.history.replaceState(null, "", "/admin/portfolio/cases/case-123");
    vi.mocked(resolveAuthState).mockResolvedValue({ status: "anonymous" });

    render(<App />);

    await screen.findByRole("heading", { name: "Entrar no Portfolio CMS" });
    expect(portfolioMock.openCase).not.toHaveBeenCalled();
    expect(window.location.pathname).toBe("/admin/portfolio/login");
  });

  it("opens direct /cases/:id routes for authorized users", async () => {
    window.history.replaceState(null, "", "/admin/portfolio/cases/case-123");
    vi.mocked(resolveAuthState).mockResolvedValue({ status: "authorized", session: {} as never });

    render(<App />);

    await waitFor(() => expect(portfolioMock.openCase).toHaveBeenCalledWith("case-123"));
    expect(window.location.pathname).toBe("/admin/portfolio/cases/case-123");
  });

  it("navigates to the administrative UUID route before opening a newly created case", async () => {
    const id = "11111111-1111-4111-8111-111111111111";
    window.history.replaceState(null, "", "/admin/portfolio/");
    vi.mocked(resolveAuthState).mockResolvedValue({ status: "authorized", session: {} as never });
    portfolioMock.createNewCase.mockResolvedValue({ id });

    render(<App />);
    await userEvent.click(await screen.findByRole("button", { name: "Novo case" }));

    await waitFor(() => expect(portfolioMock.openCase).toHaveBeenCalledWith(id));
    expect(window.location.pathname).toBe(`/admin/portfolio/cases/${id}`);
  });

  it("creates only one case while the create request is pending and exposes failures", async () => {
    window.history.replaceState(null, "", "/admin/portfolio/");
    vi.mocked(resolveAuthState).mockResolvedValue({ status: "authorized", session: {} as never });
    let rejectCreate: (reason: Error) => void = () => {};
    portfolioMock.createNewCase.mockImplementation(() => new Promise((_, reject) => { rejectCreate = reject; }));
    render(<App />);
    const create = await screen.findByRole("button", { name: "Novo case" });
    await userEvent.click(create);
    await userEvent.click(create);
    expect(portfolioMock.createNewCase).toHaveBeenCalledOnce();
    await act(async () => rejectCreate(new Error("Falha ao criar case")));
    expect(await screen.findByRole("status")).toHaveTextContent("Falha ao criar case");
  });
});
