import type { SupabaseClient } from "@supabase/supabase-js";
import type { EditableCaseFields, PortfolioCase, PortfolioCaseMedia } from "@/types/portfolio";
import { promoteDraftAsset } from "@/lib/storage/mediaStorage";
import { validateCaseForPublish } from "@/lib/validation/case";
import { updateCase, updateMedia } from "@/features/cases/api";

export type PublishStep =
  | "Validando conteudo"
  | "Salvando alteracoes"
  | "Enviando arquivos"
  | "Promovendo midias"
  | "Atualizando registros"
  | "Confirmando publicacao"
  | "Concluido";

type PublishOptions = {
  onStep?: (step: PublishStep) => void;
};

export async function publishCase(
  client: SupabaseClient,
  current: PortfolioCase,
  local: EditableCaseFields,
  media: PortfolioCaseMedia[],
  options: PublishOptions = {},
): Promise<PortfolioCase> {
  options.onStep?.("Validando conteudo");
  const blockers = validateCaseForPublish(local, media);
  const draftCover = local.cover_storage_bucket === "portfolio-drafts" && local.cover_storage_path;
  const draftMedia = media.filter((item) => item.storage_bucket === "portfolio-drafts" && item.storage_path);
  if (blockers.length && !draftCover && !draftMedia.length) throw new Error(blockers.join(" "));

  options.onStep?.("Promovendo midias");
  let coverPatch: Partial<EditableCaseFields> = {};
  if (draftCover) {
    const promoted = await promoteDraftAsset(client, local.cover_storage_path as string);
    coverPatch = {
      cover_storage_bucket: promoted.bucket,
      cover_storage_path: promoted.path,
      cover_url: promoted.url,
    };
  }

  for (const item of draftMedia) {
    const promoted = await promoteDraftAsset(client, item.storage_path as string);
    await updateMedia(client, item.id, {
      storage_bucket: promoted.bucket,
      storage_path: promoted.path,
      source_url: promoted.url,
    });
  }

  const refreshedMedia = media.map((item) => {
    if (item.storage_bucket !== "portfolio-drafts" || !item.storage_path) return item;
    return { ...item, storage_bucket: "portfolio-media" as const };
  });
  const finalPayload = { ...local, ...coverPatch, status: "published" as const };
  const finalBlockers = validateCaseForPublish(finalPayload, refreshedMedia);
  if (finalBlockers.length) throw new Error(finalBlockers.join(" "));
  options.onStep?.("Atualizando registros");
  const saved = await updateCase(client, current.id, current.version, finalPayload);
  options.onStep?.("Concluido");
  return saved;
}

export async function updatePublishedCase(
  client: SupabaseClient,
  current: PortfolioCase,
  local: EditableCaseFields,
  media: PortfolioCaseMedia[],
  options: PublishOptions = {},
): Promise<PortfolioCase> {
  options.onStep?.("Validando conteudo");
  const payload = { ...local, status: "published" as const };
  const blockers = validateCaseForPublish(payload, media);
  const draftCover = payload.cover_storage_bucket === "portfolio-drafts" && payload.cover_storage_path;
  const draftMedia = media.filter((item) => item.storage_bucket === "portfolio-drafts" && item.storage_path);
  if (blockers.length && !draftCover && !draftMedia.length) throw new Error(blockers.join(" "));

  let coverPatch: Partial<EditableCaseFields> = {};
  if (draftCover || draftMedia.length) options.onStep?.("Promovendo midias");
  if (draftCover) {
    const promoted = await promoteDraftAsset(client, payload.cover_storage_path as string);
    coverPatch = {
      cover_storage_bucket: promoted.bucket,
      cover_storage_path: promoted.path,
      cover_url: promoted.url,
    };
  }

  const refreshedMedia: PortfolioCaseMedia[] = [];
  for (const item of media) {
    if (item.storage_bucket === "portfolio-drafts" && item.storage_path) {
      const promoted = await promoteDraftAsset(client, item.storage_path);
      const updated = await updateMedia(client, item.id, {
        storage_bucket: promoted.bucket,
        storage_path: promoted.path,
        source_url: promoted.url,
      });
      refreshedMedia.push(updated);
    } else {
      refreshedMedia.push(item);
    }
  }

  const finalPayload = { ...payload, ...coverPatch, status: "published" as const };
  const finalBlockers = validateCaseForPublish(finalPayload, refreshedMedia);
  if (finalBlockers.length) throw new Error(finalBlockers.join(" "));
  options.onStep?.("Atualizando registros");
  const saved = await updateCase(client, current.id, current.version, finalPayload);
  options.onStep?.("Confirmando publicacao");
  options.onStep?.("Concluido");
  return saved;
}
