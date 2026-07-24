import { Plus, LogOut } from "lucide-react";
import { requireAdmin } from "@/lib/auth/permissions";
import { logoutAction } from "./actions";

export default async function AdminCasesPage() {
  const { supabase } = await requireAdmin();
  const { data: cases, error } = await supabase
    .from("portfolio_cases")
    .select("*")
    .order("portfolio_order", { ascending: true })
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);

  return (
    <main className="admin-page">
      <header className="admin-topbar">
        <div><p className="section-label">Portfólio</p><h1>Cases</h1><p>{cases.length} registros entre rascunhos, publicados e arquivados.</p></div>
        <div className="admin-topbar__actions"><form action={logoutAction}><button className="button button--secondary" data-testid="logout" type="submit"><LogOut size={16} /> Sair</button></form><a className="button button--primary" data-testid="create-case" href="/admin/cases/new"><Plus size={16} /> Novo case</a></div>
      </header>
      <section className="admin-list" aria-label="Lista de cases">
        <div className="admin-list__header"><span>Case</span><span>Status</span><span>Ordem</span><span>Atualizado</span></div>
        {cases.map((item) => (
          <a className="admin-list__row" data-testid="case-row" href={`/admin/cases/${item.id}/edit`} key={item.id}>
            <span><strong>{item.title}</strong><small>/{item.slug}</small></span>
            <span><i className={`status status--${item.status}`} />{item.status}</span>
            <span>{item.portfolio_order}</span>
            <span>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(item.updated_at))}</span>
          </a>
        ))}
        {!cases.length ? <p className="admin-empty">Nenhum case criado ainda.</p> : null}
      </section>
    </main>
  );
}
