"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/permissions";
import { caseInputFromFormData } from "@/lib/validation/case";
import { CASES_CACHE_TAG } from "@/lib/queries/cases";
import { PORTFOLIO_CATEGORIES_CACHE_TAG } from "@/lib/queries/portfolio-categories";
import type { Database, StorageBucket } from "@/lib/supabase/database.types";
import { withCompensation } from "@/lib/portfolio/compensation";
import { portfolioPathsForSlugs } from "@/lib/portfolio/revalidation";
const idSchema = z.string().uuid();
const uploadPathSchema = z.string().regex(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[a-z0-9._-]+$/i,
  "Uma imagem enviada não possui um caminho válido. Envie-a novamente.",
);
const mediaManifestSchema = z.array(z.discriminatedUnion("source", [
  z.object({ source: z.literal("existing"), id: idSchema, altText: z.string().max(500).default(""), caption: z.string().max(500).default("") }),
  z.object({ source: z.literal("uploaded"), path: uploadPathSchema, altText: z.string().max(500).default(""), caption: z.string().max(500).default("") }),
])).max(60, "Adicione no máximo 60 imagens por case.");
const coverManifestSchema = z.discriminatedUnion("source", [
  z.object({ source: z.literal("existing") }),
  z.object({ source: z.literal("uploaded"), path: uploadPathSchema }),
  z.object({ source: z.literal("none") }),
]);

type AdminSupabase = SupabaseClient<Database, "public", "public", Database["public"]>;

function textToDocument(text: string) {
  return {
    type: "doc",
    content: text.split(/\n{2,}/).filter(Boolean).map((paragraph) => ({
      type: "paragraph",
      content: [{ type: "text", text: paragraph.replace(/<[^>]*>/g, "").trim() }],
    })),
  };
}

function publicError(cause: unknown) {
  const digest = typeof cause === "object" && cause !== null && "digest" in cause ? String((cause as { digest?: unknown }).digest) : "";
  if (digest.startsWith("NEXT_REDIRECT")) return cause as Error;
  const message = cause instanceof Error
    ? cause.message
    : typeof cause === "object" && cause !== null && "message" in cause
      ? String((cause as { message?: unknown }).message ?? "")
      : "";
  if (cause instanceof z.ZodError) {
    return new Error(cause.issues[0]?.message || "Revise as informações do case e tente novamente.");
  }
  if (/duplicate key|portfolio_cases_slug_key|already reserved|old_slug/i.test(message)) {
    return new Error("Este slug já está em uso ou reservado no histórico.");
  }
  if (/row-level security|permission|not authorized|JWT|auth/i.test(message)) {
    return new Error("Sua conta não tem permissão para salvar cases. Entre novamente ou peça acesso administrativo.");
  }
  if (/portfolio_cases_categories_check|unknown or inactive category/i.test(message)) {
    return new Error("Uma das categorias selecionadas não está mais disponível. Atualize a página e escolha outra categoria.");
  }
  if (/title_length|slug_length|slug_not_blank|required_content/i.test(message)) {
    return new Error("Algumas informações obrigatórias para publicar estão incompletas. Revise os campos destacados.");
  }
  if (/portfolio-drafts|valid cover|published portfolio/i.test(message)) {
    return new Error("O case publicado precisa usar capa e galeria válidas fora do bucket de rascunhos.");
  }
  if (/conflito|versão|version/i.test(message)) {
    return new Error("Este case foi alterado em outra sessão. Recarregue a página antes de salvar novamente.");
  }
  if (/arquivo|imagem|JPEG|PNG|WebP|AVIF|25 MB|extensão|conteúdo/i.test(message)) {
    return new Error(message);
  }
  if (message) console.error("CMS case action failed", message);
  return new Error("Não foi possível salvar o case. Verifique os campos e tente novamente.");
}

async function promoteStorageObject(
  supabase: AdminSupabase,
  fromBucket: "portfolio-drafts",
  toBucket: "portfolio-media",
  path: string,
) {
  const { data: object, error: downloadError } = await supabase.storage.from(fromBucket).download(path);
  if (downloadError || !object) throw new Error("Falha ao preparar arquivo para publicação.");

  const { error: uploadError } = await supabase.storage.from(toBucket).upload(path, object, {
    contentType: object.type || undefined,
    upsert: false,
  });
  if (uploadError) throw new Error("Falha ao publicar arquivo do case.");

  return { bucket: toBucket as StorageBucket, path };
}

async function promoteDraftAssets(supabase: AdminSupabase, caseId: string) {
  const { data: caseRow, error: caseError } = await supabase
    .from("portfolio_cases")
    .select("cover_storage_bucket,cover_storage_path")
    .eq("id", caseId)
    .single();
  if (caseError) throw caseError;
  const { data: draftMedia, error: mediaError } = await supabase
    .from("portfolio_case_media")
    .select("id,storage_path")
    .eq("case_id", caseId)
    .eq("storage_bucket", "portfolio-drafts");
  if (mediaError) throw mediaError;

  const promotedPaths: string[] = [];
  await withCompensation(async (defer) => {
    if (caseRow.cover_storage_bucket === "portfolio-drafts" && caseRow.cover_storage_path) {
      const path = caseRow.cover_storage_path;
      const promoted = await promoteStorageObject(supabase, "portfolio-drafts", "portfolio-media", path);
      promotedPaths.push(path);
      defer(async () => { await supabase.storage.from("portfolio-media").remove([path]); });
      const { error } = await supabase.from("portfolio_cases").update({
        cover_storage_bucket: promoted.bucket,
        cover_storage_path: promoted.path,
      }).eq("id", caseId);
      if (error) throw error;
      defer(async () => {
        await supabase.from("portfolio_cases").update({
          cover_storage_bucket: "portfolio-drafts",
          cover_storage_path: path,
        }).eq("id", caseId);
      });
    }
    for (const media of draftMedia ?? []) {
      if (!media.storage_path) continue;
      const path = media.storage_path;
      const promoted = await promoteStorageObject(supabase, "portfolio-drafts", "portfolio-media", path);
      promotedPaths.push(path);
      defer(async () => { await supabase.storage.from("portfolio-media").remove([path]); });
      const { error } = await supabase
        .from("portfolio_case_media")
        .update({ storage_bucket: promoted.bucket, storage_path: promoted.path })
        .eq("id", media.id);
      if (error) throw error;
      defer(async () => {
        await supabase.from("portfolio_case_media").update({ storage_bucket: "portfolio-drafts", storage_path: path }).eq("id", media.id);
      });
    }
  });

  if (promotedPaths.length) {
    const { error } = await supabase.storage.from("portfolio-drafts").remove([...new Set(promotedPaths)]);
    if (error) console.warn("Published assets retained duplicate draft objects", caseId);
  }
}

function parseMediaManifest(formData: FormData) {
  const rawValue = String(formData.get("media_manifest") ?? "[]");
  let raw: unknown;
  try {
    raw = JSON.parse(rawValue);
  } catch {
    throw new Error("Não foi possível ler a ordem das imagens. Atualize a página e tente novamente.");
  }
  const manifest = mediaManifestSchema.parse(raw);
  const existingIds = manifest.filter((item) => item.source === "existing").map((item) => item.id);
  const uploadedPaths = manifest.filter((item) => item.source === "uploaded").map((item) => item.path);
  if (new Set(existingIds).size !== existingIds.length || new Set(uploadedPaths).size !== uploadedPaths.length) {
    throw new Error("Há uma imagem repetida na lista. Remova a duplicata e tente novamente.");
  }
  return manifest;
}

function parseCoverManifest(formData: FormData) {
  const rawValue = String(formData.get("cover_manifest") ?? '{"source":"none"}');
  try {
    return coverManifestSchema.parse(JSON.parse(rawValue));
  } catch (cause) {
    if (cause instanceof z.ZodError) throw cause;
    throw new Error("Não foi possível ler a imagem de capa. Envie-a novamente e tente salvar.");
  }
}

async function reconcileProjectImages(
  supabase: AdminSupabase,
  caseId: string,
  manifest: z.infer<typeof mediaManifestSchema>,
  title: string,
) {
  const { data: mediaToRemove, error: selectError } = await supabase
    .from("portfolio_case_media")
    .select("id,storage_bucket,storage_path")
    .eq("case_id", caseId);
  if (selectError) throw selectError;
  const { data: caseCover, error: coverError } = await supabase
    .from("portfolio_cases")
    .select("cover_storage_bucket,cover_storage_path")
    .eq("id", caseId)
    .single();
  if (coverError) throw coverError;

  const currentMedia = mediaToRemove ?? [];
  const currentIds = new Set(currentMedia.map((media) => media.id));
  const includedIds = new Set(manifest.filter((entry) => entry.source === "existing").map((entry) => entry.id));
  for (const mediaId of includedIds) {
    if (!currentIds.has(mediaId)) throw new Error("Uma imagem deste case foi alterada em outra sessão. Atualize a página antes de salvar.");
  }
  const removeIds = currentMedia.filter((media) => !includedIds.has(media.id)).map((media) => media.id);

  for (const [sortOrder, entry] of manifest.entries()) {
    if (entry.source === "existing") {
      const { error } = await supabase
        .from("portfolio_case_media")
        .update({ sort_order: sortOrder, alt_text: entry.altText.trim(), caption: entry.caption.trim() })
        .eq("id", entry.id)
        .eq("case_id", caseId);
      if (error) throw error;
      continue;
    }
    const { error } = await supabase.from("portfolio_case_media").insert({
      case_id: caseId,
      storage_bucket: "portfolio-drafts",
      storage_path: entry.path,
      source_url: "",
      alt_text: entry.altText.trim() || `${title} - imagem ${sortOrder + 1}`,
      caption: entry.caption.trim(),
      sort_order: sortOrder,
    });
    if (error) throw error;
  }

  if (!removeIds.length) return;
  const { error: deleteError } = await supabase.from("portfolio_case_media").delete().eq("case_id", caseId).in("id", removeIds);
  if (deleteError) throw deleteError;

  for (const media of currentMedia.filter((entry) => removeIds.includes(entry.id))) {
    if (media.storage_bucket === caseCover.cover_storage_bucket && media.storage_path === caseCover.cover_storage_path) continue;
    if ((media.storage_bucket === "portfolio-drafts" || media.storage_bucket === "portfolio-media") && media.storage_path) {
      const { error } = await supabase.storage.from(media.storage_bucket).remove([media.storage_path]);
      if (error) console.warn("Could not remove deleted media object", media.storage_bucket, media.storage_path);
    }
  }
}

async function reconcileCover(
  supabase: AdminSupabase,
  caseId: string,
  manifest: z.infer<typeof coverManifestSchema>,
) {
  const { data: current, error: currentError } = await supabase
    .from("portfolio_cases")
    .select("cover_storage_bucket,cover_storage_path")
    .eq("id", caseId)
    .single();
  if (currentError) throw currentError;
  if (manifest.source === "existing") return current;

  const next = manifest.source === "uploaded"
    ? { cover_storage_bucket: "portfolio-drafts" as const, cover_storage_path: manifest.path }
    : { cover_storage_bucket: null, cover_storage_path: null };
  const { error } = await supabase.from("portfolio_cases").update(next).eq("id", caseId);
  if (error) throw error;

  if (
    current.cover_storage_path
    && current.cover_storage_path !== next.cover_storage_path
    && (current.cover_storage_bucket === "portfolio-drafts" || current.cover_storage_bucket === "portfolio-media")
  ) {
    const { error: removeError } = await supabase.storage.from(current.cover_storage_bucket).remove([current.cover_storage_path]);
    if (removeError) console.warn("Could not remove replaced cover object", current.cover_storage_bucket, current.cover_storage_path);
  }
  return next;
}

export async function saveCaseAction(formData: FormData): Promise<{ caseId: string; notice: "saved" | "published" }> {
  try {
    const { supabase } = await requireAdmin();
    const { data: categoryRows, error: categoriesError } = await supabase
      .from("portfolio_categories")
      .select("name")
      .eq("is_active", true);
    if (categoriesError) throw categoriesError;
    const input = caseInputFromFormData(formData, (categoryRows ?? []).map((row) => row.name));
    const mediaManifest = parseMediaManifest(formData);
    const coverManifest = parseCoverManifest(formData);
    const id = input.id;
    const requestedStatus = input.status;
    const basePayload = {
      title: input.title,
      slug: input.slug.normalize("NFC"),
      client_name: input.client_name,
      categories: input.categories,
      excerpt: input.excerpt,
      content_html: input.content_html,
      content_json: textToDocument(input.content_html),
      cover_url: "",
      external_url: input.external_url,
      featured_on_home: input.featured_on_home,
      home_order: input.home_order,
      portfolio_order: input.portfolio_order,
      seo_title: input.seo_title,
      seo_description: input.seo_description,
    };

    const saved = await withCompensation(async (defer) => {
      let caseId = id;
      let oldSlug: string | null = null;

      if (!caseId) {
        const { data, error } = await supabase.from("portfolio_cases").insert({ ...basePayload, status: "draft" }).select("id").single();
        if (error) throw error;
        caseId = data.id;
        defer(async () => { await supabase.from("portfolio_cases").delete().eq("id", data.id); });
      } else {
        if (!input.version) throw new Error("Conflito de versão: recarregue o case.");
        const { data: current, error: currentError } = await supabase
          .from("portfolio_cases")
          .select("slug,version")
          .eq("id", caseId)
          .single();
        if (currentError) throw currentError;
        if (current.version !== input.version) throw new Error("Conflito de versão: o case foi alterado.");
        oldSlug = current.slug;
        const { data: updated, error } = await supabase
          .from("portfolio_cases")
          .update({ ...basePayload, status: "draft", published_at: null })
          .eq("id", caseId)
          .eq("version", input.version)
          .select("id")
          .maybeSingle();
        if (error) throw error;
        if (!updated) throw new Error("Conflito de versão: o case foi alterado.");
      }

      if (!caseId) throw new Error("O case não recebeu um identificador válido.");
      await reconcileProjectImages(supabase, caseId, mediaManifest, input.title);
      const cover = await reconcileCover(supabase, caseId, coverManifest);
      if (requestedStatus === "published" && (!cover.cover_storage_bucket || !cover.cover_storage_path)) {
        throw new Error("Para publicar, envie uma imagem de capa.");
      }
      if (requestedStatus === "published") {
        await promoteDraftAssets(supabase, caseId);
      }
      const { error: statusError } = await supabase.from("portfolio_cases").update({
        status: requestedStatus,
        published_at: requestedStatus === "published" ? (input.published_at ?? new Date().toISOString()) : null,
      }).eq("id", caseId);
      if (statusError) throw statusError;

      return { caseId, oldSlug, newSlug: input.slug.normalize("NFC") };
    });

    revalidateTag(CASES_CACHE_TAG, "max");
    portfolioPathsForSlugs(saved.oldSlug, saved.newSlug).forEach((path) => revalidatePath(path));
    const notice = requestedStatus === "published" ? "published" : "saved";
    return { caseId: saved.caseId, notice };
  } catch (cause) {
    throw publicError(cause);
  }
}

export async function createCategoryAction(formData: FormData) {
  try {
    const { supabase } = await requireAdmin();
    const name = String(formData.get("name") ?? "").trim().replace(/\s+/g, " ");
    if (name.length < 2 || name.length > 80) throw new Error("A categoria deve ter entre 2 e 80 caracteres.");
    const slug = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    if (!slug) throw new Error("Informe um nome de categoria válido.");
    const { data, error } = await supabase.from("portfolio_categories").insert({ name, slug, is_active: true }).select("name,slug").single();
    if (error) {
      if (/duplicate|unique/i.test(error.message)) throw new Error("Já existe uma categoria com este nome.");
      throw error;
    }
    revalidateTag(PORTFOLIO_CATEGORIES_CACHE_TAG, "max");
    revalidatePath("/admin/cases");
    revalidatePath("/cases");
    return data;
  } catch (cause) {
    throw publicError(cause);
  }
}

export async function archiveCaseAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = idSchema.parse(String(formData.get("id") ?? ""));
  const { data: item, error: readError } = await supabase.from("portfolio_cases").select("slug").eq("id", id).single();
  if (readError) throw publicError(readError);
  const { error } = await supabase.from("portfolio_cases").update({ status: "archived", published_at: null }).eq("id", id);
  if (error) throw publicError(error);
  revalidateTag(CASES_CACHE_TAG, "max");
  portfolioPathsForSlugs(item.slug).forEach((path) => revalidatePath(path));
  redirect("/admin/cases");
}

export async function restoreCaseAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = idSchema.parse(String(formData.get("id") ?? ""));
  const { error } = await supabase.from("portfolio_cases").update({ status: "draft", published_at: null }).eq("id", id);
  if (error) throw publicError(error);
  redirect(`/admin/cases/${id}/edit`);
}

export async function logoutAction() {
  const { supabase } = await requireAdmin();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
