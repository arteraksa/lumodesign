import type { PortfolioCase, PortfolioCaseMedia } from "@/types/portfolio";

export function makeCase(overrides: Partial<PortfolioCase> = {}): PortfolioCase {
  return {
    id: overrides.id || "11111111-1111-4111-8111-111111111111",
    legacy_id: null,
    legacy_slug: null,
    slug: overrides.slug || "leylaw",
    title: overrides.title || "Leylaw",
    status: overrides.status || "draft",
    categories: overrides.categories || ["UI/UX Design"],
    excerpt: "",
    content_json: { type: "doc", content: [] },
    content_html: overrides.content_html || "<p>Conteudo</p>",
    cover_url: overrides.cover_url || "https://example.test/cover.jpg",
    cover_storage_bucket: overrides.cover_storage_bucket ?? null,
    cover_storage_path: overrides.cover_storage_path ?? null,
    external_url: "",
    featured_on_home: false,
    home_order: 999,
    portfolio_order: 1,
    seo_title: "",
    seo_description: "",
    published_at: null,
    created_by: null,
    updated_by: null,
    version: overrides.version || 1,
    created_at: "2026-07-11T00:00:00Z",
    updated_at: "2026-07-11T00:00:00Z",
    ...overrides,
  };
}

export function makeMedia(overrides: Partial<PortfolioCaseMedia> = {}): PortfolioCaseMedia {
  return {
    id: overrides.id || "22222222-2222-4222-8222-222222222222",
    case_id: overrides.case_id || "11111111-1111-4111-8111-111111111111",
    source_url: overrides.source_url || "https://example.test/1.jpg",
    storage_bucket: overrides.storage_bucket ?? null,
    storage_path: overrides.storage_path ?? null,
    media_type: "image",
    alt_text: "",
    caption: "",
    width: null,
    height: null,
    sort_order: overrides.sort_order || 0,
    created_at: "2026-07-11T00:00:00Z",
    updated_at: "2026-07-11T00:00:00Z",
    ...overrides,
  };
}

export function make36Cases(): PortfolioCase[] {
  const special = ["dark-star", "demip", "leylaw", "morangos-mofados", "portal-do-aluno-ufrgs", "vexo", "atitus-educação"];
  return Array.from({ length: 36 }, (_, index) => {
    const slug = special[index] || `case-${index}`;
    return makeCase({
      id: `${String(index + 1).padStart(8, "0")}-1111-4111-8111-111111111111`,
      slug,
      title: slug === "leylaw" ? "Leylaw" : slug,
      portfolio_order: index + 1,
      status: "published",
    });
  });
}
