import type { SupabaseClient } from "@supabase/supabase-js";
import { buildDraftPath, validateImageFile } from "@/lib/validation/media";
import { createUuid } from "@shared/uuid";

export type DraftUploadResult = {
  bucket: "portfolio-drafts";
  path: string;
  signedUrl: string;
};

export async function uploadDraftMedia(
  client: SupabaseClient,
  caseId: string,
  area: "cover" | "gallery",
  file: File,
): Promise<DraftUploadResult> {
  const errors = validateImageFile(file);
  if (errors.length) throw new Error(errors.join(" "));
  const path = buildDraftPath(caseId, area, file, createUuid());
  const { error } = await client.storage.from("portfolio-drafts").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;
  const signed = await client.storage.from("portfolio-drafts").createSignedUrl(path, 60 * 60);
  if (signed.error || !signed.data?.signedUrl) throw signed.error || new Error("Nao foi possivel assinar URL do draft.");
  return { bucket: "portfolio-drafts", path, signedUrl: signed.data.signedUrl };
}

export async function signedUrlForDraft(client: SupabaseClient, path: string): Promise<string> {
  const { data, error } = await client.storage.from("portfolio-drafts").createSignedUrl(path, 60 * 60);
  if (error || !data?.signedUrl) throw error || new Error("Nao foi possivel assinar URL do draft.");
  return data.signedUrl;
}

export async function publicUrl(client: SupabaseClient, bucket: string, path: string): Promise<string> {
  const { data } = client.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function promoteDraftAsset(client: SupabaseClient, path: string): Promise<{ bucket: "portfolio-media"; path: string; url: string }> {
  const download = await client.storage.from("portfolio-drafts").download(path);
  if (download.error || !download.data) throw download.error || new Error("Falha ao baixar asset de draft.");
  const targetPath = path;
  const contentType = allowedImageContentType(download.data.type) || imageContentTypeFromPath(path);
  const upload = await client.storage.from("portfolio-media").upload(targetPath, download.data, {
    cacheControl: "3600",
    upsert: false,
    contentType,
  });
  if (upload.error) {
    const existing = await client.storage.from("portfolio-media").info(targetPath);
    if (existing.error || !existing.data) throw upload.error;
  }
  return { bucket: "portfolio-media", path: targetPath, url: await publicUrl(client, "portfolio-media", targetPath) };
}

function allowedImageContentType(value: string) {
  return ["image/jpeg", "image/png", "image/webp", "image/avif"].includes(value) ? value : "";
}

function imageContentTypeFromPath(path: string) {
  const extension = path.split(".").pop()?.toLowerCase();
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (extension === "webp") return "image/webp";
  if (extension === "avif") return "image/avif";
  return "image/png";
}
