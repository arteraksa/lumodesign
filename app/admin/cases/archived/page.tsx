import { Archive, ArchiveRestore, ArrowLeft, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth/permissions";
import { moveCaseToTrashAction, unarchiveCaseAction } from "../actions";
import { CaseTableIdentity } from "../CaseTableIdentity";
import { ConfirmCaseAction } from "../ConfirmCaseAction";
import { getCaseCoverPreviewUrl } from "../case-cover";

export default async function ArchivedCasesPage() {
  const { supabase } = await requireAdmin();
  const { data: cases, error } = await supabase.from("portfolio_cases").select("*").eq("status", "archived").is("deleted_at", null).order("archived_at", { ascending: false });
  if (error) throw new Error(error.message);
  const casesWithCovers = await Promise.all(cases.map(async (item) => ({ ...item, coverPreviewUrl: await getCaseCoverPreviewUrl(supabase, item) })));

  return <main className="admin-page"><header className="admin-topbar"><div><a className="admin-back-link" href="/admin/cases"><ArrowLeft size={15} /> Cases</a><h1>Arquivados</h1><p>{cases.length} {cases.length === 1 ? "case arquivado" : "cases arquivados"}.</p></div></header><section className="admin-list admin-list--three-columns" aria-label="Cases arquivados"><table className="admin-list__table"><thead><tr><th scope="col">Case</th><th scope="col">Arquivado em</th><th scope="col" aria-label="Ações" /></tr></thead><tbody>{casesWithCovers.map((item) => <tr data-testid="archived-case-row" key={item.id}><td><CaseTableIdentity item={item} coverPreviewUrl={item.coverPreviewUrl} /></td><td>{item.archived_at ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(item.archived_at)) : "—"}</td><td><div className="admin-case-actions" aria-label={`Ações para ${item.title}`}><ConfirmCaseAction id={item.id} action={unarchiveCaseAction} label={<><ArchiveRestore size={15} /> Desarquivar</>} title="Desarquivar case?" description="O case voltará para a lista ativa como rascunho." /><ConfirmCaseAction id={item.id} action={moveCaseToTrashAction} label={<><Trash2 size={15} /> Excluir</>} title="Mover case para a lixeira?" description="Ele ficará disponível para restauração por 30 dias." className="button button--tertiary admin-row-action admin-row-action--danger" /></div></td></tr>)}{!cases.length ? <tr><td className="admin-empty" colSpan={3}><Archive size={18} /> Nenhum case arquivado.</td></tr> : null}</tbody></table></section></main>;
}
