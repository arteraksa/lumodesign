import type { SupabaseClient } from "@supabase/supabase-js";
import type { EditableCaseFields, PortfolioCase, PortfolioCaseMedia } from "@/types/portfolio";
import { slugFromTitle } from "@/lib/validation/slug";
import { createUuid } from "@shared/uuid";

const CASE_COLUMNS = "id,legacy_id,legacy_slug,slug,title,status,categories,excerpt,content_json,content_html,cover_url,cover_storage_bucket,cover_storage_path,external_url,featured_on_home,home_order,portfolio_order,seo_title,seo_description,published_at,created_by,updated_by,version,created_at,updated_at";
const MEDIA_COLUMNS = "id,case_id,source_url,storage_bucket,storage_path,media_type,alt_text,caption,width,height,sort_order,created_at,updated_at";

export class VersionConflictError extends Error {
  constructor(
    message: string,
    public remote: PortfolioCase | null,
  ) {
    super(message);
    this.name = "VersionConflictError";
  }
}

export async function listCases(client: SupabaseClient): Promise<PortfolioCase[]> {
  const { data, error } = await client
    .from("portfolio_cases")
    .select(CASE_COLUMNS)
    .order("portfolio_order", { ascending: true })
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data || []) as PortfolioCase[];
}

export async function getCase(client: SupabaseClient, id: string): Promise<PortfolioCase> {
  const { data, error } = await client.from("portfolio_cases").select(CASE_COLUMNS).eq("id", id).single();
  if (error) throw error;
  return data as PortfolioCase;
}

export async function listMedia(client: SupabaseClient, caseId: string): Promise<PortfolioCaseMedia[]> {
  const { data, error } = await client
    .from("portfolio_case_media")
    .select(MEDIA_COLUMNS)
    .eq("case_id", caseId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []) as PortfolioCaseMedia[];
}

export async function createCase(client: SupabaseClient, title: string): Promise<PortfolioCase> {
  const baseSlug = slugFromTitle(title);
  const record = {
    title: title.trim() || "Novo case",
    slug: `${baseSlug}-${createUuid().slice(0, 8)}`,
    status: "draft",
    categories: [],
    content_json: { type: "doc", content: [] },
    content_html: "",
  };
  const { data, error } = await client.from("portfolio_cases").insert(record).select(CASE_COLUMNS).single();
  if (error) throw error;
  return data as PortfolioCase;
}

export async function updateCase(
  client: SupabaseClient,
  id: string,
  version: number,
  patch: Partial<EditableCaseFields>,
): Promise<PortfolioCase> {
  const { data, error } = await client
    .from("portfolio_cases")
    .update(patch)
    .eq("id", id)
    .eq("version", version)
    .select(CASE_COLUMNS)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    let remote: PortfolioCase | null = null;
    try {
      remote = await getCase(client, id);
    } catch {
      remote = null;
    }
    throw new VersionConflictError("A versao remota mudou antes do salvamento.", remote);
  }
  return data as PortfolioCase;
}

export async function reorderMedia(client: SupabaseClient, media: PortfolioCaseMedia[]): Promise<void> {
  for (const [index, item] of media.entries()) {
    const { error } = await client.from("portfolio_case_media").update({ sort_order: index }).eq("id", item.id);
    if (error) throw error;
  }
}

export async function updateMedia(
  client: SupabaseClient,
  id: string,
  patch: Partial<Pick<PortfolioCaseMedia, "alt_text" | "caption" | "sort_order" | "source_url" | "storage_bucket" | "storage_path">>,
): Promise<PortfolioCaseMedia> {
  const { data, error } = await client.from("portfolio_case_media").update(patch).eq("id", id).select(MEDIA_COLUMNS).single();
  if (error) throw error;
  return data as PortfolioCaseMedia;
}

export async function removeMedia(client: SupabaseClient, id: string): Promise<void> {
  const { error } = await client.from("portfolio_case_media").delete().eq("id", id);
  if (error) throw error;
}

export async function insertMedia(client: SupabaseClient, payload: Partial<PortfolioCaseMedia>): Promise<PortfolioCaseMedia> {
  const { data, error } = await client.from("portfolio_case_media").insert(payload).select(MEDIA_COLUMNS).single();
  if (error) throw error;
  return data as PortfolioCaseMedia;
}

export async function unpublishCase(client: SupabaseClient, item: PortfolioCase): Promise<PortfolioCase> {
  return updateCase(client, item.id, item.version, { status: "draft" });
}

export async function archiveCase(client: SupabaseClient, item: PortfolioCase): Promise<PortfolioCase> {
  return updateCase(client, item.id, item.version, { status: "archived" });
}

export async function restoreArchivedCase(client: SupabaseClient, item: PortfolioCase): Promise<PortfolioCase> {
  return updateCase(client, item.id, item.version, { status: "draft" });
}
