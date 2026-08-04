import { notFound, redirect } from "next/navigation";
import { Archive, RotateCcw, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth/permissions";
import { requireSupabaseConfig } from "@/lib/supabase/config";
import type { PortfolioCaseMedia, StorageBucket } from "@/lib/supabase/database.types";
import { CaseForm } from "../../CaseForm";
import { ConfirmCaseAction } from "../../ConfirmCaseAction";
import { SaveFeedback } from "../../SaveFeedback";
import { archiveCaseAction, createCategoryAction, moveCaseToTrashAction, restoreCaseAction, saveCaseAction } from "../../actions";
import { getPortfolioCategories } from "@/lib/queries/portfolio-categories";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ notice?: string }> };

async function previewUrl(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  bucket: StorageBucket | null,
  path: string | null,
) {
  if (!bucket || !path) return "";
  const { url } = requireSupabaseConfig();
  if (bucket === "portfolio-media" || bucket === "case-images") {
    return `${url}/storage/v1/object/public/${bucket}/${path}`;
  }
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 10);
  return data?.signedUrl ?? "";
}

export default async function EditCasePage({ params, searchParams }: Props) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const { data: item, error } = await supabase.from("portfolio_cases").select("*").eq("id", id).single();
  if (error || !item) notFound();
  if (item.deleted_at) redirect("/admin/cases/trash");
  const { data: caseMedia, error: mediaError } = await supabase
    .from("portfolio_case_media")
    .select("*")
    .eq("case_id", id)
    .order("sort_order", { ascending: true });
  if (mediaError) throw new Error("Não foi possível carregar a galeria do case.");
  const media = await Promise.all((caseMedia ?? []).map(async (entry: PortfolioCaseMedia) => ({
    ...entry,
    preview_url: entry.source_url || await previewUrl(supabase, entry.storage_bucket, entry.storage_path),
  })));
  const coverPreviewUrl = item.cover_url || await previewUrl(supabase, item.cover_storage_bucket, item.cover_storage_path);
  const [categories, query] = await Promise.all([getPortfolioCategories(), searchParams]);
  return (
    <main className="admin-page admin-editor">
      <header className="admin-editor__header"><div><h1>{item.title}</h1><p>Versão {item.version} · {item.status === "published" ? "Publicado" : item.status === "archived" ? "Arquivado" : "Rascunho"}</p></div><div className="admin-editor__header-actions"><ConfirmCaseAction id={item.id} action={item.status === "archived" ? restoreCaseAction : archiveCaseAction} label={item.status === "archived" ? <><RotateCcw size={16} /> Restaurar como rascunho</> : <><Archive size={16} /> Arquivar</>} title={item.status === "archived" ? "Restaurar como rascunho?" : "Arquivar case?"} description={item.status === "archived" ? "O case voltará para a lista ativa como rascunho." : "O case sairá da lista ativa e poderá ser restaurado depois."} className="button button--secondary" /><ConfirmCaseAction id={item.id} action={moveCaseToTrashAction} label={<><Trash2 size={16} /> Excluir</>} title="Mover case para a lixeira?" description="Ele ficará disponível para restauração por 30 dias." className="admin-danger-button" /></div></header>
      {query.notice === "saved" || query.notice === "published" ? <SaveFeedback notice={query.notice} /> : null}
      <CaseForm item={item} media={media} coverPreviewUrl={coverPreviewUrl} categoryOptions={categories} action={saveCaseAction} createCategoryAction={createCategoryAction} />
    </main>
  );
}
