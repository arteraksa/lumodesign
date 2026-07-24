import type { EditableCaseFields, PortfolioCaseMedia } from "@/types/portfolio";
import { validateSlug } from "./slug";
import { isDraftAsset, isPublicAsset } from "./media";

const VALID_CATEGORIES = new Set(["Branding", "Desenvolvimento", "Editorial", "UI/UX Design"]);

export function validateUrl(value: string, label: string): string[] {
  if (!value) return [];
  return /^https?:\/\/[^\s]+$/i.test(value) ? [] : [`${label} precisa ser uma URL HTTP/HTTPS valida.`];
}

export function validateCaseForSave(item: EditableCaseFields): string[] {
  const errors = [
    ...validateSlug(item.slug),
    ...validateUrl(item.external_url, "Website"),
    ...validateUrl(item.cover_url, "Capa externa"),
  ];
  if (!item.title.trim()) errors.push("Titulo obrigatorio.");
  for (const category of item.categories) {
    if (!VALID_CATEGORIES.has(category)) errors.push(`Categoria invalida: ${category}`);
  }
  return errors;
}

export function validateCaseForPublish(item: EditableCaseFields, media: PortfolioCaseMedia[]): string[] {
  const errors = validateCaseForSave(item);
  if (!item.categories.length) errors.push("Adicione ao menos uma categoria.");
  if (!item.content_html.trim()) errors.push("Conteudo obrigatorio.");
  const hasCover =
    (item.cover_storage_bucket && item.cover_storage_path && isPublicAsset(item.cover_storage_bucket, item.cover_url)) ||
    /^https?:\/\//i.test(item.cover_url);
  if (!hasCover) errors.push("Publique exige capa valida em portfolio-media, case-images ou URL HTTP/HTTPS.");
  if (!media.length) errors.push("Publique exige ao menos uma midia na galeria.");
  if (item.cover_storage_bucket && isDraftAsset(item.cover_storage_bucket)) errors.push("Capa em portfolio-drafts precisa ser promovida antes de publicar.");
  if (media.some((entry) => isDraftAsset(entry.storage_bucket))) errors.push("Midias em portfolio-drafts precisam ser promovidas antes de publicar.");
  return errors;
}
