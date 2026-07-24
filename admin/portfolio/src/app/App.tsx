import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Loader2, LogIn } from "lucide-react";
import type { AuthError } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";
import { resolveAuthState, type AuthState } from "@/lib/supabase/auth";
import { usePortfolioCases } from "@/features/cases/usePortfolioCases";
import { CaseList } from "@/features/cases/CaseList";
import { CaseEditor } from "@/features/cases/CaseEditor";

const ROUTER_BASENAME = "/admin/portfolio";
const SESSION_EXPIRED_MESSAGE = "Sua sessao expirou. Entre novamente para continuar.";

function getInternalPath(pathname = window.location.pathname) {
  if (pathname === ROUTER_BASENAME) return "/";
  if (pathname.startsWith(`${ROUTER_BASENAME}/`)) return pathname.slice(ROUTER_BASENAME.length) || "/";
  return "/";
}

function navigateWithinPortfolio(path: string, replace = false) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const target = `${ROUTER_BASENAME}${normalizedPath === "/" ? "/" : normalizedPath}`;
  const method = replace ? "replaceState" : "pushState";
  window.history[method](null, "", target);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function App() {
  const client = useMemo(() => getSupabaseClient(), []);
  const [auth, setAuth] = useState<AuthState>({ status: "loading" });
  const [loginNotice, setLoginNotice] = useState<string | null>(null);
  const portfolio = usePortfolioCases(auth.status === "authorized" ? client : null);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [routePath, setRoutePath] = useState(getInternalPath);
  const [creating, setCreating] = useState(false);
  const [createNotice, setCreateNotice] = useState<{ message: string; tone: "success" | "error" } | null>(null);
  const createInFlightRef = useRef(false);
  const busyLabel = auth.status === "loading" ? "Restaurando sessao" : portfolio.operation || (portfolio.loading ? "Carregando" : null);
  const hasPendingChanges = portfolio.hasUnsavedChanges || portfolio.hasDraftMedia;

  useEffect(() => {
    resolveAuthState(client).then((state) => {
      setAuth(state);
      if (state.status === "authorized" && routePath === "/login") navigateWithinPortfolio("/", true);
      if (state.status === "anonymous") navigateWithinPortfolio("/login", true);
      if (state.status === "forbidden") navigateWithinPortfolio("/unauthorized", true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client]);

  useEffect(() => {
    const { data } = client.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setAuth((current) => {
          if (current.status === "authorized") setLoginNotice(SESSION_EXPIRED_MESSAGE);
          return { status: "anonymous", reason: current.status === "authorized" ? "session-expired" : undefined };
        });
        navigateWithinPortfolio("/login", true);
        return;
      }
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
        void refreshAuth();
      }
    });
    return () => data.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client]);

  useEffect(() => {
    const onPopState = () => {
      if (!confirmDiscardChanges(hasPendingChanges)) {
        const target = `${ROUTER_BASENAME}${routePath === "/" ? "/" : routePath}`;
        window.history.replaceState(null, "", target);
        return;
      }
      setRoutePath(getInternalPath());
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [hasPendingChanges, routePath]);

  useEffect(() => {
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    if (auth.status === "authorized") portfolio.refreshCases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.status]);

  useEffect(() => {
    if (!hasPendingChanges) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [hasPendingChanges]);

  useEffect(() => {
    if (auth.status !== "authorized") return;
    const match = routePath.match(/^\/cases\/([^/]+)\/?$/);
    if (match) void portfolio.openCase(decodeURIComponent(match[1]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.status, routePath]);

  async function refreshAuth(reason?: "session-expired") {
    const state = await resolveAuthState(client, reason);
    setAuth(state);
    if (state.status === "authorized") navigateWithinPortfolio(routePath === "/login" ? "/" : routePath, true);
    if (state.status === "anonymous") navigateWithinPortfolio("/login", true);
    if (state.status === "forbidden") navigateWithinPortfolio("/unauthorized", true);
    return state;
  }

  async function handleLogin(email: string, password: string): Promise<string | null> {
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) return loginErrorMessage(error);

    const state = await refreshAuth();
    if (state.status === "authorized") {
      setLoginNotice(null);
      return null;
    }
    if (state.status === "forbidden") {
      await client.auth.signOut();
      return "Usuario sem permissao para gerenciar o Portfolio CMS.";
    }
    return "Nao foi possivel restaurar a sessao apos o login.";
  }

  async function handleLogout() {
    if (!confirmDiscardChanges(hasPendingChanges)) return;
    await client.auth.signOut();
    setAuth({ status: "anonymous" });
    navigateWithinPortfolio("/login", true);
  }

  function openCase(id: string) {
    if (!confirmDiscardChanges(hasPendingChanges)) return;
    const path = `/cases/${encodeURIComponent(id)}`;
    window.history.pushState(null, "", `${ROUTER_BASENAME}${path}`);
    setRoutePath(path);
  }

  async function createCase() {
    if (!confirmDiscardChanges(hasPendingChanges)) return;
    if (createInFlightRef.current) return;
    createInFlightRef.current = true;
    setCreating(true);
    setCreateNotice(null);
    try {
      const row = await portfolio.createNewCase();
      if (!row?.id) throw new Error("O banco não confirmou a criação do case.");
      const path = `/cases/${encodeURIComponent(row.id)}`;
      window.history.pushState(null, "", `${ROUTER_BASENAME}${path}`);
      setRoutePath(path);
      setCreateNotice({ message: "Case criado. Abrindo o editor…", tone: "success" });
    } catch (error) {
      const detail = error instanceof Error && error.message ? error.message : "Não foi possível criar o case. Tente novamente.";
      setCreateNotice({ message: detail, tone: "error" });
    } finally {
      createInFlightRef.current = false;
      setCreating(false);
    }
  }

  if (auth.status === "loading") {
    return (
      <>
        <GlobalProgress label={busyLabel} />
        <FullState icon={<Loader2 className="spin" />} title="Verificando sessao" body="Validando autenticacao Supabase." />
      </>
    );
  }

  if (auth.status === "anonymous") {
    if (routePath === "/login") {
      return <LoginScreen onSubmit={handleLogin} notice={auth.reason === "session-expired" ? SESSION_EXPIRED_MESSAGE : loginNotice} />;
    }
    return <FullState icon={<Loader2 className="spin" />} title="Redirecionando" body="Abrindo o login do Portfolio CMS." />;
  }

  if (auth.status === "forbidden") {
    return (
      <FullState
        icon={<AlertTriangle />}
        title="Sem permissao"
        body="Sua sessao esta ativa, mas public.can_manage_portfolio() retornou false. O acesso real continua protegido por RLS."
      />
    );
  }

  return (
    <div className="app-shell">
      <GlobalProgress label={busyLabel} />
      {offline && <div className="offline-banner">Voce esta offline. Salvamentos e uploads ficam indisponiveis ate a conexao voltar.</div>}
      <CaseList
        cases={portfolio.filteredCases}
        allCases={portfolio.cases}
        categories={portfolio.categories}
        filters={portfolio.filters}
        selectedId={portfolio.selected?.id || ""}
        loading={portfolio.loading}
        creating={creating}
        error={portfolio.error}
        notice={createNotice}
        onFilter={portfolio.setFilters}
        onOpen={openCase}
        onCreate={() => void createCase()}
        onLogout={() => void handleLogout()}
      />
      <CaseEditor client={client} portfolio={portfolio} />
    </div>
  );
}

function confirmDiscardChanges(hasUnsavedChanges: boolean) {
  if (!hasUnsavedChanges) return true;
  return window.confirm("Existem alteracoes nao salvas. Deseja sair mesmo assim?");
}

function GlobalProgress({ label }: { label: string | null }) {
  if (!label) return null;
  return (
    <div className="global-progress" role="status" aria-live="polite" aria-label={label}>
      <span />
    </div>
  );
}

function LoginScreen({ onSubmit, notice }: { onSubmit: (email: string, password: string) => Promise<string | null>; notice: string | null }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Informe email e senha para entrar.");
      return;
    }
    try {
      setSubmitting(true);
      const message = await onSubmit(email.trim(), password);
      if (message) setError(message);
    } catch {
      setError("Erro de rede ao tentar entrar. Verifique a conexao e tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <form className="login-panel" onSubmit={(event) => void handleSubmit(event)} noValidate>
        <div className="login-icon" aria-hidden="true"><LogIn size={22} /></div>
        <h1>Entrar no Portfolio CMS</h1>
        <p>Acesse com sua conta autorizada para editar cases, midias e publicacao.</p>
        {notice && <div className="notice" role="status">{notice}</div>}
        {error && <div className="notice notice-error" role="alert">{error}</div>}
        <label>
          Email
          <input
            autoFocus
            type="email"
            value={email}
            autoComplete="email"
            disabled={submitting}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label>
          Senha
          <input
            type="password"
            value={password}
            autoComplete="current-password"
            disabled={submitting}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button className="primary login-submit" type="submit" disabled={submitting}>
          {submitting && <Loader2 size={16} className="spin" />}
          {submitting ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}

function loginErrorMessage(error: AuthError) {
  const message = error.message.toLowerCase();
  if (message.includes("invalid") || message.includes("credentials") || message.includes("login")) {
    return "Credenciais invalidas. Confira email e senha.";
  }
  return "Erro de rede ao tentar entrar. Verifique a conexao e tente novamente.";
}

function FullState({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <main className="full-state">
      <div className="full-state-icon">{icon}</div>
      <h1>{title}</h1>
      <p>{body}</p>
    </main>
  );
}
