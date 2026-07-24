export function normalizeSlug(value: string): string {
  return value
    .normalize("NFC")
    .trim()
    .toLowerCase()
    .replace(/[\s]+/g, "-")
    .replace(/[/?#]+/g, "-")
    .replace(/[^\p{L}\p{N}._-]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function slugFromTitle(title: string): string {
  return normalizeSlug(title || "novo-case");
}

export function validateSlug(slug: string): string[] {
  const errors: string[] = [];
  const normalized = slug.normalize("NFC");
  if (!normalized) errors.push("Slug obrigatorio.");
  if (normalized !== slug) errors.push("Slug precisa estar normalizado em NFC.");
  if (/\s/.test(slug)) errors.push("Slug nao pode conter espacos.");
  if (/[/?#]/.test(slug)) errors.push("Slug nao pode conter slash, query ou hash.");
  if (slug.length > 160) errors.push("Slug muito longo.");
  return errors;
}

export function portfolioUrlPreview(slug: string): string {
  return `/cases/${encodeURIComponent(slug)}/`;
}
