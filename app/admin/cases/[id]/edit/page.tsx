import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/permissions";
import { requireSupabaseConfig } from "@/lib/supabase/config";
import type { PortfolioCaseMedia, StorageBucket } from "@/lib/supabase/database.types";
import { CaseForm } from "../../CaseForm";
import { SaveFeedback } from "../../SaveFeedback";
import { archiveCaseAction, createCategoryAction, restoreCaseAction, saveCaseAction } from "../../actions";
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
      <header className="admin-editor__header"><div><a href="/admin/cases">← Cases</a><h1>{item.title}</h1><p>Versão {item.version} · {item.status}</p></div><form action={item.status === "archived" ? restoreCaseAction : archiveCaseAction}><input type="hidden" name="id" value={item.id} /><button className="button button--secondary" data-testid={item.status === "archived" ? "restore-case" : "archive-case"} type="submit">{item.status === "archived" ? "Restaurar como rascunho" : "Arquivar"}</button></form></header>
      {query.notice === "saved" || query.notice === "published" ? <SaveFeedback notice={query.notice} /> : null}
      <CaseForm item={item} media={media} coverPreviewUrl={coverPreviewUrl} categoryOptions={categories} action={saveCaseAction} createCategoryAction={createCategoryAction} />
    </main>
  );
}
