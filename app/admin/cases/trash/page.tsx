import { ArrowLeft, RotateCcw, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth/permissions";
import { permanentlyDeleteCaseAction, restoreCaseFromTrashAction } from "../actions";
import { CaseTableIdentity } from "../CaseTableIdentity";
import { ConfirmCaseAction } from "../ConfirmCaseAction";
import { getCaseCoverPreviewUrl } from "../case-cover";

type TrashPageProps = { searchParams: Promise<{ notice?: string }> };

export default async function TrashCasesPage({ searchParams }: TrashPageProps) {
  const [{ supabase }, query] = await Promise.all([requireAdmin(), searchParams]);
  const { data: cases, error } = await supabase.from("portfolio_cases").select("*").not("deleted_at", "is", null).order("deleted_at", { ascending: false });
  if (error) throw new Error(error.message);
  const casesWithCovers = await Promise.all(cases.map(async (item) => ({ ...item, coverPreviewUrl: await getCaseCoverPreviewUrl(supabase, item) })));

  return <main className="admin-page"><header className="admin-topbar"><div><a className="admin-back-link" href="/admin/cases"><ArrowLeft size={15} /> Cases</a><h1>Lixeira</h1><p>Cases ficam disponíveis para restauração por 30 dias.</p></div></header>{query.notice === "trashed" ? <p className="admin-notice admin-notice--success">Case movido para a lixeira. Ele será excluído definitivamente após 30 dias.</p> : null}{query.notice === "restored" ? <p className="admin-notice admin-notice--success">Case restaurado com sucesso.</p> : null}{query.notice === "permanently-deleted" ? <p className="admin-notice admin-notice--success">Case excluído permanentemente.</p> : null}<section className="admin-list admin-list--three-columns" aria-label="Cases na lixeira"><table className="admin-list__table"><thead><tr><th scope="col">Case</th><th scope="col">Excluído em</th><th scope="col" aria-label="Ações" /></tr></thead><tbody>{casesWithCovers.map((item) => <tr data-testid="trashed-case-row" key={item.id}><td><CaseTableIdentity item={item} coverPreviewUrl={item.coverPreviewUrl} /></td><td>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(item.deleted_at as string))}</td><td><div className="admin-case-actions" aria-label={`Ações para ${item.title}`}><ConfirmCaseAction id={item.id} action={restoreCaseFromTrashAction} label={<><RotateCcw size={15} /> Restaurar</>} title="Restaurar case?" description="O case voltará para a lista ativa como rascunho." /><ConfirmCaseAction id={item.id} action={permanentlyDeleteCaseAction} label={<><Trash2 size={15} /> Excluir permanentemente</>} title="Excluir case permanentemente?" description="Esta ação remove o case e as imagens associadas. Não será possível recuperá-lo." className="button button--tertiary admin-row-action admin-row-action--danger" /></div></td></tr>)}{!cases.length ? <tr><td className="admin-empty" colSpan={3}><Trash2 size={18} /> A lixeira está vazia.</td></tr> : null}</tbody></table></section></main>;
}
