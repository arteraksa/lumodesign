export type {
  PortfolioCase,
  PortfolioCaseMedia,
  PortfolioCaseSlugHistory,
  PortfolioCaseStatus,
  PortfolioCategory,
  PortfolioMediaType,
  TiptapDocument,
} from "../../../types/portfolio-cms-v2";

export type SaveState = "idle" | "dirty" | "saving" | "saved" | "published" | "error" | "conflict";

export type CaseListFilters = {
  search: string;
  status: "all" | "active" | "draft" | "published" | "archived";
  category: "all" | string;
  sort: "portfolio_order" | "home_order" | "updated_at" | "title" | "status";
};

export type EditableCaseFields = {
  title: string;
  slug: string;
  status: "draft" | "published" | "archived";
  categories: string[];
  excerpt: string;
  content_json: unknown;
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
};

export type ConflictState = {
  remote: import("../../../types/portfolio-cms-v2").PortfolioCase;
  local: EditableCaseFields;
  message: string;
} | null;

export type UploadProgress = {
  id: string;
  fileName: string;
  progress: number;
  status: "queued" | "uploading" | "done" | "error";
  error?: string;
};

export type PreviewSize = "desktop" | "tablet" | "mobile";
