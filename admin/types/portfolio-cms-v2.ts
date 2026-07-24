export type PortfolioCaseStatus = "draft" | "published" | "archived";

export type PortfolioCategory =
  | "Branding"
  | "Desenvolvimento"
  | "Editorial"
  | "UI/UX Design";

export type PortfolioMediaType = "image" | "video";

export type TiptapDocument = {
  type: "doc";
  content: unknown[];
  [key: string]: unknown;
};

export type PortfolioCase = {
  id: string;
  legacy_id: string | null;
  legacy_slug: string | null;
  slug: string;
  title: string;
  status: PortfolioCaseStatus;
  categories: PortfolioCategory[];
  excerpt: string;
  content_json: TiptapDocument;
  content_html: string;
  cover_url: string;
  cover_storage_bucket: "portfolio-drafts" | "portfolio-media" | "case-images" | null;
  cover_storage_path: string | null;
  external_url: string;
  featured_on_home: boolean;
  home_order: number;
  portfolio_order: number;
  seo_title: string;
  seo_description: string;
  published_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  version: number;
  created_at: string;
  updated_at: string;
};

export type PortfolioCaseMedia = {
  id: string;
  case_id: string;
  source_url: string;
  storage_bucket: "portfolio-drafts" | "portfolio-media" | "case-images" | null;
  storage_path: string | null;
  media_type: PortfolioMediaType;
  alt_text: string;
  caption: string;
  width: number | null;
  height: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type PortfolioCaseSlugHistory = {
  id: string;
  case_id: string;
  old_slug: string;
  created_at: string;
};
