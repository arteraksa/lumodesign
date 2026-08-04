import { Archive, Plus, Trash2, LogOut } from "lucide-react";
import { requireAdmin } from "@/lib/auth/permissions";
import { logoutAction } from "./actions";
import { CasesList } from "./CasesList";
import { getCaseCoverPreviewUrl } from "./case-cover";
import { FeaturedCasesManager } from "./FeaturedCasesManager";

export default async function AdminCasesPage() {
  const { supabase } = await requireAdmin();
  const [{ data: cases, error }, { count: archivedCount }, { count: trashCount }] = await Promise.all([
    supabase
    .from("portfolio_cases")
    .select("*")
    .is("deleted_at", null)
    .neq("status", "archived")
    .order("portfolio_order", { ascending: true })
    .order("updated_at", { ascending: false }),
    supabase.from("portfolio_cases").select("id", { count: "exact", head: true }).eq("status", "archived").is("deleted_at", null),
    supabase.from("portfolio_cases").select("id", { count: "exact", head: true }).not("deleted_at", "is", null),
  ]);
  if (error) throw new Error(error.message);
  const casesWithCovers = await Promise.all(cases.map(async (item) => ({ ...item, coverPreviewUrl: await getCaseCoverPreviewUrl(supabase, item) })));

  return (
    <main className="admin-page">
      <header className="admin-topbar">
        <div><h1>Cases</h1><p>{cases.length} registros ativos entre rascunhos e publicados.</p><nav className="admin-page-links" aria-label="Navegação de cases"><a className="button button--tertiary" href="/admin/cases/archived"><Archive size={15} /> Arquivados{archivedCount ? <span>{archivedCount}</span> : null}</a><a className="button button--tertiary admin-page-links__trash" href="/admin/cases/trash"><Trash2 size={14} /> Lixeira{trashCount ? <span>{trashCount}</span> : null}</a></nav></div>
        <div className="admin-topbar__actions"><form action={logoutAction}><button className="button button--secondary" data-testid="logout" type="submit">Sair <LogOut size={16} /></button></form><a className="button button--primary" data-testid="create-case" href="/admin/cases/new">Novo case <Plus size={16} /></a></div>
      </header>
      <CasesList cases={casesWithCovers} />
      <FeaturedCasesManager cases={casesWithCovers.filter((item) => item.status === "published")} />
    </main>
  );
}
