// Keep client-side validation aligned with the remote Supabase buckets.
export const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/avif"];
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export function fileExtension(file: File): string {
  if (file.type === "image/png") return "png";
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/avif") return "avif";
  return file.name.split(".").pop()?.toLowerCase() || "";
}

export function validateImageFile(file: File): string[] {
  const errors: string[] = [];
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) errors.push("Formato invalido. Use PNG, JPEG, WEBP ou AVIF.");
  if (file.size > MAX_IMAGE_BYTES) errors.push("Arquivo maior que 10 MB.");
  return errors;
}

export function buildDraftPath(caseId: string, area: "cover" | "gallery", file: File, randomId: string): string {
  if (!/^[0-9a-f-]{36}$/i.test(caseId)) throw new Error("case_uuid invalido para path de Storage.");
  const ext = fileExtension(file);
  if (!ext) throw new Error("Extensao de imagem invalida.");
  return `${caseId}/${area}/${randomId}.${ext}`;
}

export function isDraftAsset(bucket: string | null): boolean {
  return bucket === "portfolio-drafts";
}

export function isPublicAsset(bucket: string | null, url = ""): boolean {
  return bucket === "portfolio-media" || bucket === "case-images" || /^https?:\/\//i.test(url);
}
