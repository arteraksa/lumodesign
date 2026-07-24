export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type CaseStatus = "draft" | "published" | "archived";
export type StorageBucket = "portfolio-drafts" | "portfolio-media" | "case-images";

export interface PortfolioCaseMedia {
  [key: string]: unknown;
  id: string;
  case_id: string;
  source_url: string;
  storage_bucket: StorageBucket | null;
  storage_path: string | null;
  media_type: "image" | "video";
  alt_text: string;
  caption: string;
  width: number | null;
  height: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PortfolioCase {
  [key: string]: unknown;
  id: string;
  slug: string;
  title: string;
  status: CaseStatus;
  client_name: string;
  categories: string[];
  excerpt: string;
  content_json: Json;
  content_html: string;
  cover_url: string;
  cover_storage_bucket: StorageBucket | null;
  cover_storage_path: string | null;
  external_url: string;
  featured_on_home: boolean;
  home_order: number;
  portfolio_order: number;
  seo_title: string;
  seo_description: string;
  published_at: string | null;
  archived_at: string | null;
  version: number;
  created_at: string;
  updated_at: string;
  portfolio_case_media?: PortfolioCaseMedia[];
}

export interface PortfolioCategory {
  [key: string]: unknown;
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      portfolio_cases: {
        Row: PortfolioCase;
        Insert: Partial<PortfolioCase> & Pick<PortfolioCase, "slug" | "title">;
        Update: Partial<PortfolioCase>;
        Relationships: [];
      };
      portfolio_case_media: {
        Row: PortfolioCaseMedia;
        Insert: Partial<PortfolioCaseMedia> & Pick<PortfolioCaseMedia, "case_id">;
        Update: Partial<PortfolioCaseMedia>;
        Relationships: [];
      };
      portfolio_categories: {
        Row: PortfolioCategory;
        Insert: Partial<PortfolioCategory> & Pick<PortfolioCategory, "name" | "slug">;
        Update: Partial<PortfolioCategory>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      can_manage_portfolio: { Args: Record<PropertyKey, never>; Returns: boolean };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
